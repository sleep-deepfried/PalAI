'use client';

import { useEffect, useState } from 'react';

interface ConfidenceGaugeProps {
  confidence: number; // 0-100
}

export function ConfidenceGauge({ confidence }: ConfidenceGaugeProps) {
  const [displayConfidence, setDisplayConfidence] = useState(0);

  useEffect(() => {
    // Animate the gauge
    const duration = 1500;
    const steps = 60;
    const increment = confidence / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= confidence) {
        setDisplayConfidence(confidence);
        clearInterval(timer);
      } else {
        setDisplayConfidence(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [confidence]);

  // Calculate color based on confidence
  const getColor = () => {
    if (confidence >= 75) return '#10b981'; // green
    if (confidence >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getLabel = () => {
    if (confidence >= 75) return 'High Confidence';
    if (confidence >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayConfidence / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-900">
            {Math.round(displayConfidence)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Confidence</div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-sm font-semibold" style={{ color: getColor() }}>
          {getLabel()}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Average AI confidence score
        </div>
      </div>
    </div>
  );
}

