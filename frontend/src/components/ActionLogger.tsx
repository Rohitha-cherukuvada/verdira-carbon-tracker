import React, { useState, useEffect } from 'react';
import type { DailyLog } from '../utils/calculations';

interface ActionLoggerProps {
  onLogSaved: (log: DailyLog) => void;
  existingLogs: DailyLog[];
}

export const ActionLogger: React.FC<ActionLoggerProps> = ({ onLogSaved, existingLogs }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Form State
  const [transportType, setTransportType] = useState<DailyLog['transportType']>('walk_bike');
  const [transportDistance, setTransportDistance] = useState<number>(5);
  const [mealType, setMealType] = useState<DailyLog['mealType']>('vegetarian');
  const [foodWaste, setFoodWaste] = useState<boolean>(false);
  const [solarEnergy, setSolarEnergy] = useState<boolean>(false);
  const [energyEcoMode, setEnergyEcoMode] = useState<boolean>(true);
  const [consumption, setConsumption] = useState<DailyLog['consumption']>('none');
  const [wasteRecycled, setWasteRecycled] = useState<boolean>(true);
  const [wasteComposted, setWasteComposted] = useState<boolean>(false);

  const [notification, setNotification] = useState<string | null>(null);

  // Load existing log if user changes the date
  useEffect(() => {
    const existing = existingLogs.find(l => l.date === selectedDate);
    if (existing) {
      setTransportType(existing.transportType);
      setTransportDistance(existing.transportDistance);
      setMealType(existing.mealType);
      setFoodWaste(existing.foodWaste);
      setSolarEnergy(existing.solarEnergy);
      setEnergyEcoMode(existing.energyEcoMode);
      setConsumption(existing.consumption);
      setWasteRecycled(existing.wasteRecycled);
      setWasteComposted(existing.wasteComposted);
    } else {
      // Set defaults for a new day
      setTransportType('walk_bike');
      setTransportDistance(5);
      setMealType('vegetarian');
      setFoodWaste(false);
      setSolarEnergy(false);
      setEnergyEcoMode(true);
      setConsumption('none');
      setWasteRecycled(true);
      setWasteComposted(false);
    }
  }, [selectedDate, existingLogs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Input sanitization / validation
    const sanitizedDistance = Math.max(0, Math.min(500, Number(transportDistance) || 0));

    const dailyLog: DailyLog = {
      date: selectedDate,
      transportType,
      transportDistance: sanitizedDistance,
      mealType,
      foodWaste,
      solarEnergy,
      energyEcoMode,
      consumption,
      wasteRecycled,
      wasteComposted
    };

    onLogSaved(dailyLog);
    setNotification('Snapshot saved successfully! 🍃');
    
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div className="logger-card glass-panel">
      <div className="card-header">
        <h3 className="card-title">Daily Action Logger</h3>
        <input 
          type="date" 
          value={selectedDate} 
          max={todayStr}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker-input"
        />
      </div>

      <form onSubmit={handleSubmit} className="logger-form">
        {/* Category: Transit */}
        <div className="form-section">
          <div className="section-title-row">
            <span className="section-icon">🚲</span>
            <h4 className="section-title">Transportation</h4>
          </div>
          
          <div className="button-group-row">
            {[
              { id: 'walk_bike', label: 'Walk/Bike', icon: '🚶' },
              { id: 'public_transit', label: 'Transit', icon: '🚌' },
              { id: 'electric_vehicle', label: 'EV', icon: '⚡' },
              { id: 'gas_vehicle', label: 'Gas Car', icon: '🚗' },
              { id: 'none', label: 'None', icon: '🏠' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                className={`toggle-chip ${transportType === item.id ? 'active' : ''}`}
                onClick={() => setTransportType(item.id as DailyLog['transportType'])}
              >
                <span className="chip-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {transportType !== 'none' && (
            <div className="slider-container">
              <div className="slider-labels">
                <span>Distance Traveled:</span>
                <span className="slider-value">{transportDistance} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={transportDistance}
                onChange={(e) => setTransportDistance(Number(e.target.value))}
                className="custom-range-slider"
              />
              <div className="range-hints">
                <span>0 km</span>
                <span>50 km</span>
                <span>100+ km</span>
              </div>
            </div>
          )}
        </div>

        {/* Category: Food */}
        <div className="form-section">
          <div className="section-title-row">
            <span className="section-icon">🥗</span>
            <h4 className="section-title">Meals & Waste</h4>
          </div>

          <div className="button-group-row">
            {[
              { id: 'vegan', label: 'Vegan', desc: 'Plant-only' },
              { id: 'vegetarian', label: 'Veggie', desc: 'No meat' },
              { id: 'low_meat', label: 'Low Meat', desc: 'Poultry/Fish' },
              { id: 'high_meat', label: 'High Meat', desc: 'Beef/Pork' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                className={`toggle-chip ${mealType === item.id ? 'active' : ''}`}
                onClick={() => setMealType(item.id as DailyLog['mealType'])}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="toggle-switch-row">
            <label className="switch-label-group">
              <span className="switch-title">Did you waste any food?</span>
              <span className="switch-desc">Leftovers thrown in trash</span>
            </label>
            <button
              type="button"
              className={`boolean-toggle-btn ${foodWaste ? 'true-active' : ''}`}
              onClick={() => setFoodWaste(!foodWaste)}
            >
              {foodWaste ? 'Yes, Wasted' : 'No Waste'}
            </button>
          </div>
        </div>

        {/* Category: Home Energy */}
        <div className="form-section">
          <div className="section-title-row">
            <span className="section-icon">⚡</span>
            <h4 className="section-title">Home Energy</h4>
          </div>

          <div className="toggle-grid">
            <div className="toggle-switch-row">
              <label className="switch-label-group">
                <span className="switch-title">Renewable Energy</span>
                <span className="switch-desc">Solar panels or green grid tariff</span>
              </label>
              <button
                type="button"
                className={`boolean-toggle-btn ${solarEnergy ? 'green-active' : ''}`}
                onClick={() => setSolarEnergy(!solarEnergy)}
              >
                {solarEnergy ? 'Active' : 'Off'}
              </button>
            </div>

            <div className="toggle-switch-row">
              <label className="switch-label-group">
                <span className="switch-title">Eco Thermostat / Off lights</span>
                <span className="switch-desc">Eco climate settings active</span>
              </label>
              <button
                type="button"
                className={`boolean-toggle-btn ${energyEcoMode ? 'green-active' : ''}`}
                onClick={() => setEnergyEcoMode(!energyEcoMode)}
              >
                {energyEcoMode ? 'Active' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Category: Purchases */}
        <div className="form-section">
          <div className="section-title-row">
            <span className="section-icon">🛍️</span>
            <h4 className="section-title">Purchases & Shopping</h4>
          </div>

          <div className="button-group-row">
            {[
              { id: 'none', label: 'No Shopping', icon: '🚫' },
              { id: 'second_hand', label: 'Second-hand', icon: '♻️' },
              { id: 'essential', label: 'Essential', icon: '📦' },
              { id: 'luxury', label: 'Luxury / Tech', icon: '💎' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                className={`toggle-chip ${consumption === item.id ? 'active' : ''}`}
                onClick={() => setConsumption(item.id as DailyLog['consumption'])}
              >
                <span className="chip-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category: Waste & Recycling */}
        <div className="form-section">
          <div className="section-title-row">
            <span className="section-icon">♻️</span>
            <h4 className="section-title">Waste Recycling</h4>
          </div>

          <div className="toggle-grid">
            <button
              type="button"
              className={`checkbox-chip ${wasteRecycled ? 'checked' : ''}`}
              onClick={() => setWasteRecycled(!wasteRecycled)}
            >
              <span className="checkbox-icon">{wasteRecycled ? '✓' : '+'}</span>
              Recycled Plastic/Paper/Glass
            </button>

            <button
              type="button"
              className={`checkbox-chip ${wasteComposted ? 'checked' : ''}`}
              onClick={() => setWasteComposted(!wasteComposted)}
            >
              <span className="checkbox-icon">{wasteComposted ? '✓' : '+'}</span>
              Composted Organic waste
            </button>
          </div>
        </div>

        {/* Form Action */}
        <div className="form-actions-row">
          {notification && (
            <div className="success-banner">{notification}</div>
          )}
          <button type="submit" className="submit-log-btn">
            Save Snapshot
          </button>
        </div>
      </form>
    </div>
  );
};
