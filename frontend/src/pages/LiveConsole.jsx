import { useState, useMemo } from 'react';
import Ledger from '../components/Ledger';
import StatCard from '../components/StatCard';
import RiskChart from '../components/RiskChart';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import FilterBar from '../components/FilterBar';
import ActionBar from '../components/ActionBar';
import SimulateTxnModal from '../components/SimulateTxnModal';
import PageTransition from '../components/PageTransition';
import { useAppData } from '../context/AppDataContext';

export default function LiveConsole() {
  const {
    ledger,
    selected,
    setSelected,
    history,
    isPaused,
    setIsPaused,
    setLedger,
    handleManualScored,
    handleExportCSV,
    flaggedCount,
    avgRisk,
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const filteredLedger = useMemo(() => {
    return ledger.filter((txn) => {
      const matchesSearch = !searchQuery || txn.transaction_id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (riskFilter === 'all') return true;
      if (riskFilter === 'flagged') return txn.is_flagged;
      return txn.risk_level === riskFilter;
    });
  }, [ledger, searchQuery, riskFilter]);

  return (
    <PageTransition>
      <div className="console-body">
        <section className="ledger-panel">
          <div className="toolbar-container">
            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              riskFilter={riskFilter}
              setRiskFilter={setRiskFilter}
            />
            <ActionBar
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((prev) => !prev)}
              onClearLedger={() => setLedger([])}
              onExportCSV={handleExportCSV}
              onOpenSimulate={() => setIsSimulateOpen(true)}
            />
          </div>

          <Ledger ledger={filteredLedger} selected={selected} onSelect={setSelected} />
        </section>

        <aside className="side-rail">
          <div className="stat-grid">
            <StatCard label="Flagged" value={flaggedCount} sublabel="this session" accent="var(--alert-red)" />
            <StatCard label="Avg risk" value={`${(avgRisk * 100).toFixed(1)}%`} sublabel="rolling window" />
          </div>

          <RiskChart history={history} />
          <ExplainabilityPanel selected={selected} />
        </aside>
      </div>

      <SimulateTxnModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onScored={handleManualScored}
      />
    </PageTransition>
  );
}
