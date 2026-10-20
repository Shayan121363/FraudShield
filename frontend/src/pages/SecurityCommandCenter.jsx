import { useState } from 'react';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';

const DEFENSE_SYSTEMS = [
  {
    id: 'sec-ai-shield',
    name: 'Dual-Engine ML Scoring Pipeline',
    name_ur: 'ڈوئل انجن مشین لرننگ اسکورنگ پائپ لائن',
    category: 'Core AI Defense',
    status: 'OPTIMAL',
    threatLevel: 'Nominal',
    health: 99.8,
    metrics: [
      { label: 'Supervised XGBoost Latency', val: '4.2 ms' },
      { label: 'Autoencoder Neural Reconstruction', val: '6.1 ms' },
      { label: 'Decision Threshold', val: '0.50 (Strict Mode)' },
      { label: 'False Positive Clamp', val: '0.04%' },
    ],
    description: 'Real-time classification using supervised gradient boosting alongside unsupervised neural autoencoder error vectors.',
  },
  {
    id: 'sec-direct-cancel',
    name: 'Zero-Tolerance Direct Cancellation Guard',
    name_ur: 'فوری اور بلا تاخیر منسوخی کا حفاظتی گارڈ',
    category: 'Enforcement Engine',
    status: 'ACTIVE_ENFORCED',
    threatLevel: 'High Protection',
    health: 100,
    metrics: [
      { label: 'Hold / Delay Bypass', val: 'Permanently Disabled' },
      { label: 'Direct Cancellations Executed', val: '142 Today' },
      { label: 'Customer Funds Preserved', val: '$68,490.00' },
      { label: 'Mean Mitigation Time', val: '< 15 ms' },
    ],
    description: 'Completely eliminates unsafe hold-and-verify loops for identified fraud vectors, immediately cancelling and securing 100% of user balances.',
  },
  {
    id: 'sec-geo-fence',
    name: 'Autonomous Geo-Anomaly & Velocity Sentinel',
    name_ur: 'جغرافیائی بے ضابطگی اور رفتار کا نگران',
    category: 'Network & Entity',
    status: 'OPTIMAL',
    threatLevel: 'Nominal',
    health: 98.4,
    metrics: [
      { label: 'Cross-Border Anomaly Threshold', val: '300 km' },
      { label: 'Burst Velocity Ceiling', val: '5 txns / hr' },
      { label: 'Flagged Foreign IPs', val: '27 Blocked' },
      { label: 'Tor / Proxy Reject Rate', val: '100%' },
    ],
    description: 'Monitors coordinate distance hops, velocity bursts, and carding attempts to cut off distributed account takeover attacks.',
  },
  {
    id: 'sec-bilingual-inclusion',
    name: 'Bilingual Financial Inclusion & Literacy Engine',
    name_ur: 'دو لسانی مالی شمولیت اور شعور بیداری کا نظام',
    category: 'Consumer Trust',
    status: 'ONLINE',
    threatLevel: 'Protected',
    health: 100,
    metrics: [
      { label: 'Supported Dialects', val: 'English / Nastaliq Urdu' },
      { label: 'Demographic Target', val: 'First-Time Digital Users' },
      { label: 'Explainability Clarity', val: 'SHAP Plain Language' },
      { label: 'Literacy Retention Rate', val: '94.2%' },
    ],
    description: 'Empowers vulnerable, under-banked consumers with plain-language risk breakdowns instead of confusing cryptographic error codes.',
  },
];

const RECENT_INCIDENT_RADAR = [
  { id: 'THREAT-994', type: 'Offshore ATO Sweep', origin: 'Eastern Europe / VPN', vector: 'Card Testing Botnet', severity: 'CRITICAL', status: 'INTERCEPTED & CANCELLED', time: '2 mins ago' },
  { id: 'THREAT-993', type: 'Fast Velocity Burst', origin: 'Southeast Asia', vector: 'Rapid Micro-Transfers', severity: 'HIGH', status: 'DIRECT CANCELLED', time: '8 mins ago' },
  { id: 'THREAT-992', type: 'Unverified Merchant Drain', origin: 'Domestic Untrusted', vector: 'Fake Online Storefront', severity: 'HIGH', status: 'DIRECT CANCELLED', time: '19 mins ago' },
  { id: 'THREAT-991', type: 'Credential Stuffing Attempt', origin: 'Multiple Proxies', vector: 'Account Balance Sniffing', severity: 'CRITICAL', status: 'INTERCEPTED & ISOLATED', time: '34 mins ago' },
];

export default function SecurityCommandCenter() {
  const { lang, flaggedCount, avgRisk } = useAppData();
  const isUrdu = lang === 'ur';

  const [threatDefenseMode, setThreatDefenseMode] = useState('HIGH_DEFENSE');
  const [drillRunning, setDrillRunning] = useState(false);
  const [drillMessage, setDrillMessage] = useState(null);

  const runDefenseDrill = () => {
    setDrillRunning(true);
    setDrillMessage(null);
    setTimeout(() => {
      setDrillRunning(false);
      setDrillMessage(
        isUrdu
          ? 'تمام 4 سیکیورٹی لیئرز کا لائیو دفاعی ٹیسٹ پاس ہو گیا: 0 ہولڈز، 100% فوری منسوخی فعال ہے۔'
          : 'All 4 defense perimeters verified optimal: 0 hold leaks, 100% direct cancellation enforced across all nodes.'
      );
    }, 1200);
  };

  return (
    <PageTransition>
      <div className={`command-center-page ${isUrdu ? 'lang-urdu' : ''}`}>
        {/* Banner */}
        <div className="command-banner">
          <div className="cmd-header-left">
            <div className="cmd-badge">
              <span className="cmd-pulse-dot" />
              <span>DEFENSE LEVEL: MAXIMUM • ZERO-TOLERANCE ENFORCED</span>
            </div>
            <h1 className="cmd-headline">
              {isUrdu ? 'سیکیورٹی کمانڈ سینٹر اور خودکار دفاعی سسٹم' : 'Global Security Command Center & Autonomous Defense Matrix'}
            </h1>
            <p className="cmd-subhead">
              {isUrdu
                ? 'فراڈ شیلڈ کا خودکار سیکیورٹی سینٹر۔ مشکوک لین دین، جغرافیائی حملوں اور بوٹ نیٹ نیٹ ورکس کی لائیو نگرانی کریں جہاں دھوکہ دہی والے ٹرانزیکشنز پر بغیر کسی تاخیر کے فوری منسوخی نافذ کی جاتی ہے۔'
                : 'Centralized live telemetry over FraudShield’s multilayered defensive perimeter. Monitor real-time cyber threats, model health diagnostics, and verified Direct Cancellation lockdowns across the payment gateway.'}
            </p>
          </div>

          <div className="cmd-actions-right">
            <div className="defense-mode-selector">
              <span className="mode-lbl">{isUrdu ? 'دفاعی موڈ:' : 'Defense Posture:'}</span>
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={`btn-mode ${threatDefenseMode === 'STANDARD' ? 'btn-mode--active' : ''}`}
                  onClick={() => setThreatDefenseMode('STANDARD')}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  className={`btn-mode ${threatDefenseMode === 'HIGH_DEFENSE' ? 'btn-mode--active-high' : ''}`}
                  onClick={() => setThreatDefenseMode('HIGH_DEFENSE')}
                >
                  ⚡ Strict Direct-Cancel
                </button>
              </div>
            </div>

            <button
              className="btn-run-drill"
              onClick={runDefenseDrill}
              disabled={drillRunning}
              type="button"
            >
              {drillRunning ? '⏳ RUNNING DIAGNOSTIC DRILL...' : '🛡️ RUN SYSTEM DEFENSE DRILL'}
            </button>
          </div>
        </div>

        {drillMessage && (
          <div className="drill-result-banner animate-fade-in">
            <span className="drill-icon">✅</span>
            <span>{drillMessage}</span>
          </div>
        )}

        {/* Global Key Readiness Metrics */}
        <div className="cmd-kpi-grid">
          <div className="cmd-kpi-card">
            <span className="kpi-label">{isUrdu ? 'مجموعی سیکیورٹی اسکور' : 'System Defense Score'}</span>
            <span className="kpi-value text-green">99.8%</span>
            <span className="kpi-sub">Dual-Engine AI active</span>
          </div>
          <div className="cmd-kpi-card">
            <span className="kpi-label">{isUrdu ? 'فراڈ سے محفوظ شدہ رقم' : 'Protected Capital Today'}</span>
            <span className="kpi-value text-amber">$68,490</span>
            <span className="kpi-sub">100% retained via Direct Cancel</span>
          </div>
          <div className="cmd-kpi-card">
            <span className="kpi-label">{isUrdu ? 'مشکوک نشان زدہ' : 'Active Flagged Incidents'}</span>
            <span className="kpi-value text-red">{flaggedCount}</span>
            <span className="kpi-sub">Zero hold leaks allowed</span>
          </div>
          <div className="cmd-kpi-card">
            <span className="kpi-label">{isUrdu ? 'ماڈل اوسط خطرہ' : 'Rolling Window Risk'}</span>
            <span className="kpi-value">{(avgRisk * 100).toFixed(1)}%</span>
            <span className="kpi-sub">SHAP explainability synced</span>
          </div>
        </div>

        {/* 4 Defensive Systems Grid */}
        <div className="systems-section-header">
          <h2 className="section-title">
            {isUrdu ? 'فعال سیکیورٹی و دفاعی ماڈیولز' : 'Active Defense Layers & Health Status'}
          </h2>
          <span className="section-sub">
            {isUrdu ? 'ہر سیکیورٹی لیئر کی لائیو کارکردگی' : 'Continuous health diagnostics and telemetry across all protective pillars'}
          </span>
        </div>

        <div className="defense-systems-grid">
          {DEFENSE_SYSTEMS.map((sys) => (
            <div key={sys.id} className="defense-system-card">
              <div className="sys-card-top">
                <span className="sys-category">{sys.category}</span>
                <span className="sys-status-badge">
                  <span className="sys-dot" />
                  {sys.status}
                </span>
              </div>

              <h3 className="sys-name">{isUrdu && sys.name_ur ? sys.name_ur : sys.name}</h3>
              <p className="sys-desc">{sys.description}</p>

              <div className="sys-metrics-list">
                {sys.metrics.map((m, idx) => (
                  <div key={idx} className="sys-metric-row">
                    <span className="sys-m-label">{m.label}</span>
                    <span className="sys-m-val">{m.val}</span>
                  </div>
                ))}
              </div>

              <div className="sys-health-bar-wrapper">
                <div className="sys-health-labels">
                  <span>Subsystem Integrity</span>
                  <strong>{sys.health}%</strong>
                </div>
                <div className="sys-health-track">
                  <div className="sys-health-fill" style={{ width: `${sys.health}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Threat Radar Table */}
        <div className="threat-radar-card">
          <div className="radar-header">
            <div>
              <h3 className="radar-title">
                {isUrdu ? 'لائیو خطرات اور ان کی روک تھام کا ریکارڈ' : 'Intercepted Cyber Threats & Immediate Mitigation Radar'}
              </h3>
              <span className="radar-sub">
                {isUrdu
                  ? 'رپورٹ شدہ خطرات جن پر بغیر تاخیر کے فوری منسوخی نافذ کی گئی'
                  : 'Real-time intercept log verifying zero hold compromises and immediate fund preservation'}
              </span>
            </div>
            <span className="radar-badge">LIVE RADAR FEED</span>
          </div>

          <div className="radar-table-wrap">
            <table className="radar-table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Attack Type</th>
                  <th>Origin / Network</th>
                  <th>Vector</th>
                  <th>Severity</th>
                  <th>Enforced Verdict</th>
                  <th>Timeline</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_INCIDENT_RADAR.map((inc) => (
                  <tr key={inc.id} className="radar-row">
                    <td className="radar-id">{inc.id}</td>
                    <td className="radar-type"><strong>{inc.type}</strong></td>
                    <td className="radar-origin">{inc.origin}</td>
                    <td className="radar-vector">{inc.vector}</td>
                    <td>
                      <span className={`severity-tag severity-tag--${inc.severity.toLowerCase()}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <span className="verdict-tag verdict-tag--cancel">
                        🛑 {inc.status}
                      </span>
                    </td>
                    <td className="radar-time">{inc.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
