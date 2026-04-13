export const LABELS = ['HEALTHY', 'SHEATH_BLIGHT', 'TUNGRO', 'RICE_BLAST'] as const;

export type Label = (typeof LABELS)[number];

export const SEVERITIES = ['LOW', 'MODERATE', 'HIGH'] as const;

export type Severity = (typeof SEVERITIES)[number];

export const LABEL_LABELS: Record<Label, string> = {
  HEALTHY: 'Healthy',
  SHEATH_BLIGHT: 'Sheath Blight',
  TUNGRO: 'Tungro',
  RICE_BLAST: 'Rice Blast',
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: 'bg-green-100 text-green-800',
  MODERATE: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};
