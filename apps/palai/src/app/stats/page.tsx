import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { StatsContent } from '@/components/stats/StatsContent';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import type { Database } from '@/types/database';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Scan = Database['public']['Tables']['scans']['Row'];

async function StatsData() {
  if (!supabaseAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-600 font-semibold mb-2">Database Not Configured</p>
          <p className="text-sm text-gray-600">
            Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file
          </p>
        </div>
      </div>
    );
  }

  const { data: scans, error } = await supabaseAdmin
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load scans:', error);
  }

  return <StatsContent initialScans={scans || []} />;
}

export default function StatsPage() {
  return (
    <Suspense fallback={<SkeletonLoader variant="chart" count={3} />}>
      <StatsData />
    </Suspense>
  );
}
