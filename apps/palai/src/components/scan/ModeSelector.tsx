'use client';

import { Camera, Radio } from 'lucide-react';
import { useEffect } from 'react';

const STORAGE_KEY = 'palai-scan-mode';

interface ModeSelectorProps {
  mode: 'photo' | 'live';
  onModeChange: (mode: 'photo' | 'live') => void;
  liveSupported: boolean;
}

/**
 * Segmented control for switching between "Photo Capture" and "Live Diagnosis" modes.
 * Disables "Live Diagnosis" when the device does not support the required APIs.
 * Persists the farmer's selection to localStorage.
 */
export function ModeSelector({ mode, onModeChange, liveSupported }: ModeSelectorProps) {
  // Persist mode to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }
  }, [mode]);

  const handleModeChange = (newMode: 'photo' | 'live') => {
    if (newMode === 'live' && !liveSupported) return;
    onModeChange(newMode);
  };

  return (
    <div className="flex items-center bg-gray-800/80 backdrop-blur-sm rounded-full p-1">
      <button
        onClick={() => handleModeChange('photo')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          mode === 'photo' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
        }`}
        aria-pressed={mode === 'photo'}
      >
        <Camera className="w-3.5 h-3.5" />
        Photo Capture
      </button>
      <button
        onClick={() => handleModeChange('live')}
        disabled={!liveSupported}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          mode === 'live' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
        } ${!liveSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-pressed={mode === 'live'}
        title={!liveSupported ? 'Live Diagnosis is not supported on this device' : undefined}
      >
        <Radio className="w-3.5 h-3.5" />
        Live Diagnosis
      </button>
    </div>
  );
}
