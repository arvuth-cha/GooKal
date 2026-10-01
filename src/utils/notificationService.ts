import { MealReminderSettings, MealReminderType, MealReminderConfig, ScheduledReminderInfo } from '../types/notifications';

const REMINDER_STORAGE_KEY = 'kalguru_meal_reminders_v1';

export const DEFAULT_REMINDER_SETTINGS: MealReminderSettings = {
  enabled: false,
  onlyIfNotLogged: true,
  soundEnabled: true,
  vibrateEnabled: true,
  reminders: {
    breakfast: {
      id: 'breakfast',
      label: 'มื้อเช้า',
      subLabel: 'เติมพลังเริ่มต้นวันใหม่',
      defaultTime: '08:00',
      time: '08:00',
      enabled: true,
      title: '☀️ ได้เวลาสแกนบันทึกมื้อเช้าแล้ว!',
      message: 'เริ่มต้นวันใหม่อย่างสดใส ถ่ายรูปหรือบันทึกมื้อเช้าเพื่อคุมแคลอรีและสารอาหารกันครับ 🥗',
      icon: '🌅'
    },
    lunch: {
      id: 'lunch',
      label: 'มื้อกลางวัน',
      subLabel: 'พลังงานสำหรับช่วงบ่าย',
      defaultTime: '12:30',
      time: '12:30',
      enabled: true,
      title: '🍲 พักเที่ยงแล้ว! บันทึกมื้อกลางวันกัน',
      message: 'มื้อเที่ยงทานอะไรดี? สแกนอาหารเพื่อเช็กปริมาณโปรตีน คาร์บ และไขมันกันเลย 🍜',
      icon: '🍱'
    },
    dinner: {
      id: 'dinner',
      label: 'มื้อเย็น',
      subLabel: 'สรุปยอดโภชนาการประจำวัน',
      defaultTime: '18:30',
      time: '18:30',
      enabled: true,
      title: '🌙 มื้อเย็นอย่าลืมคุมแคลอรี!',
      message: 'สแกนอาหารมื้อเย็นเพื่อดูว่าวันนี้ทานครบตามเป้าหมาย TDEE หรือยังครับ 🥑',
      icon: '🥗'
    },
    snack: {
      id: 'snack',
      label: 'ของว่างบ่าย (Snack)',
      subLabel: 'คุมแคลอรีของว่างไม่ให้เกิน',
      defaultTime: '15:30',
      time: '15:30',
      enabled: false,
      title: '🍵 ได้เวลาของว่างบ่าย!',
      message: 'จิบชา กาแฟ หรือทานผลไม้? บันทึกแคลอรีของว่างเพื่อวินัยที่ดี 🍎',
      icon: '🍎'
    }
  },
  lastTriggeredDates: {}
};

/**
 * Check if the browser supports Notification API
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // Notification might be blocked inside some sandboxed iframes without allow="notifications"
  try {
    return 'Notification' in window && typeof Notification.requestPermission === 'function';
  } catch (e) {
    return false;
  }
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch (e) {
    return 'default';
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission (may be iframe-restricted):', error);
    return 'denied';
  }
}

/**
 * Load reminder settings from localStorage
 */
export function loadReminderSettings(): MealReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_REMINDER_SETTINGS;
  try {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!stored) return DEFAULT_REMINDER_SETTINGS;
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_REMINDER_SETTINGS,
      ...parsed,
      reminders: {
        ...DEFAULT_REMINDER_SETTINGS.reminders,
        ...(parsed.reminders || {})
      },
      lastTriggeredDates: parsed.lastTriggeredDates || {}
    };
  } catch (err) {
    console.error('Failed to load reminder settings:', err);
    return DEFAULT_REMINDER_SETTINGS;
  }
}

/**
 * Save reminder settings to localStorage
 */
export function saveReminderSettings(settings: MealReminderSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save reminder settings:', err);
  }
}

/**
 * Synthesize a soft, pleasant notification chime using Web Audio API
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create a pleasant two-tone chime (E5 -> G5)
    const now = ctx.currentTime;
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonic tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    // AudioContext might be blocked until user gesture, ignore silently
  }
}

/**
 * Show a browser notification (supports ServiceWorker and desktop fallback, with audio)
 */
export async function showMealNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    vibrate?: number[];
    sound?: boolean;
  }
): Promise<boolean> {
  // Always play audio chime if sound is enabled
  if (options.sound) {
    playNotificationChime();
  }

  // Trigger vibration if supported on device
  if (options.vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(options.vibrate);
    } catch (e) {
      // ignore
    }
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultIcon = '/icon.svg';
  const notificationOptions: NotificationOptions & Record<string, any> = {
    body: options.body,
    icon: options.icon || defaultIcon,
    badge: defaultIcon,
    tag: options.tag || 'kalguru-meal-reminder',
    data: options.data || { url: '/#scan', action: 'scan' },
    renotify: true,
    requireInteraction: false,
    silent: false,
    ...((options.vibrate && 'vibrate' in navigator) ? { vibrate: options.vibrate } : {})
  };

  // 1. Prefer Service Worker registration if available
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          ...notificationOptions,
          // Add quick action button for Service Worker
          actions: [
            { action: 'scan', title: '📸 สแกนอาหารตอนนี้' },
            { action: 'dismiss', title: 'ปิด' }
          ]
        } as NotificationOptions);
        return true;
      }
    } catch (err) {
      console.warn('SW showNotification failed, trying standard Notification:', err);
    }
  }

  // 2. Fallback to standard Window Notification
  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      window.location.hash = 'scan';
      notification.close();
    };
    return true;
  } catch (err) {
    console.error('Failed to create browser notification:', err);
    return false;
  }
}

/**
 * Send an immediate test notification
 */
export async function sendTestNotification(mealType: MealReminderType = 'breakfast'): Promise<boolean> {
  const settings = loadReminderSettings();
  const reminder = settings.reminders[mealType] || settings.reminders.breakfast;
  
  const title = `🔔 [ทดสอบการแจ้งเตือน] ${reminder.label}`;
  const body = reminder.message;

  return await showMealNotification(title, {
    body,
    tag: `kalguru-test-${Date.now()}`,
    data: { url: '/#scan', action: 'scan', test: true },
    vibrate: settings.vibrateEnabled ? [200, 100, 200] : undefined,
    sound: settings.soundEnabled
  });
}

/**
 * Check if the user has already logged a specific meal today
 */
export function hasMealLoggedToday(history: Array<{ date: number | string; mealType: string }>, mealType: MealReminderType): boolean {
  if (!history || history.length === 0) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return history.some(item => {
    const d = new Date(item.date);
    const itemDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return itemDateStr === todayStr && item.mealType === mealType;
  });
}

/**
 * Calculate the next scheduled reminder time & human countdown
 */
export function getNextScheduledReminder(settings: MealReminderSettings): ScheduledReminderInfo {
  if (!settings.enabled) {
    return {
      nextMeal: null,
      nextTimeFormatted: 'ปิดการแจ้งเตือน',
      timeRemainingText: 'ไม่ได้เปิดใช้งาน',
      isToday: false
    };
  }

  const enabledReminders = (Object.values(settings.reminders) as MealReminderConfig[])
    .filter(r => r.enabled);

  if (enabledReminders.length === 0) {
    return {
      nextMeal: null,
      nextTimeFormatted: 'ไม่มีรายการที่เปิด',
      timeRemainingText: 'ไม่ได้เลือกมื้ออาหาร',
      isToday: false
    };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Parse meal times into minutes from midnight
  const parsed = enabledReminders.map(reminder => {
    const [h, m] = reminder.time.split(':').map(Number);
    const reminderMinutes = (h || 0) * 60 + (m || 0);
    return {
      reminder,
      minutes: reminderMinutes,
      diffToday: reminderMinutes - currentMinutes
    };
  });

  // Check if there is another reminder today
  const upcomingToday = parsed
    .filter(item => item.diffToday > 0)
    .sort((a, b) => a.diffToday - b.diffToday);

  if (upcomingToday.length > 0) {
    const next = upcomingToday[0];
    const diff = next.diffToday;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    
    let timeRemaining = '';
    if (hours > 0) {
      timeRemaining = `อีก ${hours} ชม. ${mins > 0 ? `${mins} นาที` : ''}`;
    } else {
      timeRemaining = `อีก ${mins} นาที`;
    }

    return {
      nextMeal: next.reminder,
      nextTimeFormatted: `วันนี้ ${next.reminder.time} น.`,
      timeRemainingText: timeRemaining,
      isToday: true
    };
  }

  // Otherwise, the next reminder is tomorrow's earliest enabled reminder
  const sortedAll = [...parsed].sort((a, b) => a.minutes - b.minutes);
  const earliestTomorrow = sortedAll[0];
  const diffTomorrow = (24 * 60 - currentMinutes) + earliestTomorrow.minutes;
  const hoursTomorrow = Math.floor(diffTomorrow / 60);
  const minsTomorrow = diffTomorrow % 60;

  return {
    nextMeal: earliestTomorrow.reminder,
    nextTimeFormatted: `พรุ่งนี้ ${earliestTomorrow.reminder.time} น.`,
    timeRemainingText: `อีก ${hoursTomorrow} ชม. ${minsTomorrow > 0 ? `${minsTomorrow} นาที` : ''}`,
    isToday: false
  };
}

/**
 * Check and trigger reminders if current time matches schedule
 * This should be called by an active timer (e.g. every 10-30s)
 */
export function checkAndTriggerScheduledReminders(
  history: Array<{ date: number | string; mealType: string }>,
  onTriggered?: (reminder: MealReminderConfig) => void
): boolean {
  const settings = loadReminderSettings();
  if (!settings.enabled) return false;

  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMin = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHour}:${currentMin}`;

  let triggeredAny = false;
  const updatedLastTriggered = { ...settings.lastTriggeredDates };

  for (const key of Object.keys(settings.reminders) as MealReminderType[]) {
    const reminder = settings.reminders[key];
    if (!reminder || !reminder.enabled) continue;

    // Check if the scheduled time matches the current minute
    if (reminder.time === currentTimeStr) {
      const triggerKey = `${key}-${todayDateStr}`;

      // Prevent duplicate notification in the same minute/day
      if (updatedLastTriggered[triggerKey]) {
        continue;
      }

      // Check smart condition: skip if already logged
      if (settings.onlyIfNotLogged && hasMealLoggedToday(history, key)) {
        console.log(`[GooKal] Skipping ${key} reminder: meal already logged today.`);
        updatedLastTriggered[triggerKey] = currentTimeStr;
        continue;
      }

      // Fire notification (plays chime, vibration, and native notification if granted)
      showMealNotification(reminder.title, {
        body: reminder.message,
        tag: `kalguru-meal-${key}-${todayDateStr}`,
        data: { url: '/#scan', action: 'scan', mealType: key },
        vibrate: settings.vibrateEnabled ? [200, 100, 200, 100, 200] : undefined,
        sound: settings.soundEnabled
      });

      updatedLastTriggered[triggerKey] = currentTimeStr;
      triggeredAny = true;

      if (onTriggered) {
        onTriggered(reminder);
      }
    }
  }

  if (triggeredAny) {
    // Clean up old entries from previous days (keep only last 14 days)
    const cleanedTriggeredDates: Record<string, string> = {};
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    for (const [k, v] of Object.entries(updatedLastTriggered)) {
      const parts = k.split('-');
      if (parts.length >= 4) {
        const itemDateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
        const itemDate = new Date(itemDateStr);
        if (itemDate >= cutoff) {
          cleanedTriggeredDates[k] = v;
        }
      } else {
        cleanedTriggeredDates[k] = v;
      }
    }

    saveReminderSettings({
      ...settings,
      lastTriggeredDates: cleanedTriggeredDates
    });
  }

  return triggeredAny;
}
