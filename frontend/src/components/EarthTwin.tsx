import React, { useState } from 'react';
import { getHealthScore, getTreeStage } from '../utils/calculations';

interface EarthTwinProps {
  avgFootprint: number;
}

export const EarthTwin: React.FC<EarthTwinProps> = ({ avgFootprint }) => {
  const [rustle, setRustle] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const health = getHealthScore(avgFootprint);
  const stage = getTreeStage(health);

  // Quotes from the Earth Twin depending on health
  const healthyQuotes = [
    "I feel vibrant and full of oxygen! Thank you! 🌿",
    "My branches are reaching high today. Let's keep it up! ✨",
    "Breathe deep. We are doing great things for the planet! 🌎",
    "Your choice to walk or eat green makes my leaves grow! 🍃",
    "I love the solar power warmth! ☀️"
  ];

  const neutralQuotes = [
    "Steady and calm. Every small change counts! 🌱",
    "I'm growing steadily. Let's try to walk a bit more tomorrow!",
    "Doing okay, but I can feel a bit of carbon weight.",
    "A clean day keeps my leaves green. Let's make an eco-choice next!",
    "Let's protect our ecosystem together. 🌲"
  ];

  const stressedQuotes = [
    "Whew, it is getting a bit hazy out here... 🍂",
    "My leaves feel a little dry. Let's cut back on the gas vehicle?",
    "A bit of stress on my branches today. Let's try a plant-based meal!",
    "Carbon levels are rising. I believe in our power to reduce it!",
    "Help me grow greener! 🌳"
  ];

  const handleTreeClick = () => {
    if (rustle) return;
    setRustle(true);
    
    // Choose quote
    let pool = healthyQuotes;
    if (health < 40) pool = stressedQuotes;
    else if (health < 75) pool = neutralQuotes;
    
    const randomQuote = pool[Math.floor(Math.random() * pool.length)];
    setMessage(randomQuote);

    setTimeout(() => {
      setRustle(false);
    }, 1200);

    setTimeout(() => {
      setMessage(null);
    }, 4500);
  };

  // Color scheme based on health
  // Glow radial gradient colors
  let glowColor = 'rgba(16, 185, 129, 0.25)'; // Emerald
  let glowAccent = 'rgba(13, 148, 136, 0.4)'; // Teal
  let treeColor = '#10B981'; // Green leaves
  let leafAccent = '#0D9488'; // Teal leaves
  let trunkColor = '#5C4033'; // Warm wood brown
  let statusText = 'Vibrant & Blooming';
  let statusClass = 'status-excellent';

  if (health < 40) {
    // Critical / Stressed
    glowColor = 'rgba(239, 68, 68, 0.15)'; // Red
    glowAccent = 'rgba(75, 85, 99, 0.3)'; // Charcoal
    treeColor = '#9A3412'; // Rust brown leaves
    leafAccent = '#78350F'; // Dark amber
    trunkColor = '#374151'; // Dark grey trunk
    statusText = 'Stressed & Wilting';
    statusClass = 'status-critical';
  } else if (health < 65) {
    // Stressed / Moderate
    glowColor = 'rgba(245, 158, 11, 0.2)'; // Amber
    glowAccent = 'rgba(217, 119, 6, 0.3)';
    treeColor = '#D97706'; // Amber leaves
    leafAccent = '#B45309';
    trunkColor = '#4B5563'; // Greyish brown trunk
    statusText = 'Balanced but Strained';
    statusClass = 'status-moderate';
  } else if (health < 85) {
    // Good / Healthy
    glowColor = 'rgba(52, 211, 153, 0.22)'; // Green
    glowAccent = 'rgba(16, 185, 129, 0.35)';
    treeColor = '#34D399'; // Emerald-ish
    leafAccent = '#10B981';
    trunkColor = '#5C4033';
    statusText = 'Healthy & Growing';
    statusClass = 'status-good';
  }

  // Draw leaves based on growth stage and health
  const renderLeaves = () => {
    // Return SVG nodes representing leaves
    // Blooming stage gets full leaf clusters, sapling gets a few leaves
    if (stage === 'sapling') {
      return (
        <g className="leaf-group">
          {/* Sapling: very few leaves */}
          <circle cx="100" cy="115" r="8" fill={treeColor} />
          <circle cx="92" cy="110" r="6" fill={leafAccent} />
          <circle cx="108" cy="112" r="5" fill={treeColor} opacity="0.8" />
        </g>
      );
    }

    if (stage === 'young') {
      return (
        <g className="leaf-group">
          {/* Young: sparse canopy */}
          <circle cx="100" cy="100" r="14" fill={treeColor} />
          <circle cx="85" cy="95" r="11" fill={leafAccent} />
          <circle cx="115" cy="98" r="10" fill={treeColor} />
          <circle cx="95" cy="85" r="9" fill={leafAccent} opacity="0.9" />
          <circle cx="106" cy="88" r="10" fill={treeColor} opacity="0.9" />
        </g>
      );
    }

    if (stage === 'mature') {
      return (
        <g className="leaf-group">
          {/* Mature: decent canopy */}
          <circle cx="100" cy="90" r="22" fill={treeColor} opacity="0.95" />
          <circle cx="75" cy="92" r="17" fill={leafAccent} />
          <circle cx="125" cy="94" r="16" fill={leafAccent} />
          <circle cx="90" cy="70" r="18" fill={treeColor} />
          <circle cx="110" cy="72" r="16" fill={leafAccent} />
          <circle cx="68" cy="80" r="12" fill={treeColor} opacity="0.8" />
          <circle cx="132" cy="82" r="11" fill={treeColor} opacity="0.8" />
        </g>
      );
    }

    // Blooming (Best stage: beautiful full canopy)
    return (
      <g className="leaf-group">
        {/* Blooming: dense, healthy canopy + flowers/glows */}
        <circle cx="100" cy="85" r="28" fill={treeColor} opacity="0.95" />
        <circle cx="70" cy="90" r="22" fill={leafAccent} />
        <circle cx="130" cy="92" r="20" fill={leafAccent} />
        <circle cx="90" cy="60" r="24" fill={treeColor} />
        <circle cx="115" cy="62" r="22" fill={leafAccent} />
        <circle cx="60" cy="78" r="16" fill={treeColor} opacity="0.85" />
        <circle cx="140" cy="80" r="15" fill={treeColor} opacity="0.85" />
        
        {/* Blossom particles for healthy blooming state */}
        <circle cx="82" cy="72" r="4" fill="#F472B6" className="blossom-sparkle" />
        <circle cx="122" cy="78" r="3.5" fill="#F472B6" className="blossom-sparkle" />
        <circle cx="102" cy="55" r="4.5" fill="#38BDF8" className="blossom-sparkle" />
        <circle cx="64" cy="92" r="3" fill="#F472B6" className="blossom-sparkle" />
        <circle cx="136" cy="96" r="3" fill="#38BDF8" className="blossom-sparkle" />
      </g>
    );
  };

  // Draw trunk depending on health & growth
  const renderTrunk = () => {
    if (stage === 'sapling') {
      return (
        <path 
          d="M100,160 Q101,135 100,115" 
          stroke={trunkColor} 
          strokeWidth="5" 
          strokeLinecap="round" 
          fill="none" 
        />
      );
    }
    
    // Slouched trunk if unhealthy, upright and thick if healthy
    const trunkPath = health < 45 
      ? "M100,160 C98,140 92,122 96,98" // slouched/bent trunk
      : "M100,160 C101,135 99,112 100,88"; // upright strong trunk

    const strokeWidth = stage === 'young' ? '7' : '11';

    return (
      <g>
        {/* Base roots */}
        <path d="M88,160 Q100,157 112,160" stroke={trunkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* Main trunk */}
        <path 
          d={trunkPath} 
          stroke={trunkColor} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Small branches */}
        {stage !== 'young' && (
          <>
            <path d="M99,120 Q84,110 80,102" stroke={trunkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M100,115 Q118,108 122,98" stroke={trunkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        )}
      </g>
    );
  };

  return (
    <div className="earth-twin-card glass-panel">
      <div className="card-header">
        <h3 className="card-title">Earth Twin Avatar</h3>
        <span className={`status-badge ${statusClass}`}>{statusText}</span>
      </div>

      <div className="avatar-canvas-container">
        {/* Bubble Speech Message */}
        <div className={`speech-bubble ${message ? 'visible' : ''}`}>
          {message}
        </div>

        <svg 
          viewBox="0 0 200 200" 
          className={`earth-twin-svg ${rustle ? 'rustle-anim' : ''}`}
          onClick={handleTreeClick}
        >
          <defs>
            {/* Custom filters for glowing radial background */}
            <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={glowAccent} />
              <stop offset="60%" stopColor={glowColor} />
              <stop offset="100%" stopColor="rgba(247, 244, 235, 0)" />
            </radialGradient>
          </defs>

          {/* Glow backdrop */}
          <circle cx="100" cy="100" r="85" fill="url(#auraGlow)" />

          {/* Floating life particles */}
          {health >= 65 && (
            <g className="particles-layer">
              <circle cx="80" cy="80" r="1.5" fill="#fff" className="float-particle-1" />
              <circle cx="120" cy="60" r="1.2" fill="#fff" className="float-particle-2" />
              <circle cx="65" cy="110" r="1.5" fill="#fff" className="float-particle-3" />
              <circle cx="135" cy="100" r="1.8" fill="#fff" className="float-particle-4" />
              {health >= 85 && (
                <>
                  <circle cx="95" cy="40" r="1.6" fill="#A7F3D0" className="float-particle-5" />
                  <circle cx="105" cy="120" r="1.2" fill="#A7F3D0" className="float-particle-6" />
                </>
              )}
            </g>
          )}

          {/* Ground patch */}
          <ellipse cx="100" cy="160" rx="35" ry="5" fill="#E5E7EB" />
          <ellipse cx="100" cy="160" rx="22" ry="3" fill="#D1D5DB" />

          {/* Tree drawing */}
          {renderTrunk()}
          {renderLeaves()}
        </svg>

        {/* Small prompt below avatar */}
        <div className="avatar-hint">
          Click your Earth Twin to listen to its thoughts
        </div>
      </div>

      <div className="health-bar-container">
        <div className="health-bar-label">
          <span>Earth Twin Vitality</span>
          <span className="health-value">{health}%</span>
        </div>
        <div className="health-bar-track">
          <div 
            className="health-bar-fill" 
            style={{ 
              width: `${health}%`,
              backgroundColor: health < 40 ? '#EF4444' : health < 65 ? '#F59E0B' : health < 85 ? '#10B981' : '#0D9488'
            }}
          />
        </div>
      </div>
    </div>
  );
};
