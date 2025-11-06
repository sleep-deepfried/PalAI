'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendData {
  date: string;
  scans: number;
  healthy: number;
  diseased: number;
}

interface TrendChartProps {
  data: TrendData[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Scan Trends Over Time</h3>
      <p className="text-sm text-gray-600 mb-4">
        Daily scan activity and health status
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="scans"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            name="Total Scans"
          />
          <Line
            type="monotone"
            dataKey="healthy"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            name="Healthy"
          />
          <Line
            type="monotone"
            dataKey="diseased"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            name="Diseased"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

