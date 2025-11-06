'use client';

import { useState } from 'react';
import { StatCard } from '@/components/stats/StatCard';
import { ViewToggle } from '@/components/stats/ViewToggle';
import { ConfidenceGauge } from '@/components/stats/ConfidenceGauge';
import { DiseaseDonut } from '@/components/stats/DiseaseDonut';
import { ConfidenceDistribution } from '@/components/stats/ConfidenceDistribution';
import { TrendChart } from '@/components/stats/TrendChart';
import { LABEL_LABELS } from '@/lib/constants';
import {
  TrendingUp,
  Target,
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
  const [view, setView] = useState<'personal' | 'community'>('community');
  const scans = initialScans; // In future, could filter by view with authentication

  // Calculate statistics
  const totalScans = scans.length;
  const avgConfidence = scans.length > 0
    ? (scans.reduce((sum, scan) => sum + scan.confidence, 0) / scans.length) * 100
    : 0;

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

  // Confidence distribution
  const confidenceRanges = [
    { range: '0-50%', min: 0, max: 0.5, count: 0, percentage: 0 },
    { range: '50-75%', min: 0.5, max: 0.75, count: 0, percentage: 0 },
    { range: '75-90%', min: 0.75, max: 0.9, count: 0, percentage: 0 },
    { range: '90-100%', min: 0.9, max: 1, count: 0, percentage: 0 },
  ];

  scans.forEach(scan => {
    const range = confidenceRanges.find(
      r => scan.confidence >= r.min && scan.confidence < r.max
    ) || confidenceRanges[confidenceRanges.length - 1];
    range.count++;
  });

  confidenceRanges.forEach(range => {
    range.percentage = totalScans > 0 ? (range.count / totalScans) * 100 : 0;
  });

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
  const highConfidencePercent = confidenceRanges
    .filter(r => r.range.includes('75-90') || r.range.includes('90-100'))
    .reduce((sum, r) => sum + r.percentage, 0);
  
  if (highConfidencePercent >= 75) {
    insights.push(`${highConfidencePercent.toFixed(0)}% of diagnoses have high confidence (>75%)`);
  }

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white px-4 py-6 safe-area-top">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-7 h-7" />
            <h1 className="text-2xl font-bold">Insights</h1>
          </div>
          <p className="text-sm text-purple-100 mb-4">
            Data-driven insights from rice leaf analysis
          </p>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Activity}
                label="Total Scans"
                value={totalScans}
                color="blue"
              />
              <StatCard
                icon={Target}
                label="Avg Confidence"
                value={`${avgConfidence.toFixed(0)}%`}
                color="green"
              />
              <StatCard
                icon={TrendingUp}
                label="Health Score"
                value={`${healthScore.toFixed(0)}%`}
                color="purple"
              />
              <StatCard
                icon={Award}
                label="Top Disease"
                value={topDiseaseLabel}
                color="orange"
              />
            </div>

            {/* AI Confidence Story */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                How Accurate Are the Diagnoses?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Understanding the reliability of AI predictions
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                  <ConfidenceGauge confidence={avgConfidence} />
                </div>
                <div>
                  <ConfidenceDistribution data={confidenceRanges} />
                </div>
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
              <p>Showing community insights from {totalScans} total scans</p>
              <p className="text-xs mt-1 text-gray-400">
                Personal view requires authentication
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

