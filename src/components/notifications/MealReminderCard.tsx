import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  BellOff, 
  Clock, 
  Settings2, 
  Sunrise, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle,
  Play
} from 'lucide-react';
import { 
  loadReminderSettings, 
  getNextScheduledReminder, 
  getNotificationPermission,
  sendTestNotification 
} from '../../utils/notificationService';
import { MealReminderSettings } from '../../types/notifications';

interface MealReminderCardProps {
  onOpenSettings: () => void;
  onToast: (msg: string) => void;
}

export const MealReminderCard: React.FC<MealReminderCardProps> = ({
  onOpenSettings,
  onToast
}) => {
  const [settings, setSettings] = useState<MealReminderSettings>(loadReminderSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setSettings(loadReminderSettings());
    setPermission(getNotificationPermission());

    const interval = setInterval(() => {
      setSettings(loadReminderSettings());
      setPermission(getNotificationPermission());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const scheduledInfo = getNextScheduledReminder(settings);

  const handleQuickTest = async () => {
    setIsTesting(true);
    const ok = await sendTestNotification('breakfast');
    setIsTesting(false);
    if (ok) {
      onToast('🔔 ส่งการแจ้งเตือนทดสอบมื้อเช้าแล้ว! (ระบบเบราว์เซอร์)');
    } else {
      onToast('🔔 ทดสอบเสียงสัญญาณแจ้งเตือนมื้ออาหารสำเร็จ!');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            settings.enabled 
              ? 'bg-orange-50 text-orange-600' 
              : 'bg-neutral-100 text-neutral-400'
          }`}>
            {settings.enabled ? <BellRing size={20} className="text-orange-500" /> : <BellOff size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-neutral-900 text-base">ระบบแจ้งเตือนมื้ออาหาร</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                settings.enabled && permission === 'granted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : settings.enabled
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-neutral-100 text-neutral-600'
              }`}>
                {settings.enabled && permission === 'granted' 
                  ? 'เปิดใช้งาน' 
                  : settings.enabled 
                  ? 'รออนุญาต' 
                  : 'ปิดอยู่'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              เตือนสแกนและบันทึกอาหารเช้า เที่ยง เย็น ผ่าน Notification API
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-neutral-50 hover:bg-orange-50 text-neutral-500 hover:text-orange-600 border border-neutral-200 hover:border-orange-200 transition-colors"
          title="ตั้งค่าเวลาแจ้งเตือน"
        >
          <Settings2 size={16} />
        </button>
      </div>

      {/* Next Scheduled Pill / Time info */}
      {settings.enabled ? (
        <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-orange-500 shrink-0" />
            <div>
              <span className="text-neutral-500 block text-[10px]">การแจ้งเตือนรอบถัดไป</span>
              <span className="font-bold text-neutral-900">{scheduledInfo.nextTimeFormatted}</span>
            </div>
          </div>
          <span className="font-bold text-orange-600 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-orange-200/60">
            {scheduledInfo.timeRemainingText}
          </span>
        </div>
      ) : (
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-3 flex items-center justify-between text-xs text-neutral-500">
          <span>การแจ้งเตือนถูกปิดอยู่</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs font-bold text-orange-600 hover:underline"
          >
            เปิดใช้งาน
          </button>
        </div>
      )}

      {/* Active Schedule Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-2.5 rounded-2xl border text-center transition-all ${
          settings.enabled && settings.reminders.breakfast.enabled
            ? 'bg-white border-neutral-200 text-neutral-800'
            : 'bg-neutral-50/50 border-neutral-100 text-neutral-400'
        }`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Sunrise size={13} className={settings.reminders.breakfast.enabled ? "text-amber-500" : ""} />
            <span className="text-[11px] font-bold">มื้อเช้า</span>
          </div>
          <span className="text-xs font-black text-neutral-900">
            {settings.reminders.breakfast.time}
          </span>
        </div>

        <div className={`p-2.5 rounded-2xl border text-center transition-all ${
          settings.enabled && settings.reminders.lunch.enabled
            ? 'bg-white border-neutral-200 text-neutral-800'
            : 'bg-neutral-50/50 border-neutral-100 text-neutral-400'
        }`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Sun size={13} className={settings.reminders.lunch.enabled ? "text-orange-500" : ""} />
            <span className="text-[11px] font-bold">มื้อเที่ยง</span>
          </div>
          <span className="text-xs font-black text-neutral-900">
            {settings.reminders.lunch.time}
          </span>
        </div>

        <div className={`p-2.5 rounded-2xl border text-center transition-all ${
          settings.enabled && settings.reminders.dinner.enabled
            ? 'bg-white border-neutral-200 text-neutral-800'
            : 'bg-neutral-50/50 border-neutral-100 text-neutral-400'
        }`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Moon size={13} className={settings.reminders.dinner.enabled ? "text-indigo-500" : ""} />
            <span className="text-[11px] font-bold">มื้อเย็น</span>
          </div>
          <span className="text-xs font-black text-neutral-900">
            {settings.reminders.dinner.time}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs bg-neutral-900 hover:bg-black text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
        >
          <Settings2 size={15} />
          <span>ตั้งเวลา & จัดการการแจ้งเตือน</span>
        </button>

        <button
          type="button"
          onClick={handleQuickTest}
          disabled={isTesting}
          className="py-3 px-3.5 rounded-2xl font-bold text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-all flex items-center justify-center gap-1 active:scale-98"
          title="ทดสอบส่งการแจ้งเตือน"
        >
          <Play size={13} className={isTesting ? 'animate-spin' : ''} />
          <span>ทดสอบ</span>
        </button>
      </div>
    </div>
  );
};
