import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useT } from '../translations';

function FactorBar({ factor }) {
  const isFraudPush = factor.shap_value > 0;
  const magnitude = Math.min(Math.abs(factor.shap_value) / 3.5, 1) * 100;
  return (
    <div className="factor-row">
      <span className="factor-name">{factor.feature.replace(/_/g, ' ')}</span>
      <div className="factor-track">
        <div
          className={`factor-fill ${isFraudPush ? 'factor-fill--risk' : 'factor-fill--safe'}`}
          style={{ width: `${magnitude}%` }}
        />
      </div>
    </div>
  );
}

export default function ExplainabilityPanel({ selected }) {
  const navigate = useNavigate();
  const { lang } = useAppData();
  const t = useT(lang);
  const isUrdu = lang === 'ur';

  const explanationText =
    isUrdu && selected?.user_guidance?.plain_reason_ur
      ? `${selected.user_guidance.plain_title_ur} — ${selected.user_guidance.plain_reason_ur}`
      : selected?.explanation;

  return (
    <div className="detail-panel">
      <div className="panel-heading"><span>{t.explainHeading}</span></div>
      {!selected && (
        <div className="detail-empty">{t.selectTxnPrompt}</div>
      )}
      {selected && (
        <div className="detail-content">
          <div className="detail-row">
            <span className="detail-key">{t.lblTxn}</span>
            <span className="detail-value detail-value--mono">{selected.transaction_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">{t.lblFraudProb}</span>
            <span className="detail-value detail-value--mono">{(selected.fraud_probability * 100).toFixed(2)}%</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">{t.lblAnomalyScore}</span>
            <span className="detail-value detail-value--mono">{(selected.anomaly_score * 100).toFixed(2)}%</span>
          </div>

          <div className="factor-list">
            {selected.top_factors.map((f) => (
              <FactorBar key={f.feature} factor={f} />
            ))}
          </div>

          <p className="explanation-text">{explanationText}</p>

          <div className="confidence-flow-cta">
            <button
              className="btn-launch-confidence"
              onClick={() => navigate('/confidence-flow')}
              type="button"
            >
              <span>{t.ctaConfidenceBtn}</span>
              <span className="cta-arrow">{isUrdu ? '←' : '→'}</span>
            </button>
            <span className="cta-subtext">{t.ctaConfidenceSub}</span>
          </div>
        </div>
      )}
    </div>
  );
}
