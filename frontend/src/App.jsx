import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import NavBar from './components/NavBar';
import NotificationBell from './components/NotificationBell';
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import LiveConsole from './pages/LiveConsole';
import Analytics from './pages/Analytics';
import ModelInsights from './pages/ModelInsights';
import History from './pages/History';
import ConfidenceFlow from './pages/ConfidenceFlow';
import { useT } from './translations';
import './App.css';

function Shell() {
  const { connected, alerts, setSelected, setAlerts, lang } = useAppData();
  const t = useT(lang);
  const isUrdu = lang === 'ur';

  return (
    <div className={`console ${isUrdu ? 'lang-urdu' : ''}`} dir={isUrdu ? 'rtl' : 'ltr'}>
      <header className="console-header">
        <div className="console-title">
          <span className="console-title-main">{t.appTitle}</span>
          <span className="console-title-sub">{t.appSubtitle}</span>
        </div>

        <NavBar />

        <div className="header-controls">
          <div className="connection-indicator">
            <span className={`connection-dot ${connected ? 'connection-dot--live' : ''}`} />
            <span>{connected ? t.liveFeed : t.disconnected}</span>
          </div>

          <NotificationBell
            alerts={alerts}
            onSelectAlert={(item) => setSelected(item)}
            onClearAlerts={() => setAlerts([])}
          />

          <LanguageToggle />

          <ThemeToggle />
        </div>
      </header>

      <Routes>
        <Route path="/" element={<LiveConsole />} />
        <Route path="/confidence-flow" element={<ConfidenceFlow />} />
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
