import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { ConfidenceBar } from '@/components/result/ConfidenceBar';
import { SeverityBadge } from '@/components/result/SeverityBadge';
import { ShareLink } from '@/components/result/ShareLink';
import { ResultDetails } from '@/components/result/ResultDetails';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { LABEL_LABELS } from '@/lib/constants';
import { ArrowLeft, Calendar } from 'lucide-react';

async function ResultContent({ id }: { id: string }) {
  
  if (!supabaseAdmin) {
    console.error('Supabase admin client not available');
    notFound();
  }
  
  const { data: scan, error } = await supabaseAdmin
    .from('scans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !scan) {
    console.error('Failed to fetch scan:', error);
    notFound();
  }

  // Ensure cautions is always an array
  const cautions = Array.isArray(scan.cautions) 
    ? scan.cautions 
    : scan.cautions 
      ? [scan.cautions] 
      : [];

  const shareUrl = process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/result/${id}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 safe-area-top">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Diagnosis Result</h1>
            <SeverityBadge severity={scan.severity} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Image Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-md">
          <div className="relative w-full aspect-square bg-gray-100">
            <Image
              src={scan.image_url}
              alt={LABEL_LABELS[scan.label]}
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Diagnosis Card */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Detected Disease</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {LABEL_LABELS[scan.label]}
            </h2>
            <ConfidenceBar confidence={scan.confidence} />
          </div>
        </div>

        {/* Result Details with Treatment Guide */}
        <ResultDetails
          scanId={scan.id}
          disease={scan.label}
          explanationEn={scan.explanation_en}
          explanationTl={scan.explanation_tl}
          preventionSteps={scan.prevention_steps || []}
          treatmentSteps={scan.treatment_steps || []}
          sources={scan.sources || []}
          cautions={cautions}
        />

        {/* Metadata */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(scan.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <ShareLink shareUrl={shareUrl} />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-4 safe-area-top">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </Link>
          <div className="flex items-center justify-between">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <SkeletonLoader variant="image" />
      </div>
    </div>
  );
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ResultContent id={id} />
    </Suspense>
  );
}
