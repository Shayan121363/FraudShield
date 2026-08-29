import React from 'react';

export default function ActionBar({
  isPaused,
  onTogglePause,
  onClearLedger,
  onExportCSV,
  onOpenSimulate,
}) {
  return (
    <div className="action-bar">
      <div className="action-group">
        <button
          className={`action-btn ${isPaused ? 'action-btn--active' : ''}`}
          onClick={onTogglePause}
          title={isPaused ? 'Resume live feed' : 'Pause live feed'}
        >
          {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>

        <button className="action-btn action-btn--primary" onClick={onOpenSimulate}>
          + SIMULATE TXN
        </button>
      </div>

      <div className="action-group">
        <button className="action-btn" onClick={onClearLedger} title="Clear displayed rows">
          CLEAR LEDGER
        </button>
        <button className="action-btn" onClick={onExportCSV} title="Export ledger to CSV">
          EXPORT CSV
        </button>
      </div>
    </div>
  );
}
