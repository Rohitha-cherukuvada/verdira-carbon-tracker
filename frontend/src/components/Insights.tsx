import React, { useState, useEffect } from 'react';
import type { DailyLog } from '../utils/calculations';

interface Tip {
  category: string;
  tip: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface InsightsProps {
  logs: DailyLog[];
}

export const Insights: React.FC<InsightsProps> = ({ logs }) => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error('Could not fetch coaching tips.');
      }

      const data = await response.json();
      if (data.tips && Array.isArray(data.tips)) {
        setTips(data.tips);
      } else {
        throw new Error('Invalid format returned by insights server.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to the insights engine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch insights once when logs are loaded or logs length changes
  useEffect(() => {
    if (logs.length > 0 && tips.length === 0) {
      fetchInsights();
    }
  }, [logs.length]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport': return '🚲';
      case 'food': return '🥗';
      case 'energy': return '⚡';
      case 'waste': return '♻️';
      case 'consumption': return '🛍️';
      default: return '🌱';
    }
  };

  const getImpactClass = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'impact-high';
      case 'medium': return 'impact-medium';
      default: return 'impact-low';
    }
  };

  return (
    <div className="insights-card glass-panel" role="region" aria-label="Personalized coaching insights">
      <div className="card-header">
        <div>
          <h3 className="card-title">Personalized Insights</h3>
          <p className="card-subtitle-note">Non-preachy coaching tips based on your logged patterns</p>
        </div>
        <button 
          onClick={fetchInsights} 
          disabled={loading || logs.length === 0}
          className="refresh-insights-btn"
          aria-label="Refresh carbon coaching tips"
        >
          {loading ? 'Analyzing...' : 'Refresh Tips'}
        </button>
      </div>

      <div aria-live="polite" role="status" className="insights-status-region">
        {logs.length === 0 ? (
        <div className="insights-empty" style={{ padding: '2rem 1rem', textAlign: 'center', opacity: 0.7, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }} aria-hidden="true">🔒</span>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Log an entry to get your first insight
          </p>
        </div>
      ) : loading ? (
        <div className="insights-loading">
          <div className="spinner"></div>
          <p>Analyzing footprint trends and generating suggestions...</p>
        </div>
      ) : error ? (
        <div className="insights-error">
          <p>{error}</p>
          <button onClick={fetchInsights} className="retry-btn">Retry Connection</button>
        </div>
      ) : (
        <div className="tips-list">
          {tips.map((t, idx) => (
            <div key={idx} className="tip-item-card">
              <div className="tip-meta">
                <span className="tip-category">
                  <span className="tip-icon" aria-hidden="true">{getCategoryIcon(t.category)}</span>
                  {t.category.toUpperCase()}
                </span>
                <span className={`impact-badge ${getImpactClass(t.impact)}`}>
                  {t.impact} Impact
                </span>
              </div>
              <p className="tip-text">"{t.tip}"</p>
            </div>
          ))}

          <div className="privacy-badge">
            <span className="lock-icon">🔒</span>
            <span>Your logs are aggregated locally. Analysis requests are anonymous.</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
