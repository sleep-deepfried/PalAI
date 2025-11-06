'use client';

import { Check } from 'lucide-react';

export interface Step {
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface MultiStepProgressProps {
  steps: Step[];
  percentage: number;
}

export function MultiStepProgress({ steps, percentage }: MultiStepProgressProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-green-600">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const isComplete = step.status === 'complete';
          const isActive = step.status === 'active';
          const isPending = step.status === 'pending';

          return (
            <div key={index} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-600 text-white scale-100'
                    : isActive
                    ? 'bg-green-100 text-green-600 border-2 border-green-600 scale-110'
                    : 'bg-gray-200 text-gray-400 scale-100'
                }`}
              >
                {isComplete ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="text-lg font-bold">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs text-center font-medium transition-colors ${
                  isComplete || isActive ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="mt-1 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

