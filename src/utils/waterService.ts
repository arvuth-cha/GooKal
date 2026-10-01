import { WaterLog, WaterDailyGoal } from '../types/extendedFeatures';

export const WATER_STORAGE_KEY = 'kalguru_water_logs_v1';
export const WATER_GOAL_KEY = 'kalguru_water_goal_v1';

/**
 * Get standardized local date string in YYYY-MM-DD format
 * avoiding UTC timezone drift when crossing midnight.
 */
export const getLocalDateKey = (date: Date = new Date()): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format Thai date label for user display (e.g., "วันนี้, 21 ส.ค. 2569")
 */
export const formatDisplayDateThai = (date: Date): string => {
  const isToday = getLocalDateKey(date) === getLocalDateKey(new Date());
  const dateFormatted = date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  return isToday ? `วันนี้ (${dateFormatted})` : dateFormatted;
};

/**
 * Read all water logs from localStorage safely
 */
export const getWaterLogs = (): WaterLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WATER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse water logs:', e);
    return [];
  }
};

/**
 * Filter logs strictly for a specific date (YYYY-MM-DD)
 * Automatically returns an empty array (0 ml) when crossing to a new day.
 */
export const getWaterLogsForDate = (targetDateOrKey: Date | string): WaterLog[] => {
  const targetKey = typeof targetDateOrKey === 'string' 
    ? targetDateOrKey 
    : getLocalDateKey(targetDateOrKey);
    
  const allLogs = getWaterLogs();
  return allLogs.filter((log) => {
    if (!log) return false;
    if (log.dateStr === targetKey) return true;
    // Fallback if dateStr was previously stored as UTC or needs timestamp check
    if (log.timestamp) {
      const logDateKey = getLocalDateKey(new Date(log.timestamp));
      if (logDateKey === targetKey) return true;
    }
    return false;
  });
};

/**
 * Calculate total ml for a specific date
 */
export const getWaterTotalMlForDate = (targetDateOrKey: Date | string): number => {
  const logs = getWaterLogsForDate(targetDateOrKey);
  return logs.reduce((sum, log) => sum + (Number(log.amountMl) || 0), 0);
};

/**
 * Add a new water intake entry
 */
export const addWaterLog = (amountMl: number, targetDate: Date = new Date()): WaterLog => {
  const targetKey = getLocalDateKey(targetDate);
  const newLog: WaterLog = {
    id: `water-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    amountMl: Math.max(1, Math.round(amountMl)),
    timestamp: Date.now(),
    dateStr: targetKey
  };

  const currentLogs = getWaterLogs();
  const updatedLogs = [newLog, ...currentLogs];
  
  try {
    localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Failed to save water log:', e);
  }

  notifyWaterUpdated();
  return newLog;
};

/**
 * Delete a specific water log entry
 */
export const deleteWaterLog = (id: string): void => {
  const currentLogs = getWaterLogs();
  const updated = currentLogs.filter(l => l.id !== id);
  try {
    localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete water log:', e);
  }
  notifyWaterUpdated();
};

/**
 * Clear all water logs for a specific date (Reset to 0 ml)
 */
export const clearWaterLogsForDate = (targetDateOrKey: Date | string): void => {
  const targetKey = typeof targetDateOrKey === 'string' 
    ? targetDateOrKey 
    : getLocalDateKey(targetDateOrKey);
    
  const currentLogs = getWaterLogs();
  const updated = currentLogs.filter((log) => {
    if (log.dateStr === targetKey) return false;
    if (log.timestamp) {
      const logDateKey = getLocalDateKey(new Date(log.timestamp));
      if (logDateKey === targetKey) return false;
    }
    return true;
  });

  try {
    localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to clear water logs for date:', e);
  }
  notifyWaterUpdated();
};

/**
 * Get daily water target configuration
 */
export const getWaterGoal = (): WaterDailyGoal => {
  const defaultGoal: WaterDailyGoal = { targetMl: 2500, bottleSizeMl: 500 };
  if (typeof window === 'undefined') return defaultGoal;
  try {
    const raw = localStorage.getItem(WATER_GOAL_KEY);
    if (!raw) return defaultGoal;
    const parsed = JSON.parse(raw);
    return {
      targetMl: Math.max(500, Number(parsed.targetMl) || 2500),
      bottleSizeMl: Math.max(100, Number(parsed.bottleSizeMl) || 500)
    };
  } catch {
    return defaultGoal;
  }
};

/**
 * Save daily water target configuration
 */
export const saveWaterGoal = (goal: WaterDailyGoal): void => {
  try {
    localStorage.setItem(WATER_GOAL_KEY, JSON.stringify(goal));
  } catch (e) {
    console.error('Failed to save water goal:', e);
  }
  notifyWaterUpdated();
};

/**
 * Broadcast event across components when water is updated
 */
export const notifyWaterUpdated = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kalguru_water_updated'));
  }
};

/**
 * Subscribe to water updates and midnight day-rollover
 */
export const subscribeWaterUpdates = (onUpdate: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => onUpdate();
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === WATER_STORAGE_KEY || e.key === WATER_GOAL_KEY) {
      onUpdate();
    }
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      onUpdate();
    }
  };

  window.addEventListener('kalguru_water_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Periodic interval check (every 30 seconds) to detect midnight transitions
  const intervalId = window.setInterval(() => {
    onUpdate();
  }, 30000);

  return () => {
    window.removeEventListener('kalguru_water_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.clearInterval(intervalId);
  };
};
