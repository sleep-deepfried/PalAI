'use client';

import { User, Users } from 'lucide-react';

interface ViewToggleProps {
  view: 'personal' | 'community';
  onChange: (view: 'personal' | 'community') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="bg-white rounded-xl p-1 shadow-md inline-flex">
      <button
        onClick={() => onChange('personal')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          view === 'personal'
            ? 'bg-green-600 text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <User className="w-4 h-4" />
        <span>My Scans</span>
      </button>
      <button
        onClick={() => onChange('community')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          view === 'community'
            ? 'bg-green-600 text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Users className="w-4 h-4" />
        <span>Community</span>
      </button>
    </div>
  );
}

