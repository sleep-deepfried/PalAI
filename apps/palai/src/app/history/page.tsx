import Link from 'next/link';
import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { getDemoUserId } from '@/lib/demo-user';
import { ScanCard } from '@/components/history/ScanCard';
import { ClearAllButton } from '@/components/history/ClearAllButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { History as HistoryIcon, Camera, FileText, TrendingUp } from 'lucide-react';
import { LABEL_LABELS } from '@/lib/constants';
import type { Database, Label } from '@/types/database';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ScanRow = Database['public']['Tables']['scans']['Row'];

async function ScansList() {
  if (!supabaseAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Supabase admin client not configured</p>
      </div>
    );
  }

  const userId = await getDemoUserId();

  const { data, error } = await supabaseAdmin
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch scans:', error);
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mb-6 animate-fade-in">
          <HistoryIcon className="w-12 h-12 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 animate-fade-in-delay-1">
          No Scans Yet
        </h3>
        <p className="text-sm text-gray-600 text-center mb-8 max-w-xs animate-fade-in-delay-2">
          Start scanning rice leaves to build your history and track disease patterns
        </p>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 active:scale-95 transition-all shadow-lg animate-fade-in-delay-3"
        >
          <Camera className="w-5 h-5" />
          Start Scanning
        </Link>
      </div>
    );
  }

  const scans = data as ScanRow[];

  // Calculate summary stats
  const totalScans = scans.length;
  const diseaseCounts = scans.reduce<Partial<Record<Label, number>>>((acc, scan: ScanRow) => {
    if (scan.label !== 'HEALTHY') {
      acc[scan.label] = (acc[scan.label] ?? 0) + 1;
    }
    return acc;
  }, {});
  
  const topDisease = Object.entries(diseaseCounts).sort(([, a], [, b]) => b - a)[0];
  const healthyCount = scans.filter(s => s.label === 'HEALTHY').length;
  const diseasedCount = scans.length - healthyCount;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-xl bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                Total Scans
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {totalScans}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-xl bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                Healthy
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {healthyCount}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-xl bg-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                Diseased
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {diseasedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Most Common Disease */}
      {topDisease && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Most Common Issue</h3>
          </div>
          <p className="text-sm text-gray-700 ml-8">
            <span className="font-bold">{LABEL_LABELS[topDisease[0] as keyof typeof LABEL_LABELS]}</span>
            {' '}detected in {topDisease[1]} scan{topDisease[1] > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Scans List */}
      <div className="space-y-3">
        {scans.map((scan) => (
          <ScanCard key={scan.id} scan={scan} />
        ))}
      </div>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-4 pt-72 pb-8 safe-area-top relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-32 translate-y-32"></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <HistoryIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Scan History</h1>
              </div>
            </div>
            <Suspense fallback={null}>
              <ClearAllButton />
            </Suspense>
          </div>
          <p className="text-blue-100">
            Track and review all your rice leaf diagnoses
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <ScansList />
        </Suspense>
      </div>
    </div>
  );
}
