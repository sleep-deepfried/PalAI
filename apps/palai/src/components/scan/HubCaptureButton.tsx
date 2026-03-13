'use client';

import { useCallback } from 'react';
import { useHubCapture } from '@/hooks/useHubCapture';

interface HubCaptureButtonProps {
  tunnelUrl: string;
  onCaptureStart: () => void;
  onCaptureSuccess: (scanId: string) => void;
  onCaptureError: (message: string) => void;
  disabled: boolean;
}

/**
 * Capture button for PalAI Hub mode. Sends POST to the edge server
 * and handles success, 429 (in-progress), and error states.
 */
export function HubCaptureButton({
  tunnelUrl,
  onCaptureStart,
  onCaptureSuccess,
  onCaptureError,
  disabled,
}: HubCaptureButtonProps) {
  const { isCapturing, error, triggerCapture, clearError } = useHubCapture(tunnelUrl);

  const handleClick = useCallback(async () => {
    onCaptureStart();
    clearError();

    try {
      const scanId = await triggerCapture();
      onCaptureSuccess(scanId);
    } catch (err) {
      if (err instanceof Error) {
        onCaptureError(err.message);
      } else {
        onCaptureError('An unexpected error occurred.');
      }
    }
  }, [onCaptureStart, onCaptureSuccess, onCaptureError, triggerCapture, clearError]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={disabled || isCapturing}
        className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white font-semibold text-xs active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Capture from Hub"
      >
        Capture
      </button>
      {error && (
        <p className="text-red-500 text-xs text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
