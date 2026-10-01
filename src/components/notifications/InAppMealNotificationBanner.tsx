import React from 'react';
import { Bell, Sparkles, Camera, X, Clock, ChevronRight } from 'lucide-react';
import { MealReminderConfig } from '../../types/notifications';

interface InAppMealNotificationBannerProps {
  reminder: MealReminderConfig | null;
  onDismiss: () => void;
  onScanNow: (mealType?: string) => void;
}

export const InAppMealNotificationBanner: React.FC<InAppMealNotificationBannerProps> = ({
  reminder,
  onDismiss,
  onScanNow
}) => {
  if (!reminder) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top-4 duration-300">
      <div className="bg-neutral-900/95 backdrop-blur-md text-white rounded-3xl p-4 shadow-2xl border border-orange-500/30 flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 text-xl">
          {reminder.icon || '🍱'}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <Clock size={11} /> แจ้งเตือนมื้ออาหาร • {reminder.label}
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-neutral-400 hover:text-white p-1 -mr-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <h4 className="font-bold text-sm text-white truncate">{reminder.title}</h4>
          <p className="text-xs text-neutral-300 line-clamp-2 mt-0.5 leading-relaxed">
            {reminder.message}
          </p>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                onScanNow(reminder.id);
                onDismiss();
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Camera size={14} />
              <span>สแกน/บันทึกมื้อนี้ทันที</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              ไว้ทีหลัง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
