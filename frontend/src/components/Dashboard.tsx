import React, { useState } from 'react';
import { calculateDailyFootprint } from '../utils/calculations';
import type { DailyLog, CategoryBreakdown } from '../utils/calculations';

interface DashboardProps {
  logs: DailyLog[];
}

export const Dashboard: React.FC<DashboardProps> = ({ logs }) => {
  const [filterDays, setFilterDays] = useState<7 | 14>(7);

  // If no logs, return early
  if (logs.length === 0) {
    return (
      <div className="dashboard-card glass-panel empty-state-dashboard">
        <div className="card-header">
          <h3 className="card-title">Footprint Dashboard</h3>
        </div>
        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Average Carbon Output</span>
            <span className="metric-value">— <span className="unit">kg CO2</span></span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Sustainable Threshold</span>
            <span className="metric-value status-excellent">8.0 <span className="unit">kg CO2</span></span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Total for Period</span>
            <span className="metric-value">— <span className="unit">kg CO2</span></span>
          </div>
        </div>
        <div className="empty-chart-placeholder" style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '1rem', border: '1px dashed rgba(46, 51, 49, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} aria-hidden="true">📊</span>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Log your first day to bring your Earth Twin to life
          </p>
        </div>
      </div>
    );
  }

  // Get recent logs based on filter
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recentLogs = sortedLogs.slice(-filterDays);

  // Calculate stats
  const breakdownList: CategoryBreakdown[] = recentLogs.map(log => calculateDailyFootprint(log));
  
  // Averages
  const totalFootprintSum = breakdownList.reduce((sum, item) => sum + item.total, 0);
  const avgDaily = totalFootprintSum / recentLogs.length;

  const categoryTotals = breakdownList.reduce(
    (acc, item) => {
      acc.transport += item.transport;
      acc.food += item.food;
      acc.energy += item.energy;
      acc.consumption += item.consumption;
      acc.waste += item.waste;
      return acc;
    },
    { transport: 0, food: 0, energy: 0, consumption: 0, waste: 0 }
  );

  const grandTotal = 
    categoryTotals.transport + 
    categoryTotals.food + 
    categoryTotals.energy + 
    categoryTotals.consumption + 
    categoryTotals.waste;

  const getPercentage = (val: number) => {
    if (grandTotal === 0) return 0;
    return Math.round((val / grandTotal) * 100);
  };

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Find max footprint for scaling
  const maxVal = Math.max(...breakdownList.map(item => item.total), 10); // at least 10 for grid scaling
  const yMax = Math.ceil(maxVal / 5) * 5; // round up to nearest 5

  // X Coordinate calculation
  const getX = (index: number) => {
    if (recentLogs.length <= 1) return paddingLeft + graphWidth / 2;
    return paddingLeft + (index / (recentLogs.length - 1)) * graphWidth;
  };

  // Y Coordinate calculation
  const getY = (val: number) => {
    return paddingTop + graphHeight - (val / yMax) * graphHeight;
  };

  // Construct SVG Path points
  let linePathD = '';
  let areaPathD = '';
  
  if (recentLogs.length > 0) {
    breakdownList.forEach((item, idx) => {
      const x = getX(idx);
      const y = getY(item.total);
      
      if (idx === 0) {
        linePathD = `M ${x} ${y}`;
        areaPathD = `M ${x} ${paddingTop + graphHeight} L ${x} ${y}`;
      } else {
        // Linear line
        linePathD += ` L ${x} ${y}`;
        areaPathD += ` L ${x} ${y}`;
      }

      if (idx === breakdownList.length - 1) {
        areaPathD += ` L ${x} ${paddingTop + graphHeight} Z`;
      }
    });
  }

  // Format short date label
  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    // Return MM/DD
    return `${parts[1]}/${parts[2]}`;
  };

  // Grid Lines
  const gridLinesY = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="dashboard-card glass-panel">
      <div className="card-header">
        <h3 className="card-title">Footprint Dashboard</h3>
        
        <div className="filter-group">
          <button 
            type="button" 
            className={`filter-btn ${filterDays === 7 ? 'active' : ''}`}
            onClick={() => setFilterDays(7)}
            aria-pressed={filterDays === 7}
            aria-label="Filter trends to last 7 days"
          >
            7 Days
          </button>
          <button 
            type="button" 
            className={`filter-btn ${filterDays === 14 ? 'active' : ''}`}
            onClick={() => setFilterDays(14)}
            aria-pressed={filterDays === 14}
            aria-label="Filter trends to last 14 days"
          >
            14 Days
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Average Carbon Output</span>
          <span className="metric-value">{avgDaily.toFixed(1)} <span className="unit">kg CO2/day</span></span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Sustainable Threshold</span>
          <span className="metric-value status-excellent">8.0 <span className="unit">kg CO2/day</span></span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Total for Period</span>
          <span className="metric-value">{totalFootprintSum.toFixed(0)} <span className="unit">kg CO2</span></span>
        </div>
      </div>

      {/* SVG Historical Line Chart */}
      <div className="chart-wrapper">
        <h4 className="chart-subtitle">Daily Output Trend (kg CO2)</h4>
        
        <div className="svg-container">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="trend-svg" role="img" aria-label={`Carbon output trend line chart for the last ${filterDays} days.`}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {gridLinesY.map((ratio, i) => {
              const val = yMax * ratio;
              const y = getY(val);
              return (
                <g key={i}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={chartWidth - paddingRight} 
                    y2={y} 
                    stroke="#E5E7EB" 
                    strokeDasharray="4,4"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 4} 
                    fontSize="10" 
                    fill="#6B7280" 
                    textAnchor="end"
                  >
                    {val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            {recentLogs.length > 1 && (
              <path d={areaPathD} fill="url(#areaGradient)" />
            )}

            {/* Line Path */}
            {recentLogs.length > 1 && (
              <path 
                d={linePathD} 
                fill="none" 
                stroke="#0D9488" 
                strokeWidth="3.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points and Tooltips */}
            {breakdownList.map((item, idx) => {
              const x = getX(idx);
              const y = getY(item.total);
              return (
                <g 
                  key={idx} 
                  className="chart-point-group" 
                  tabIndex={0} 
                  role="button" 
                  aria-label={`Data point day ${idx + 1}: ${item.total.toFixed(1)} kg CO2 output`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                    }
                  }}
                >
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="4.5" 
                    fill="#FFFFFF" 
                    stroke="#0D9488" 
                    strokeWidth="2.5" 
                  />
                  {/* Tooltip trigger overlay */}
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill="transparent"
                    className="point-trigger"
                  />
                  {/* Simple SVG Tooltip */}
                  <g className="point-tooltip">
                    <rect 
                      x={x - 25} 
                      y={y - 30} 
                      width="50" 
                      height="20" 
                      rx="4" 
                      fill="#2E3331" 
                    />
                    <text 
                      x={x} 
                      y={y - 16} 
                      fill="#FFFFFF" 
                      fontSize="9" 
                      textAnchor="middle" 
                      fontWeight="bold"
                    >
                      {item.total.toFixed(1)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* X-axis Labels */}
            {recentLogs.map((log, idx) => {
              // Only draw every N labels on mobile-scale to prevent overlap
              const step = recentLogs.length > 10 ? 3 : recentLogs.length > 7 ? 2 : 1;
              if (idx % step !== 0 && idx !== recentLogs.length - 1) return null;
              
              const x = getX(idx);
              const y = paddingTop + graphHeight + 16;
              return (
                <text 
                  key={idx} 
                  x={x} 
                  y={y} 
                  fontSize="10" 
                  fill="#6B7280" 
                  textAnchor="middle"
                >
                  {formatDateLabel(log.date)}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Category Breakdown list */}
      <div className="category-breakdown-section">
        <h4 className="chart-subtitle">Contribution by Category</h4>

        <div className="category-progress-list">
          {[
            { name: 'Transportation', value: categoryTotals.transport, icon: '🚲', color: '#3B82F6' },
            { name: 'Meals & Diet', value: categoryTotals.food, icon: '🥗', color: '#10B981' },
            { name: 'Home Energy', value: categoryTotals.energy, icon: '⚡', color: '#F59E0B' },
            { name: 'Shopping Purchases', value: categoryTotals.consumption, icon: '🛍️', color: '#8B5CF6' },
            { name: 'Household Waste', value: categoryTotals.waste, icon: '♻️', color: '#06B6D4' }
          ].map(cat => {
            const pct = getPercentage(cat.value);
            return (
              <div key={cat.name} className="cat-progress-item">
                <div className="cat-progress-header">
                  <div className="cat-progress-name">
                    <span className="cat-progress-icon">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  <div className="cat-progress-stats">
                    <span className="cat-progress-kg">{cat.value.toFixed(1)} kg</span>
                    <span className="cat-progress-pct">{pct}%</span>
                  </div>
                </div>
                <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat.name} output percentage`}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
