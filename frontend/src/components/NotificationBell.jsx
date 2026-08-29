import React, { useState, useRef, useEffect } from 'react';

export default function NotificationBell({ alerts = [], onSelectAlert, onClearAlerts }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alerts.length;

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button
        className={`notif-btn ${unreadCount > 0 ? 'notif-btn--has-unread' : ''}`}
        onClick={() => setOpen(!open)}
        title="Alert Notifications"
      >
        <svg className="notif-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">RISK ALERTS</span>
            {alerts.length > 0 && (
              <button className="notif-clear-btn" onClick={onClearAlerts}>
                Clear All
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {alerts.length === 0 ? (
              <div className="notif-empty">No high risk alerts recorded</div>
            ) : (
              alerts.map((item, idx) => (
                <div
                  key={`${item.transaction_id}-${idx}`}
                  className="notif-item"
                  onClick={() => {
                    onSelectAlert(item);
                    setOpen(false);
                  }}
                >
                  <div className="notif-item-header">
                    <span className="notif-item-id">{item.transaction_id}</span>
                    <span className="notif-item-level">{item.risk_level.toUpperCase()}</span>
                  </div>
                  <div className="notif-item-body">
                    <span>${item.amount?.toFixed(2) || '0.00'}</span>
                    <span className="notif-item-score">{(item.risk_score * 100).toFixed(1)}% Risk</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
