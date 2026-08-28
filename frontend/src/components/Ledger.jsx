import React from 'react';
import SignalStrip, { RISK_META } from './SignalStrip';

function LedgerRow({ txn, onSelect, isSelected }) {
  const meta = RISK_META[txn.risk_level] ?? RISK_META.low;
  return (
    <button
      className={`ledger-row ${isSelected ? 'ledger-row--selected' : ''} ${txn.is_flagged ? 'ledger-row--flagged' : ''}`}
      onClick={() => onSelect(txn)}
    >
      <span className="ledger-id">{txn.transaction_id}</span>
      <span className="ledger-risk-label" style={{ color: meta.color }}>{meta.label}</span>
      <SignalStrip score={txn.risk_score} level={txn.risk_level} />
      <span className="ledger-score">{(txn.risk_score * 100).toFixed(1)}%</span>
    </button>
  );
}

export default function Ledger({ ledger, selected, onSelect }) {
  return (
    <section className="ledger-panel">
      <div className="panel-heading">
        <span>TRANSACTION LEDGER</span>
        <span className="panel-heading-count">{ledger.length} scored</span>
      </div>
      <div className="ledger-columns">
        <span>ID</span>
        <span>RISK</span>
        <span>SIGNAL</span>
        <span>SCORE</span>
      </div>
      <div className="ledger-list">
        {ledger.length === 0 && (
          <div className="ledger-empty">Waiting for transactions to stream in…</div>
        )}
        {ledger.map((txn, i) => (
          <LedgerRow
            key={`${txn.transaction_id}-${i}`}
            txn={txn}
            onSelect={onSelect}
            isSelected={selected?.transaction_id === txn.transaction_id}
          />
        ))}
      </div>
    </section>
  );
}
