export default function ProgressBar({ value = 0, showLabel = true, size = 'md' }) {
  const pct   = Math.min(100, Math.max(0, Math.round(value)));
  const h     = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5';
  const color = pct === 100 ? 'bg-success' : pct >= 50 ? 'bg-accent' : 'bg-warning';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-primary-muted mb-1">
          <span>Progression</span>
          <span className="font-medium text-primary">{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-surface-2 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
