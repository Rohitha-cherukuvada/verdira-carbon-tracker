import React from 'react';
import type { DailyLog } from '../utils/calculations';
import { calculateStreaks, getBadges } from '../utils/storage';

interface StreaksProps {
  logs: DailyLog[];
}

export const Streaks: React.FC<StreaksProps> = ({ logs }) => {
  const { currentStreak, longestStreak, ecoDaysCount } = calculateStreaks(logs);
  const badges = getBadges(logs);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="streaks-card glass-panel">
      <div className="card-header">
        <h3 className="card-title">Habit Streaks & Badges</h3>
        <span className="badge-ratio">{unlockedCount} / {badges.length} Unlocked</span>
      </div>

      {/* Streak metrics display */}
      <div className="streak-stats-row" role="status" aria-live="polite">
        <div className="streak-stat-box" aria-label={`Current logging streak is ${currentStreak} days`}>
          <div className="streak-icon-wrap current">
            <span className="streak-stat-icon" aria-hidden="true">🔥</span>
          </div>
          <span className="streak-stat-value">{currentStreak} days</span>
          <span className="streak-stat-label">Current Streak</span>
        </div>

        <div className="streak-stat-box" aria-label={`Peak logging streak is ${longestStreak} days`}>
          <div className="streak-icon-wrap peak">
            <span className="streak-stat-icon" aria-hidden="true">🏆</span>
          </div>
          <span className="streak-stat-value">{longestStreak} days</span>
          <span className="streak-stat-label">Peak Streak</span>
        </div>

        <div className="streak-stat-box" aria-label={`Total low carbon days recorded is ${ecoDaysCount} days`}>
          <div className="streak-icon-wrap eco">
            <span className="streak-stat-icon" aria-hidden="true">🌿</span>
          </div>
          <span className="streak-stat-value">{ecoDaysCount} days</span>
          <span className="streak-stat-label">Low Carbon Days</span>
        </div>
      </div>

      {/* Badges list */}
      <div className="badges-section">
        <h4 className="badges-title">Milestone Achievements</h4>
        
        <div className="badges-grid">
          {badges.map(b => (
            <div 
              key={b.id} 
              className={`badge-item-container ${b.unlocked ? 'unlocked' : 'locked'}`}
              title={b.description}
              tabIndex={0}
              role="article"
              aria-label={`Badge: ${b.title}. Description: ${b.description} Status: ${b.unlocked ? 'Unlocked' : 'Locked'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                }
              }}
            >
              <div className="badge-icon-circle" aria-hidden="true">
                {b.icon}
              </div>
              <div className="badge-info-details">
                <span className="badge-name">{b.title}</span>
                <span className="badge-description">{b.description}</span>
              </div>
              <div className="badge-status-dot" aria-hidden="true">
                {b.unlocked ? '✓' : '🔒'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
