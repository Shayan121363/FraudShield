import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/stream';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_LEDGER_ROWS = 50;

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [ledger, setLedger] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

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

  const flaggedCount = ledger.filter((t) => t.is_flagged).length;
  const avgRisk = ledger.length
    ? ledger.reduce((sum, t) => sum + t.risk_score, 0) / ledger.length
    : 0;

  const value = useMemo(
    () => ({
      ledger,
      setLedger,
      selected,
      setSelected,
      connected,
      history,
      alerts,
      setAlerts,
      isPaused,
      setIsPaused,
      handleManualScored,
      handleExportCSV,
      flaggedCount,
      avgRisk,
      API_URL,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ledger, selected, connected, history, alerts, isPaused, flaggedCount, avgRisk]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
