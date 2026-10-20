import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';

const MOCK_CASES = [
  {
    case_id: 'CASE-8821',
    transaction_id: 'INC-7821',
    timestamp: '2026-10-18 19:42:10 UTC',
    status: 'DIRECT_CANCELLED',
    user_id: 'USR-9024',
    merchant: 'FastPay Digital Goods LLC (Newly Formed)',
    amount: 450.0,
    risk_score: 0.76,
    risk_level: 'high',
    analyst_verdict: 'CONFIRMED_FRAUD_ATTEMPT',
    narrative: 'High velocity transfer directed to newly created merchant account (age < 25 days). System enforced instant Direct Cancellation. 0 funds debited.',
    reasons: ['Merchant age under threshold', 'Unusual time of day (15:00)', 'Zero prior consumer trust record'],
    evidence: [
      { key: 'IP Geo-coordinate', val: 'Lat 31.5204, Long 74.3587' },
      { key: 'Device Fingerprint', val: 'Linux x86_64; HeadlessChrome/118.0' },
      { key: 'Merchant Domain Age', val: '14 days' },
      { key: 'Cancellation Reason', val: 'Mandatory Safe Cancellation Protocol' },
    ],
  },
  {
    case_id: 'CASE-8822',
    transaction_id: 'INC-9042',
    timestamp: '2026-10-18 18:15:33 UTC',
    status: 'DIRECT_CANCELLED',
    user_id: 'USR-3190',
    merchant: 'Offshore Crypto Remit Hub',
    amount: 1850.0,
    risk_score: 0.71,
    risk_level: 'high',
    analyst_verdict: 'CONFIRMED_FRAUD_ATTEMPT',
    narrative: 'Sudden spike 12x above median daily spending. AI model clamped transaction immediately under Direct Cancellation rules.',
    reasons: ['12x median volume jump', 'Offshore routing', 'Neural reconstruction error anomaly = 0.61'],
    evidence: [
      { key: 'IP Geo-coordinate', val: 'Lat 24.8607, Long 67.0011' },
      { key: 'Device Fingerprint', val: 'Android 13; SM-G998B' },
      { key: 'Transaction Type', val: 'P2P Cross-Border Instant Outflow' },
      { key: 'Cancellation Status', val: 'Zero customer liability ($1,850 preserved)' },
    ],
  },
  {
    case_id: 'CASE-8823',
    transaction_id: 'INC-3319',
    timestamp: '2026-10-18 17:05:22 UTC',
    status: 'RESOLVED_SAFE',
    user_id: 'USR-4812',
    merchant: 'High Speed Train Booking',
    amount: 120.0,
    risk_score: 0.44,
    risk_level: 'medium',
    analyst_verdict: 'LEGITIMATE_TRAVEL',
    narrative: 'Geographic jump 380 km from home. Customer verified travel purpose through Customer Confidence checklist.',
    reasons: ['Transit station terminal', 'Expected seasonal travel pattern'],
    evidence: [
      { key: 'IP Geo-coordinate', val: 'Lat 33.6844, Long 73.0479' },
      { key: 'Device Fingerprint', val: 'iPhone 15 Pro; iOS 17.4' },
      { key: 'Merchant Category', val: 'Public Transportation & Transit' },
      { key: 'Confidence Check', val: 'Customer authorized with full consent' },
    ],
  },
];

export default function CaseInvestigator() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const { ledger, lang } = useAppData();
  const isUrdu = lang === 'ur';

  // Merge mock cases with any high-risk flagged transactions from live ledger
  const allCases = useMemo(() => {
    const fromLedger = ledger
      .filter((t) => t.is_flagged || t.risk_level === 'high')
      .map((t, idx) => ({
        case_id: `CASE-LIVE-${idx + 1}`,
        transaction_id: t.transaction_id,
        timestamp: new Date().toLocaleString(),
        status: 'DIRECT_CANCELLED',
        user_id: `USR-${t.transaction_id.slice(-4) || '101'}`,
        merchant: 'Unverified Entity / Live Stream',
        amount: t.amount ?? 0,
        risk_score: t.risk_score,
        risk_level: t.risk_level,
        analyst_verdict: 'AUTO_CANCELLED_FRAUD',
        narrative: t.explanation || 'Directly cancelled due to high fraud probability and safety violations.',
        reasons: t.top_factors ? t.top_factors.map((f) => `${f.feature} (+${f.shap_value.toFixed(2)})`) : ['High anomaly score'],
        evidence: [
          { key: 'Anomaly Score', val: `${((t.anomaly_score ?? 0) * 100).toFixed(1)}%` },
          { key: 'Fraud Probability', val: `${((t.fraud_probability ?? 0) * 100).toFixed(1)}%` },
          { key: 'Protocol', val: 'Direct Cancellation Enforced' },
        ],
      }));

    return [...fromLedger, ...MOCK_CASES];
  }, [ledger]);

  const [selectedCase, setSelectedCase] = useState(() => {
    if (initialId) {
      const match = allCases.find((c) => c.transaction_id === initialId);
      if (match) return match;
    }
    return allCases[0];
  });

  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState({});

  const handleSaveNote = () => {
    if (!notes.trim()) return;
    setSavedNotes((prev) => ({
      ...prev,
      [selectedCase.case_id]: [...(prev[selectedCase.case_id] || []), { note: notes, time: new Date().toLocaleTimeString() }],
    }));
    setNotes('');
  };

  return (
    <PageTransition>
      <div className={`investigator-page ${isUrdu ? 'lang-urdu' : ''}`}>
        {/* Banner */}
        <div className="investigator-banner">
          <div className="inv-badge">
            <span>🔍 FRAUD INTELLIGENCE & FORENSIC INVESTIGATOR</span>
          </div>
          <h1 className="investigator-headline">
            {isUrdu ? 'فارنزک فراڈ کیس انوسٹی گیٹر اور ڈائریکٹ کینسلیشن آڈٹ' : 'Forensic Fraud Case Dossier & Direct Cancellation Audit'}
          </h1>
          <p className="investigator-subhead">
            {isUrdu
              ? 'ہر مشکوک اور کینسل شدہ ٹرانزیکشن کی تفصیلی تفتیش کریں۔ فراڈ کے شواہد، ڈیوائس فنگر پرنٹ اور فنڈز کے محفوظ رہنے کی مکمل تاریخچہ دیکھیں۔'
              : 'Conduct deep-dive forensic audits on high-risk incidents. Review device telemetry, SHAP explainability factors, and verify that 100% of funds were protected by Direct Cancellation.'}
          </p>
        </div>

        {/* Layout: Sidebar Cases List & Main Case Dossier */}
        <div className="investigator-layout">
          {/* Case List Sidebar */}
          <div className="case-sidebar">
            <div className="case-sidebar-header">
              <span className="sidebar-title">{isUrdu ? 'تمام کیسز' : 'INCIDENT DOSSIERS'}</span>
              <span className="sidebar-badge">{allCases.length} total</span>
            </div>

            <div className="case-list-items">
              {allCases.map((c) => (
                <div
                  key={c.case_id}
                  className={`case-item-card ${selectedCase?.case_id === c.case_id ? 'case-item-card--active' : ''}`}
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="case-item-top">
                    <span className="case-item-id">{c.case_id}</span>
                    <span className={`case-item-status ${c.status === 'DIRECT_CANCELLED' ? 'case-item-status--cancelled' : 'case-item-status--safe'}`}>
                      {c.status === 'DIRECT_CANCELLED' ? '🛑 DIRECT CANCEL' : '✓ SAFE'}
                    </span>
                  </div>
                  <div className="case-item-body">
                    <div className="case-item-txn">{c.transaction_id}</div>
                    <div className="case-item-amount">${c.amount.toFixed(2)}</div>
                  </div>
                  <div className="case-item-footer">
                    <span>Risk: {(c.risk_score * 100).toFixed(1)}%</span>
                    <span className="case-item-time">{c.timestamp.split(' ')[1] || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dossier Detail Area */}
          <div className="case-dossier-main">
            {selectedCase ? (
              <div className="dossier-content animate-fade-in">
                {/* Dossier Header */}
                <div className="dossier-header-card">
                  <div className="dossier-header-left">
                    <span className="dossier-case-tag">{selectedCase.case_id}</span>
                    <h2 className="dossier-title">{selectedCase.merchant}</h2>
                    <span className="dossier-txn-ref">Transaction ID: <code>{selectedCase.transaction_id}</code> • User: <code>{selectedCase.user_id}</code></span>
                  </div>
                  <div className="dossier-header-right">
                    <div className="dossier-status-pill">
                      {selectedCase.status === 'DIRECT_CANCELLED' ? '🛑 DIRECT CANCELLED (FUNDS SAFE)' : '✓ RESOLVED SAFE'}
                    </div>
                    <div className="dossier-amount">${selectedCase.amount.toFixed(2)}</div>
                  </div>
                </div>

                {/* Direct Cancellation Enforcement Banner */}
                {selectedCase.status === 'DIRECT_CANCELLED' && (
                  <div className="cancellation-enforced-card">
                    <div className="cenf-icon">🛡️</div>
                    <div className="cenf-text">
                      <h4>{isUrdu ? 'فوری منسوخی اور فنڈز کا تحفظ لاگو ہوا' : 'Zero Customer Loss Mandate: Direct Cancellation Executed'}</h4>
                      <p>
                        {isUrdu
                          ? `یہ ٹرانزیکشن فراڈ پروٹیکشن پالیسی کے تحت بلاک کی گئی ہے۔ صارف کی $${selectedCase.amount.toFixed(2)} کی رقم محفوظ رکھی گئی۔ کوئی ہولڈ یا بھیجنے کا خطرہ پیدا نہیں ہونے دیا گیا۔`
                          : `Because this transaction exceeded high-risk fraud boundaries, hold/send options were revoked. The system executed instantaneous Direct Cancellation, successfully retaining 100% of $${selectedCase.amount.toFixed(2)} for the cardholder.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Incident Evidence Grid */}
                <div className="dossier-grid">
                  <div className="dossier-box">
                    <h4 className="box-title">🛰️ TELEMETRY & FORENSIC EVIDENCE</h4>
                    <div className="evidence-list">
                      {selectedCase.evidence.map((ev, i) => (
                        <div key={i} className="evidence-row">
                          <span className="evidence-key">{ev.key}</span>
                          <span className="evidence-val">{ev.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dossier-box">
                    <h4 className="box-title">⚖️ RISK FACTORS & SHAP DRIVERS</h4>
                    <ul className="reasons-list">
                      {selectedCase.reasons.map((r, i) => (
                        <li key={i} className="reason-item">
                          <span className="bullet">⚡</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Case Narrative */}
                <div className="dossier-narrative-card">
                  <h4 className="box-title">📝 ANALYST AUDIT NARRATIVE</h4>
                  <p className="narrative-text">{selectedCase.narrative}</p>
                </div>

                {/* Analyst Notes & Actions */}
                <div className="dossier-notes-card">
                  <h4 className="box-title">✍️ INVESTIGATOR FIELD NOTES & COLLABORATION</h4>
                  <div className="notes-entry-form">
                    <input
                      type="text"
                      placeholder={isUrdu ? 'اس کیس پر اپنے تفتیشی نوٹس درج کریں…' : 'Add forensic field note or law enforcement update…'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNote();
                      }}
                    />
                    <button className="btn-add-note" onClick={handleSaveNote} type="button">
                      + Add Note
                    </button>
                  </div>

                  <div className="saved-notes-list">
                    {(savedNotes[selectedCase.case_id] || []).map((sn, idx) => (
                      <div key={idx} className="saved-note-row">
                        <span className="sn-time">{sn.time}</span>
                        <span className="sn-text">{sn.note}</span>
                      </div>
                    ))}
                    {!(savedNotes[selectedCase.case_id]?.length) && (
                      <div className="notes-empty">No investigator notes recorded yet for this dossier.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="dossier-empty">Select a case from the sidebar to inspect forensics.</div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
