import { useEffect, useState, useMemo, useCallback } from 'react';
import PageTransition from '../components/PageTransition';
import { RISK_META } from '../components/SignalStrip';
import { useAppData } from '../context/AppDataContext';
import { useT } from '../translations';

const LIMIT_OPTIONS = [25, 50, 100, 200];

export default function History() {
  const { API_URL, lang } = useAppData();
  const t = useT(lang);
  const isUrdu = lang === 'ur';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [limit, setLimit] = useState(50);
  const [query, setQuery] = useState('');

  const fetchHistory = useCallback(
    (targetLimit) => {
      setLoading(true);
      const url = `${API_URL}/history?limit=${targetLimit}&_t=${Date.now()}`;
      fetch(url, { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('bad response');
          return res.json();
        })
        .then((data) => {
          setRecords(Array.isArray(data) ? data : []);
          setError(false);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    },
    [API_URL]
  );

  useEffect(() => {
    fetchHistory(limit);
  }, [fetchHistory, limit]);

  const handleSelectLimit = (opt) => {
    setLimit(opt);
    fetchHistory(opt);
  };

  const filtered = useMemo(() => {
    if (!query) return records;
    const q = query.toLowerCase();
    return records.filter((r) => r.transaction_id?.toLowerCase().includes(q));
  }, [records, query]);

  return (
    <PageTransition>
      <div className="history-page">
        <div className="history-toolbar">
          <div className="filter-bar-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="filter-search-icon">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={isUrdu ? 'ٹرانزیکشن آئی ڈی سے تلاش کریں…' : 'Search by transaction ID…'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="history-limit-select">
            <span className="history-limit-label">
              {isUrdu ? 'تعداد:' : 'Limit:'}
            </span>
            {LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`history-limit-btn ${limit === opt ? 'history-limit-btn--active' : ''}`}
                onClick={() => handleSelectLimit(opt)}
                title={`Show up to ${opt} records`}
              >
                {opt}
              </button>
            ))}
            <button
              type="button"
              className="history-refresh-btn"
              onClick={() => fetchHistory(limit)}
              title={isUrdu ? 'تازہ ترین ریکارڈز لائیں' : 'Refresh records'}
            >
              🔄
            </button>
          </div>
        </div>

        <div className="chart-panel">
          <div className="panel-heading">
            <span>{isUrdu ? 'محفوظ شدہ ٹرانزیکشن ہسٹری' : 'PERSISTED TRANSACTION HISTORY'}</span>
            <span className="panel-heading-count">
              {isUrdu
                ? `${filtered.length} قطاریں (حد: ${limit})`
                : `${filtered.length} rows (limit: ${limit})`}
            </span>
          </div>

          {loading && records.length === 0 && (
            <div className="ledger-empty">
              {isUrdu ? 'ہسٹری لوڈ ہو رہی ہے…' : 'Loading history…'}
            </div>
          )}

          {!loading && error && records.length === 0 && (
            <div className="ledger-empty">
              Couldn&apos;t reach the backend at <code>{API_URL}</code>.
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="ledger-empty">
              {isUrdu ? 'کوئی ریکارڈ موجود نہیں ہے۔' : 'No persisted records found.'}
            </div>
          )}

          {filtered.length > 0 && (
            <div className={`history-table-wrap ${loading ? 'history-table-wrap--loading' : ''}`}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>{isUrdu ? 'شناخت (ID)' : 'ID'}</th>
                    <th>{isUrdu ? 'رقم' : 'Amount'}</th>
                    <th>{isUrdu ? 'خطرہ' : 'Risk'}</th>
                    <th>{isUrdu ? 'اسکور' : 'Score'}</th>
                    <th>{isUrdu ? 'نشان زدہ' : 'Flagged'}</th>
                    <th>{isUrdu ? 'وقت' : 'Scored at'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const meta = RISK_META[r.risk_level] ?? RISK_META.low;
                    const riskLabel =
                      isUrdu
                        ? r.risk_level === 'low'
                          ? t.riskLow
                          : r.risk_level === 'medium'
                          ? t.riskMedium
                          : t.riskHigh
                        : meta.label;

                    return (
                      <tr key={r.id ?? `${r.transaction_id}-${i}`} className="history-row">
                        <td className="history-id">{r.transaction_id}</td>
                        <td>${(r.amount ?? 0).toFixed(2)}</td>
                        <td style={{ color: meta.color }}>{riskLabel}</td>
                        <td>{(r.risk_score * 100).toFixed(1)}%</td>
                        <td>{r.is_flagged ? '🚩' : '—'}</td>
                        <td className="history-timestamp">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
