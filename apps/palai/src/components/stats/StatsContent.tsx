'use client';

import { StatCard } from '@/components/stats/StatCard';
import { DiseaseDonut } from '@/components/stats/DiseaseDonut';
import { TrendChart } from '@/components/stats/TrendChart';
import { LABEL_LABELS } from '@/lib/constants';
import {
  TrendingUp,
  Activity,
  Award,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import type { Database } from '@/types/database';

type Scan = Database['public']['Tables']['scans']['Row'];

interface StatsContentProps {
  initialScans: Scan[];
}

export function StatsContent({ initialScans }: StatsContentProps) {
  const scans = initialScans;

  // Calculate statistics
  const totalScans = scans.length;

  // Most detected disease
  const diseaseCounts = scans.reduce((acc, scan) => {
    if (scan.label !== 'HEALTHY') {
      acc[scan.label] = (acc[scan.label] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const topDisease = Object.entries(diseaseCounts).sort(([, a], [, b]) => b - a)[0];
  const topDiseaseLabel = topDisease ? LABEL_LABELS[topDisease[0] as keyof typeof LABEL_LABELS] : 'None';

  // Health score (percentage of healthy scans)
  const healthyCount = scans.filter(s => s.label === 'HEALTHY').length;
  const healthScore = totalScans > 0 ? (healthyCount / totalScans) * 100 : 0;

  // Disease distribution for donut chart
  const labelCounts = scans.reduce((acc, scan) => {
    acc[scan.label] = (acc[scan.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const diseaseData = Object.entries(labelCounts).map(([label, count]) => ({
    label,
    count,
    percentage: (count / totalScans) * 100,
  }));

  // Trend data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const trendData = last7Days.map(date => {
    const dayScans = scans.filter(s => s.created_at.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      scans: dayScans.length,
      healthy: dayScans.filter(s => s.label === 'HEALTHY').length,
      diseased: dayScans.filter(s => s.label !== 'HEALTHY').length,
    };
  });

  // Generate insights
  const insights = [];
  
  if (healthScore >= 50) {
    insights.push(`${healthScore.toFixed(0)}% of scanned leaves are healthy`);
  } else if (healthScore < 30 && healthScore > 0) {
    insights.push(`Only ${healthScore.toFixed(0)}% of leaves are healthy - consider preventive measures`);
  }

  if (topDisease) {
    insights.push(`${topDiseaseLabel} is the most detected disease (${topDisease[1]} cases)`);
  }

  const recentScans = scans.slice(0, Math.min(10, scans.length));
  const olderScans = scans.slice(Math.min(10, scans.length));
  if (recentScans.length >= 5 && olderScans.length >= 5) {
    const recentHealthy = recentScans.filter(s => s.label === 'HEALTHY').length / recentScans.length;
    const olderHealthy = olderScans.filter(s => s.label === 'HEALTHY').length / olderScans.length;
    if (recentHealthy > olderHealthy * 1.2) {
      insights.push('Crop health is improving over time 📈');
    } else if (recentHealthy < olderHealthy * 0.8) {
      insights.push('Crop health is declining - early intervention recommended ⚠️');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white px-4 pt-24 pb-8 safe-area-top relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-32 translate-y-32"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-3xl font-bold">Insights</h1>
            </div>
          </div>
          <p className="text-base sm:text-lg text-purple-100">
            Data-driven insights from rice leaf analysis
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 space-y-6">
        {totalScans === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-md">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Data Yet
            </h3>
            <p className="text-sm text-gray-600">
              Start scanning rice leaves to see insights
            </p>
          </div>
        ) : (
          <>
            {/* Hero Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={Activity}
                  label="Total Scans"
                  value={totalScans}
                  color="blue"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Health Score"
                  value={`${healthScore.toFixed(0)}%`}
                  color="purple"
                />
              </div>
              
              <div className="max-w-md mx-auto">
                <StatCard
                  icon={Award}
                  label="Top Disease"
                  value={topDiseaseLabel}
                  color="orange"
                />
              </div>
            </div>

            {/* Disease Detection Patterns */}
            <div className="grid md:grid-cols-2 gap-6">
              <DiseaseDonut data={diseaseData} />
              
              {/* Key Insights */}
              <div className="bg-white rounded-2xl p-5 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Key Insights
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  What the data is telling us
                </p>

                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                      >
                        <span className="text-purple-600 mt-0.5">•</span>
                        <p className="text-sm text-gray-700 flex-1">{insight}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Not enough data to generate insights yet
                  </p>
                )}
              </div>
            </div>

            {/* Trends Over Time */}
            {trendData.some(d => d.scans > 0) && (
              <TrendChart data={trendData} />
            )}

            {/* Context Message */}
            <div className="text-center text-sm text-gray-500 pt-4">
              <p>Showing insights from {totalScans} total scans</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

