import { useState, useEffect } from 'react';
import { calculateDailyFootprint } from './utils/calculations';
import type { DailyLog } from './utils/calculations';
import { getLogs, saveDailyLog } from './utils/storage';
import { EarthTwin } from './components/EarthTwin';
import { ActionLogger } from './components/ActionLogger';
import { Dashboard } from './components/Dashboard';
import { Insights } from './components/Insights';
import { Streaks } from './components/Streaks';
import { Benchmarking } from './components/Benchmarking';

function App() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [avgFootprint, setAvgFootprint] = useState<number>(0);

  // Load logs on mount
  useEffect(() => {
    const loadedLogs = getLogs();
    setLogs(loadedLogs);
  }, []);

  // Re-calculate average daily footprint whenever logs change
  useEffect(() => {
    if (logs.length === 0) {
      setAvgFootprint(0);
      return;
    }
    const total = logs.reduce((sum, log) => sum + calculateDailyFootprint(log).total, 0);
    setAvgFootprint(total / logs.length);
  }, [logs]);

  // Handler for when a new log is submitted
  const handleLogSaved = (newLog: DailyLog) => {
    const updated = saveDailyLog(newLog);
    setLogs([...updated]);
  };

  return (
    <div className="app-container">
      {/* Top Navigation / Header */}
      <header className="app-header">
        <div className="brand-section">
          {/* Custom inline leaf SVG logo */}
          <svg className="brand-logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 3C7.5 3 3.5 6.5 3 11C2.5 15.5 5.5 19.5 10 20.5V22H14V20.5C18.5 19.5 21.5 15.5 21 11C20.5 6.5 16.5 3 12 3Z" stroke="#1B3B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V20" stroke="#0D9488" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 9C14.5 9 17 10 18.5 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 14C9.5 14 7 13 5.5 11" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <h1 className="app-title">Verdira</h1>
            <span className="tagline">Personal Carbon Footprint Companion</span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="connection-status" role="status" aria-live="polite">
          <div className="status-dot"></div>
          <span className="status-label">Local Snapshot Active</span>
        </div>
      </header>

      {/* Main Content Layout Grid */}
      <main className="dashboard-grid">
        {/* Left Column: Avatar & Gamification */}
        <div className="grid-left-col">
          {/* Earth Twin Avatar */}
          <EarthTwin avgFootprint={avgFootprint} hasLogs={logs.length > 0} />

          {/* Gamified Streaks */}
          <Streaks logs={logs} />

          {/* AI Insights Panel */}
          <Insights logs={logs} />
        </div>

        {/* Right Column: Logging & Dashboard */}
        <div className="grid-right-col">
          {/* Daily Quick-Action Logger */}
          <ActionLogger onLogSaved={handleLogSaved} existingLogs={logs} />

          {/* Visual Footprint Dashboard */}
          <Dashboard logs={logs} />

          {/* Comparative Benchmarking */}
          <Benchmarking logs={logs} />
        </div>
      </main>

      {/* Footer / Privacy & Compliance Disclaimer */}
      <footer className="privacy-section-footer">
        <div className="privacy-panel-notice">
          <div className="privacy-title-row">
            <span>🔒</span>
            <span>Verdira Privacy Promise</span>
          </div>
          <p className="privacy-description-text">
            Your environmental data belongs strictly to you. All daily action snapshots and habits are saved locally in your browser's local storage (offline-first). Analytical insight requests and benchmarking comparisons sent to our server are fully anonymized. We do not store, distribute, or track any personally identifiable information (PII).
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
