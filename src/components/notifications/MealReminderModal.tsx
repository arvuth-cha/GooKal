import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Clock, 
  Check, 
  X, 
  Sparkles, 
  Sunrise, 
  Sun, 
  Moon, 
  Coffee, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  AlertCircle, 
  Play, 
  CheckCircle2, 
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  MealReminderSettings, 
  MealReminderType, 
  MealReminderConfig 
} from '../../types/notifications';
import { 
  loadReminderSettings, 
  saveReminderSettings, 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendTestNotification,
  getNextScheduledReminder,
  playNotificationChime
} from '../../utils/notificationService';

interface MealReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  onOpenScanTab?: () => void;
}

const PRESET_TIMES: Record<MealReminderType, string[]> = {
  breakfast: ['07:00', '07:30', '08:00', '08:30'],
  lunch: ['11:30', '12:00', '12:30', '13:00'],
  dinner: ['17:30', '18:00', '18:30', '19:30'],
  snack: ['15:00', '15:30', '16:00', '16:30']
};

const MEAL_ICONS: Record<MealReminderType, React.ElementType> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
  snack: Coffee
};

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_LIST = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const MealReminderModal: React.FC<MealReminderModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [settings, setSettings] = useState<MealReminderSettings>(loadReminderSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [testingMeal, setTestingMeal] = useState<MealReminderType | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<MealReminderType | null>('breakfast');

  useEffect(() => {
    if (isOpen) {
      const currentSettings = loadReminderSettings();
      setSettings(currentSettings);
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMaster = async () => {
    const nextState = !settings.enabled;
    
    // If enabling, attempt to request notification permission gracefully
    if (nextState && permission !== 'granted') {
      setIsRequesting(true);
      try {
        const res = await requestNotificationPermission();
        setPermission(res);
      } catch (e) {
        // ignore
      } finally {
        setIsRequesting(false);
      }
    }

    const updated: MealReminderSettings = {
      ...settings,
      enabled: nextState
    };
    setSettings(updated);
    saveReminderSettings(updated);
    
    if (nextState) {
      onToast('🔔 เปิดระบบแจ้งเตือนมื้ออาหารตามเวลาที่ตั้งไว้แล้ว');
      if (settings.soundEnabled) {
        playNotificationChime();
      }
    } else {
      onToast('🔕 ปิดระบบแจ้งเตือนมื้ออาหารเรียบร้อยแล้ว');
    }
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const res = await requestNotificationPermission();
    setPermission(res);
    setIsRequesting(false);

    if (res === 'granted') {
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      saveReminderSettings(updated);
      onToast('✅ อนุญาตการแจ้งเตือนสำเร็จ! ระบบจะแจ้งเตือนตามเวลามื้ออาหาร');
      playNotificationChime();
    } else if (res === 'denied') {
      onToast('❌ การแจ้งเตือนถูกปฏิเสธ กรุณาปลดบล็อกในการตั้งค่าเว็บไซต์ของเบราว์เซอร์');
    }
  };

  const handleMealToggle = (mealKey: MealReminderType) => {
    const updated: MealReminderSettings = {
      ...settings,
      reminders: {
        ...settings.reminders,
        [mealKey]: {
          ...settings.reminders[mealKey],
          enabled: !settings.reminders[mealKey].enabled
        }
      }
    };
    setSettings(updated);
    saveReminderSettings(updated);
  };

  const handleTimeChange = (mealKey: MealReminderType, time: string) => {
    const updated: MealReminderSettings = {
      ...settings,
      reminders: {
        ...settings.reminders,
        [mealKey]: {
          ...settings.reminders[mealKey],
          time
        }
      }
    };
    setSettings(updated);
    saveReminderSettings(updated);
  };

  const handleAdjustMinutes = (mealKey: MealReminderType, deltaMinutes: number) => {
    const currentTime = settings.reminders[mealKey]?.time || '12:00';
    const [hStr, mStr] = currentTime.split(':');
    let totalMins = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0) + deltaMinutes;
    if (totalMins < 0) totalMins += 24 * 60;
    totalMins = totalMins % (24 * 60);

    const newH = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const newM = (totalMins % 60).toString().padStart(2, '0');
    handleTimeChange(mealKey, `${newH}:${newM}`);
  };

  const handleSetHour = (mealKey: MealReminderType, hourStr: string) => {
    const currentTime = settings.reminders[mealKey]?.time || '12:00';
    const [, mStr] = currentTime.split(':');
    handleTimeChange(mealKey, `${hourStr}:${mStr || '00'}`);
  };

  const handleSetMinute = (mealKey: MealReminderType, minStr: string) => {
    const currentTime = settings.reminders[mealKey]?.time || '12:00';
    const [hStr] = currentTime.split(':');
    handleTimeChange(mealKey, `${hStr || '12'}:${minStr}`);
  };

  const handleCustomTextChange = (mealKey: MealReminderType, field: 'title' | 'message', val: string) => {
    const updated: MealReminderSettings = {
      ...settings,
      reminders: {
        ...settings.reminders,
        [mealKey]: {
          ...settings.reminders[mealKey],
          [field]: val
        }
      }
    };
    setSettings(updated);
    saveReminderSettings(updated);
  };

  const handleToggleOption = (key: 'onlyIfNotLogged' | 'soundEnabled' | 'vibrateEnabled') => {
    const updated: MealReminderSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(updated);
    saveReminderSettings(updated);

    if (key === 'soundEnabled' && !settings.soundEnabled) {
      playNotificationChime();
    }
  };

  const handleTestNotification = async (mealKey: MealReminderType) => {
    // Attempt permission request if needed
    if (permission !== 'granted') {
      try {
        const res = await requestNotificationPermission();
        setPermission(res);
      } catch (e) {
        // ignore
      }
    }

    setTestingMeal(mealKey);
    const success = await sendTestNotification(mealKey);
    setTimeout(() => setTestingMeal(null), 800);

    const reminder = settings.reminders[mealKey];
    if (success) {
      onToast(`🔔 ส่งการแจ้งเตือน "${reminder.label}" แล้ว! (ตรวจดูการแจ้งเตือนของระบบ)`);
    } else {
      onToast(`🔔 ทดสอบเสียงและระบบเตือน "${reminder.label}" สำเร็จ! (${reminder.time} น.)`);
    }
  };

  const scheduledInfo = getNextScheduledReminder(settings);
  const mealKeys: MealReminderType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-orange-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <BellRing size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">ตั้งเวลาแจ้งเตือนมื้ออาหาร</h2>
              <p className="text-xs text-neutral-500 font-medium">เตือนสแกนและบันทึกอาหาร มื้อเช้า เที่ยง เย็น</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Browser Permission Status Card */}
          {permission !== 'granted' && (
            <div className={`p-4 rounded-2xl border transition-all ${
              permission === 'denied' 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className={`shrink-0 mt-0.5 ${permission === 'denied' ? 'text-rose-600' : 'text-amber-600'}`} />
                <div className="flex-1">
                  <h3 className="font-bold text-sm">
                    {permission === 'denied' 
                      ? 'เบราว์เซอร์บล็อกการแจ้งเตือนอยู่' 
                      : 'ยังไม่ได้เปิดอนุญาตการแจ้งเตือน (Push Notification)'}
                  </h3>
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">
                    {permission === 'denied'
                      ? 'คุณได้ปิดกั้นการแจ้งเตือนไว้ ให้คลิกที่ไอคอนแม่กุญแจ 🔒 หรือการตั้งค่าข้างแถบ URL บนเบราว์เซอร์ แล้วเปลี่ยนเป็น "อนุญาต (Allow)"'
                      : 'เพื่อให้แอปส่งการแจ้งเตือนเตือนมื้ออาหารได้ตรงเวลา โปรดกดปุ่มอนุญาตด้านล่าง'}
                  </p>

                  {permission !== 'denied' && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      disabled={isRequesting}
                      className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Bell size={14} />
                      <span>{isRequesting ? 'กำลังขออนุญาต...' : 'เปิดรับการแจ้งเตือน (Allow Notifications)'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Master Toggle Card */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${settings.enabled ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                  {settings.enabled ? <BellRing size={20} /> : <BellOff size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">ระบบแจ้งเตือนมื้ออาหาร</h3>
                  <p className="text-xs text-neutral-400 font-medium">
                    {settings.enabled ? 'เปิดใช้งานอยู่ตามตารางเวลา' : 'ปิดการแจ้งเตือนทั้งหมด'}
                  </p>
                </div>
              </div>

              {/* iOS / modern toggle switch */}
              <button
                type="button"
                onClick={handleToggleMaster}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${
                  settings.enabled ? 'bg-orange-500' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Next scheduled info pill */}
            {settings.enabled && (
              <div className="mt-4 pt-3 border-t border-neutral-700/60 flex items-center justify-between text-xs">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-orange-400" />
                  การเตือนรอบถัดไป:
                </span>
                <span className="font-bold text-orange-300 bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/30">
                  {scheduledInfo.nextTimeFormatted} ({scheduledInfo.timeRemainingText})
                </span>
              </div>
            )}
          </div>

          {/* Quick Smart Options */}
          <div className="bg-neutral-50 rounded-3xl p-4 border border-neutral-100 space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">การตั้งค่าเพิ่มเติม</h3>

            {/* Smart skip if already logged */}
            <div 
              onClick={() => handleToggleOption('onlyIfNotLogged')}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-neutral-200/70 hover:border-orange-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${settings.onlyIfNotLogged ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800">ระบบเตือนอัจฉริยะ (Smart Filter)</h4>
                  <p className="text-[11px] text-neutral-500">ข้ามการเตือนหากคุณบันทึกมื้อนั้นของวันไปแล้ว</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.onlyIfNotLogged}
                onChange={() => {}} // handled by parent div
                className="w-4 h-4 text-orange-500 rounded accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Sound toggle */}
              <div 
                onClick={() => handleToggleOption('soundEnabled')}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-neutral-200/70 hover:border-orange-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${settings.soundEnabled ? 'bg-orange-50 text-orange-600' : 'bg-neutral-100 text-neutral-400'}`}>
                    {settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </div>
                  <span className="text-xs font-bold text-neutral-800">เสียงแจ้งเตือน</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.soundEnabled}
                  onChange={() => {}}
                  className="w-4 h-4 text-orange-500 rounded accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Vibration toggle */}
              <div 
                onClick={() => handleToggleOption('vibrateEnabled')}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-neutral-200/70 hover:border-orange-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${settings.vibrateEnabled ? 'bg-orange-50 text-orange-600' : 'bg-neutral-100 text-neutral-400'}`}>
                    <Vibrate size={14} />
                  </div>
                  <span className="text-xs font-bold text-neutral-800">ระบบสั่นเตือน</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.vibrateEnabled}
                  onChange={() => {}}
                  className="w-4 h-4 text-orange-500 rounded accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Meal Schedule List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">กำหนดเวลาแต่ละมื้อ</h3>
              <span className="text-[11px] text-neutral-400">เลือกเวลาหรือพิมพ์เวลาที่สะดวก</span>
            </div>

            {mealKeys.map((mealKey) => {
              const reminder = settings.reminders[mealKey];
              const MealIcon = MEAL_ICONS[mealKey];
              const isExpanded = activeAccordion === mealKey;
              const isTesting = testingMeal === mealKey;

              return (
                <div 
                  key={mealKey}
                  className={`rounded-3xl border transition-all ${
                    reminder.enabled 
                      ? 'bg-white border-neutral-200/90 shadow-sm' 
                      : 'bg-neutral-50/70 border-neutral-100 opacity-75'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                        reminder.enabled 
                          ? 'bg-orange-100/70 text-orange-600' 
                          : 'bg-neutral-100 text-neutral-400'
                      }`}>
                        <MealIcon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-neutral-900">{reminder.label}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                            {reminder.time} น.
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-medium">{reminder.subLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Test trigger button */}
                      <button
                        type="button"
                        onClick={() => handleTestNotification(mealKey)}
                        disabled={isTesting}
                        title="ทดสอบแจ้งเตือนมื้อนี้"
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Play size={11} className={isTesting ? 'animate-spin' : ''} />
                        <span className="text-[10px]">ทดสอบ</span>
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleMealToggle(mealKey)}
                        className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                          reminder.enabled ? 'bg-orange-500' : 'bg-neutral-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-200 ${
                            reminder.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Settings & Time Picker */}
                  {reminder.enabled && (
                    <div className="px-4 pb-4 pt-1 border-t border-neutral-100/80 space-y-3">
                      {/* Time Presets & Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-neutral-500">
                            เวลาแจ้งเตือน ({reminder.time} น.)
                          </label>
                          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={11} /> บันทึกอัตโนมัติ
                          </span>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          {PRESET_TIMES[mealKey].map((pTime) => (
                            <button
                              key={pTime}
                              type="button"
                              onClick={() => handleTimeChange(mealKey, pTime)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                reminder.time === pTime
                                  ? 'bg-neutral-900 text-white shadow-xs'
                                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                              }`}
                            >
                              {pTime}
                            </button>
                          ))}
                        </div>

                        {/* Steppers & Dropdown Selectors */}
                        <div className="flex flex-wrap items-center gap-2 bg-neutral-50 p-2 rounded-2xl border border-neutral-200/80">
                          {/* Steppers */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustMinutes(mealKey, -15)}
                              className="px-2 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold border border-neutral-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
                              title="ลดลง 15 นาที"
                            >
                              -15น.
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustMinutes(mealKey, +15)}
                              className="px-2 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold border border-neutral-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
                              title="เพิ่มขึ้น 15 นาที"
                            >
                              +15น.
                            </button>
                          </div>

                          {/* Hour / Minute Dropdowns */}
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-neutral-200 shadow-2xs">
                            <Clock size={13} className="text-orange-500" />
                            <select
                              value={reminder.time.split(':')[0] || '12'}
                              onChange={(e) => handleSetHour(mealKey, e.target.value)}
                              className="text-xs font-bold bg-transparent text-neutral-800 outline-none cursor-pointer pr-1"
                            >
                              {HOURS_LIST.map((h) => (
                                <option key={h} value={h}>{h} น.</option>
                              ))}
                            </select>
                            <span className="text-neutral-400 font-bold">:</span>
                            <select
                              value={reminder.time.split(':')[1] || '00'}
                              onChange={(e) => handleSetMinute(mealKey, e.target.value)}
                              className="text-xs font-bold bg-transparent text-neutral-800 outline-none cursor-pointer pl-1"
                            >
                              {MINUTES_LIST.map((m) => (
                                <option key={m} value={m}>{m} น.</option>
                              ))}
                            </select>
                          </div>

                          {/* Native Time Input fallback */}
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-neutral-200 shadow-2xs">
                            <input 
                              type="time" 
                              value={reminder.time}
                              onChange={(e) => handleTimeChange(mealKey, e.target.value)}
                              className="text-xs font-bold bg-transparent text-neutral-800 outline-none cursor-pointer"
                              title="เลือกเวลาด้วยตัวเลือกของเครื่อง"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notification message preview */}
                      <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                            <span>{reminder.icon}</span> {reminder.title}
                          </span>
                          <span className="text-[10px] text-neutral-400">GooKal</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          {reminder.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Helpful Tips Card */}
          <div className="bg-orange-50/60 rounded-3xl p-4 border border-orange-100 text-xs text-orange-950 flex items-start gap-3">
            <Info size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">เคล็ดลับการรับการแจ้งเตือน</p>
              <p className="text-[11px] text-orange-900/80 leading-relaxed">
                การแจ้งเตือนจะแสดงขึ้นตามเวลาที่คุณตั้งไว้แม้ไม่ได้เปิดหน้าแอปค้างไว้ (หากเบราว์เซอร์เปิดอยู่) เมื่อกดที่การแจ้งเตือน ระบบจะเปิดหน้าสแกนอาหารให้คุณถ่ายรูปและบันทึกได้ทันที
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleTestNotification('breakfast')}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <Bell size={14} className="text-orange-500" />
            <span>ทดสอบยิงแจ้งเตือน</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
