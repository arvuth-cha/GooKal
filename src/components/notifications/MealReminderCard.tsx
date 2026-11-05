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
  Play,
  ChevronDown,
  ChevronUp
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const MealReminderCard: React.FC<MealReminderCardProps> = ({
  onOpenSettings,
  onToast,
  isExpanded,
  onToggleExpand
}) => {
  const isCardExpanded = isExpanded !== undefined ? isExpanded : true;
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
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-neutral-100 space-y-3.5">
      {/* Header */}
      <div 
        onClick={onToggleExpand}
        className={`flex items-center justify-between gap-2.5 ${isCardExpanded ? 'border-b border-neutral-100 pb-2.5 sm:pb-3' : ''} ${onToggleExpand ? 'cursor-pointer select-none group' : ''}`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
            settings.enabled 
              ? 'bg-orange-50 text-orange-600' 
              : 'bg-neutral-100 text-neutral-400'
          }`}>
            {settings.enabled ? <BellRing size={18} className="text-orange-500" /> : <BellOff size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-neutral-900 text-sm sm:text-base group-hover:text-orange-600 transition-colors truncate">
                ระบบแจ้งเตือนมื้ออาหาร
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full shrink-0 ${
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
            <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
              เตือนสแกนและบันทึกอาหารเช้า เที่ยง เย็น
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-neutral-50 hover:bg-orange-50 text-neutral-500 hover:text-orange-600 border border-neutral-200 hover:border-orange-200 transition-colors"
            title="ตั้งค่าเวลาแจ้งเตือน"
          >
            <Settings2 size={15} />
          </button>

          {onToggleExpand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title={isCardExpanded ? 'ยุบหมวด' : 'ขยายหมวด'}
            >
              {isCardExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>
      </div>

      {isCardExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">

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
      )}
    </div>
  );
};
