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
    { to: '/analytics', label: t.navAnalytics, icon: 'M3 3v18h18M7 15l4-4 3 3 5-6' },
    { to: '/insights', label: t.navInsights, icon: 'M12 2a5 5 0 015 5c0 2-1.5 3.2-2 4.5-.4 1-.5 1.5-.5 2.5h-5c0-1-.1-1.5-.5-2.5-.5-1.3-2-2.5-2-4.5a5 5 0 015-5zM9 19h6M10 22h4' },
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
