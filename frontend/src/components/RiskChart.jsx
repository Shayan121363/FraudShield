import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function RiskChart({ history }) {
  return (
    <div className="chart-panel">
      <div className="panel-heading"><span>RISK SIGNAL</span></div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal-blue)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--signal-blue)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="tick" hide />
          <YAxis domain={[0, 1]} hide />
          <Tooltip
            contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }}
            labelFormatter={() => ''}
            formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'risk']}
          />
          <Area type="monotone" dataKey="risk" stroke="var(--signal-blue)" fill="url(#riskGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
