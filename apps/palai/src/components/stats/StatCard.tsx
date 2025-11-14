'use client';

import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

export function StatCard({ icon: Icon, label, value, trend, color = 'blue' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;

  useEffect(() => {
    // Animate number counting up
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 30;
      const increment = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, numericValue]);

  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex flex-col h-full">
        {/* Icon and Label */}
        <div className="flex items-center justify-center mb-3">
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        <div className="text-center flex-1">
          <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
            {label}
          </div>
          
          <div className="text-2xl sm:text-xl font-bold text-gray-900">
            {typeof value === 'number' ? displayValue : value}
          </div>
          
          {trend && (
            <div className={`flex items-center justify-center gap-1 text-xs font-medium mt-2 ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

