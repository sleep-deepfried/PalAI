'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConfidenceDistributionProps {
  data: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

export function ConfidenceDistribution({ data }: ConfidenceDistributionProps) {
  const getColor = (range: string) => {
    if (range.includes('90-100')) return '#10b981'; // green
    if (range.includes('75-90')) return '#84cc16'; // lime
    if (range.includes('50-75')) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const highConfidenceCount = data
    .filter(d => d.range.includes('75-90') || d.range.includes('90-100'))
    .reduce((sum, d) => sum + d.count, 0);
  
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const highConfidencePercent = totalCount > 0 ? (highConfidenceCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Confidence Distribution</h3>
      <p className="text-sm text-gray-600 mb-4">
        How confident is the AI in its diagnoses?
      </p>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value} scans (${props.payload.percentage.toFixed(1)}%)`,
              'Count',
            ]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">High Confidence Scans</div>
            <div className="text-xs text-gray-500">(Above 75%)</div>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {highConfidencePercent.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

