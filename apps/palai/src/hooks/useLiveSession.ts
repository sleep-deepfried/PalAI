'use client';

import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';
import { useSession } from 'next-auth/react';
import { GoogleGenAI, Modality } from '@google/genai';
import { checkLiveCompatibility } from '@/lib/live-compatibility';
import { resampleAndEncode, arrayBufferToBase64 } from '@/lib/audio-utils';
import { AudioPlayer } from '@/lib/audio-player';
import { startVideoCapture } from '@/lib/video-streamer';
import { extractDiagnosis, type StructuredDiagnosis } from '@/lib/diagnosis-extractor';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveSessionState {
  status: 'idle' | 'connecting' | 'active' | 'extracting' | 'error';
  timeRemaining: number;
  isWarning: boolean;
  transcription: string;
  isSpeaking: boolean;
  error: string | null;
  isMuted: boolean;
}

export interface UseLiveSessionReturn extends LiveSessionState {
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  toggleCamera: () => void;
  toggleMute: () => void;
  hasMultipleCameras: boolean;
}

interface UseLiveSessionOptions {
  videoRef: RefObject<HTMLVideoElement>;
  onDiagnosisComplete: (scanId: string) => void;
  onFallback: () => void;
  sessionDuration?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

const SYSTEM_INSTRUCTION = `You are PalAI, a rice disease diagnosis assistant for Filipino farmers.

Your task:
1. Ask the farmer to show you their rice leaves through the camera
2. Once you can see the leaves clearly, analyze them for diseases
3. Provide your diagnosis immediately based on what you see

Common rice diseases to look for:
- Bacterial Leaf Blight: water-soaked lesions, yellow to white streaks
- Brown Spot: oval brown spots with gray centers
- Sheath Blight: irregular lesions on leaf sheaths
- Tungro: yellow-orange discoloration, stunted growth
- Rice Blast: diamond-shaped lesions with gray centers

Keep responses SHORT and direct. Do NOT ask follow-up questions about field conditions or weather.
Focus only on what you can see in the camera.
Speak in English with occasional Tagalog words (Taglish).`;

const INITIAL_PROMPT =
  'Greet the farmer briefly and ask them to show you their rice leaves so you can check for any diseases.';

const FINALIZATION_PROMPT =
  'Time is almost up. Give your final diagnosis now based on what you have seen. Be direct and concise.';

const WARNING_THRESHOLD = 30;
const FINALIZATION_THRESHOLD = 10;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveSession(options: UseLiveSessionOptions): UseLiveSessionReturn {
  const { videoRef, onDiagnosisComplete, onFallback, sessionDuration = 120 } = options;

  const { data: authSession } = useSession();

  // ---- State ----
  const [status, setStatus] = useState<LiveSessionState['status']>('idle');
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [transcription, setTranscription] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // ---- Refs (mutable across renders, not triggering re-renders) ----
  const sessionRef = useRef<any>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const stopVideoCaptureRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRemainingRef = useRef(sessionDuration);
  const finalizationSentRef = useRef(false);
  const endingRef = useRef(false);
  const statusRef = useRef<LiveSessionState['status']>('idle');
  const textResponseResolverRef = useRef<((text: string) => void) | null>(null);
  const accumulatedTextRef = useRef('');
  const currentCameraIndexRef = useRef(0);
  const availableCamerasRef = useRef<MediaDeviceInfo[]>([]);
  const isMutedRef = useRef(false);
  /** True while we are intentionally closing the Live WS (avoids spurious "Connection lost" from onclose). */
  const closingLiveSessionRef = useRef(false);
  /** Bumped in cleanup so stale WebSocket callbacks from a previous attempt cannot fire errors after remount/retry. */
  const liveSessionEpochRef = useRef(0);

  // ---- Helpers ----

  const updateStatus = useCallback((newStatus: LiveSessionState['status']) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const cleanup = useCallback(() => {
    closingLiveSessionRef.current = true;
    liveSessionEpochRef.current += 1;
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Stop video capture
    if (stopVideoCaptureRef.current) {
      stopVideoCaptureRef.current();
      stopVideoCaptureRef.current = null;
    }
    // Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
    }
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    // Close session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // ignore
      }
      sessionRef.current = null;
    }
    finalizationSentRef.current = false;
    endingRef.current = false;
    // Do not clear closingLiveSessionRef here — deferred onclose may run after this;
    // reset only when starting a new session (startSession).
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ---- Fetch ephemeral token ----

  const fetchEphemeralToken = async (): Promise<string> => {
    const res = await fetch('/api/ai/live-token', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to fetch ephemeral token');
    }
    const { token } = await res.json();
    return token;
  };

  // ---- Audio capture setup ----

  const startAudioCapture = async (stream: MediaStream, session: any) => {
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    await audioCtx.audioWorklet.addModule('/pcm-processor.js');

    const source = audioCtx.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor');

    workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      // Skip sending audio if muted
      if (isMutedRef.current) return;

      const pcmBuffer = resampleAndEncode(event.data, audioCtx.sampleRate, 16000);
      const base64 = arrayBufferToBase64(pcmBuffer);
      try {
        session.sendRealtimeInput({
          audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
        });
      } catch {
        // Session may have closed
      }
    };

    source.connect(workletNode);
    workletNode.connect(audioCtx.destination); // required for worklet to process
  };

  // ---- Session timer (Task 9.2) ----

  const startTimer = useCallback(
    (session: any) => {
      timeRemainingRef.current = sessionDuration;
      setTimeRemaining(sessionDuration);
      setIsWarning(false);
      finalizationSentRef.current = false;

      timerRef.current = setInterval(() => {
        timeRemainingRef.current -= 1;
        const remaining = timeRemainingRef.current;
        setTimeRemaining(remaining);

        // 30s remaining — trigger warning state
        if (remaining <= WARNING_THRESHOLD && remaining > 0) {
          setIsWarning(true);
        }

        // 10s remaining — send finalization prompt (once)
        if (remaining <= FINALIZATION_THRESHOLD && !finalizationSentRef.current) {
          finalizationSentRef.current = true;
          try {
            session.sendRealtimeInput({
              text: FINALIZATION_PROMPT,
            });
          } catch {
            // Session may have closed
          }
        }

        // 0s — auto-close
        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (!endingRef.current) {
            // Trigger endSession flow
            handleSessionEnd(session);
          }
        }
      }, 1000);
    },
    // handleSessionEnd is intentionally omitted - it's called with the session parameter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionDuration]
  );

  // ---- Diagnosis extraction + save ----

  const handleSessionEnd = async (session: any) => {
    if (endingRef.current) return;
    endingRef.current = true;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    updateStatus('extracting');

    try {
      // Wire sendMessage and waitForResponse to the live session
      const sendMessage = (text: string) => {
        try {
          session.sendRealtimeInput({
            text: text,
          });
        } catch {
          // Session may have closed
        }
      };

      const waitForResponse = (): Promise<string> => {
        return new Promise<string>((resolve) => {
          accumulatedTextRef.current = '';
          textResponseResolverRef.current = resolve;

          // Timeout after 15s in case Gemini doesn't respond
          setTimeout(() => {
            if (textResponseResolverRef.current === resolve) {
              textResponseResolverRef.current = null;
              resolve(accumulatedTextRef.current || '');
            }
          }, 15000);
        });
      };

      const result = await extractDiagnosis(sendMessage, waitForResponse);

      if (!result.success || !result.diagnosis) {
        throw new Error(result.error || 'Diagnosis extraction failed');
      }

      // Save to Supabase
      const scanId = await saveDiagnosis(result.diagnosis);

      // Cleanup everything
      cleanup();
      updateStatus('idle');

      onDiagnosisComplete(scanId);
    } catch (err) {
      cleanup();
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      updateStatus('error');
    }
  };

  const saveDiagnosis = async (diagnosis: StructuredDiagnosis): Promise<string> => {
    const userId = (authSession?.user as { id?: string })?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const insertData = {
      user_id: userId,
      image_url: 'live-session',
      label: diagnosis.label,
      confidence: diagnosis.confidence,
      severity: diagnosis.severity,
      explanation_en: diagnosis.explanationEn,
      explanation_tl: diagnosis.explanationTl,
      cautions: diagnosis.cautions,
      prevention_steps: [] as {
        step: number;
        titleEn: string;
        titleTl: string;
        descriptionEn: string;
        descriptionTl: string;
      }[],
      treatment_steps: [] as {
        step: number;
        titleEn: string;
        titleTl: string;
        descriptionEn: string;
        descriptionTl: string;
      }[],
      sources: [] as { title: string; url: string }[],
    };

    const { data, error: insertError } = await (supabase as any)
      .from('scans')
      .insert([insertData])
      .select()
      .single();

    if (insertError || !data) {
      throw new Error(insertError?.message || 'Failed to save scan record');
    }

    return (data as { id: string }).id;
  };

  // ---- toggleCamera ----

  const toggleCamera = useCallback(() => {
    if (availableCamerasRef.current.length <= 1) return;
    const nextIndex = (currentCameraIndexRef.current + 1) % availableCamerasRef.current.length;
    currentCameraIndexRef.current = nextIndex;

    // Re-acquire video track with new device
    const deviceId = availableCamerasRef.current[nextIndex].deviceId;
    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false, // keep existing audio track
      })
      .then((newStream) => {
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        // Replace video track in existing media stream
        if (mediaStreamRef.current) {
          const oldVideoTrack = mediaStreamRef.current.getVideoTracks()[0];
          if (oldVideoTrack) {
            mediaStreamRef.current.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }
          mediaStreamRef.current.addTrack(newVideoTrack);
        }

        // Update video element
        if (videoRef.current && mediaStreamRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
        }
      })
      .catch((err) => {
        console.error('Failed to switch camera:', err);
      });
  }, [videoRef]);

  // ---- toggleMute ----

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  }, []);

  // ---- startSession ----

  const startSession = useCallback(async () => {
    try {
      closingLiveSessionRef.current = false;
      setError(null);
      updateStatus('connecting');
      setTranscription('');
      setIsWarning(false);
      setTimeRemaining(sessionDuration);

      // 1. Compatibility check (hard requirements only)
      const compat = checkLiveCompatibility();
      if (!compat.supported) {
        throw new Error(
          `Your browser is missing required features: ${compat.missing.join(', ')}. Please use Photo Capture mode instead.`
        );
      }

      // 2. Fetch ephemeral token (no bandwidth pre-check — manifest probe was latency-dominated and blocked valid networks)
      const token = await fetchEphemeralToken();

      // 3. Request camera + mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      });
      mediaStreamRef.current = stream;

      // Enumerate cameras for toggle support
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      availableCamerasRef.current = videoDevices;
      setHasMultipleCameras(videoDevices.length > 1);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 4. Create AudioPlayer for Gemini output
      const audioPlayer = new AudioPlayer(24000);
      audioPlayerRef.current = audioPlayer;

      // 5. Open WebSocket via ai.live.connect() (v1alpha required for ephemeral tokens)
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' },
      });

      const epochAtConnect = liveSessionEpochRef.current;

      const session = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr',
              },
            },
          },
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
        },
        callbacks: {
          onopen: () => {
            console.log('Live session connected');
          },
          onmessage: (message) => {
            if (liveSessionEpochRef.current !== epochAtConnect) return;
            handleMessage(message, audioPlayer);
          },
          onerror: (err: unknown) => {
            if (liveSessionEpochRef.current !== epochAtConnect) return;
            console.error('Live session error:', err);
            if (closingLiveSessionRef.current) return;
            if (statusRef.current === 'extracting') return;
            // Ignore errors during handshake; `live.connect()` will still reject if the socket never opens
            if (statusRef.current !== 'active') return;
            cleanup();
            setError('Connection error. Please retry or switch to Photo Capture.');
            updateStatus('error');
          },
          onclose: (event?: { code?: number; reason?: string }) => {
            if (liveSessionEpochRef.current !== epochAtConnect) return;
            if (closingLiveSessionRef.current) return;
            if (endingRef.current) return;
            if (statusRef.current !== 'active') return;
            const code = event?.code;
            if (code === 1000 || code === 1001 || code === 1005) return;
            cleanup();
            setError('Connection lost. Please retry or switch to Photo Capture.');
            updateStatus('error');
          },
        },
      });

      if (liveSessionEpochRef.current !== epochAtConnect) {
        try {
          session.close();
        } catch {
          // ignore
        }
        return;
      }

      sessionRef.current = session;

      // 6. Start video capture (1fps)
      if (videoRef.current) {
        const stopVideo = startVideoCapture(
          videoRef.current,
          (frame) => {
            try {
              session.sendRealtimeInput({ video: frame });
            } catch {
              // Session may have closed
            }
          },
          1000
        );
        stopVideoCaptureRef.current = stopVideo;
      }

      // 7. Start audio capture
      await startAudioCapture(stream, session);

      // 8. Start session timer
      startTimer(session);

      // 9. Send initial greeting prompt so Gemini speaks first
      try {
        session.sendRealtimeInput({
          text: INITIAL_PROMPT,
        });
      } catch {
        // Session may have closed
      }

      updateStatus('active');
    } catch (err) {
      cleanup();
      const message = err instanceof Error ? err.message : String(err);

      // If it's a permission error, provide a clearer message
      if (message.includes('NotAllowedError') || message.includes('Permission')) {
        setError('Camera and microphone permissions are required for live diagnosis.');
      } else {
        setError(message);
      }

      updateStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDuration, videoRef, onDiagnosisComplete, onFallback, cleanup, startTimer]);

  // ---- Handle incoming messages ----

  const handleMessage = useCallback(
    (message: any, audioPlayer: AudioPlayer) => {
      // goAway often arrives without serverContent — handle before early return
      if (message?.goAway) {
        if (!endingRef.current && sessionRef.current) {
          handleSessionEnd(sessionRef.current);
        }
        return;
      }

      const content = message?.serverContent;
      if (!content) return;

      // Audio playback
      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.inlineData?.data) {
            audioPlayer.enqueue(part.inlineData.data);
            setIsSpeaking(true);
          }
          // Text part (used during extraction)
          if (part.text) {
            accumulatedTextRef.current += part.text;
          }
        }
      }

      // Turn complete — resolve text response if waiting, update speaking state
      if (content.turnComplete) {
        setIsSpeaking(false);
        if (textResponseResolverRef.current && accumulatedTextRef.current) {
          const resolver = textResponseResolverRef.current;
          textResponseResolverRef.current = null;
          resolver(accumulatedTextRef.current);
          accumulatedTextRef.current = '';
        }
      }

      // Output transcription
      if (content.outputTranscription?.text) {
        setTranscription(content.outputTranscription.text);
      }

      // Input transcription (we don't display it but could)
      // if (content.inputTranscription?.text) { ... }

      // Interruption — stop audio playback
      if (content.interrupted) {
        audioPlayer.stop();
        setIsSpeaking(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ---- endSession ----

  const endSession = useCallback(async () => {
    if (sessionRef.current && !endingRef.current) {
      await handleSessionEnd(sessionRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    timeRemaining,
    isWarning,
    transcription,
    isSpeaking,
    error,
    isMuted,
    startSession,
    endSession,
    toggleCamera,
    toggleMute,
    hasMultipleCameras,
  };
}
