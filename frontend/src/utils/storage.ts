import { calculateDailyFootprint } from './calculations';
import type { DailyLog } from './calculations';

// 14 Days of Seed Data showing a realistic positive journey
export const SEED_DATA: DailyLog[] = [
  {
    date: getPastDateString(14),
    transportType: 'gas_vehicle',
    transportDistance: 32,
    mealType: 'high_meat',
    foodWaste: true,
    solarEnergy: false,
    energyEcoMode: false,
    consumption: 'luxury',
    wasteRecycled: false,
    wasteComposted: false
  },
  {
    date: getPastDateString(13),
    transportType: 'gas_vehicle',
    transportDistance: 25,
    mealType: 'high_meat',
    foodWaste: false,
    solarEnergy: false,
    energyEcoMode: true,
    consumption: 'essential',
    wasteRecycled: true,
    wasteComposted: false
  },
  {
    date: getPastDateString(12),
    transportType: 'public_transit',
    transportDistance: 20,
    mealType: 'low_meat',
    foodWaste: false,
    solarEnergy: false,
    energyEcoMode: true,
    consumption: 'second_hand',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(11),
    transportType: 'electric_vehicle',
    transportDistance: 15,
    mealType: 'vegetarian',
    foodWaste: false,
    solarEnergy: false,
    energyEcoMode: true,
    consumption: 'none',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(10),
    transportType: 'walk_bike',
    transportDistance: 4,
    mealType: 'vegan',
    foodWaste: false,
    solarEnergy: true,
    energyEcoMode: true,
    consumption: 'none',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(9),
    transportType: 'gas_vehicle',
    transportDistance: 12,
    mealType: 'low_meat',
    foodWaste: true,
    solarEnergy: false,
    energyEcoMode: false,
    consumption: 'essential',
    wasteRecycled: true,
    wasteComposted: false
  },
  {
    date: getPastDateString(8),
    transportType: 'public_transit',
    transportDistance: 18,
    mealType: 'vegetarian',
    foodWaste: false,
    solarEnergy: false,
    energyEcoMode: true,
    consumption: 'none',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(7),
    transportType: 'walk_bike',
    transportDistance: 6,
    mealType: 'vegan',
    foodWaste: false,
    solarEnergy: true,
    energyEcoMode: true,
    consumption: 'second_hand',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(6),
    transportType: 'none',
    transportDistance: 0,
    mealType: 'vegetarian',
    foodWaste: false,
    solarEnergy: true,
    energyEcoMode: true,
    consumption: 'none',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(5),
    transportType: 'electric_vehicle',
    transportDistance: 10,
    mealType: 'vegan',
    foodWaste: false,
    solarEnergy: true,
    energyEcoMode: true,
    consumption: 'essential',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(4),
    transportType: 'public_transit',
    transportDistance: 15,
    mealType: 'low_meat',
    foodWaste: false,
    solarEnergy: false,
    energyEcoMode: true,
    consumption: 'none',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(3),
    transportType: 'walk_bike',
    transportDistance: 8,
    mealType: 'vegan',
    foodWaste: false,
    solarEnergy: true,
    energyEcoMode: true,
    consumption: 'none',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(2),
    transportType: 'none',
    transportDistance: 0,
    mealType: 'vegan',
    foodWaste: false,
    solarEnergy: true,
    energyEcoMode: true,
    consumption: 'none',
    wasteRecycled: true,
    wasteComposted: true
  },
  {
    date: getPastDateString(1),
    transportType: 'walk_bike',
    transportDistance: 5,
    mealType: 'vegetarian',
    foodWaste: false,
    solarEnergy: true,
    energyEcoMode: true,
    consumption: 'second_hand',
    wasteRecycled: true,
    wasteComposted: true
  }
];

function getPastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const STORAGE_KEY = 'verdira_daily_logs';

export function getLogs(): DailyLog[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      // Sort logs by date ascending
      return parsed.sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (e) {
    console.error('Error parsing storage logs:', e);
  }
  return [];
}

export function saveLogs(logs: DailyLog[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function saveDailyLog(log: DailyLog): DailyLog[] {
  const logs = getLogs();
  const index = logs.findIndex(l => l.date === log.date);

  if (index >= 0) {
    logs[index] = log; // Update existing
  } else {
    logs.push(log); // Add new
  }

  saveLogs(logs);
  return logs;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  ecoDaysCount: number;
}

export function calculateStreaks(logs: DailyLog[]): StreakInfo {
  if (logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, ecoDaysCount: 0 };
  }

  // Sort logs descending to calculate current streak
  
  // Calculate Eco Days (days where footprint is < 15 kg CO2)
  const ecoDays = logs.filter(log => calculateDailyFootprint(log).total < 15.0);
  const ecoDaysCount = ecoDays.length;

  // Let's count consecutive days logged.
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // We need to check dates.
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = getPastDateString(1);

  // Check if today or yesterday was logged to start the current streak
  const hasLoggedToday = logs.some(l => l.date === todayStr);
  const hasLoggedYesterday = logs.some(l => l.date === yesterdayStr);

  if (hasLoggedToday || hasLoggedYesterday) {
    let checkDate = hasLoggedToday ? new Date() : new Date();
    if (!hasLoggedToday) checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      const found = logs.some(l => l.date === checkStr);
      if (found) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest log streak in history
  // Sort ascending
  const ascLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let prevTime: number | null = null;

  ascLogs.forEach(log => {
    const currTime = new Date(log.date).getTime();
    if (prevTime === null) {
      tempStreak = 1;
    } else {
      const diffDays = (currTime - prevTime) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1.1) { // roughly 1 day apart, allowing minor timezone shifts
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevTime = currTime;
  });
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    ecoDaysCount
  };
}

export function getBadges(logs: DailyLog[]): Badge[] {
  const { longestStreak, ecoDaysCount } = calculateStreaks(logs);

  const totalLogs = logs.length;
  
  // Count specific habits
  let greenTransitDays = 0;
  let plantPoweredDays = 0;
  let zeroWasteDays = 0;
  let solarDays = 0;

  logs.forEach(log => {
    if (log.transportType === 'walk_bike' || log.transportType === 'public_transit') {
      greenTransitDays++;
    }
    if (log.mealType === 'vegan' || log.mealType === 'vegetarian') {
      plantPoweredDays++;
    }
    if (!log.foodWaste && log.wasteRecycled && log.wasteComposted) {
      zeroWasteDays++;
    }
    if (log.solarEnergy) {
      solarDays++;
    }
  });

  const badgeDefinitions = [
    {
      id: 'first_step',
      title: 'First Step',
      description: 'Logged your first daily carbon snapshot.',
      icon: '🌱',
      unlocked: totalLogs >= 1
    },
    {
      id: 'consistent_green',
      title: 'Green Routine',
      description: 'Achieve a logging streak of 3 consecutive days.',
      icon: '📅',
      unlocked: longestStreak >= 3
    },
    {
      id: 'eco_warrior',
      title: 'Eco Warrior',
      description: 'Record 7 total days with low-carbon footprints (< 15 kg).',
      icon: '🛡️',
      unlocked: ecoDaysCount >= 7
    },
    {
      id: 'active_commuter',
      title: 'Wind in your Hair',
      description: 'Choose walking, biking, or transit 5 times.',
      icon: '🚲',
      unlocked: greenTransitDays >= 5
    },
    {
      id: 'plant_power',
      title: 'Plant Powered',
      description: 'Eat 5 vegetarian or vegan daily meals.',
      icon: '🥗',
      unlocked: plantPoweredDays >= 5
    },
    {
      id: 'zero_waste_hero',
      title: 'Circular Champion',
      description: 'Achieve 3 days of zero food waste, recycling, and composting.',
      icon: '♻️',
      unlocked: zeroWasteDays >= 3
    },
    {
      id: 'solar_glow',
      title: 'Solar Glow',
      description: 'Use renewable solar energy for 3 days.',
      icon: '☀️',
      unlocked: solarDays >= 3
    }
  ];

  return badgeDefinitions;
}
