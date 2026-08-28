import React from 'react';

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
  return (
    <div className="detail-panel">
      <div className="panel-heading"><span>EXPLAINABILITY</span></div>
      {!selected && (
        <div className="detail-empty">Select a transaction from the ledger to inspect its risk factors.</div>
      )}
      {selected && (
        <div className="detail-content">
          <div className="detail-row">
            <span className="detail-key">Transaction</span>
            <span className="detail-value detail-value--mono">{selected.transaction_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Fraud probability</span>
            <span className="detail-value detail-value--mono">{(selected.fraud_probability * 100).toFixed(2)}%</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Anomaly score</span>
            <span className="detail-value detail-value--mono">{(selected.anomaly_score * 100).toFixed(2)}%</span>
          </div>

          <div className="factor-list">
            {selected.top_factors.map((f) => (
              <FactorBar key={f.feature} factor={f} />
            ))}
          </div>

          <p className="explanation-text">{selected.explanation}</p>
        </div>
      )}
    </div>
  );
}
