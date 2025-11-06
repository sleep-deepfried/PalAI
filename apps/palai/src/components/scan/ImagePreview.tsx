'use client';

import Image from 'next/image';
import { X, Check, Loader2 } from 'lucide-react';

interface ImagePreviewProps {
  preview: string;
  locale: 'en' | 'tl';
  onLocaleChange: (locale: 'en' | 'tl') => void;
  onReset: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ImagePreview({
  preview,
  locale,
  onLocaleChange,
  onReset,
  onSubmit,
  isSubmitting,
}: ImagePreviewProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Preview Image</h2>
          <button
            onClick={onReset}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => onLocaleChange('en')}
            disabled={isSubmitting}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
              locale === 'en'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => onLocaleChange('tl')}
            disabled={isSubmitting}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
              locale === 'tl'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tagalog
          </button>
        </div>
      </div>

      {/* Image Preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 bg-white border-t safe-area-bottom">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Analyze Image
            </>
          )}
        </button>
        
        {isSubmitting && (
          <p className="text-center text-sm text-gray-500 mt-3">
            This may take a few seconds...
          </p>
        )}
      </div>
    </div>
  );
}
