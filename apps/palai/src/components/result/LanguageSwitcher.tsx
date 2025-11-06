'use client';

import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  explanationEn: string;
  explanationTl: string;
  language: 'en' | 'tl';
  onLanguageChange: (lang: 'en' | 'tl') => void;
}

export function LanguageSwitcher({ 
  explanationEn, 
  explanationTl,
  language,
  onLanguageChange 
}: LanguageSwitcherProps) {

  return (
    <>
      {/* Language Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Explanation</h3>
        </div>
        
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as 'en' | 'tl')}
          className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
        >
          <option value="en">🇬🇧 English</option>
          <option value="tl">🇵🇭 Tagalog</option>
        </select>
      </div>

      {/* Explanation Text */}
      <div className="prose prose-sm max-w-none">
        {language === 'en' ? (
          <p className="text-gray-700 leading-relaxed">{explanationEn}</p>
        ) : (
          <p className="text-gray-700 leading-relaxed">{explanationTl}</p>
        )}
      </div>
    </>
  );
}

