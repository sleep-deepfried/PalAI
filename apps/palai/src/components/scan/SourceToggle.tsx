'use client';

import { Smartphone, Radio } from 'lucide-react';

interface SourceToggleProps {
  source: 'mobile' | 'hub';
  onSourceChange: (source: 'mobile' | 'hub') => void;
}

/**
 * Segmented control for switching between "Mobile Camera" and "PalAI Hub" input modes.
 * Only renders when NEXT_PUBLIC_PI_TUNNEL_URL is set and non-empty.
 */
export function SourceToggle({ source, onSourceChange }: SourceToggleProps) {
  const tunnelUrl = process.env.NEXT_PUBLIC_PI_TUNNEL_URL;

  if (!tunnelUrl || tunnelUrl.trim().length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-gray-800/80 backdrop-blur-sm rounded-full p-1">
      <button
        onClick={() => onSourceChange('mobile')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          source === 'mobile' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
        }`}
        aria-pressed={source === 'mobile'}
      >
        <Smartphone className="w-3.5 h-3.5" />
        Mobile Camera
      </button>
      <button
        onClick={() => onSourceChange('hub')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          source === 'hub' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
        }`}
        aria-pressed={source === 'hub'}
      >
        <Radio className="w-3.5 h-3.5" />
        PalAI Hub
      </button>
    </div>
  );
}
