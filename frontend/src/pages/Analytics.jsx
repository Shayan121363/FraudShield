import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend,
} from 'recharts';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import { useAppData } from '../context/AppDataContext';

const RISK_COLORS = {
  low: 'var(--signal-green)',
  medium: 'var(--alert-amber)',
  high: 'var(--alert-red)',
};

export default function Analytics() {
  const { ledger, flaggedCount, avgRisk, API_URL } = useAppData();
  const [serverStats, setServerStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (!cancelled && res.ok) setServerStats(await res.json());
      } catch {
        // silently ignore — backend may not be running yet
      }
    };
    fetchStats();
    const id = setInterval(fetchStats, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [API_URL]);

  const riskDistribution = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    ledger.forEach((t) => {
      counts[t.risk_level] = (counts[t.risk_level] || 0) + 1;
    });
    return Object.entries(counts).map(([level, count]) => ({ level, count }));
  }, [ledger]);

  const amountBuckets = useMemo(() => {
    const buckets = [
      { label: '$0-50', min: 0, max: 50, count: 0 },
      { label: '$50-200', min: 50, max: 200, count: 0 },
      { label: '$200-500', min: 200, max: 500, count: 0 },
      { label: '$500-1k', min: 500, max: 1000, count: 0 },
      { label: '$1k+', min: 1000, max: Infinity, count: 0 },
    ];
    ledger.forEach((t) => {
      const amt = t.amount ?? 0;
      const bucket = buckets.find((b) => amt >= b.min && amt < b.max);
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [ledger]);

  const scatterData = useMemo(
    () =>
      ledger.map((t) => ({
        amount: t.amount ?? 0,
        risk: t.risk_score,
        level: t.risk_level,
      })),
    [ledger]
  );

  return (
    <PageTransition>
      <div className="analytics-page">
        <div className="stat-grid stat-grid--wide">
          <StatCard label="Total scored" value={serverStats?.total_scored ?? ledger.length} sublabel="all time" />
          <StatCard label="Flagged" value={flaggedCount} sublabel="this session" accent="var(--alert-red)" />
          <StatCard label="Avg risk" value={`${(avgRisk * 100).toFixed(1)}%`} sublabel="rolling window" />
          <StatCard
            label="Fraud rate"
            value={serverStats ? `${(serverStats.fraud_rate * 100).toFixed(2)}%` : '—'}
            sublabel="server-wide"
            accent="var(--alert-amber)"
          />
        </div>

        <div className="analytics-grid">
          <div className="chart-panel chart-panel--tall">
            <div className="panel-heading"><span>RISK LEVEL DISTRIBUTION</span></div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="count"
                  nameKey="level"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  animationDuration={700}
                >
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level] || 'var(--signal-blue)'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel chart-panel--tall">
            <div className="panel-heading"><span>TRANSACTION AMOUNT BUCKETS</span></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={amountBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: 'var(--border-subtle)', opacity: 0.3 }}
                />
                <Bar dataKey="count" fill="var(--signal-blue)" radius={[4, 4, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-panel chart-panel--wide">
            <div className="panel-heading"><span>AMOUNT VS RISK SCORE</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                  type="number"
                  dataKey="amount"
                  name="Amount"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  unit="$"
                />
                <YAxis
                  type="number"
                  dataKey="risk"
                  name="Risk"
                  domain={[0, 1]}
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }}
                  formatter={(value, name) => (name === 'Risk' ? `${(value * 100).toFixed(1)}%` : `$${value.toFixed(2)}`)}
                />
                <Scatter data={scatterData} animationDuration={700}>
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.level] || 'var(--signal-blue)'} fillOpacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {scatterData.length === 0 && (
              <div className="chart-empty-overlay">Waiting for transactions to plot…</div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
