'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { LABEL_LABELS } from '@/lib/constants';

interface DiseaseData {
  label: string;
  count: number;
  percentage: number;
}

interface DiseaseDonutProps {
  data: DiseaseData[];
}

const COLORS = {
  HEALTHY: '#10b981',
  BACTERIAL_LEAF_BLIGHT: '#ef4444',
  BROWN_SPOT: '#f59e0b',
  SHEATH_BLIGHT: '#8b5cf6',
  TUNGRO: '#ec4899',
  BLAST: '#f97316',
};

export function DiseaseDonut({ data }: DiseaseDonutProps) {
  const chartData = data.map(item => ({
    name: LABEL_LABELS[item.label as keyof typeof LABEL_LABELS] || item.label,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Disease Distribution</h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => {
              const originalLabel = data[index].label;
              const color = COLORS[originalLabel as keyof typeof COLORS] || '#6b7280';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value} scans (${props.payload.percentage.toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={80}
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            formatter={(value, entry: any) => (
              <span className="text-xs sm:text-sm text-gray-700">
                {value} ({entry.payload.percentage.toFixed(0)}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

