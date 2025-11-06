import Link from 'next/link';
import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { getDemoUserId } from '@/lib/demo-user';
import { ScanCard } from '@/components/history/ScanCard';
import { ClearAllButton } from '@/components/history/ClearAllButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { History as HistoryIcon, Camera, FileText, TrendingUp } from 'lucide-react';
import { LABEL_LABELS } from '@/lib/constants';

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

  // Calculate summary stats
  const totalScans = scans.length;
  const diseaseCounts = scans.reduce((acc, scan) => {
    if (scan.label !== 'HEALTHY') {
      acc[scan.label] = (acc[scan.label] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const topDisease = Object.entries(diseaseCounts).sort(([, a], [, b]) => b - a)[0];
  const healthyCount = scans.filter(s => s.label === 'HEALTHY').length;
  const avgConfidence = (scans.reduce((sum, s) => sum + s.confidence, 0) / scans.length) * 100;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalScans}</div>
          <div className="text-xs text-gray-600">Total Scans</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{healthyCount}</div>
          <div className="text-xs text-gray-600">Healthy</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{Math.round(avgConfidence)}%</div>
          <div className="text-xs text-gray-600">Avg Confidence</div>
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
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-4 py-8 safe-area-top relative overflow-hidden">
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
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <ScansList />
        </Suspense>
      </div>
    </div>
  );
}
