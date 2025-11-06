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
import { ArrowLeft, Calendar, Camera, History as HistoryIcon, CheckCircle, AlertTriangle, Download } from 'lucide-react';

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

  const isHealthy = scan.label === 'HEALTHY';
  const diseaseIcon = isHealthy ? CheckCircle : AlertTriangle;
  const DiseaseIcon = diseaseIcon;
  const headerGradient = isHealthy 
    ? 'from-green-600 via-green-700 to-emerald-800' 
    : 'from-amber-600 via-orange-600 to-red-700';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Enhanced Header with Gradient */}
      <div className={`bg-gradient-to-br ${headerGradient} text-white px-4 py-8 safe-area-top relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-32 translate-y-32"></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to History</span>
          </Link>

          {/* Title with Icon */}
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${
              isHealthy ? 'bg-green-500/30' : 'bg-orange-500/30'
            } backdrop-blur-sm`}>
              <DiseaseIcon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white/80 mb-1">Diagnosis Result</div>
              <h1 className="text-3xl font-bold mb-2">{LABEL_LABELS[scan.label]}</h1>
              <div className="inline-flex items-center gap-2">
                <SeverityBadge severity={scan.severity} />
                <span className="text-sm text-white/90">
                  {Math.round(scan.confidence * 100)}% Confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Image Card - Enhanced */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 animate-fade-in">
          <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
            <Image
              src={scan.image_url}
              alt={LABEL_LABELS[scan.label]}
              fill
              className="object-contain p-4"
              priority
            />
          </div>
        </div>

        {/* Confidence Card - Enhanced */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-fade-in-delay-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900">AI Confidence Score</h3>
          </div>
          <ConfidenceBar confidence={scan.confidence} />
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

        {/* Metadata & Share */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/scan"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 active:scale-[0.98] transition-all shadow-lg"
          >
            <Camera className="w-5 h-5" />
            Scan Again
          </Link>
          <Link
            href="/history"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all shadow-lg border border-gray-200"
          >
            <HistoryIcon className="w-5 h-5" />
            View History
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-400 to-gray-500 px-4 py-8 safe-area-top animate-pulse">
        <div className="max-w-2xl mx-auto">
          <div className="h-4 w-24 bg-white/30 rounded mb-4" />
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/30 rounded-2xl" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-white/30 rounded mb-2" />
              <div className="h-8 w-48 bg-white/30 rounded mb-2" />
              <div className="h-4 w-36 bg-white/30 rounded" />
            </div>
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
