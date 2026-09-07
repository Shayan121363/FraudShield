import { useEffect, useState } from 'react';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';
import { useT } from '../translations';

function MetricCard({ label, value, sublabel, format = 'pct' }) {
  const display =
    value === undefined || value === null
      ? '—'
    : format === 'pct'
    ? `${(value * 100).toFixed(2)}%`
    : format === 'raw'
    ? value.toLocaleString()
    : value;

  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{display}</span>
      {sublabel && <span className="metric-sublabel">{sublabel}</span>}
    </div>
  );
}

export default function ModelInsights() {
  const { API_URL, healthData, setHealthData, lang } = useAppData();
  const t = useT(lang);
  const isUrdu = lang === 'ur';

  const [health, setHealth] = useState(healthData);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setHealth(data);
          if (setHealthData) setHealthData(data);
        }
      })
      .catch(() => {
        if (!cancelled && !healthData) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [API_URL, healthData, setHealthData]);

  const metrics = health?.metrics || healthData?.metrics;

  return (
    <PageTransition>
      <div className="insights-page">
        <div className="insights-header">
          <div>
            <h1 className="insights-title">
              {isUrdu ? 'ماڈل تفصیلات اور پیمائشیں' : 'MODEL INSIGHTS'}
            </h1>
            <p className="insights-subtitle">
              {isUrdu
                ? 'نگرانی شدہ XGBoost اور غیر نگرانی شدہ PyTorch آٹو اینکوڈر کا مشترکہ اینسمبل، جو ریئل ٹائم فراڈ اسکورنگ فراہم کرتا ہے۔'
                : 'Ensemble of a supervised XGBoost classifier and an unsupervised PyTorch autoencoder, blended for real-time fraud scoring.'}
            </p>
          </div>
          <div className={`model-status-pill ${metrics ? 'model-status-pill--ok' : ''}`}>
            <span className="model-status-dot" />
            {metrics
              ? isUrdu ? 'ماڈلز فعال ہیں' : 'MODELS LOADED'
              : error
              ? isUrdu ? 'سرور سے رابطہ نہیں ہو سکا' : 'BACKEND UNREACHABLE'
              : isUrdu ? 'جانچ جاری ہے…' : 'CHECKING…'}
          </div>
        </div>

        {!metrics && !error && (
          <div className="insights-loading">
            {isUrdu ? 'ماڈل کی معلومات حاصل کی جا رہی ہیں…' : 'Loading model metrics…'}
          </div>
        )}
        {error && !metrics && (
          <div className="insights-loading">
            Couldn&apos;t reach the backend at <code>{API_URL}</code>. Start the FastAPI server to see live metrics.
          </div>
        )}

        {metrics && (
          <>
            <div className="section-label">
              {isUrdu ? 'کلاسیفائر کی کارکردگی (CLASSIFIER PERFORMANCE)' : 'CLASSIFIER PERFORMANCE'}
            </div>
            <div className="metrics-grid">
              <MetricCard label="XGBoost ROC-AUC" value={metrics.xgb_roc_auc} />
              <MetricCard label="XGBoost PR-AUC" value={metrics.xgb_pr_auc} />
              <MetricCard label="Autoencoder ROC-AUC" value={metrics.autoencoder_roc_auc} />
              <MetricCard label="Ensemble PR-AUC" value={metrics.ensemble_pr_auc} />
            </div>

            <div className="section-label">
              {isUrdu ? 'فیصلے کی حدود (DECISION THRESHOLDS)' : 'DECISION THRESHOLDS'}
            </div>
            <div className="metrics-grid">
              <MetricCard
                label={isUrdu ? 'اینسمبل حد (Ensemble threshold)' : 'Ensemble threshold'}
                value={metrics.best_threshold}
              />
              <MetricCard
                label={isUrdu ? 'نگرانی شدہ حد (Supervised threshold)' : 'Supervised threshold'}
                value={metrics.supervised_best_threshold}
              />
              <MetricCard
                label={isUrdu ? 'بے قاعدگی حد (Anomaly threshold)' : 'Anomaly threshold'}
                value={metrics.anomaly_threshold}
              />
              <MetricCard
                label={isUrdu ? 'نگرانی شدہ وزن (Supervised weight)' : 'Supervised weight'}
                value={metrics.ensemble_weight_supervised}
                sublabel={`autoencoder weight ${((1 - metrics.ensemble_weight_supervised) * 100).toFixed(0)}%`}
              />
            </div>

            <div className="section-label">
              {isUrdu ? 'تربیتی ڈیٹا (TRAINING DATA)' : 'TRAINING DATA'}
            </div>
            <div className="metrics-grid">
              <MetricCard
                label={isUrdu ? 'ٹیسٹ ڈیٹا سائز' : 'Test set size'}
                value={metrics.test_set_size}
                format="raw"
              />
              <MetricCard
                label={isUrdu ? 'ٹیسٹ فراڈ تعداد' : 'Test fraud count'}
                value={metrics.test_fraud_count}
                format="raw"
              />
              <MetricCard
                label={isUrdu ? 'ٹریننگ فراڈ تعداد' : 'Train fraud count'}
                value={metrics.train_fraud_count}
                format="raw"
              />
              <MetricCard
                label={isUrdu ? 'کل قطاریں' : 'Dataset rows'}
                value={metrics.dataset?.rows}
                format="raw"
                sublabel={metrics.dataset?.source}
              />
            </div>

            {metrics.repro && (
              <>
                <div className="section-label">
                  {isUrdu ? 'تکرار پذیری (REPRODUCIBILITY)' : 'REPRODUCIBILITY'}
                </div>
                <div className="repro-chip-row">
                  {Object.entries(metrics.repro).map(([key, val]) => (
                    <span className="repro-chip" key={key}>
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
