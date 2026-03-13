'use client';

import { useState, useCallback } from 'react';

interface HubStreamProps {
  tunnelUrl: string;
  onError: (message: string) => void;
}

/**
 * Displays the live MJPEG feed from the PalAI Hub edge server.
 * Shows a reconnection message with retry button on error.
 */
export function HubStream({ tunnelUrl, onError }: HubStreamProps) {
  const [hasError, setHasError] = useState(false);
  const [streamKey, setStreamKey] = useState(0);

  const handleError = useCallback(() => {
    setHasError(true);
    onError('Hub stream connection lost. The PalAI Hub may be unreachable.');
  }, [onError]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setStreamKey((k) => k + 1);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 rounded-lg p-6 gap-4">
        <p className="text-red-500 text-sm text-center">
          Unable to connect to PalAI Hub. The device may be offline or unreachable.
        </p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg active:scale-95 transition-transform"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <img
      key={streamKey}
      src={`${tunnelUrl}/stream`}
      alt="PalAI Hub live stream"
      className="w-full h-full object-cover rounded-lg"
      onError={handleError}
    />
  );
}
