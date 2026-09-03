import { useEffect, useState } from 'react';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';

function MetricCard({ label, value, sublabel, index, format = 'pct' }) {
  const display =
    value === undefined || value === null
      ? '—'
      : format === 'pct'
      ? `${(value * 100).toFixed(2)}%`
      : format === 'raw'
      ? value.toLocaleString()
      : value;

  return (
    <div className="metric-card" style={{ animationDelay: `${index * 70}ms` }}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{display}</span>
      {sublabel && <span className="metric-sublabel">{sublabel}</span>}
    </div>
  );
}

export default function ModelInsights() {
  const { API_URL } = useAppData();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const metrics = health?.metrics;

  return (
    <PageTransition>
      <div className="insights-page">
        <div className="insights-header">
          <div>
            <h1 className="insights-title">MODEL INSIGHTS</h1>
            <p className="insights-subtitle">
              Ensemble of a supervised XGBoost classifier and an unsupervised PyTorch autoencoder,
              blended for real-time fraud scoring.
            </p>
          </div>
          <div className={`model-status-pill ${health ? 'model-status-pill--ok' : ''}`}>
            <span className="model-status-dot" />
            {health ? 'MODELS LOADED' : error ? 'BACKEND UNREACHABLE' : 'CHECKING…'}
          </div>
        </div>

        {!metrics && !error && <div className="insights-loading">Loading model metrics…</div>}
        {error && (
          <div className="insights-loading">
            Couldn&apos;t reach the backend at <code>{API_URL}</code>. Start the FastAPI server to see live metrics.
          </div>
        )}

        {metrics && (
          <>
            <div className="section-label">CLASSIFIER PERFORMANCE</div>
            <div className="metrics-grid">
              <MetricCard label="XGBoost ROC-AUC" value={metrics.xgb_roc_auc} index={0} />
              <MetricCard label="XGBoost PR-AUC" value={metrics.xgb_pr_auc} index={1} />
              <MetricCard label="Autoencoder ROC-AUC" value={metrics.autoencoder_roc_auc} index={2} />
              <MetricCard label="Ensemble PR-AUC" value={metrics.ensemble_pr_auc} index={3} />
            </div>

            <div className="section-label">DECISION THRESHOLDS</div>
            <div className="metrics-grid">
              <MetricCard label="Ensemble threshold" value={metrics.best_threshold} index={4} />
              <MetricCard label="Supervised threshold" value={metrics.supervised_best_threshold} index={5} />
              <MetricCard label="Anomaly threshold" value={metrics.anomaly_threshold} index={6} />
              <MetricCard
                label="Supervised weight"
                value={metrics.ensemble_weight_supervised}
                sublabel={`autoencoder weight ${((1 - metrics.ensemble_weight_supervised) * 100).toFixed(0)}%`}
                index={7}
              />
            </div>

            <div className="section-label">TRAINING DATA</div>
            <div className="metrics-grid">
              <MetricCard label="Test set size" value={metrics.test_set_size} format="raw" index={8} />
              <MetricCard label="Test fraud count" value={metrics.test_fraud_count} format="raw" index={9} />
              <MetricCard label="Train fraud count" value={metrics.train_fraud_count} format="raw" index={10} />
              <MetricCard
                label="Dataset rows"
                value={metrics.dataset?.rows}
                format="raw"
                sublabel={metrics.dataset?.source}
                index={11}
              />
            </div>

            {metrics.repro && (
              <>
                <div className="section-label">REPRODUCIBILITY</div>
                <div className="repro-chip-row">
                  {Object.entries(metrics.repro).map(([key, val], i) => (
                    <span className="repro-chip" key={key} style={{ animationDelay: `${(i + 12) * 60}ms` }}>
                      <span className="repro-chip-key">{key}</span>
                      <span className="repro-chip-val">{String(val)}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
