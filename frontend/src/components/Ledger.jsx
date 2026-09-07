import React from 'react';
import SignalStrip, { RISK_META } from './SignalStrip';
import { useAppData } from '../context/AppDataContext';
import { useT } from '../translations';

function LedgerRow({ txn, onSelect, isSelected, lang, t }) {
  const meta = RISK_META[txn.risk_level] ?? RISK_META.low;
  const label =
    lang === 'ur'
      ? txn.risk_level === 'low'
        ? t.riskLow
        : txn.risk_level === 'medium'
        ? t.riskMedium
        : t.riskHigh
      : meta.label;

  return (
    <button
      className={`ledger-row ${isSelected ? 'ledger-row--selected' : ''} ${txn.is_flagged ? 'ledger-row--flagged' : ''}`}
      onClick={() => onSelect(txn)}
    >
      <span className="ledger-id">{txn.transaction_id}</span>
      <span className="ledger-risk-label" style={{ color: meta.color }}>{label}</span>
      <SignalStrip score={txn.risk_score} level={txn.risk_level} />
      <span className="ledger-score">{(txn.risk_score * 100).toFixed(1)}%</span>
    </button>
  );
}

export default function Ledger({ ledger, selected, onSelect }) {
  const { lang } = useAppData();
  const t = useT(lang);

  return (
    <section className="ledger-panel">
      <div className="panel-heading">
        <span>{t.ledgerTitle}</span>
        <span className="panel-heading-count">{ledger.length} {t.scoredCount}</span>
      </div>
      <div className="ledger-columns">
        <span>{t.colId}</span>
        <span>{t.colRisk}</span>
        <span>{t.colSignal}</span>
        <span>{t.colScore}</span>
      </div>
      <div className="ledger-list">
        {ledger.length === 0 && (
          <div className="ledger-empty">{t.waitingTxns}</div>
        )}
        {ledger.map((txn, i) => (
          <LedgerRow
            key={`${txn.transaction_id}-${i}`}
            txn={txn}
            onSelect={onSelect}
            isSelected={selected?.transaction_id === txn.transaction_id}
            lang={lang}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}
