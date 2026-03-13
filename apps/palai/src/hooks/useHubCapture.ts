'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHubCaptureReturn {
  isCapturing: boolean;
  error: string | null;
  triggerCapture: () => Promise<string>;
  clearError: () => void;
}

/**
 * Hook that encapsulates the remote hub capture request logic.
 * Manages capture state, error handling, and AbortController for cleanup.
 */
export function useHubCapture(tunnelUrl: string): UseHubCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const triggerCapture = useCallback(async (): Promise<string> => {
    setIsCapturing(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${tunnelUrl}/capture`, {
        method: 'POST',
        signal: controller.signal,
      });

      if (response.status === 429) {
        const body = await response.json();
        const message = body.error || 'Capture already in progress. Please wait.';
        setError(message);
        throw new Error(message);
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Capture failed' }));
        const message = body.error || 'Capture failed';
        setError(message);
        throw new Error(message);
      }

      const data = await response.json();
      return data.scanId;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        const message = 'Capture request timed out. Please try again.';
        setError(message);
        throw new Error(message);
      }
      if (err instanceof Error && !error) {
        setError(err.message);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      setIsCapturing(false);
      abortControllerRef.current = null;
    }
  }, [tunnelUrl, error]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { isCapturing, error, triggerCapture, clearError };
}
