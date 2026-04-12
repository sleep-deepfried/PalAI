'use client';

import { type RefObject } from 'react';
import { Mic, Square, Play, AlertTriangle, Camera, RotateCcw, RotateCw } from 'lucide-react';
import type { LiveSessionState } from '@/hooks/useLiveSession';

export interface LiveSessionUIProps {
  status: LiveSessionState['status'];
  timeRemaining: number;
  transcription: string;
  isSpeaking: boolean;
  isWarning: boolean;
  error: string | null;
  onStart: () => void;
  onEnd: () => void;
  onFallback: () => void;
  onToggleCamera?: () => void;
  hasMultipleCameras?: boolean;
  videoRef: RefObject<HTMLVideoElement>;
}

/** Format seconds as M:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Presentational component for the live diagnosis session.
 * Bottom bar mirrors CameraCapture layout: switch camera | main button | spacer.
 */
export function LiveSessionUI({
  status,
  timeRemaining,
  transcription,
  isSpeaking,
  isWarning,
  error,
  onStart,
  onEnd,
  onFallback,
  onToggleCamera,
  hasMultipleCameras = false,
  videoRef,
}: LiveSessionUIProps) {
  const isActive = status === 'active' || status === 'extracting';
  const isIdle = status === 'idle';
  const isConnecting = status === 'connecting';
  const isError = status === 'error';
  const isExtracting = status === 'extracting';

  // --- Error state ---
  if (isError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="bg-red-500/20 p-4 rounded-full">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-white text-sm max-w-xs">{error || 'Something went wrong.'}</p>
        <div className="flex gap-3">
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-full text-sm font-semibold transition-colors hover:bg-green-500"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={onFallback}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-full text-sm font-semibold transition-colors hover:bg-gray-600"
          >
            <Camera className="w-4 h-4" />
            Photo Capture
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Camera preview — fills available space */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay layer on top of video */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* 30-second warning banner */}
        {isWarning && isActive && (
          <div className="mx-4 mt-4 px-4 py-2 bg-amber-500/90 backdrop-blur-sm rounded-lg flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
            <span className="text-white text-xs font-semibold">
              Session ending soon — wrapping up diagnosis
            </span>
          </div>
        )}

        {/* Timer (top-right) */}
        {isActive && (
          <div className="absolute top-4 right-4">
            <div
              className={`px-3 py-1.5 rounded-full text-sm font-mono font-bold backdrop-blur-sm ${
                isWarning ? 'bg-amber-500/80 text-white' : 'bg-black/50 text-white'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
          </div>
        )}

        {/* Audio indicator (top-left, visible when active) */}
        {isActive && (
          <div className="absolute top-4 left-4">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold ${
                isSpeaking ? 'bg-green-500/80 text-white' : 'bg-black/50 text-gray-300'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
              {isSpeaking ? 'AI Speaking' : 'Listening'}
            </div>
          </div>
        )}

        {/* Spacer pushes bottom content down */}
        <div className="flex-1" />

        {/* Extracting overlay */}
        {isExtracting && (
          <div className="mx-4 mb-3 px-4 py-3 bg-black/70 backdrop-blur-sm rounded-xl text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm font-semibold">Generating diagnosis…</span>
            </div>
          </div>
        )}

        {/* Transcription overlay (bottom) */}
        {isActive && transcription && (
          <div className="mx-4 mb-3 px-4 py-3 bg-black/60 backdrop-blur-sm rounded-xl">
            <p className="text-white text-sm leading-relaxed">{transcription}</p>
          </div>
        )}

        {/* Bottom controls — matches CameraCapture 3-column layout */}
        <div className="absolute bottom-20 left-0 right-0 pb-4 safe-area-bottom">
          <div className="flex items-center justify-center gap-8 px-4">
            {/* Left: Switch Camera (or spacer) */}
            {hasMultipleCameras && (isIdle || isActive) ? (
              <button
                onClick={onToggleCamera}
                className="w-12 h-12 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-gray-700 active:scale-95 transition-transform"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-12 h-12" />
            )}

            {/* Center: Main action button */}
            {isIdle && (
              <button
                onClick={onStart}
                className="w-18 h-18 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-transform shadow-lg"
              >
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
                  <Play className="w-7 h-7 text-white" />
                </div>
              </button>
            )}

            {isConnecting && (
              <div className="w-18 h-18 bg-white/50 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            )}

            {isActive && (
              <button
                onClick={onEnd}
                className="w-18 h-18 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-transform shadow-lg"
              >
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                  <Square className="w-7 h-7 text-white" />
                </div>
              </button>
            )}

            {/* Right: spacer to balance layout */}
            <div className="w-12 h-12" />
          </div>

          {/* Label below center button */}
          {isIdle && (
            <p className="text-center text-white text-xs mt-2 font-medium">Start Live Session</p>
          )}
          {isConnecting && (
            <p className="text-center text-gray-300 text-xs mt-2 font-medium">Connecting…</p>
          )}
          {isActive && (
            <p className="text-center text-white text-xs mt-2 font-medium">End Session</p>
          )}
        </div>
      </div>
    </div>
  );
}
