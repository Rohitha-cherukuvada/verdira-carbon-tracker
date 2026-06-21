const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Mitigate large payload DOS attacks

// Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 AI calls per 10 minutes
  message: { error: 'AI Insights generation rate limit reached. Please wait a few minutes.' }
});

// Middleware for input validation and sanitization for logs
function validateLogs(req, res, next) {
  const { logs } = req.body;

  if (!logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: 'Invalid payload: logs must be an array.' });
  }

  // Cap history length to prevent abuse / heavy AI contexts
  if (logs.length > 60) {
    return res.status(400).json({ error: 'Payload too large: maximum 60 days of logs allowed for analysis.' });
  }

  // Strict schema validation of log entries
  const validTransportTypes = ['walk_bike', 'public_transit', 'electric_vehicle', 'gas_vehicle', 'none'];
  const validMealTypes = ['vegan', 'vegetarian', 'low_meat', 'high_meat'];
  const validConsumptionTypes = ['none', 'second_hand', 'essential', 'luxury'];

  for (const log of logs) {
    if (typeof log !== 'object' || log === null) {
      return res.status(400).json({ error: 'Invalid log item.' });
    }

    // Check date (simple YYYY-MM-DD match)
    if (typeof log.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
      return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
    }

    // Check transport
    if (!validTransportTypes.includes(log.transportType)) {
      return res.status(400).json({ error: 'Invalid transportType.' });
    }
    if (typeof log.transportDistance !== 'number' || log.transportDistance < 0 || log.transportDistance > 500) {
      return res.status(400).json({ error: 'Invalid transportDistance.' });
    }

    // Check food
    if (!validMealTypes.includes(log.mealType)) {
      return res.status(400).json({ error: 'Invalid mealType.' });
    }
    if (typeof log.foodWaste !== 'boolean') {
      return res.status(400).json({ error: 'Invalid foodWaste.' });
    }

    // Check energy
    if (typeof log.solarEnergy !== 'boolean') {
      return res.status(400).json({ error: 'Invalid solarEnergy.' });
    }
    if (typeof log.energyEcoMode !== 'boolean') {
      return res.status(400).json({ error: 'Invalid energyEcoMode.' });
    }

    // Check consumption
    if (!validConsumptionTypes.includes(log.consumption)) {
      return res.status(400).json({ error: 'Invalid consumption.' });
    }

    // Check waste
    if (typeof log.wasteRecycled !== 'boolean' || typeof log.wasteComposted !== 'boolean') {
      return res.status(400).json({ error: 'Invalid waste recycling/composting values.' });
    }
  }

  next();
}

// ---------------- API ENDPOINTS ----------------

// POST /api/insights: Generate personalized coaching tips using Gemini API
app.post('/api/insights', aiLimiter, validateLogs, async (req, res) => {
  const { logs } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('GEMINI_API_KEY not found. Serving mock insights.');
    return res.json(generateMockInsights(logs));
  }

  try {
    // Generate context summary to feed into Gemini (keeps prompt length and cost low)
    const summary = compileLogSummary(logs);

    const prompt = `You are the encouraging, non-preachy carbon footprint coaching assistant for the web app "Verdira".
Verdira tracks carbon footprints. The user's avatar is an "Earth Twin" (a stylized tree).
Based on the following summary of the user's habits over their logged history, generate exactly 3 highly personalized, specific, short coaching tips.

Guidelines:
1. Keep each tip under 120 characters.
2. Be encouraging, positive, and suggest small daily improvements. DO NOT guilt-trip.
3. Output MUST be valid JSON matching this schema:
{
  "tips": [
    { "category": "transport" | "food" | "energy" | "waste" | "consumption", "tip": "Tip text...", "impact": "High" | "Medium" | "Low" }
  ]
}
4. Return ONLY the JSON object. Do not include markdown code block syntax (like \`\`\`json).

User Habit Summary:
- Total logged days: ${summary.totalDays}
- Average daily footprint: ${summary.avgFootprint.toFixed(1)} kg CO2 (Target is < 8 kg CO2/day)
- Primary carbon contributors: ${summary.topContributors.join(', ')}
- Transport patterns: Commutes mostly via ${summary.commonTransport} with average distance ${summary.avgDistance.toFixed(1)} km.
- Diet patterns: Eats mostly ${summary.commonDiet} food, waste minimizer: ${summary.foodWasteMinimized ? 'Yes' : 'No'}.
- Household energy: Solar: ${summary.solarUsageRate.toFixed(0)}% of days, Eco heating/cooling: ${summary.ecoModeRate.toFixed(0)}% of days.
- Consumption level: Mostly '${summary.commonConsumption}' purchases.
- Recycling: Recycles on ${summary.recyclingRate.toFixed(0)}% of days, Composts on ${summary.compostingRate.toFixed(0)}% of days.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error details:', errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const insights = JSON.parse(resultText.trim());
    return res.json(insights);

  } catch (error) {
    console.error('Error generating AI insights:', error);
    // Graceful fallback to mock insights on API or parsing failures
    return res.json(generateMockInsights(logs));
  }
});

// POST /api/benchmark: Returns benchmark comparison
app.post('/api/benchmark', apiLimiter, (req, res) => {
  const { avgFootprint } = req.body;

  if (typeof avgFootprint !== 'number' || avgFootprint < 0) {
    return res.status(400).json({ error: 'Invalid avgFootprint value.' });
  }

  // Comparison metrics (kg CO2 per day)
  const US_DAILY_AVG = 43.8;      // ~16 tonnes/year
  const EU_DAILY_AVG = 21.9;      // ~8 tonnes/year
  const GLOBAL_DAILY_AVG = 13.7;  // ~5 tonnes/year
  const ECO_TARGET = 5.5;         // ~2 tonnes/year (sustainable limit)

  let comparisonText = '';
  let status = 'neutral';

  if (avgFootprint <= ECO_TARGET) {
    comparisonText = "Incredible! Your average footprint meets the sustainable global target to keep warming below 1.5°C.";
    status = 'excellent';
  } else if (avgFootprint <= GLOBAL_DAILY_AVG) {
    comparisonText = "Great job! You are below the global average and moving closer to the sustainable target.";
    status = 'good';
  } else if (avgFootprint <= EU_DAILY_AVG) {
    comparisonText = "Your carbon footprint is lower than the typical European household, but there is still room to optimize.";
    status = 'moderate';
  } else if (avgFootprint <= US_DAILY_AVG) {
    comparisonText = "You are currently below the average North American household, but well above the global sustainability target.";
    status = 'high';
  } else {
    comparisonText = "Your habits place you above standard averages. Small shifts in transit or diet can make a huge dent.";
    status = 'critical';
  }

  // Calculate percentiles (simulated distribution)
  // Lower is better, so 90th percentile means you produce more than 90% of people (high footprint)
  let percentile = 95;
  if (avgFootprint < ECO_TARGET) percentile = Math.max(5, Math.round((avgFootprint / ECO_TARGET) * 15));
  else if (avgFootprint < GLOBAL_DAILY_AVG) percentile = 15 + Math.round(((avgFootprint - ECO_TARGET) / (GLOBAL_DAILY_AVG - ECO_TARGET)) * 25);
  else if (avgFootprint < EU_DAILY_AVG) percentile = 40 + Math.round(((avgFootprint - GLOBAL_DAILY_AVG) / (EU_DAILY_AVG - GLOBAL_DAILY_AVG)) * 25);
  else if (avgFootprint < US_DAILY_AVG) percentile = 65 + Math.round(((avgFootprint - EU_DAILY_AVG) / (US_DAILY_AVG - EU_DAILY_AVG)) * 20);
  else percentile = Math.min(99, 85 + Math.round(((avgFootprint - US_DAILY_AVG) / 50) * 14));

  res.json({
    avgFootprint,
    benchmarks: {
      ecoTarget: ECO_TARGET,
      globalAvg: GLOBAL_DAILY_AVG,
      euAvg: EU_DAILY_AVG,
      usAvg: US_DAILY_AVG
    },
    comparisonText,
    percentile,
    status
  });
});

// Helper: Compile log summary for prompt context
function compileLogSummary(logs) {
  const totalDays = logs.length;
  if (totalDays === 0) {
    return {
      totalDays: 0,
      avgFootprint: 0,
      topContributors: [],
      commonTransport: 'none',
      avgDistance: 0,
      commonDiet: 'vegan',
      foodWasteMinimized: true,
      solarUsageRate: 0,
      ecoModeRate: 0,
      commonConsumption: 'none',
      recyclingRate: 0,
      compostingRate: 0
    };
  }

  let totalFootprint = 0;
  const transportCounts = {};
  let totalDistance = 0;
  const dietCounts = {};
  let foodWasteCount = 0;
  let solarCount = 0;
  let ecoModeCount = 0;
  const consumptionCounts = {};
  let recyclingCount = 0;
  let compostingCount = 0;

  // Approximate category sums for finding top contributors
  let catTransport = 0;
  let catFood = 0;
  let catEnergy = 0;
  let catConsumption = 0;
  let catWaste = 0;

  logs.forEach(log => {
    // Basic approximate carbon calculation per entry (simplified version of client-side math)
    let tCo2 = 0;
    if (log.transportType === 'gas_vehicle') tCo2 += log.transportDistance * 0.20;
    else if (log.transportType === 'electric_vehicle') tCo2 += log.transportDistance * 0.07;
    else if (log.transportType === 'public_transit') tCo2 += log.transportDistance * 0.05;

    let fCo2 = 0;
    if (log.mealType === 'high_meat') fCo2 += 7.0;
    else if (log.mealType === 'low_meat') fCo2 += 4.0;
    else if (log.mealType === 'vegetarian') fCo2 += 2.5;
    else fCo2 += 1.5;
    if (log.foodWaste) fCo2 += 0.5;

    let eCo2 = log.solarEnergy ? 0.4 : (log.energyEcoMode ? 2.0 : 4.0);

    let cCo2 = 0;
    if (log.consumption === 'luxury') cCo2 += 8.0;
    else if (log.consumption === 'essential') cCo2 += 3.0;
    else if (log.consumption === 'second_hand') cCo2 += 0.8;

    let wCo2 = 1.0;
    if (log.wasteRecycled) wCo2 -= 0.4;
    if (log.wasteComposted) wCo2 -= 0.3;

    catTransport += tCo2;
    catFood += fCo2;
    catEnergy += eCo2;
    catConsumption += cCo2;
    catWaste += wCo2;

    const dailySum = tCo2 + fCo2 + eCo2 + cCo2 + wCo2;
    totalFootprint += dailySum;

    // Track modes/averages
    transportCounts[log.transportType] = (transportCounts[log.transportType] || 0) + 1;
    totalDistance += log.transportDistance;
    dietCounts[log.mealType] = (dietCounts[log.mealType] || 0) + 1;
    if (!log.foodWaste) foodWasteCount++;
    if (log.solarEnergy) solarCount++;
    if (log.energyEcoMode) ecoModeCount++;
    consumptionCounts[log.consumption] = (consumptionCounts[log.consumption] || 0) + 1;
    if (log.wasteRecycled) recyclingCount++;
    if (log.wasteComposted) compostingCount++;
  });

  const getMode = (counts) => Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, Object.keys(counts)[0]);

  // Rank contributors
  const categories = [
    { name: 'Transport', val: catTransport },
    { name: 'Food/Diet', val: catFood },
    { name: 'Home Energy', val: catEnergy },
    { name: 'Consumer Shopping', val: catConsumption },
    { name: 'Household Waste', val: catWaste }
  ];
  categories.sort((a, b) => b.val - a.val);

  return {
    totalDays,
    avgFootprint: totalFootprint / totalDays,
    topContributors: [categories[0].name, categories[1].name],
    commonTransport: getMode(transportCounts),
    avgDistance: totalDistance / totalDays,
    commonDiet: getMode(dietCounts),
    foodWasteMinimized: (foodWasteCount / totalDays) > 0.5,
    solarUsageRate: (solarCount / totalDays) * 100,
    ecoModeRate: (ecoModeCount / totalDays) * 100,
    commonConsumption: getMode(consumptionCounts),
    recyclingRate: (recyclingCount / totalDays) * 100,
    compostingRate: (compostingCount / totalDays) * 100
  };
}

// Fallback Mock Generator
function generateMockInsights(logs) {
  const summary = compileLogSummary(logs);
  const highest = summary.topContributors[0];

  const fallbackTipPools = {
    'Transport': [
      { category: 'transport', tip: 'Try grouping car errands together to reduce cold starts and trim weekly gas usage.', impact: 'Medium' },
      { category: 'transport', tip: 'Consider choosing public transit or biking for short commutes under 5 km.', impact: 'High' },
      { category: 'transport', tip: 'Driving EV? Keep tires inflated to optimal pressure to improve range and efficiency.', impact: 'Low' }
    ],
    'Food/Diet': [
      { category: 'food', tip: 'Swapping beef for poultry or beans just twice a week significantly cuts diet emissions.', impact: 'High' },
      { category: 'food', tip: 'Try a "Zero Food Waste" day by planning meals around leftovers and freezing extras.', impact: 'Medium' },
      { category: 'food', tip: 'Explore plant-based dairy alternatives like oat or almond milk in your coffee.', impact: 'Low' }
    ],
    'Home Energy': [
      { category: 'energy', tip: 'Lower your thermostat by 1-2°C in winter or raise it in summer to reduce climate load.', impact: 'High' },
      { category: 'energy', tip: 'Ensure electronics are on smart power strips to eliminate phantom power draws.', impact: 'Low' },
      { category: 'energy', tip: 'Shift laundry or high-power tasks to midday if you have local solar inputs.', impact: 'Medium' }
    ],
    'Consumer Shopping': [
      { category: 'consumption', tip: 'Practice the "30-day rule" before buying non-essential items to curb impulse carbon.', impact: 'Medium' },
      { category: 'consumption', tip: 'Opt for high-quality secondhand gear or clothing instead of buying brand new.', impact: 'High' },
      { category: 'consumption', tip: 'Choose items with minimal packaging or buy bulk sizes for pantry staples.', impact: 'Low' }
    ],
    'Household Waste': [
      { category: 'waste', tip: 'Separate clean recyclables carefully — contaminated items often end up in landfills.', impact: 'Medium' },
      { category: 'waste', tip: 'Set up a small backyard or countertop compost bin for fruit peels and coffee grounds.', impact: 'High' },
      { category: 'waste', tip: 'Swap single-use paper towels for reusable microfiber cloths around the kitchen.', impact: 'Low' }
    ]
  };

  // Combine tips
  const selectedTips = [];
  const primaryPool = fallbackTipPools[highest] || fallbackTipPools['Food/Diet'];
  selectedTips.push(primaryPool[0]);
  selectedTips.push(primaryPool[1]);

  // Grab a secondary tip from another category
  const secondaryCategory = summary.topContributors[1] || 'Home Energy';
  const secondaryPool = fallbackTipPools[secondaryCategory] || fallbackTipPools['Home Energy'];
  selectedTips.push(secondaryPool[Math.floor(Math.random() * secondaryPool.length)]);

  return { tips: selectedTips };
}

// ---------------- SERVING FRONTEND IN PRODUCTION ----------------

if (process.env.NODE_ENV === 'production' || true) {
  // We serve files static in both cases for ease of deployment, but allow local dev proxying
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
  
  app.get('*', (req, res, next) => {
    // If request is for an API path, pass through
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Verdira backend running on port ${PORT}`);
});
