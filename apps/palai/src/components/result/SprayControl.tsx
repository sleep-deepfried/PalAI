'use client';

import { useState, useEffect, useCallback } from 'react';
import { Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { getPumpState, togglePump } from '@/app/actions/pump';

interface SprayControlProps {
  show?: boolean;
  language?: 'en' | 'tl';
}

const SPRAY_DURATION_SECONDS = 30;

export function SprayControl({ show = true, language = 'en' }: SprayControlProps) {
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Fetch initial pump state
  useEffect(() => {
    async function fetchState() {
      const state = await getPumpState();
      if (state) {
        setIsOn(state.isOn);
      }
      setIsLoading(false);
    }
    fetchState();
  }, []);

  // Countdown timer when spray is active
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleStop();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const handleStop = useCallback(async () => {
    const result = await togglePump(false);
    if (result.success) {
      setIsOn(false);
      setCountdown(null);
      toast.success(
        language === 'en' ? 'Spray treatment completed!' : 'Tapos na ang spray treatment!'
      );
    }
  }, [language]);

  const handleActivate = async () => {
    setIsLoading(true);
    const result = await togglePump(true);
    setIsLoading(false);

    if (result.success) {
      setIsOn(true);
      setCountdown(SPRAY_DURATION_SECONDS);
      toast.success(
        language === 'en'
          ? `Spraying for ${SPRAY_DURATION_SECONDS} seconds...`
          : `Nagsi-spray ng ${SPRAY_DURATION_SECONDS} segundo...`,
        {
          duration: SPRAY_DURATION_SECONDS * 1000,
          description:
            language === 'en'
              ? 'Treatment is being applied to your crops'
              : 'Ina-apply na ang treatment sa iyong crops',
        }
      );
    } else {
      toast.error(result.error || 'Failed to activate spray');
    }
  };

  if (!show || isLoading) return null;

  // If already spraying, show stop button
  if (isOn && countdown !== null) {
    return (
      <button
        onClick={handleStop}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
      >
        <Droplets className="w-5 h-5 animate-pulse" />
        {language === 'en' ? `Stop Spray (${countdown}s)` : `Itigil ang Spray (${countdown}s)`}
      </button>
    );
  }

  return (
    <button
      onClick={handleActivate}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sunbeam hover:bg-sunbeam-400 disabled:bg-sunbeam-200 text-olive-700 rounded-xl font-semibold transition-colors"
    >
      <Droplets className="w-5 h-5" />
      {language === 'en' ? 'Activate Spray Treatment' : 'I-activate ang Spray Treatment'}
    </button>
  );
}
