import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Ledger from './components/Ledger';
import StatCard from './components/StatCard';
import RiskChart from './components/RiskChart';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import ThemeToggle from './components/ThemeToggle';
import NotificationBell from './components/NotificationBell';
import FilterBar from './components/FilterBar';
import ActionBar from './components/ActionBar';
import SimulateTxnModal from './components/SimulateTxnModal';
import './App.css';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/stream';
const MAX_LEDGER_ROWS = 50;

export default function App() {
  const [ledger, setLedger] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const wsRef = useRef(null);
  const tickRef = useRef(0);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleIncomingTxn = useCallback((txn) => {
    if (isPausedRef.current) return;

    tickRef.current += 1;
    setLedger((prev) => [txn, ...prev].slice(0, MAX_LEDGER_ROWS));
    setHistory((prev) => [...prev, { tick: tickRef.current, risk: txn.risk_score }].slice(-30));

    if (txn.is_flagged || txn.risk_level === 'high') {
      setAlerts((prev) => [txn, ...prev].slice(0, 20));
    }
  }, []);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const txn = JSON.parse(event.data);
        handleIncomingTxn(txn);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    wsRef.current = ws;
  }, [handleIncomingTxn]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const handleManualScored = (result) => {
    handleIncomingTxn(result);
    setSelected(result);
  };

  const handleExportCSV = () => {
    if (ledger.length === 0) return;
    const headers = ['transaction_id', 'amount', 'risk_score', 'risk_level', 'is_flagged', 'explanation'];
    const csvRows = [
      headers.join(','),
      ...ledger.map((t) =>
        [
          t.transaction_id,
          t.amount ?? 0,
          t.risk_score,
          t.risk_level,
          t.is_flagged,
          `"${(t.explanation || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraudshield-ledger-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLedger = useMemo(() => {
    return ledger.filter((txn) => {
      const matchesSearch = !searchQuery || txn.transaction_id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (riskFilter === 'all') return true;
      if (riskFilter === 'flagged') return txn.is_flagged;
      return txn.risk_level === riskFilter;
    });
  }, [ledger, searchQuery, riskFilter]);

  const flaggedCount = ledger.filter((t) => t.is_flagged).length;
  const avgRisk = ledger.length
    ? ledger.reduce((sum, t) => sum + t.risk_score, 0) / ledger.length
    : 0;

  return (
    <div className="console">
      <header className="console-header">
        <div className="console-title">
          <span className="console-title-main">FRAUD SHIELD</span>
          <span className="console-title-sub">real-time transaction risk console</span>
        </div>

        <div className="header-controls">
          <div className="connection-indicator">
            <span className={`connection-dot ${connected ? 'connection-dot--live' : ''}`} />
            <span>{connected ? 'LIVE FEED' : 'DISCONNECTED'}</span>
          </div>

          <NotificationBell
            alerts={alerts}
            onSelectAlert={(item) => setSelected(item)}
            onClearAlerts={() => setAlerts([])}
          />

          <ThemeToggle />
        </div>
      </header>

      <div className="console-body">
        <section className="ledger-panel">
          <div className="toolbar-container">
            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              riskFilter={riskFilter}
              setRiskFilter={setRiskFilter}
            />
            <ActionBar
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((prev) => !prev)}
              onClearLedger={() => setLedger([])}
              onExportCSV={handleExportCSV}
              onOpenSimulate={() => setIsSimulateOpen(true)}
            />
          </div>

          <Ledger ledger={filteredLedger} selected={selected} onSelect={setSelected} />
        </section>

        <aside className="side-rail">
          <div className="stat-grid">
            <StatCard label="Flagged" value={flaggedCount} sublabel="this session" accent="var(--alert-red)" />
            <StatCard label="Avg risk" value={`${(avgRisk * 100).toFixed(1)}%`} sublabel="rolling window" />
          </div>

          <RiskChart history={history} />
          <ExplainabilityPanel selected={selected} />
        </aside>
      </div>

      <SimulateTxnModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onScored={handleManualScored}
      />
    </div>
  );
}
