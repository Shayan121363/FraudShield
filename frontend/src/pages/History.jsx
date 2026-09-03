import { useEffect, useState, useMemo } from 'react';
import PageTransition from '../components/PageTransition';
import { RISK_META } from '../components/SignalStrip';
import { useAppData } from '../context/AppDataContext';

const LIMIT_OPTIONS = [25, 50, 100, 200];

export default function History() {
  const { API_URL } = useAppData();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [limit, setLimit] = useState(50);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/history?limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setRecords(data);
          setError(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [API_URL, limit]);

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
              placeholder="Search by transaction ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="history-limit-select">
            {LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt}
                className={`history-limit-btn ${limit === opt ? 'history-limit-btn--active' : ''}`}
                onClick={() => setLimit(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-panel">
          <div className="panel-heading">
            <span>PERSISTED TRANSACTION HISTORY</span>
            <span className="panel-heading-count">{filtered.length} rows</span>
          </div>

          {loading && <div className="ledger-empty">Loading history…</div>}
          {!loading && error && (
            <div className="ledger-empty">
              Couldn&apos;t reach the backend at <code>{API_URL}</code>.
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="ledger-empty">No persisted records yet.</div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Risk</th>
                    <th>Score</th>
                    <th>Flagged</th>
                    <th>Scored at</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const meta = RISK_META[r.risk_level] ?? RISK_META.low;
                    return (
                      <tr key={r.id ?? i} className="history-row" style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}>
                        <td className="history-id">{r.transaction_id}</td>
                        <td>${(r.amount ?? 0).toFixed(2)}</td>
                        <td style={{ color: meta.color }}>{meta.label}</td>
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
