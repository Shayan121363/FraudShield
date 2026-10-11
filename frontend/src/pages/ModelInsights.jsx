import { useEffect, useState } from 'react';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';

const FEATURE_LABELS = {
  amount: { en: 'Amount', ur: 'رقم' },
  hour: { en: 'Hour of day', ur: 'دن کا وقت' },
  merchant_risk_score: { en: 'Merchant risk', ur: 'دکان دار کا خطرہ' },
  distance_from_home_km: { en: 'Distance from home', ur: 'گھر سے فاصلہ' },
  txns_last_24h: { en: 'Txns in 24h', ur: '24 گھنٹے میں لین دین' },
  is_foreign: { en: 'Foreign payment', ur: 'غیر ملکی ادائیگی' },
  account_age_days: { en: 'Account age', ur: 'اکاؤنٹ کی عمر' },
};

const WALKTHROUGHS = [
  {
    id: 'safe',
    verdict: 'allow',
    tag_en: 'Everyday payment',
    tag_ur: 'روزمرہ ادائیگی',
    title_en: 'Local grocery · afternoon',
    title_ur: 'مقامی دکان · دوپہر',
    story_en: 'Small amount, familiar merchant, short distance — both brains agree this is normal behaviour.',
    story_ur: 'چھوٹی رقم، مانوس دکان، قریبی فاصلہ — دونوں ماڈل اتفاق کرتے ہیں کہ یہ معمول کا لین دین ہے۔',
    fraud_probability: 0.11,
    anomaly_score: 0.08,
    risk_score: 0.10,
    factors: [
      { feature: 'merchant_risk_score', shap_value: -1.82 },
      { feature: 'account_age_days', shap_value: -1.41 },
      { feature: 'distance_from_home_km', shap_value: -0.94 },
      { feature: 'amount', shap_value: -0.62 },
      { feature: 'is_foreign', shap_value: -0.38 },
      { feature: 'hour', shap_value: -0.21 },
      { feature: 'txns_last_24h', shap_value: 0.12 },
    ],
  },
  {
    id: 'review',
    verdict: 'review',
    tag_en: 'Unverified merchant',
    tag_ur: 'غیر تصدیق شدہ دکان',
    title_en: 'New store · $450 transfer',
    title_ur: 'نئی دکان · 450 ڈالر',
    story_en: 'XGBoost recognises a known high-risk merchant pattern. The autoencoder also sees an unusual reconstruction error for this account.',
    story_ur: 'XGBoost ایک معروف خطرناک دکان کا پیٹرن پہچانتا ہے۔ آٹو اینکوڈر بھی اس اکاؤنٹ کے لیے غیر معمولی ری کنسٹرکشن ایرر دیکھتا ہے۔',
    fraud_probability: 0.76,
    anomaly_score: 0.63,
    risk_score: 0.72,
    factors: [
      { feature: 'merchant_risk_score', shap_value: 4.18 },
      { feature: 'account_age_days', shap_value: 2.64 },
      { feature: 'amount', shap_value: 1.55 },
      { feature: 'distance_from_home_km', shap_value: 0.42 },
      { feature: 'txns_last_24h', shap_value: -0.18 },
      { feature: 'hour', shap_value: -0.22 },
      { feature: 'is_foreign', shap_value: -0.31 },
    ],
  },
  {
    id: 'block',
    verdict: 'block',
    tag_en: 'Zero-day burst',
    tag_ur: 'نیا حملہ',
    title_en: '2am foreign spike · new account',
    title_ur: 'رات 2 بجے غیر ملکی دھماکہ',
    story_en: 'The autoencoder fires first: this transaction does not reconstruct like anything the account has done. XGBoost confirms the night / foreign / velocity stack.',
    story_ur: 'آٹو اینکوڈر پہلے الرٹ دیتا ہے: یہ لین دین اکاؤنٹ کے معمول سے بالکل مختلف ہے۔ XGBoost رات، غیر ملک اور تیز رفتار کی تصدیق کرتا ہے۔',
    fraud_probability: 0.91,
    anomaly_score: 0.87,
    risk_score: 0.90,
    factors: [
      { feature: 'is_foreign', shap_value: 3.92 },
      { feature: 'hour', shap_value: 3.11 },
      { feature: 'distance_from_home_km', shap_value: 2.88 },
      { feature: 'txns_last_24h', shap_value: 2.41 },
      { feature: 'account_age_days', shap_value: 2.05 },
      { feature: 'amount', shap_value: 1.74 },
      { feature: 'merchant_risk_score', shap_value: 0.66 },
    ],
  },
];

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

function Gauge({ label, value, tone }) {
  return (
    <div className="brain-gauge">
      <div className="brain-gauge-head">
        <span>{label}</span>
        <span className={`brain-gauge-val brain-gauge-val--${tone}`}>{pct(value)}</span>
      </div>
      <div className="brain-gauge-track">
        <div
          className={`brain-gauge-fill brain-gauge-fill--${tone}`}
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ModelInsights() {
  const { API_URL, healthData, setHealthData, lang } = useAppData();
  const isUrdu = lang === 'ur';

  const [health, setHealth] = useState(healthData);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState('review');
  const [revealKey, setRevealKey] = useState(0);

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
  const caseStudy = WALKTHROUGHS.find((c) => c.id === activeId) || WALKTHROUGHS[1];
  const maxShap = Math.max(...caseStudy.factors.map((f) => Math.abs(f.shap_value)), 1);

  const selectCase = (id) => {
    setActiveId(id);
    setRevealKey((k) => k + 1);
  };

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

        {error && !metrics && (
          <div className="insights-loading">
            Backend unreachable at <code>{API_URL}</code> — walkthrough still works offline.
          </div>
        )}

            <div className="section-label">
              {isUrdu ? 'استعمال شدہ ماڈلز (MODELS USED)' : 'MODELS USED'}
            </div>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">{isUrdu ? 'نگرانی شدہ ماڈل' : 'Supervised Model'}</span>
                <span className="metric-value" style={{ fontSize: '18px' }}>XGBoost Classifier</span>
                <span className="metric-sublabel">Primary tabular fraud detection</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">{isUrdu ? 'غیر نگرانی شدہ ماڈل' : 'Unsupervised Model'}</span>
                <span className="metric-value" style={{ fontSize: '18px' }}>PyTorch Autoencoder</span>
                <span className="metric-sublabel">Deep anomaly reconstruction error</span>
              </div>
              <div className="metric-card" style={{ gridColumn: 'span 2' }}>
                <span className="metric-label">{isUrdu ? 'مشترکہ ماڈل' : 'Ensemble Architecture'}</span>
                <span className="metric-value" style={{ fontSize: '18px' }}>70% XGBoost + 30% Autoencoder</span>
                <span className="metric-sublabel">Weighted hybrid scoring to catch novel & known fraud</span>
              </div>
            </div>

            <div className="section-label">
              {isUrdu ? 'دو دماغ، ایک فیصلہ' : 'TWO BRAINS, ONE DECISION'}
            </div>
            <div className="dual-brain">
              <div className="brain-card brain-card--xgb">
                <div className="brain-kicker">{isUrdu ? 'دماغی نظام 01' : 'BRAIN 01 · SUPERVISED'}</div>
                <h3>XGBoost</h3>
                <p>
                  {isUrdu
                    ? 'معلوم فراڈ دستخطیں سیکھتا ہے — جعلی دکانیں، تیز لین دین، نئے اکاؤنٹس۔'
                    : 'Learns known fraud signatures from labelled history — risky merchants, velocity spikes, young accounts.'}
                </p>
                <span className="brain-weight">70% of the ensemble</span>
              </div>
              <div className="brain-blend" aria-hidden="true">
                <span>70</span>
                <div className="brain-blend-bar">
                  <i />
                </div>
                <span>30</span>
              </div>
              <div className="brain-card brain-card--ae">
                <div className="brain-kicker">{isUrdu ? 'دماغی نظام 02' : 'BRAIN 02 · UNSUPERVISED'}</div>
                <h3>Autoencoder</h3>
                <p>
                  {isUrdu
                    ? 'عام لین دین کو دوبارہ بناتا ہے۔ جو نہ بن سکے وہ نیا، ان دیکھا فراڈ ہے۔'
                    : 'Rebuilds “normal” behaviour. High reconstruction error means a pattern it has never seen — zero-day fraud.'}
                </p>
                <span className="brain-weight">30% novelty detector</span>
              </div>
            </div>

            <div className="section-label">
              {isUrdu ? 'لین دین کو ماڈل کے اندر چلائیں' : 'WALK A TRANSACTION THROUGH THE MODEL'}
            </div>
            <div className="walkthrough">
              <div className="walkthrough-picks" role="tablist">
                {WALKTHROUGHS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={activeId === c.id}
                    className={`walk-chip walk-chip--${c.verdict} ${activeId === c.id ? 'is-active' : ''}`}
                    onClick={() => selectCase(c.id)}
                  >
                    <span className="walk-chip-tag">{isUrdu ? c.tag_ur : c.tag_en}</span>
                    <span className="walk-chip-title">{isUrdu ? c.title_ur : c.title_en}</span>
                  </button>
                ))}
              </div>

              <div className="walkthrough-stage" key={revealKey}>
                <div className="walk-scores">
                  <Gauge
                    label={isUrdu ? 'XGBoost احتمال' : 'XGBoost probability'}
                    value={caseStudy.fraud_probability}
                    tone={caseStudy.verdict}
                  />
                  <Gauge
                    label={isUrdu ? 'آٹو اینکوڈر انوملی' : 'Autoencoder anomaly'}
                    value={caseStudy.anomaly_score}
                    tone={caseStudy.verdict}
                  />
                  <div className={`walk-verdict walk-verdict--${caseStudy.verdict}`}>
                    <span className="walk-verdict-kicker">{isUrdu ? 'اینسمبل فیصلہ' : 'ENSEMBLE VERDICT'}</span>
                    <strong>
                      {caseStudy.verdict === 'allow'
                        ? isUrdu ? 'اجازت' : 'ALLOW'
                        : caseStudy.verdict === 'review'
                        ? isUrdu ? 'جائزہ' : 'REVIEW'
                        : isUrdu ? 'روکیں' : 'BLOCK'}
                    </strong>
                    <span>{pct(caseStudy.risk_score)} blended risk</span>
                  </div>
                </div>

                <p className="walk-story">{isUrdu ? caseStudy.story_ur : caseStudy.story_en}</p>

                <div className="shap-board">
                  <div className="shap-board-head">
                    <span>{isUrdu ? 'SHAP وضاحت — کس چیز نے اسکور کو دھکیلا' : 'SHAP TRACE — WHAT PUSHED THIS SCORE'}</span>
                    <span className="shap-legend">
                      <i className="shap-legend-dot shap-legend-dot--risk" /> {isUrdu ? 'فراڈ کی طرف' : 'toward fraud'}
                      <i className="shap-legend-dot shap-legend-dot--safe" /> {isUrdu ? 'محفوظ کی طرف' : 'toward safe'}
                    </span>
                  </div>
                  {caseStudy.factors.map((f) => {
                    const towardFraud = f.shap_value > 0;
                    const width = (Math.abs(f.shap_value) / maxShap) * 100;
                    const label = FEATURE_LABELS[f.feature];
                    return (
                      <div className="shap-row" key={f.feature}>
                        <span className="shap-name">{isUrdu ? label.ur : label.en}</span>
                        <div className="shap-track">
                          <div
                            className={`shap-fill ${towardFraud ? 'shap-fill--risk' : 'shap-fill--safe'}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className={`shap-delta ${towardFraud ? 'is-risk' : 'is-safe'}`}>
                          {towardFraud ? '+' : '−'}{Math.abs(f.shap_value).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="section-label">
              {isUrdu ? 'اسکورنگ کیسے کام کرتی ہے (HOW SCORING WORKS)' : 'HOW SCORING WORKS'}
            </div>
            <div className="scoring-steps">
              {[
                { step: '01', title: isUrdu ? 'ٹرانزیکشن آتی ہے' : 'Transaction Received', desc: isUrdu ? '7 خصوصیات نکالی جاتی ہیں' : '7 features extracted & scaled' },
                { step: '02', title: isUrdu ? 'دو ماڈل چلتے ہیں' : 'Dual Model Scoring', desc: isUrdu ? 'XGBoost + آٹو اینکوڈر بیک وقت' : 'XGBoost + Autoencoder run in parallel' },
                { step: '03', title: isUrdu ? 'SHAP وضاحت' : 'SHAP Explainability', desc: isUrdu ? 'ہر فیصلے کی وجوہات بیان ہوتی ہیں' : 'Top factors driving each decision identified' },
                { step: '04', title: isUrdu ? 'فیصلہ اور الرٹ' : 'Decision & Alert', desc: isUrdu ? 'خطرے کی سطح + رہنمائی + لائیو الرٹ' : 'Risk level assigned, guidance generated, live alert pushed' },
              ].map((item) => (
                <div key={item.step} className="metric-card scoring-step">
                  <span className="scoring-step-num">STEP {item.step}</span>
                  <span className="metric-label" style={{ fontWeight: 600, fontSize: '12px' }}>{item.title}</span>
                  <span className="metric-sublabel">{item.desc}</span>
                </div>
              ))}
            </div>
      </div>
    </PageTransition>
  );
}
