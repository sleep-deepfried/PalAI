'use client';

import { useState, useEffect, useCallback } from 'react';
import { Droplets, Power, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getPumpState, togglePump } from '@/app/actions/pump';

interface SprayControlProps {
  /** Whether to show the control (hide for HEALTHY diagnosis) */
  show?: boolean;
  /** Language for labels */
  language?: 'en' | 'tl';
}

const SPRAY_DURATION_SECONDS = 30;

export function SprayControl({ show = true, language = 'en' }: SprayControlProps) {
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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
          // Auto-off when countdown reaches 0
          handleToggle(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleToggle = useCallback(
    async (turnOn: boolean) => {
      setIsToggling(true);
      setError(null);

      const result = await togglePump(turnOn);

      if (result.success) {
        setIsOn(turnOn);
        if (turnOn) {
          setCountdown(SPRAY_DURATION_SECONDS);
        } else {
          setCountdown(null);
          if (!turnOn && isOn) {
            // Show success message when spray completes
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }
        }
      } else {
        setError(result.error || 'Failed to control spray');
      }

      setIsToggling(false);
    },
    [isOn]
  );

  const handleActivateSpray = () => {
    handleToggle(true);
  };

  const handleStopSpray = () => {
    handleToggle(false);
  };

  if (!show) return null;

  const labels = {
    en: {
      title: 'Spray Treatment',
      description: 'Activate the spray system to apply treatment to your crops.',
      activate: 'Activate Spray',
      stop: 'Stop Spray',
      spraying: 'Spraying...',
      remaining: 'remaining',
      success: 'Treatment applied successfully!',
      loading: 'Checking spray system...',
      notConnected: 'Spray system not connected',
    },
    tl: {
      title: 'Spray Treatment',
      description: 'I-activate ang spray system para mag-apply ng treatment sa iyong crops.',
      activate: 'I-activate ang Spray',
      stop: 'Itigil ang Spray',
      spraying: 'Nagsi-spray...',
      remaining: 'natitira',
      success: 'Matagumpay na na-apply ang treatment!',
      loading: 'Tine-check ang spray system...',
      notConnected: 'Hindi nakakonekta ang spray system',
    },
  };

  const t = labels[language];

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-center gap-3 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Droplets className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{t.description}</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success message */}
      {showSuccess && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-4 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{t.success}</span>
        </div>
      )}

      {/* Spray status and control */}
      {isOn ? (
        <div className="space-y-3">
          {/* Active spray indicator */}
          <div className="flex items-center justify-between bg-blue-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Droplets className="w-6 h-6 text-blue-600 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
              </div>
              <div>
                <span className="font-semibold text-blue-800">{t.spraying}</span>
                {countdown !== null && (
                  <span className="text-blue-600 text-sm ml-2">
                    {countdown}s {t.remaining}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={handleStopSpray}
            disabled={isToggling}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-semibold transition-colors"
          >
            {isToggling ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Power className="w-5 h-5" />
            )}
            {t.stop}
          </button>
        </div>
      ) : (
        <button
          onClick={handleActivateSpray}
          disabled={isToggling}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold transition-colors"
        >
          {isToggling ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Droplets className="w-5 h-5" />
          )}
          {t.activate}
        </button>
      )}

      {/* Duration note */}
      <p className="text-xs text-gray-500 text-center mt-3">
        {language === 'en'
          ? `Spray will automatically stop after ${SPRAY_DURATION_SECONDS} seconds`
          : `Awtomatikong titigil ang spray pagkatapos ng ${SPRAY_DURATION_SECONDS} segundo`}
      </p>
    </div>
  );
}
