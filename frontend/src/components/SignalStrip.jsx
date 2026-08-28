import React from 'react';

export const RISK_META = {
  critical: { label: 'CRITICAL', color: 'var(--alert-red)', dim: 'var(--alert-red-dim)' },
  high:     { label: 'HIGH',     color: 'var(--alert-red)', dim: 'var(--alert-red-dim)' },
  medium:   { label: 'MEDIUM',   color: 'var(--alert-amber)', dim: 'var(--alert-amber-dim)' },
  low:      { label: 'LOW',      color: 'var(--signal-green)', dim: 'var(--signal-green-dim)' },
};

export default function SignalStrip({ score, level }) {
  const meta = RISK_META[level] ?? RISK_META.low;
  return (
    <div className="signal-strip" aria-hidden="true">
      <div
        className="signal-strip-fill"
        style={{ width: `${Math.max(score * 100, 2)}%`, background: meta.color }}
      />
    </div>
  );
}
