'use client';

import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { checkLiveCompatibility } from '@/lib/live-compatibility';
import { resampleAndEncode, arrayBufferToBase64 } from '@/lib/audio-utils';
import { AudioPlayer } from '@/lib/audio-player';
import { startVideoCapture } from '@/lib/video-streamer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveSessionState {
  status: 'idle' | 'connecting' | 'active' | 'error';
  timeRemaining: number;
  isWarning: boolean;
  transcription: string;
  isSpeaking: boolean;
  error: string | null;
  isMuted: boolean;
}

export interface UseLiveSessionReturn extends LiveSessionState {
  startSession: () => Promise<void>;
  endSession: () => void;
  toggleCamera: () => void;
  toggleMute: () => void;
  hasMultipleCameras: boolean;
}

interface UseLiveSessionOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  onSessionEnd?: () => void;
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
Speak in English with occasional Tagalog words (Taglish).
If the farmer asks about treatment, provide simple actionable advice.`;

const INITIAL_PROMPT =
  'Greet the farmer briefly and ask them to show you their rice leaves so you can check for any diseases.';

const WARNING_THRESHOLD = 30;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveSession(options: UseLiveSessionOptions): UseLiveSessionReturn {
  const { videoRef, onSessionEnd, sessionDuration = 120 } = options;

  // ---- State ----
  const [status, setStatus] = useState<LiveSessionState['status']>('idle');
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [transcription, setTranscription] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted by default

  // ---- Refs (mutable across renders, not triggering re-renders) ----
  const sessionRef = useRef<any>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const stopVideoCaptureRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRemainingRef = useRef(sessionDuration);
  const statusRef = useRef<LiveSessionState['status']>('idle');
  const currentCameraIndexRef = useRef(0);
  const availableCamerasRef = useRef<MediaDeviceInfo[]>([]);
  const isMutedRef = useRef(true); // Start muted by default
  const closingLiveSessionRef = useRef(false);
  const liveSessionEpochRef = useRef(0);

  // ---- Helpers ----

  const updateStatus = useCallback((newStatus: LiveSessionState['status']) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const cleanup = useCallback(() => {
    closingLiveSessionRef.current = true;
    liveSessionEpochRef.current += 1;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stopVideoCaptureRef.current) {
      stopVideoCaptureRef.current();
      stopVideoCaptureRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // ignore
      }
      sessionRef.current = null;
    }
  }, []);

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
    workletNode.connect(audioCtx.destination);
  };

  // ---- Session timer ----

  const startTimer = useCallback(() => {
    timeRemainingRef.current = sessionDuration;
    setTimeRemaining(sessionDuration);
    setIsWarning(false);

    timerRef.current = setInterval(() => {
      timeRemainingRef.current -= 1;
      const remaining = timeRemainingRef.current;
      setTimeRemaining(remaining);

      if (remaining <= WARNING_THRESHOLD && remaining > 0) {
        setIsWarning(true);
      }

      // Auto-end at 0
      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        cleanup();
        updateStatus('idle');
        onSessionEnd?.();
      }
    }, 1000);
  }, [sessionDuration, cleanup, updateStatus, onSessionEnd]);

  // ---- toggleCamera ----

  const toggleCamera = useCallback(() => {
    if (availableCamerasRef.current.length <= 1) return;
    const nextIndex = (currentCameraIndexRef.current + 1) % availableCamerasRef.current.length;
    currentCameraIndexRef.current = nextIndex;

    const deviceId = availableCamerasRef.current[nextIndex].deviceId;
    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      })
      .then((newStream) => {
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        if (mediaStreamRef.current) {
          const oldVideoTrack = mediaStreamRef.current.getVideoTracks()[0];
          if (oldVideoTrack) {
            mediaStreamRef.current.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }
          mediaStreamRef.current.addTrack(newVideoTrack);
        }

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
    const wasMuted = isMutedRef.current;
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);

    // When unmuting, prompt AI to respond based on what it sees
    if (wasMuted && !isMutedRef.current && sessionRef.current) {
      try {
        sessionRef.current.sendRealtimeInput({
          text: 'The farmer is now ready to talk. Look at the camera and tell them what you see. If you see rice leaves, diagnose them.',
        });
      } catch {
        // Session may have closed
      }
    }
  }, []);

  // ---- Handle incoming messages ----

  const handleMessage = useCallback(
    (message: any, audioPlayer: AudioPlayer) => {
      // goAway — session expiring
      if (message?.goAway) {
        cleanup();
        updateStatus('idle');
        onSessionEnd?.();
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
        }
      }

      // Turn complete
      if (content.turnComplete) {
        setIsSpeaking(false);
      }

      // Output transcription
      if (content.outputTranscription?.text) {
        setTranscription(content.outputTranscription.text);
      }

      // Interruption
      if (content.interrupted) {
        audioPlayer.stop();
        setIsSpeaking(false);
      }
    },
    [cleanup, updateStatus, onSessionEnd]
  );

  // ---- startSession ----

  const startSession = useCallback(async () => {
    try {
      closingLiveSessionRef.current = false;
      setError(null);
      updateStatus('connecting');
      setTranscription('');
      setIsWarning(false);
      setTimeRemaining(sessionDuration);

      const compat = checkLiveCompatibility();
      if (!compat.supported) {
        throw new Error(
          `Your browser is missing required features: ${compat.missing.join(', ')}. Please use Photo Capture mode instead.`
        );
      }

      const token = await fetchEphemeralToken();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      });
      mediaStreamRef.current = stream;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      availableCamerasRef.current = videoDevices;
      setHasMultipleCameras(videoDevices.length > 1);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const audioPlayer = new AudioPlayer(24000);
      audioPlayerRef.current = audioPlayer;

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
            if (statusRef.current !== 'active') return;
            cleanup();
            setError('Connection error. Please retry or switch to Photo Capture.');
            updateStatus('error');
          },
          onclose: (event?: { code?: number; reason?: string }) => {
            if (liveSessionEpochRef.current !== epochAtConnect) return;
            if (closingLiveSessionRef.current) return;
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

      await startAudioCapture(stream, session);
      startTimer();

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

      if (message.includes('NotAllowedError') || message.includes('Permission')) {
        setError('Camera and microphone permissions are required for live diagnosis.');
      } else {
        setError(message);
      }

      updateStatus('error');
    }
  }, [sessionDuration, videoRef, cleanup, startTimer, updateStatus, handleMessage]);

  // ---- endSession ----

  const endSession = useCallback(() => {
    cleanup();
    updateStatus('idle');
    onSessionEnd?.();
  }, [cleanup, updateStatus, onSessionEnd]);

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
