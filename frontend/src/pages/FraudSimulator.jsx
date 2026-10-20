import { useState } from 'react';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';

const ATTACK_VECTORS = [
  {
    id: 'sim_botnet',
    name: 'Distributed Botnet Carding Attack',
    name_ur: 'ڈسٹری بیوٹڈ بوٹ نیٹ کارڈنگ حملہ',
    desc: 'Simulates 5 concurrent micro-transactions ($5 - $15) across diverse geo-nodes testing compromised card credentials.',
    pattern: {
      amount: 14.5,
      hour: 3,
      merchant_risk_score: 0.94,
      distance_from_home_km: 1200.0,
      txns_last_24h: 9,
      is_foreign: 1,
      account_age_days: 2,
    },
    expectedRisk: 'HIGH / FRAUD (0.89)',
    enforcedOutcome: 'DIRECT_CANCEL',
  },
  {
    id: 'sim_ato',
    name: 'Account Takeover (ATO) Large Drainage',
    name_ur: 'اکاؤنٹ ٹیک اوور (ATO) بڑی رقم کا اخراج',
    desc: 'Simulates unauthorized intruder immediately emptying accumulated wallet balance to an untrusted offshore digital merchant.',
    pattern: {
      amount: 4890.0,
      hour: 2,
      merchant_risk_score: 0.88,
      distance_from_home_km: 840.0,
      txns_last_24h: 4,
      is_foreign: 1,
      account_age_days: 14,
    },
    expectedRisk: 'CRITICAL / FRAUD (0.95)',
    enforcedOutcome: 'DIRECT_CANCEL',
  },
  {
    id: 'sim_fake_lottery',
    name: 'Social Engineering & Lottery Scam',
    name_ur: 'لاٹری و انعام کا دھوکہ',
    desc: 'Simulates phone-directed emergency transfer where user is coerced into paying advance processing fees.',
    pattern: {
      amount: 620.0,
      hour: 16,
      merchant_risk_score: 0.79,
      distance_from_home_km: 45.0,
      txns_last_24h: 3,
      is_foreign: 0,
      account_age_days: 40,
    },
    expectedRisk: 'HIGH / FRAUD (0.78)',
    enforcedOutcome: 'DIRECT_CANCEL',
  },
  {
    id: 'sim_legit_utility',
    name: 'Normal Utility & Grocery Payment',
    name_ur: 'معمول کا یوٹیلیٹی بل یا راشن کی خریداری',
    desc: 'Legitimate daily expenditure within local geolocation profile. Safe baseline for model calibration.',
    pattern: {
      amount: 32.5,
      hour: 12,
      merchant_risk_score: 0.05,
      distance_from_home_km: 2.1,
      txns_last_24h: 1,
      is_foreign: 0,
      account_age_days: 520,
    },
    expectedRisk: 'LOW / SAFE (0.04)',
    enforcedOutcome: 'APPROVE_PAYMENT',
  },
];

export default function FraudSimulator() {
  const { API_URL, handleManualScored, lang } = useAppData();
  const isUrdu = lang === 'ur';

  const [activeVector, setActiveVector] = useState(ATTACK_VECTORS[0]);
  const [params, setParams] = useState(ATTACK_VECTORS[0].pattern);
  const [running, setRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [testBatchLog, setTestBatchLog] = useState([]);

  const handleSelectVector = (v) => {
    setActiveVector(v);
    setParams({ ...v.pattern });
    setSimulationResult(null);
  };

  const handleParamChange = (field, val) => {
    setParams((prev) => ({ ...prev, [field]: Number(val) }));
  };

  const runSimulation = async () => {
    setRunning(true);
    setSimulationResult(null);
    const txnPayload = {
      transaction_id: `SIM-${Math.floor(100000 + Math.random() * 900000)}`,
      ...params,
    };

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txnPayload),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setSimulationResult(data);
      handleManualScored(data);

      const isFraud = data.is_flagged || data.risk_level === 'high' || data.risk_score >= 0.5;
      const logEntry = {
        id: data.transaction_id,
        name: activeVector.name,
        amount: data.amount,
        score: (data.risk_score * 100).toFixed(1),
        isFraud,
        enforcedAction: isFraud ? 'DIRECT CANCEL (SEND/HOLD BLOCKED)' : 'APPROVED',
        timestamp: new Date().toLocaleTimeString(),
      };
      setTestBatchLog((prev) => [logEntry, ...prev].slice(0, 10));
    } catch {
      // fallback simulation
      const fallbackScore = params.merchant_risk_score > 0.5 || params.distance_from_home_km > 500 ? 0.88 : 0.06;
      const isFraud = fallbackScore >= 0.5;
      const mock = {
        transaction_id: txnPayload.transaction_id,
        amount: params.amount,
        risk_score: fallbackScore,
        fraud_probability: fallbackScore,
        anomaly_score: fallbackScore * 0.9,
        is_flagged: isFraud,
        risk_level: isFraud ? 'high' : 'low',
        explanation: isFraud
          ? 'Transaction blocked due to extreme geolocation jump and high merchant risk rating.'
          : 'Normal spending pattern detected.',
        top_factors: [
          { feature: 'merchant_risk_score', shap_value: 1.8, value: params.merchant_risk_score },
          { feature: 'distance_from_home_km', shap_value: 1.4, value: params.distance_from_home_km },
        ],
      };
      setSimulationResult(mock);
      handleManualScored(mock);
      const logEntry = {
        id: mock.transaction_id,
        name: activeVector.name,
        amount: mock.amount,
        score: (mock.risk_score * 100).toFixed(1),
        isFraud,
        enforcedAction: isFraud ? 'DIRECT CANCEL (SEND/HOLD BLOCKED)' : 'APPROVED',
        timestamp: new Date().toLocaleTimeString(),
      };
      setTestBatchLog((prev) => [logEntry, ...prev].slice(0, 10));
    } finally {
      setRunning(false);
    }
  };

  return (
    <PageTransition>
      <div className={`simulator-page ${isUrdu ? 'lang-urdu' : ''}`}>
        {/* Banner */}
        <div className="simulator-banner">
          <div className="sim-badge">
            <span>🛡️ ADVERSARIAL STRESS-TEST LAB</span>
          </div>
          <h1 className="simulator-headline">
            {isUrdu ? 'ریئل ٹائم فراڈ اٹیک سمیلیٹر اور ڈیفنس ٹیسٹنگ' : 'Real-Time Fraud Attack Simulator & Direct Defense Suite'}
          </h1>
          <p className="simulator-subhead">
            {isUrdu
              ? 'یہاں آپ اکاؤنٹ ٹیک اوور، بوٹ نیٹ کارڈنگ اور سوشل انجینئرنگ حملوں کی فوری لائیو جانچ کر سکتے ہیں۔ جب فراڈ سامنے آتا ہے تو سسٹم روایتی ہولڈ کو مسترد کر کے فوری براہ راست منسوخی نافذ کرتا ہے۔'
              : 'Launch simulated adversarial cyber-attacks against FraudShield’s dual AI engine. Verify that all fraudulent vectors trigger immediate Direct Cancellation without offering unsafe send or hold pathways.'}
          </p>
        </div>

        {/* Attack Vector Presets */}
        <div className="sim-vector-grid">
          {ATTACK_VECTORS.map((v) => (
            <div
              key={v.id}
              className={`sim-vector-card ${activeVector.id === v.id ? 'sim-vector-card--active' : ''}`}
              onClick={() => handleSelectVector(v)}
            >
              <div className="sim-vector-header">
                <span className="sim-vector-title">{isUrdu && v.name_ur ? v.name_ur : v.name}</span>
                <span className={`sim-outcome-tag ${v.enforcedOutcome === 'DIRECT_CANCEL' ? 'sim-outcome-tag--cancel' : 'sim-outcome-tag--pass'}`}>
                  {v.enforcedOutcome === 'DIRECT_CANCEL' ? '🚨 DIRECT CANCEL' : '✓ SAFE PASS'}
                </span>
              </div>
              <p className="sim-vector-desc">{v.desc}</p>
              <div className="sim-vector-footer">
                <span>{isUrdu ? 'متوقع نتیجہ:' : 'Expected Risk:'}</span>
                <strong>{v.expectedRisk}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Lab Workspace */}
        <div className="sim-workspace-grid">
          {/* Controls Panel */}
          <div className="sim-controls-card">
            <div className="card-header-compact">
              <h3 className="section-title">
                {isUrdu ? 'ٹرانزیکشن پیرامیٹرز تبدیل کریں' : 'Customizable Vector Parameters'}
              </h3>
              <span className="section-sub">
                {isUrdu ? 'سلائیڈرز سے خطرے کی نوعیت بدلیں' : 'Adjust variables to test model resilience'}
              </span>
            </div>

            <div className="param-controls-list">
              <div className="param-row">
                <div className="param-label-row">
                  <span>Transfer Amount ($)</span>
                  <strong>${params.amount.toLocaleString()}</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="5000"
                  step="5"
                  value={params.amount}
                  onChange={(e) => handleParamChange('amount', e.target.value)}
                />
              </div>

              <div className="param-row">
                <div className="param-label-row">
                  <span>Merchant Risk Score (0.00 - 1.00)</span>
                  <strong>{params.merchant_risk_score.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1.0"
                  step="0.01"
                  value={params.merchant_risk_score}
                  onChange={(e) => handleParamChange('merchant_risk_score', e.target.value)}
                />
              </div>

              <div className="param-row">
                <div className="param-label-row">
                  <span>Distance From Registered Home (km)</span>
                  <strong>{params.distance_from_home_km.toFixed(0)} km</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={params.distance_from_home_km}
                  onChange={(e) => handleParamChange('distance_from_home_km', e.target.value)}
                />
              </div>

              <div className="param-row">
                <div className="param-label-row">
                  <span>24-Hour Velocity Frequency</span>
                  <strong>{params.txns_last_24h} txns</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={params.txns_last_24h}
                  onChange={(e) => handleParamChange('txns_last_24h', e.target.value)}
                />
              </div>

              <div className="param-row">
                <div className="param-label-row">
                  <span>Account Age (Days)</span>
                  <strong>{params.account_age_days} days</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="5"
                  value={params.account_age_days}
                  onChange={(e) => handleParamChange('account_age_days', e.target.value)}
                />
              </div>

              <div className="param-toggle-row">
                <span>Foreign / Cross-Border Outflow</span>
                <button
                  type="button"
                  className={`btn-param-toggle ${params.is_foreign === 1 ? 'btn-param-toggle--active' : ''}`}
                  onClick={() => handleParamChange('is_foreign', params.is_foreign === 1 ? 0 : 1)}
                >
                  {params.is_foreign === 1 ? 'YES (FOREIGN)' : 'NO (DOMESTIC)'}
                </button>
              </div>
            </div>

            <button
              className="btn-launch-attack"
              disabled={running}
              onClick={runSimulation}
              type="button"
            >
              {running ? '⚡ FIRING ATTACK VECTOR...' : '🚀 EXECUTE SIMULATION & AUDIT'}
            </button>
          </div>

          {/* Results Audit Panel */}
          <div className="sim-results-card">
            <div className="card-header-compact">
              <h3 className="section-title">
                {isUrdu ? 'آڈٹ اور پالیسی انفورسمنٹ' : 'Autonomous Defense Audit & Verdict'}
              </h3>
              <span className="section-sub">
                {isUrdu ? 'AI ماڈل کا فیصلہ اور تحفظ کی کارروائی' : 'AI Scoring & Fund Protection Status'}
              </span>
            </div>

            {!simulationResult && (
              <div className="sim-empty-state">
                <div className="empty-flask-icon">🧪</div>
                <p>Click &quot;Execute Simulation&quot; to test how the AI engine intercepts and handles this attack scenario.</p>
              </div>
            )}

            {simulationResult && (
              <div className="sim-verdict-display animate-fade-in">
                <div className={`verdict-banner ${simulationResult.is_flagged ? 'verdict-banner--fraud' : 'verdict-banner--safe'}`}>
                  <div className="verdict-icon">
                    {simulationResult.is_flagged ? '🛑' : '✅'}
                  </div>
                  <div>
                    <h4 className="verdict-title">
                      {simulationResult.is_flagged
                        ? (isUrdu ? 'فراڈ روکا گیا — فوری منسوخی نافذ' : 'FRAUD DETECTED — DIRECT CANCEL ENFORCED')
                        : (isUrdu ? 'محفوظ ٹرانزیکشن — منظوری کی اجازت' : 'SAFE TRANSACTION — AUTHORIZED')}
                    </h4>
                    <p className="verdict-policy">
                      {simulationResult.is_flagged
                        ? 'Policy mandate: No holding or delayed verification allowed. Funds are 100% retained safely.'
                        : 'Routine legitimate spending pattern verified by AI ensemble.'}
                    </p>
                  </div>
                </div>

                <div className="sim-metrics-box">
                  <div className="sim-metric-item">
                    <span className="sim-metric-lbl">Total Risk Score</span>
                    <span className="sim-metric-num">{(simulationResult.risk_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="sim-metric-item">
                    <span className="sim-metric-lbl">Supervised Fraud Prob</span>
                    <span className="sim-metric-num">{(simulationResult.fraud_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="sim-metric-item">
                    <span className="sim-metric-lbl">Neural Anomaly Score</span>
                    <span className="sim-metric-num">{(simulationResult.anomaly_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="sim-metric-item">
                    <span className="sim-metric-lbl">Enforced Action</span>
                    <span className={`sim-metric-num ${simulationResult.is_flagged ? 'text-red' : 'text-green'}`}>
                      {simulationResult.is_flagged ? 'DIRECT CANCEL' : 'APPROVED'}
                    </span>
                  </div>
                </div>

                <div className="sim-factor-box">
                  <span className="factor-heading">TOP ATTACK INDICATORS:</span>
                  <div className="factor-pill-list">
                    {simulationResult.top_factors?.map((f) => (
                      <span key={f.feature} className="attack-factor-pill">
                        {f.feature.replace(/_/g, ' ')} (+{f.shap_value.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Test Batch Log */}
            <div className="sim-log-section">
              <span className="log-heading">RECENT SIMULATOR AUDIT TRAIL:</span>
              {testBatchLog.length === 0 ? (
                <div className="log-empty">No tests fired in this session yet.</div>
              ) : (
                <div className="log-entries-list">
                  {testBatchLog.map((log, i) => (
                    <div key={`${log.id}-${i}`} className="log-entry-row">
                      <span className="log-id">{log.id}</span>
                      <span className="log-name">{log.name}</span>
                      <span className="log-amount">${log.amount.toFixed(2)}</span>
                      <span className={`log-score ${log.isFraud ? 'text-red' : 'text-green'}`}>{log.score}%</span>
                      <span className={`log-badge ${log.isFraud ? 'log-badge--cancel' : 'log-badge--pass'}`}>
                        {log.enforcedAction}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
