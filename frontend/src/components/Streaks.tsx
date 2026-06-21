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
      <div className="streak-stats-row">
        <div className="streak-stat-box">
          <div className="streak-icon-wrap current">
            <span className="streak-stat-icon">🔥</span>
          </div>
          <span className="streak-stat-value">{currentStreak} days</span>
          <span className="streak-stat-label">Current Streak</span>
        </div>

        <div className="streak-stat-box">
          <div className="streak-icon-wrap peak">
            <span className="streak-stat-icon">🏆</span>
          </div>
          <span className="streak-stat-value">{longestStreak} days</span>
          <span className="streak-stat-label">Peak Streak</span>
        </div>

        <div className="streak-stat-box">
          <div className="streak-icon-wrap eco">
            <span className="streak-stat-icon">🌿</span>
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
            >
              <div className="badge-icon-circle">
                {b.icon}
              </div>
              <div className="badge-info-details">
                <span className="badge-name">{b.title}</span>
                <span className="badge-description">{b.description}</span>
              </div>
              <div className="badge-status-dot">
                {b.unlocked ? '✓' : '🔒'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
