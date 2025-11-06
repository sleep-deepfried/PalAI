import Link from 'next/link';
import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { getDemoUserId } from '@/lib/demo-user';
import { ScanCard } from '@/components/history/ScanCard';
import { ClearAllButton } from '@/components/history/ClearAllButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { History as HistoryIcon, Camera } from 'lucide-react';

async function ScansList() {
  if (!supabaseAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Supabase admin client not configured</p>
      </div>
    );
  }

  const userId = await getDemoUserId();

  const { data: scans, error } = await supabaseAdmin
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch scans:', error);
  }

  if (!scans || scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <HistoryIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Scans Yet
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
          Start scanning rice leaves to build your history
        </p>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-transform"
        >
          <Camera className="w-5 h-5" />
          Start Scanning
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-3">
        {scans.length} {scans.length === 1 ? 'scan' : 'scans'} found
      </div>
      {scans.map((scan) => (
        <ScanCard key={scan.id} scan={scan} />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="text-sm text-gray-600 mb-3">Loading scans...</div>
      <SkeletonLoader variant="card" count={4} />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-6 safe-area-top">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <HistoryIcon className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Scan History</h1>
            </div>
            <Suspense fallback={null}>
              <ClearAllButton />
            </Suspense>
          </div>
          <p className="text-sm text-blue-100">
            View all your previous scans
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <ScansList />
        </Suspense>
      </div>
    </div>
  );
}
