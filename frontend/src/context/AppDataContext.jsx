import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { exportStyledExcel } from '../utils/excelExport';

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
  const [healthData, setHealthData] = useState(null);
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('fraudshield_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('fraudshield_lang', newLang);
    } catch {
      // ignore
    }
  }, []);

  // Pre-fetch and cache model metrics so ModelInsights renders immediately
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHealthData(data);
      })
      .catch(() => {});
  }, []);

  const wsRef = useRef(null);
  const tickRef = useRef(0);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleIncomingTxn = useCallback((txn) => {
    if (isPausedRef.current) return;

    const resolvedAmount =
      txn.amount !== undefined && txn.amount !== null
        ? Number(txn.amount)
        : (txn.top_factors?.find((f) => f.feature === 'amount')?.value ?? 0);
    const normalizedTxn = { ...txn, amount: resolvedAmount };

    tickRef.current += 1;
    setLedger((prev) => [normalizedTxn, ...prev].slice(0, MAX_LEDGER_ROWS));
    setHistory((prev) => [...prev, { tick: tickRef.current, risk: normalizedTxn.risk_score }].slice(-30));

    if (normalizedTxn.is_flagged || normalizedTxn.risk_level === 'high') {
      setAlerts((prev) => [normalizedTxn, ...prev].slice(0, 20));
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
    exportStyledExcel(ledger, flaggedCount, avgRisk);
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
      lang,
      setLang,
      healthData,
      setHealthData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ledger, selected, connected, history, alerts, isPaused, flaggedCount, avgRisk, lang, healthData]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
