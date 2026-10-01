export type MealReminderType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealReminderConfig {
  id: MealReminderType;
  label: string;
  subLabel: string;
  defaultTime: string; // "08:00"
  time: string;        // "08:00"
  enabled: boolean;
  title: string;
  message: string;
  icon: string;
}

export interface MealReminderSettings {
  enabled: boolean;
  onlyIfNotLogged: boolean; // only remind if user hasn't logged this meal today
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  reminders: Record<MealReminderType, MealReminderConfig>;
  lastTriggeredDates: Record<string, string>; // e.g. { "breakfast-2026-08-20": "08:00" }
}

export interface ScheduledReminderInfo {
  nextMeal: MealReminderConfig | null;
  nextTimeFormatted: string;
  timeRemainingText: string;
  isToday: boolean;
}
