import { useState, useEffect, useRef, useCallback } from 'react';
import Ledger from './components/Ledger';
import StatCard from './components/StatCard';
import RiskChart from './components/RiskChart';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import './App.css';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/stream';
const MAX_LEDGER_ROWS = 40;

export default function App() {
  const [ledger, setLedger] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const wsRef = useRef(null);
  const tickRef = useRef(0);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      const txn = JSON.parse(event.data);
      tickRef.current += 1;
      setLedger((prev) => [txn, ...prev].slice(0, MAX_LEDGER_ROWS));
      setHistory((prev) => [...prev, { tick: tickRef.current, risk: txn.risk_score }].slice(-30));
    };
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const flaggedCount = ledger.filter((t) => t.is_flagged).length;
  const avgRisk = ledger.length
    ? ledger.reduce((sum, t) => sum + t.risk_score, 0) / ledger.length
    : 0;

  return (
    <div className="console">
      <header className="console-header">
        <div className="console-title">
          <span className="console-title-main">FRAUD WATCH</span>
          <span className="console-title-sub">real-time transaction risk console</span>
        </div>
        <div className="connection-indicator">
          <span className={`connection-dot ${connected ? 'connection-dot--live' : ''}`} />
          <span>{connected ? 'LIVE FEED' : 'DISCONNECTED'}</span>
        </div>
      </header>

      <div className="console-body">
        <Ledger ledger={ledger} selected={selected} onSelect={setSelected} />

        <aside className="side-rail">
          <div className="stat-grid">
            <StatCard label="Flagged" value={flaggedCount} sublabel="this session" accent="var(--alert-red)" />
            <StatCard label="Avg risk" value={`${(avgRisk * 100).toFixed(1)}%`} sublabel="rolling window" />
          </div>

          <RiskChart history={history} />
          <ExplainabilityPanel selected={selected} />
        </aside>
      </div>
    </div>
  );
}
