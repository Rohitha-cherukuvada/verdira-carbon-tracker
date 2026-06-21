// Carbon Footprint Calculations (values in kg CO2)

export interface DailyLog {
  date: string; // YYYY-MM-DD
  transportType: 'walk_bike' | 'public_transit' | 'electric_vehicle' | 'gas_vehicle' | 'none';
  transportDistance: number; // in km
  mealType: 'vegan' | 'vegetarian' | 'low_meat' | 'high_meat';
  foodWaste: boolean;
  solarEnergy: boolean;
  energyEcoMode: boolean;
  consumption: 'none' | 'second_hand' | 'essential' | 'luxury';
  wasteRecycled: boolean;
  wasteComposted: boolean;
}

export interface CategoryBreakdown {
  transport: number;
  food: number;
  energy: number;
  consumption: number;
  waste: number;
  total: number;
}

// Emission Factors (approximate kg CO2 equivalent)
export const EMISSION_FACTORS = {
  transport: {
    walk_bike: 0,
    public_transit: 0.05, // per km
    electric_vehicle: 0.07, // per km (average grid mix charging)
    gas_vehicle: 0.20, // per km (average passenger car)
    none: 0
  },
  food: {
    vegan: 1.5, // daily baseline
    vegetarian: 2.5,
    low_meat: 4.0, // chicken/fish
    high_meat: 7.0 // beef/pork heavy
  },
  foodWastePenalty: 0.5, // penalty if food was wasted
  energy: {
    gridBase: 4.0, // daily household avg share
    gridEco: 2.0, // eco-conscious adjustments (thermostat, efficiency)
    solarBase: 0.4 // panel manufacturing amortized + backup grid draw
  },
  consumption: {
    none: 0,
    second_hand: 0.8, // low footprint (circular economy)
    essential: 3.0, // average daily essentials
    luxury: 8.0 // high manufacturing footprint
  },
  waste: {
    base: 1.0, // daily waste average
    recyclingCredit: -0.4,
    compostingCredit: -0.3
  }
};

export function calculateDailyFootprint(log: DailyLog): CategoryBreakdown {
  // 1. Transport
  const transportFactor = EMISSION_FACTORS.transport[log.transportType] || 0;
  const transport = transportFactor * log.transportDistance;

  // 2. Food
  let food = EMISSION_FACTORS.food[log.mealType] || 2.5;
  if (log.foodWaste) {
    food += EMISSION_FACTORS.foodWastePenalty;
  }

  // 3. Energy
  let energy = EMISSION_FACTORS.energy.gridBase;
  if (log.solarEnergy) {
    energy = EMISSION_FACTORS.energy.solarBase;
  } else if (log.energyEcoMode) {
    energy = EMISSION_FACTORS.energy.gridEco;
  }

  // 4. Consumption
  const consumption = EMISSION_FACTORS.consumption[log.consumption] || 0;

  // 5. Waste
  let waste = EMISSION_FACTORS.waste.base;
  if (log.wasteRecycled) waste += EMISSION_FACTORS.waste.recyclingCredit;
  if (log.wasteComposted) waste += EMISSION_FACTORS.waste.compostingCredit;
  waste = Math.max(0.1, waste); // Ensure waste doesn't drop below 0.1

  const total = transport + food + energy + consumption + waste;

  return {
    transport: parseFloat(transport.toFixed(2)),
    food: parseFloat(food.toFixed(2)),
    energy: parseFloat(energy.toFixed(2)),
    consumption: parseFloat(consumption.toFixed(2)),
    waste: parseFloat(waste.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

export function getHealthScore(avgFootprint: number): number {
  // Thresholds:
  // Excellent (Sustainable): < 8 kg CO2 / day -> score 85-100
  // Good: 8 - 15 kg CO2 / day -> score 70-85
  // Moderate: 15 - 25 kg CO2 / day -> score 40-70
  // Critical: > 25 kg CO2 / day -> score 0-40
  
  if (avgFootprint <= 5) return 100;
  if (avgFootprint <= 8) {
    // 5 to 8 -> 100 to 85
    return Math.round(100 - ((avgFootprint - 5) / 3) * 15);
  }
  if (avgFootprint <= 15) {
    // 8 to 15 -> 85 to 70
    return Math.round(85 - ((avgFootprint - 8) / 7) * 15);
  }
  if (avgFootprint <= 25) {
    // 15 to 25 -> 70 to 40
    return Math.round(70 - ((avgFootprint - 15) / 10) * 30);
  }
  // > 25 -> scale down to 10
  const score = Math.round(40 - ((avgFootprint - 25) / 25) * 30);
  return Math.max(10, score);
}

export function getTreeStage(score: number): 'sapling' | 'young' | 'mature' | 'blooming' {
  if (score < 40) return 'sapling';
  if (score < 65) return 'young';
  if (score < 85) return 'mature';
  return 'blooming';
}
