import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { useT } from '../translations';

export default function ActionBar({
  isPaused,
  onTogglePause,
  onClearLedger,
  onExportCSV,
  onOpenSimulate,
}) {
  const { lang } = useAppData();
  const t = useT(lang);

  return (
    <div className="action-bar">
      <div className="action-group">
        <button
          className={`action-btn ${isPaused ? 'action-btn--active' : ''}`}
          onClick={onTogglePause}
          title={isPaused ? t.btnResume : t.btnPause}
        >
          {isPaused ? `▶ ${t.btnResume.toUpperCase()}` : `⏸ ${t.btnPause.toUpperCase()}`}
        </button>

        <button className="action-btn action-btn--primary" onClick={onOpenSimulate}>
          + {t.btnSimulate.toUpperCase()}
        </button>
      </div>

      <div className="action-group">
        <button className="action-btn" onClick={onClearLedger} title={t.btnClear}>
          {t.btnClear.toUpperCase()}
        </button>
        <button className="action-btn" onClick={onExportCSV} title={t.btnExportCsv}>
          {t.btnExportCsv.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
