'use client';

interface SkeletonLoaderProps {
  variant?: 'card' | 'image' | 'text' | 'chart';
  count?: number;
}

export function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {skeletons.map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-md animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-6 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'image') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-2xl w-full" />
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          {skeletons.map((i) => (
            <div key={i} className="flex items-end gap-2 h-32">
              <div className="flex-1 bg-gray-200 rounded" style={{ height: `${Math.random() * 100 + 20}%` }} />
              <div className="flex-1 bg-gray-200 rounded" style={{ height: `${Math.random() * 100 + 20}%` }} />
              <div className="flex-1 bg-gray-200 rounded" style={{ height: `${Math.random() * 100 + 20}%` }} />
              <div className="flex-1 bg-gray-200 rounded" style={{ height: `${Math.random() * 100 + 20}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // text variant
  return (
    <div className="space-y-3 animate-pulse">
      {skeletons.map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

