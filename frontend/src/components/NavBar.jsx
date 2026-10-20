import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useT } from '../translations';

export default function NavBar() {
  const { lang } = useAppData();
  const t = useT(lang);
  const location = useLocation();
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    { to: '/', label: t.navLiveConsole, icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
    { to: '/confidence-flow', label: t.navConfidenceFlow, badge: t.inclusionBadge, icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { to: '/rules', label: t.navRules, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { to: '/simulator', label: t.navSimulator, icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { to: '/investigator', label: t.navInvestigator, icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { to: '/analytics', label: t.navAnalytics, icon: 'M3 3v18h18M7 15l4-4 3 3 5-6' },
    { to: '/command', label: t.navCommand, icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    { to: '/history', label: t.navHistory, icon: 'M12 8v4l3 3M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8' },
  ];

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector('.nav-tab--active');
    if (activeEl) {
      setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    }
  }, [location.pathname, lang]);

  // Close mobile drawer on route change or ESC
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="nav-bar nav-bar--desktop" ref={containerRef}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab--active' : ''}`}
          >
            <svg className="nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
            {tab.badge && <span className="nav-tab-badge">{tab.badge}</span>}
          </NavLink>
        ))}
        <span
          className="nav-indicator"
          style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
        />
      </nav>

      {/* Mobile Hamburger Toggle Button */}
      <button
        type="button"
        className={`nav-hamburger-btn ${mobileOpen ? 'nav-hamburger-btn--open' : ''}`}
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label={t.menu}
        title={t.menu}
      >
        <span className="hamburger-bar hamburger-bar--1" />
        <span className="hamburger-bar hamburger-bar--2" />
        <span className="hamburger-bar hamburger-bar--3" />
      </button>

      {/* Mobile Drawer Overlay & Menu */}
      {mobileOpen && (
        <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="nav-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="nav-mobile-header">
              <span className="nav-mobile-title">{t.menu}</span>
              <button
                type="button"
                className="nav-mobile-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="nav-mobile-links">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === '/'}
                  className={({ isActive }) => `nav-mobile-link ${isActive ? 'nav-mobile-link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <svg className="nav-mobile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={tab.icon} />
                  </svg>
                  <span className="nav-mobile-label">{tab.label}</span>
                  {tab.badge && <span className="nav-tab-badge">{tab.badge}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
