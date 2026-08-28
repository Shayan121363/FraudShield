import React from 'react';

export default function StatCard({ label, value, sublabel, accent }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
      {sublabel && <span className="stat-sublabel">{sublabel}</span>}
    </div>
  );
}
