import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend,
} from 'recharts';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import { useAppData } from '../context/AppDataContext';
import { useT } from '../translations';

const RISK_COLORS = {
  low: 'var(--signal-green)',
  medium: 'var(--alert-amber)',
  high: 'var(--alert-red)',
  critical: 'var(--alert-red)',
};

function resolveAmount(t) {
  if (t.amount !== undefined && t.amount !== null && !isNaN(Number(t.amount))) {
    return Number(t.amount);
  }
  const factorAmt = t.top_factors?.find((f) => f.feature === 'amount')?.value;
  if (factorAmt !== undefined && factorAmt !== null && !isNaN(Number(factorAmt))) {
    return Number(factorAmt);
  }
  return 0;
}

export default function Analytics() {
  const { ledger, flaggedCount, avgRisk, API_URL, lang } = useAppData();
  const t = useT(lang);
  const [serverStats, setServerStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (!cancelled && res.ok) setServerStats(await res.json());
      } catch {
        // silently ignore
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
    ledger.forEach((item) => {
      const lvl = item.risk_level === 'critical' ? 'high' : item.risk_level;
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return Object.entries(counts).map(([level, count]) => {
      const label = level === 'low' ? t.riskLow : level === 'medium' ? t.riskMedium : t.riskHigh;
      return { level, name: label, count };
    });
  }, [ledger, t]);

  const amountBuckets = useMemo(() => {
    const buckets = [
      { label: '$0-50', min: 0, max: 50, count: 0 },
      { label: '$50-200', min: 50, max: 200, count: 0 },
      { label: '$200-500', min: 200, max: 500, count: 0 },
      { label: '$500-1k', min: 500, max: 1000, count: 0 },
      { label: '$1k+', min: 1000, max: Infinity, count: 0 },
    ];
    ledger.forEach((item) => {
      const amt = resolveAmount(item);
      const bucket = buckets.find((b) => amt >= b.min && amt < b.max);
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [ledger]);

  const scatterData = useMemo(
    () =>
      ledger.map((item) => ({
        amount: resolveAmount(item),
        risk: item.risk_score,
        level: item.risk_level,
      })),
    [ledger]
  );

  return (
    <PageTransition>
      <div className="analytics-page">
        <div className="stat-grid stat-grid--wide">
          <StatCard
            label={t.totalScored}
            value={serverStats?.total_scored ?? ledger.length}
            sublabel={t.allTime}
          />
          <StatCard
            label={t.flagged}
            value={flaggedCount}
            sublabel={t.thisSession}
            accent="var(--alert-red)"
          />
          <StatCard
            label={t.avgRisk}
            value={`${(avgRisk * 100).toFixed(1)}%`}
            sublabel={t.rollingWindow}
          />
          <StatCard
            label={t.fraudRate}
            value={serverStats ? `${(serverStats.fraud_rate * 100).toFixed(2)}%` : '—'}
            sublabel={t.serverWide}
            accent="var(--alert-amber)"
          />
        </div>

        <div className="analytics-grid">
          {/* Pie Chart: Risk Level */}
          <div className="chart-panel chart-panel--tall">
            <div className="panel-heading"><span>{t.chartRiskDist}</span></div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="count"
                  nameKey="name"
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

          {/* Bar Chart: Amount Buckets */}
          <div className="chart-panel chart-panel--tall">
            <div className="panel-heading"><span>{t.chartAmountBuckets}</span></div>
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

          {/* Scatter Chart: Amount vs Risk Score */}
          <div className="chart-panel chart-panel--wide">
            <div className="panel-heading"><span>{t.chartAmountVsRisk}</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                  type="number"
                  dataKey="amount"
                  name={t.axisAmount}
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  unit="$"
                  domain={[0, 'dataMax + 50']}
                />
                <YAxis
                  type="number"
                  dataKey="risk"
                  name={t.axisRisk}
                  domain={[0, 1]}
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }}
                  formatter={(value, name) => (name === t.axisRisk || name === 'Risk' ? `${(Number(value) * 100).toFixed(1)}%` : `$${Number(value).toFixed(2)}`)}
                />
                <Scatter data={scatterData} animationDuration={700}>
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.level] || 'var(--signal-blue)'} fillOpacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {scatterData.length === 0 && (
              <div className="chart-empty-overlay">{t.waitingToPlot}</div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
