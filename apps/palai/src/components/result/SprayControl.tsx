'use client';

import { useState, useEffect, useCallback } from 'react';
import { Droplets, Leaf, Droplet, Bug } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllPumpStates,
  togglePump,
  turnOffAllPumps,
  type PumpChannel,
  type PumpState,
} from '@/app/actions/pump';

interface SprayControlProps {
  show?: boolean;
  language?: 'en' | 'tl';
}

interface PumpConfig {
  channel: PumpChannel;
  icon: React.ElementType;
  colorClass: string;
  activeColorClass: string;
}

const PUMP_CONFIGS: PumpConfig[] = [
  {
    channel: 1,
    icon: Droplets,
    colorClass: 'bg-sunbeam hover:bg-sunbeam-400 text-olive-700',
    activeColorClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
  {
    channel: 2,
    icon: Leaf,
    colorClass: 'bg-olive-100 hover:bg-olive-200 text-olive-700',
    activeColorClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
  {
    channel: 3,
    icon: Droplet,
    colorClass: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
    activeColorClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
  {
    channel: 4,
    icon: Bug,
    colorClass: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
    activeColorClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
];

const SPRAY_DURATION_SECONDS = 30;

export function SprayControl({ show = true, language = 'en' }: SprayControlProps) {
  const [pumpStates, setPumpStates] = useState<PumpState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePump, setActivePump] = useState<PumpChannel | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Fetch initial pump states
  useEffect(() => {
    async function fetchStates() {
      const states = await getAllPumpStates();
      if (states) {
        setPumpStates(states);
        // Check if any pump is already on
        if (states.pump1On) setActivePump(1);
        else if (states.pump2On) setActivePump(2);
        else if (states.pump3On) setActivePump(3);
        else if (states.pump4On) setActivePump(4);
      }
      setIsLoading(false);
    }
    fetchStates();
  }, []);

  // Countdown timer when a pump is active
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleStopAll();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const handleStopAll = useCallback(async () => {
    const result = await turnOffAllPumps();
    if (result.success) {
      setActivePump(null);
      setCountdown(null);
      setPumpStates((prev) =>
        prev ? { ...prev, pump1On: false, pump2On: false, pump3On: false, pump4On: false } : null
      );
      toast.success(language === 'en' ? 'All pumps stopped!' : 'Lahat ng pump ay huminto!');
    }
  }, [language]);

  const handleActivate = async (channel: PumpChannel) => {
    // If this pump is already active, stop it
    if (activePump === channel) {
      await handleStopAll();
      return;
    }

    // Turn off any active pump first
    if (activePump) {
      await togglePump(false, activePump);
    }

    setIsLoading(true);
    const result = await togglePump(true, channel);
    setIsLoading(false);

    if (result.success) {
      setActivePump(channel);
      setCountdown(SPRAY_DURATION_SECONDS);

      const label = getPumpLabel(channel);
      toast.success(
        language === 'en'
          ? `${label} activated for ${SPRAY_DURATION_SECONDS} seconds...`
          : `${label} ay naka-activate ng ${SPRAY_DURATION_SECONDS} segundo...`,
        {
          duration: SPRAY_DURATION_SECONDS * 1000,
          description:
            language === 'en'
              ? 'Treatment is being applied to your crops'
              : 'Ina-apply na ang treatment sa iyong crops',
        }
      );
    } else {
      toast.error(result.error || 'Failed to activate pump');
    }
  };

  const getPumpLabel = (channel: PumpChannel): string => {
    if (!pumpStates) {
      const defaultLabels = ['Spray Treatment', 'Fertilizer', 'Water', 'Pesticide'];
      return defaultLabels[channel - 1];
    }
    switch (channel) {
      case 1:
        return pumpStates.pump1Label;
      case 2:
        return pumpStates.pump2Label;
      case 3:
        return pumpStates.pump3Label;
      case 4:
        return pumpStates.pump4Label;
    }
  };

  const isPumpOn = (channel: PumpChannel): boolean => {
    if (!pumpStates) return false;
    switch (channel) {
      case 1:
        return pumpStates.pump1On;
      case 2:
        return pumpStates.pump2On;
      case 3:
        return pumpStates.pump3On;
      case 4:
        return pumpStates.pump4On;
    }
  };

  if (!show || isLoading) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Droplets className="w-4 h-4 text-olive-600" />
        {language === 'en' ? 'Pump Control' : 'Kontrol ng Pump'}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {PUMP_CONFIGS.map((config) => {
          const Icon = config.icon;
          const isActive = activePump === config.channel;
          const label = getPumpLabel(config.channel);

          return (
            <button
              key={config.channel}
              onClick={() => handleActivate(config.channel)}
              disabled={isLoading}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all ${
                isActive ? config.activeColorClass : config.colorClass
              } disabled:opacity-50`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-center leading-tight">
                {isActive && countdown ? `${label} (${countdown}s)` : label}
              </span>
            </button>
          );
        })}
      </div>

      {activePump && (
        <button
          onClick={handleStopAll}
          className="w-full mt-3 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
        >
          {language === 'en' ? 'Stop All Pumps' : 'Itigil Lahat ng Pump'}
        </button>
      )}
    </div>
  );
}
