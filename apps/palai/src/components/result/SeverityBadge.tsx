interface SeverityBadgeProps {
  severity: 'LOW' | 'MODERATE' | 'HIGH';
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const styles = {
    LOW: 'bg-green-100 text-green-700 border-green-200',
    MODERATE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}
