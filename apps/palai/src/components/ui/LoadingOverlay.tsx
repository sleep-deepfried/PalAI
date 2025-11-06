'use client';

import { X, Clock } from 'lucide-react';
import { MultiStepProgress, Step } from './MultiStepProgress';

interface LoadingOverlayProps {
  steps: Step[];
  currentStep: number;
  percentage: number;
  message: string;
  estimatedTime?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function LoadingOverlay({
  steps,
  currentStep,
  percentage,
  message,
  estimatedTime,
  onCancel,
  showCancel = true,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 safe-area-bottom safe-area-top">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Processing...</h2>
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
              aria-label="Cancel"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          )}
        </div>

        {/* Progress */}
        <MultiStepProgress steps={steps} percentage={percentage} />

        {/* Status Message */}
        <div className="mt-8 text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">{message}</p>
          
          {estimatedTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{estimatedTime}</span>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        {showCancel && onCancel && (
          <div className="mt-8">
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all"
            >
              Cancel Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

