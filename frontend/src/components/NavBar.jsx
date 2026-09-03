import { useRef, useLayoutEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Live Console', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
  { to: '/analytics', label: 'Analytics', icon: 'M3 3v18h18M7 15l4-4 3 3 5-6' },
  { to: '/insights', label: 'Model Insights', icon: 'M12 2a5 5 0 015 5c0 2-1.5 3.2-2 4.5-.4 1-.5 1.5-.5 2.5h-5c0-1-.1-1.5-.5-2.5-.5-1.3-2-2.5-2-4.5a5 5 0 015-5zM9 19h6M10 22h4' },
  { to: '/history', label: 'History', icon: 'M12 8v4l3 3M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8' },
];

export default function NavBar() {
  const location = useLocation();
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector('.nav-tab--active');
    if (activeEl) {
      setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    }
  }, [location.pathname]);

  return (
    <nav className="nav-bar" ref={containerRef}>
      {TABS.map((tab) => (
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
        </NavLink>
      ))}
      <span
        className="nav-indicator"
        style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
      />
    </nav>
  );
}
