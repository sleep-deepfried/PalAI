'use client';

import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white px-4 pt-8 pb-4 safe-area-top relative overflow-hidden flex-shrink-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-24 -translate-y-24"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-32 translate-y-32"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Preview & Confirm</h2>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="relative w-full max-w-md aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-xl border border-gray-200">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain p-3"
            unoptimized
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pb-20 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-3">
          <button
            onClick={onReset}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Retake
          </button>
          
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 active:scale-[0.98] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Analyze
              </>
            )}
          </button>
        </div>
        
        {isSubmitting && (
          <p className="text-center text-sm text-gray-600 mt-2 font-medium">
            This may take a few seconds...
          </p>
        )}
      </div>
    </div>
  );
}
