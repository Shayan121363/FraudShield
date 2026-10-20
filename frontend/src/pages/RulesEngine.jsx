import { useState } from 'react';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';

const DEFAULT_RULES = [
  {
    id: 'RUL-101',
    name: 'Auto-Block New Merchants (> $1,000)',
    name_ur: 'نئے دکانداروں پر $1,000 سے زائد کی خودکار بندش',
    description: 'Instantly cancel any transaction exceeding $1,000 directed towards newly registered merchant entities under 30 days old.',
    condition: 'amount > 1000 && merchant_risk_score > 0.65',
    category: 'Velocity & Entity Risk',
    action: 'CANCEL_DIRECT',
    status: 'ACTIVE',
    hitsToday: 42,
    severity: 'critical',
  },
  {
    id: 'RUL-102',
    name: 'Enforce Direct Cancel on Extreme Geolocation Jump',
    name_ur: 'انتہائی جغرافیائی دوری پر براہ راست منسوخی',
    description: 'Zero tolerance for transactions > 500 km away from home coordinates. No sending, no hold - direct instant cancel.',
    condition: 'distance_from_home_km > 500 && txns_last_24h > 2',
    category: 'Geolocation Anomaly',
    action: 'CANCEL_DIRECT',
    status: 'ACTIVE',
    hitsToday: 18,
    severity: 'critical',
  },
  {
    id: 'RUL-103',
    name: 'Unsupervised Autoencoder Outlier Clamp',
    name_ur: 'غیر نگرانی شدہ آٹو اینکوڈر اینوملی کلیمپ',
    description: 'When neural network reconstruction error exceeds anomaly threshold >= 0.70, enforce immediate cancellation.',
    condition: 'anomaly_score >= 0.70',
    category: 'Deep Learning',
    action: 'CANCEL_DIRECT',
    status: 'ACTIVE',
    hitsToday: 29,
    severity: 'high',
  },
  {
    id: 'RUL-104',
    name: 'Rapid Micro-Transaction Velocity Burst',
    name_ur: 'تیز رفتاری سے بار بار چھوٹی ٹرانزیکشنز کا برسٹ',
    description: 'Flag and pause transactions when more than 8 transactions are attempted within a 24-hour cycle.',
    condition: 'txns_last_24h >= 8',
    category: 'Bot & Carding',
    action: 'CHALLENGE_2FA',
    status: 'ACTIVE',
    hitsToday: 12,
    severity: 'medium',
  },
  {
    id: 'RUL-105',
    name: 'Nighttime High-Value Foreign Outflow',
    name_ur: 'رات کے اوقات میں بھاری غیر ملکی اخراج',
    description: 'Directly cancel cross-border payments between 00:00 and 05:00 exceeding $2,500.',
    condition: 'is_foreign == 1 && hour < 5 && amount > 2500',
    category: 'Cross-Border',
    action: 'CANCEL_DIRECT',
    status: 'ACTIVE',
    hitsToday: 7,
    severity: 'critical',
  },
];

export default function RulesEngine() {
  const { lang } = useAppData();
  const isUrdu = lang === 'ur';

  const [rules, setRules] = useState(DEFAULT_RULES);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [newRuleModal, setNewRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    condition: '',
    category: 'Custom Rule',
    action: 'CANCEL_DIRECT',
    severity: 'high',
  });

  const filteredRules = rules.filter((r) => {
    if (filterSeverity === 'all') return true;
    return r.severity === filterSeverity;
  });

  const toggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : r
      )
    );
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRule.name || !newRule.condition) return;
    const ruleObj = {
      id: `RUL-${Math.floor(100 + Math.random() * 900)}`,
      name: newRule.name,
      description: newRule.description || 'Custom heuristic defense rule.',
      condition: newRule.condition,
      category: newRule.category,
      action: newRule.action,
      status: 'ACTIVE',
      hitsToday: 0,
      severity: newRule.severity,
    };
    setRules((prev) => [ruleObj, ...prev]);
    setNewRuleModal(false);
    setNewRule({
      name: '',
      description: '',
      condition: '',
      category: 'Custom Rule',
      action: 'CANCEL_DIRECT',
      severity: 'high',
    });
  };

  const totalHits = rules.reduce((acc, r) => acc + r.hitsToday, 0);

  return (
    <PageTransition>
      <div className={`rules-page ${isUrdu ? 'lang-urdu' : ''}`}>
        {/* Banner */}
        <div className="rules-banner">
          <div className="rules-banner-header">
            <div className="rules-badge">
              <span>⚡ REAL-TIME POLICY & RULE MATRIX</span>
            </div>
            <h1 className="rules-headline">
              {isUrdu ? 'خودکار فراڈ پالیسیاں اور براہ راست منسوخی رولز' : 'Autonomous Fraud Defense & Direct Cancellation Policies'}
            </h1>
            <p className="rules-subhead">
              {isUrdu
                ? 'مشکوک یا تصدیق شدہ فراڈ کے لیے روایتی ہولڈ اور تصدیق کے بجائے فورا منسوخی کے رولز بنائیں۔ جب کوئی رول ٹرگر ہوتا ہے، صارف کو فنڈز کے مکمل تحفظ کی ضمانت دی جاتی ہے۔'
                : 'Enforce real-time programmatic rules that automatically execute Direct Cancellation on high-risk vectors, eliminating vulnerable hold-delays and safeguarding customer funds instantly.'}
            </p>
          </div>

          <div className="rules-stats-row">
            <div className="rule-stat-chip">
              <span className="stat-chip-label">{isUrdu ? 'فعال رولز' : 'Active Rules'}</span>
              <span className="stat-chip-val">{rules.filter((r) => r.status === 'ACTIVE').length} / {rules.length}</span>
            </div>
            <div className="rule-stat-chip">
              <span className="stat-chip-label">{isUrdu ? 'آج روکے گئے حملے' : 'Direct Cancellations Today'}</span>
              <span className="stat-chip-val text-red">{totalHits}</span>
            </div>
            <div className="rule-stat-chip">
              <span className="stat-chip-label">{isUrdu ? 'پالیسی ردعمل کی رفتار' : 'Execution Latency'}</span>
              <span className="stat-chip-val text-green">&lt; 1.2 ms</span>
            </div>
            <div className="rule-stat-chip">
              <span className="stat-chip-label">{isUrdu ? 'پالیسی موڈ' : 'Strict Cancellation'}</span>
              <span className="stat-chip-val text-amber">ENFORCED</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="rules-toolbar">
          <div className="rules-filter-group">
            <button
              className={`filter-chip ${filterSeverity === 'all' ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterSeverity('all')}
              type="button"
            >
              {isUrdu ? 'تمام رولز' : 'All Rules'} ({rules.length})
            </button>
            <button
              className={`filter-chip ${filterSeverity === 'critical' ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterSeverity('critical')}
              type="button"
            >
              🔴 {isUrdu ? 'شدید (Critical)' : 'Critical Direct-Cancel'}
            </button>
            <button
              className={`filter-chip ${filterSeverity === 'high' ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterSeverity('high')}
              type="button"
            >
              🟠 {isUrdu ? 'ہائی رسک (High)' : 'High Risk'}
            </button>
            <button
              className={`filter-chip ${filterSeverity === 'medium' ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterSeverity('medium')}
              type="button"
            >
              🟡 {isUrdu ? 'معتدل (Medium)' : 'Medium Challenge'}
            </button>
          </div>

          <button
            className="btn-create-rule"
            onClick={() => setNewRuleModal(true)}
            type="button"
          >
            + {isUrdu ? 'نیا پالیسی رول بنائیں' : 'Create Custom Rule'}
          </button>
        </div>

        {/* Rules Grid */}
        <div className="rules-grid">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`rule-card rule-card--${rule.severity} ${rule.status === 'PAUSED' ? 'rule-card--paused' : ''}`}
            >
              <div className="rule-card-top">
                <div className="rule-meta">
                  <span className="rule-id">{rule.id}</span>
                  <span className={`rule-severity-tag rule-severity-tag--${rule.severity}`}>
                    {rule.severity.toUpperCase()}
                  </span>
                  <span className="rule-cat">{rule.category}</span>
                </div>
                <button
                  className={`btn-toggle-switch ${rule.status === 'ACTIVE' ? 'btn-toggle-switch--on' : ''}`}
                  onClick={() => toggleRule(rule.id)}
                  title={rule.status === 'ACTIVE' ? 'Pause Rule' : 'Activate Rule'}
                  type="button"
                >
                  <span className="switch-handle" />
                </button>
              </div>

              <h3 className="rule-title">{isUrdu && rule.name_ur ? rule.name_ur : rule.name}</h3>
              <p className="rule-desc">{rule.description}</p>

              <div className="rule-condition-box">
                <span className="condition-label">EXPRESSION:</span>
                <code>{rule.condition}</code>
              </div>

              <div className="rule-card-footer">
                <div className="rule-action-pill rule-action-pill--cancel">
                  <span>🛡️ ACTION:</span>
                  <strong>{rule.action.replace('_', ' ')}</strong>
                </div>
                <div className="rule-hits">
                  <span>{isUrdu ? 'آج ٹرگرز:' : 'Hits today:'}</span>
                  <strong>{rule.hitsToday} txns</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Create Rule */}
        {newRuleModal && (
          <div className="modal-overlay" onClick={() => setNewRuleModal(false)}>
            <div className="modal-content modal-rule-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">{isUrdu ? 'نیا اینٹی فراڈ رول تخلیق کریں' : 'NEW FRAUD DEFENSE POLICY RULE'}</span>
                <button className="modal-close-btn" onClick={() => setNewRuleModal(false)}>×</button>
              </div>

              <form onSubmit={handleAddRule} className="modal-form">
                <div className="form-grid">
                  <div className="form-group form-group--full">
                    <label>Rule Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Block High-Value Night Transactions"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label>Description / Rationale</label>
                    <input
                      type="text"
                      placeholder="Why this rule protects against financial fraud"
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label>Heuristic Condition Expression</label>
                    <input
                      type="text"
                      placeholder="e.g. amount > 2000 && is_foreign == 1 && distance_from_home_km > 300"
                      value={newRule.condition}
                      onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newRule.category}
                      onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    >
                      <option value="Entity Risk">Entity Risk</option>
                      <option value="Geolocation Anomaly">Geolocation Anomaly</option>
                      <option value="Velocity & Carding">Velocity & Carding</option>
                      <option value="Deep Learning Anomaly">Deep Learning Anomaly</option>
                      <option value="Custom Rule">Custom Rule</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Enforced Action</label>
                    <select
                      value={newRule.action}
                      onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                    >
                      <option value="CANCEL_DIRECT">Direct Cancel (Strict Fraud Block)</option>
                      <option value="CHALLENGE_2FA">Biometric Challenge</option>
                      <option value="QUARANTINE_WALLET">Quarantine Account</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Risk Severity</label>
                    <select
                      value={newRule.severity}
                      onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                    >
                      <option value="critical">Critical (Zero Tolerance)</option>
                      <option value="high">High Risk</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="action-btn" onClick={() => setNewRuleModal(false)}>
                    CANCEL
                  </button>
                  <button type="submit" className="action-btn action-btn--primary">
                    DEPLOY POLICY RULE
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
