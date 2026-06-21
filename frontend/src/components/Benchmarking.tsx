import React, { useState, useEffect } from 'react';
import { calculateDailyFootprint } from '../utils/calculations';
import type { DailyLog } from '../utils/calculations';

interface BenchmarkingProps {
  logs: DailyLog[];
}

interface BenchmarkData {
  avgFootprint: number;
  benchmarks: {
    ecoTarget: number;
    globalAvg: number;
    euAvg: number;
    usAvg: number;
  };
  comparisonText: string;
  percentile: number;
  status: string;
}

export const Benchmarking: React.FC<BenchmarkingProps> = ({ logs }) => {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate average footprint
  const calculateAverage = () => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, log) => acc + calculateDailyFootprint(log).total, 0);
    return sum / logs.length;
  };

  const avgFootprint = calculateAverage();

  const fetchBenchmark = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/benchmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avgFootprint })
      });

      if (!response.ok) {
        throw new Error('Benchmark server error.');
      }

      const resData = await response.json();
      setData(resData);
    } catch (err: any) {
      console.error(err);
      setError('Could not calculate benchmark comparison.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (logs.length > 0) {
      fetchBenchmark();
    }
  }, [logs.length, avgFootprint]);

  if (logs.length === 0) {
    return (
      <div className="benchmarking-card glass-panel empty-state">
        <h3>Comparative Context</h3>
        <p>Log snapshots to unlock benchmarking comparisons.</p>
      </div>
    );
  }

  return (
    <div className="benchmarking-card glass-panel">
      <div className="card-header">
        <div>
          <h3 className="card-title">Comparative Context</h3>
          <p className="card-subtitle-note">Opt-in anonymous benchmarking (no personal data shared)</p>
        </div>
      </div>

      {loading && !data ? (
        <div className="benchmark-loading">
          <div className="spinner"></div>
          <p>Comparing habits against global averages...</p>
        </div>
      ) : error ? (
        <div className="benchmark-error">
          <p>{error}</p>
          <button onClick={fetchBenchmark} className="retry-btn">Retry Benchmark</button>
        </div>
      ) : data ? (
        <div className="benchmark-content">
          
          {/* Comparison summary card */}
          <div className="comparison-card">
            <div className="comparison-metric">
              <span className="comp-pct">Lower than {100 - data.percentile}%</span>
              <span className="comp-sub">of tracked global households</span>
            </div>
            <p className="comparison-desc">
              {data.comparisonText}
            </p>
          </div>

          {/* Visual Benchmark Slider Line */}
          <div className="benchmark-slider-section">
            <h4 className="chart-subtitle">Where you stand (kg CO2 / day)</h4>
            
            <div className="slider-axis-container">
              
              {/* Markers row */}
              <div className="axis-ticks-row">
                <div className="tick eco-target" style={{ left: `${(data.benchmarks.ecoTarget / 50) * 100}%` }}>
                  <span className="tick-label">Eco Target</span>
                  <span className="tick-val">{data.benchmarks.ecoTarget}</span>
                </div>

                <div className="tick global-avg" style={{ left: `${(data.benchmarks.globalAvg / 50) * 100}%` }}>
                  <span className="tick-label">Global Avg</span>
                  <span className="tick-val">{data.benchmarks.globalAvg}</span>
                </div>

                <div className="tick eu-avg" style={{ left: `${(data.benchmarks.euAvg / 50) * 100}%` }}>
                  <span className="tick-label">EU Avg</span>
                  <span className="tick-val">{data.benchmarks.euAvg}</span>
                </div>

                <div className="tick us-avg" style={{ left: `${(data.benchmarks.usAvg / 50) * 100}%` }}>
                  <span className="tick-label">US Avg</span>
                  <span className="tick-val">{data.benchmarks.usAvg}</span>
                </div>
              </div>

              {/* Slider Track Line */}
              <div className="slider-track-line">
                {/* Eco Target Green Zone */}
                <div className="track-zone green-zone" style={{ width: `${(data.benchmarks.ecoTarget / 50) * 100}%` }} />
                {/* Yellow Zone */}
                <div className="track-zone yellow-zone" style={{ 
                  left: `${(data.benchmarks.ecoTarget / 50) * 100}%`,
                  width: `${((data.benchmarks.euAvg - data.benchmarks.ecoTarget) / 50) * 100}%` 
                }} />
                {/* Red Zone */}
                <div className="track-zone red-zone" style={{ 
                  left: `${(data.benchmarks.euAvg / 50) * 100}%`,
                  width: `${((50 - data.benchmarks.euAvg) / 50) * 100}%` 
                }} />

                {/* User indicator bubble */}
                <div 
                  className="user-track-indicator"
                  style={{ 
                    left: `${Math.min(96, Math.max(2, (data.avgFootprint / 50) * 100))}%` 
                  }}
                >
                  <div className="indicator-badge">You ({data.avgFootprint.toFixed(1)})</div>
                  <div className="indicator-pin" />
                </div>
              </div>

              <div className="axis-legend-ends">
                <span>0</span>
                <span>50+ kg CO2</span>
              </div>
            </div>
          </div>

          <div className="regional-breakdown-details">
            <h4 className="chart-subtitle">Quick Benchmarks Reference</h4>
            <div className="benchmark-list-rows">
              <div className="ref-row">
                <span className="ref-name">🌱 Climate Sustainable Target (1.5°C)</span>
                <span className="ref-val">5.5 kg CO2 / day</span>
              </div>
              <div className="ref-row">
                <span className="ref-name">🌎 Global Average Output</span>
                <span className="ref-val">13.7 kg CO2 / day</span>
              </div>
              <div className="ref-row">
                <span className="ref-name">🇪🇺 European Average Output</span>
                <span className="ref-val">21.9 kg CO2 / day</span>
              </div>
              <div className="ref-row">
                <span className="ref-name">🇺🇸 North American Average Output</span>
                <span className="ref-val">43.8 kg CO2 / day</span>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
};
