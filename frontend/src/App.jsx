import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import NavBar from './components/NavBar';
import NotificationBell from './components/NotificationBell';
import ThemeToggle from './components/ThemeToggle';
import LiveConsole from './pages/LiveConsole';
import Analytics from './pages/Analytics';
import ModelInsights from './pages/ModelInsights';
import History from './pages/History';
import './App.css';

function Shell() {
  const { connected, alerts, setSelected, setAlerts } = useAppData();

  return (
    <div className="console">
      <header className="console-header">
        <div className="console-title">
          <span className="console-title-main">FRAUD SHIELD</span>
          <span className="console-title-sub">real-time transaction risk console</span>
        </div>

        <NavBar />

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

      <Routes>
        <Route path="/" element={<LiveConsole />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/insights" element={<ModelInsights />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppDataProvider>
        <Shell />
      </AppDataProvider>
    </HashRouter>
  );
}
