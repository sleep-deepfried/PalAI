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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white px-4 py-5 safe-area-top relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-24 -translate-y-24"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-32 translate-y-32"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Preview & Confirm</h2>
            </div>
            <button
              onClick={onReset}
              disabled={isSubmitting}
              className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg active:scale-95 transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => onLocaleChange('en')}
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                locale === 'en'
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLocaleChange('tl')}
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                locale === 'tl'
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Tagalog
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-full max-w-md aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-xl border border-gray-200">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain p-4"
            unoptimized
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 active:scale-[0.98] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
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
          <p className="text-center text-sm text-gray-600 mt-3 font-medium">
            This may take a few seconds...
          </p>
        )}
      </div>
    </div>
  );
}
