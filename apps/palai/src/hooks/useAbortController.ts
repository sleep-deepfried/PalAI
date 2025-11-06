'use client';

import { useEffect, useRef } from 'react';

export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create a new AbortController
    abortControllerRef.current = new AbortController();

    // Cleanup: abort on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      // Create a new controller for potential retry
      abortControllerRef.current = new AbortController();
    }
  };

  const getSignal = () => {
    return abortControllerRef.current?.signal;
  };

  return { abort, getSignal };
}

