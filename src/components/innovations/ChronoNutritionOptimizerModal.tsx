import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sun, 
  Moon, 
  Clock, 
  Sunrise, 
  Sunset, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  Bell, 
  RotateCcw, 
  Plus, 
  Minus,
  Check
} from 'lucide-react';
import { loadReminderSettings, saveReminderSettings } from '../../utils/notificationService';

interface ChronoNutritionOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const CHRONO_STORAGE_KEY = 'kalguru_chrono_settings';

interface ChronoSettings {
  wakeTime: string;
  sleepTime: string;
  goal: 'fat_loss' | 'muscle_growth' | 'sleep_longevity';
  savedAt?: string;
}

const DEFAULT_CHRONO: ChronoSettings = {
  wakeTime: '06:30',
  sleepTime: '22:30',
  goal: 'fat_loss'
};

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_LIST = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const ChronoNutritionOptimizerModal: React.FC<ChronoNutritionOptimizerModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [wakeTime, setWakeTime] = useState<string>(DEFAULT_CHRONO.wakeTime);
  const [sleepTime, setSleepTime] = useState<string>(DEFAULT_CHRONO.sleepTime);
  const [goal, setGoal] = useState<'fat_loss' | 'muscle_growth' | 'sleep_longevity'>(DEFAULT_CHRONO.goal);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Load saved settings from localStorage on open
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(CHRONO_STORAGE_KEY);
        if (saved) {
          const parsed: ChronoSettings = JSON.parse(saved);
          if (parsed.wakeTime) setWakeTime(parsed.wakeTime);
          if (parsed.sleepTime) setSleepTime(parsed.sleepTime);
          if (parsed.goal) setGoal(parsed.goal);
          if (parsed.savedAt) setLastSavedTime(parsed.savedAt);
        }
      } catch (e) {
        console.error('Failed to load chrono settings:', e);
      }
      setIsSaved(false);
    }
  }, [isOpen]);

  // Compute Circadian Milestones
  const parseHours = (timeStr: string) => {
    if (!timeStr) return 6.5;
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) ? 6 : h) + ((isNaN(m) ? 30 : m) / 60);
  };

  const formatHours = (decHours: number) => {
    let normalized = decHours % 24;
    if (normalized < 0) normalized += 24;
    const h = Math.floor(normalized);
    const m = Math.round((normalized - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Helper to adjust time by minutes
  const adjustMinutes = (timeStr: string, deltaMinutes: number) => {
    const currentH = parseHours(timeStr);
    const newH = currentH + (deltaMinutes / 60);
    return formatHours(newH);
  };

  const getHourPart = (timeStr: string) => (timeStr.split(':')[0] || '06').padStart(2, '0');
  const getMinutePart = (timeStr: string) => (timeStr.split(':')[1] || '30').padStart(2, '0');

  const setHourPart = (timeStr: string, newH: string) => {
    const m = getMinutePart(timeStr);
    return `${newH}:${m}`;
  };

  const setMinutePart = (timeStr: string, newM: string) => {
    const h = getHourPart(timeStr);
    return `${h}:${newM}`;
  };

  const wakeH = parseHours(wakeTime);
  const sleepH = parseHours(sleepTime);

  // Calculate sleep duration
  const calcSleepDuration = () => {
    let diff = sleepH > wakeH ? (24 - sleepH + wakeH) : (wakeH - sleepH);
    if (diff <= 0) diff = 24 + diff;
    const h = Math.floor(diff);
    const m = Math.round((diff - h) * 60);
    return { hours: h, minutes: m, totalHours: diff };
  };

  const sleepDuration = calcSleepDuration();

  // Biological Chrono Windows
  const breakfastStart = formatHours(wakeH + 0.5);
  const breakfastEnd = formatHours(wakeH + 1.5);
  const cortisolPeakWindow = `${breakfastStart} - ${breakfastEnd}`;

  const lunchStart = formatHours(wakeH + 4.5);
  const lunchEnd = formatHours(wakeH + 6.5);
  const insulinSensitivityPeak = `${lunchStart} - ${lunchEnd}`;

  const optimalLastBiteTime = formatHours(sleepH - 3.5);
  const melatoninRiseTime = formatHours(sleepH - 2);

  // Current Live Window Checker
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  
  let currentWindowLabel = 'ช่วงพักผ่อน & งดอาหารข้ามคืน (Night Fasting)';
  let currentWindowColor = 'bg-indigo-50 border-indigo-200 text-indigo-800';
  let currentWindowIcon = Moon;

  if (nowH >= wakeH && nowH < wakeH + 2) {
    currentWindowLabel = 'มื้อเช้า / First Fuel Window (คอร์ติซอลลดลง)';
    currentWindowColor = 'bg-amber-50 border-amber-200 text-amber-800';
    currentWindowIcon = Sunrise;
  } else if (nowH >= wakeH + 2 && nowH < wakeH + 8) {
    currentWindowLabel = 'มื้อกลางวัน / Metabolic Peak (ไวต่ออินซูลินสูงสุด)';
    currentWindowColor = 'bg-sky-50 border-sky-200 text-sky-800';
    currentWindowIcon = Sun;
  } else if (nowH >= wakeH + 8 && nowH <= (sleepH < wakeH ? sleepH + 24 - 3.5 : sleepH - 3.5)) {
    currentWindowLabel = 'มื้อเย็นเบาๆ / Pre-Melatonin Window';
    currentWindowColor = 'bg-orange-50 border-orange-200 text-orange-800';
    currentWindowIcon = Sunset;
  }

  // Quick Preset Presets
  const applyPreset = (wake: string, sleep: string, name: string) => {
    setWakeTime(wake);
    setSleepTime(sleep);
    setIsSaved(false);
    
    // Auto-save preset to storage
    try {
      const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(CHRONO_STORAGE_KEY, JSON.stringify({
        wakeTime: wake,
        sleepTime: sleep,
        goal,
        savedAt: nowStr
      }));
      setLastSavedTime(nowStr);
    } catch {
      // ignore
    }

    onToast(`✓ เลือกพรีเซ็ต: ${name} (ตื่น ${wake} / นอน ${sleep})`);
  };

  // Save Settings Function
  const saveChronoSettings = (andSyncReminder = false) => {
    try {
      const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const chronoData: ChronoSettings = {
        wakeTime,
        sleepTime,
        goal,
        savedAt: nowStr
      };
      
      localStorage.setItem(CHRONO_STORAGE_KEY, JSON.stringify(chronoData));
      setLastSavedTime(nowStr);
      setIsSaved(true);

      if (andSyncReminder) {
        // Sync with Meal Reminders
        const currentReminderSettings = loadReminderSettings();
        const updatedReminders = {
          ...currentReminderSettings.reminders,
          breakfast: {
            ...currentReminderSettings.reminders.breakfast,
            time: formatHours(wakeH + 1)
          },
          lunch: {
            ...currentReminderSettings.reminders.lunch,
            time: formatHours(wakeH + 5.5)
          },
          dinner: {
            ...currentReminderSettings.reminders.dinner,
            time: formatHours(sleepH - 4)
          }
        };

        saveReminderSettings({
          ...currentReminderSettings,
          reminders: updatedReminders
        });

        onToast(`💾 บันทึกเวลาตื่น (${wakeTime} น.) และนอน (${sleepTime} น.) พร้อมตั้งเตือนมื้ออาหารสำเร็จแล้ว!`);
      } else {
        onToast(`💾 บันทึกเวลาตื่น (${wakeTime} น.) และนอน (${sleepTime} น.) เรียบร้อยแล้ว!`);
      }

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (e) {
      console.error('Failed to save chrono settings:', e);
      onToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-indigo-50 via-sky-50 to-amber-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                <Sun size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">โภชนาการตามนาฬิกาชีวภาพ (Chrono-Nutrition)</h2>
                <p className="text-xs text-neutral-500 font-medium">กินให้ตรงกับฮอร์โมน คอร์ติซอล อินซูลิน และเมลาโทนิน</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="ปิดหน้าต่าง"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Real-time Status Card */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${currentWindowColor}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/80 shadow-xs">
                  {React.createElement(currentWindowIcon, { size: 16 })}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    สถานะขณะนี้ ({now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.)
                  </span>
                  <span className="text-xs font-bold">{currentWindowLabel}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold opacity-85 block">เวลานอนรวม</span>
                <span className="text-xs font-bold">{sleepDuration.hours} ชม. {sleepDuration.minutes > 0 ? `${sleepDuration.minutes} น.` : ''}</span>
              </div>
            </div>

            {/* Time Setting Card with Multiple Easy Input Options */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Clock size={15} className="text-indigo-600" />
                  <span>ตั้งค่าเวลาตื่นและเวลานอนของคุณ</span>
                </span>
                {lastSavedTime && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} strokeWidth={3} />
                    <span>บันทึกล่าสุด: {lastSavedTime} น.</span>
                  </span>
                )}
              </div>

              {/* Grid with 2 distinct interactive time picker cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Wake Time Card */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sunrise size={16} className="text-amber-500" />
                      <span>เวลาตื่นนอน</span>
                    </label>
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      {wakeTime} น.
                    </span>
                  </div>

                  {/* Native Time Input */}
                  <div className="relative">
                    <input
                      type="time"
                      id="chrono-wake-time-input"
                      value={wakeTime}
                      onChange={(e) => {
                        if (e.target.value) {
                          setWakeTime(e.target.value);
                          setIsSaved(false);
                        }
                      }}
                      className="w-full px-3 py-2 bg-amber-50/40 rounded-xl border border-amber-200 font-bold text-base text-neutral-900 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
                    />
                  </div>

                  {/* Direct Hour & Minute Selectors */}
                  <div className="flex gap-1.5 items-center pt-0.5">
                    <div className="flex-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">ชั่วโมง</span>
                      <select
                        value={getHourPart(wakeTime)}
                        onChange={(e) => {
                          setWakeTime(setHourPart(wakeTime, e.target.value));
                          setIsSaved(false);
                        }}
                        className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold rounded-lg px-2 py-1.5 text-neutral-800 focus:bg-white focus:outline-none"
                      >
                        {HOURS_LIST.map((h) => (
                          <option key={h} value={h}>{h} น.</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-neutral-400 font-bold mt-3">:</span>
                    <div className="flex-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">นาที</span>
                      <select
                        value={MINUTES_LIST.includes(getMinutePart(wakeTime)) ? getMinutePart(wakeTime) : '30'}
                        onChange={(e) => {
                          setWakeTime(setMinutePart(wakeTime, e.target.value));
                          setIsSaved(false);
                        }}
                        className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold rounded-lg px-2 py-1.5 text-neutral-800 focus:bg-white focus:outline-none"
                      >
                        {MINUTES_LIST.map((m) => (
                          <option key={m} value={m}>{m} น.</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Steppers */}
                  <div className="flex gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setWakeTime(adjustMinutes(wakeTime, -30));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 text-[10px] font-bold text-neutral-600 hover:text-amber-900 transition-colors"
                      title="ลด 30 นาที"
                    >
                      -30น.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWakeTime(adjustMinutes(wakeTime, -15));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 text-[10px] font-bold text-neutral-600 hover:text-amber-900 transition-colors"
                      title="ลด 15 นาที"
                    >
                      -15น.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWakeTime(adjustMinutes(wakeTime, 15));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 text-[10px] font-bold text-neutral-600 hover:text-amber-900 transition-colors"
                      title="เพิ่ม 15 นาที"
                    >
                      +15น.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWakeTime(adjustMinutes(wakeTime, 30));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 text-[10px] font-bold text-neutral-600 hover:text-amber-900 transition-colors"
                      title="เพิ่ม 30 นาที"
                    >
                      +30น.
                    </button>
                  </div>
                </div>

                {/* 2. Bed/Sleep Time Card */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-indigo-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sunset size={16} className="text-indigo-500" />
                      <span>เวลาเข้านอน</span>
                    </label>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      {sleepTime} น.
                    </span>
                  </div>

                  {/* Native Time Input */}
                  <div className="relative">
                    <input
                      type="time"
                      id="chrono-sleep-time-input"
                      value={sleepTime}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSleepTime(e.target.value);
                          setIsSaved(false);
                        }
                      }}
                      className="w-full px-3 py-2 bg-indigo-50/40 rounded-xl border border-indigo-200 font-bold text-base text-neutral-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                    />
                  </div>

                  {/* Direct Hour & Minute Selectors */}
                  <div className="flex gap-1.5 items-center pt-0.5">
                    <div className="flex-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">ชั่วโมง</span>
                      <select
                        value={getHourPart(sleepTime)}
                        onChange={(e) => {
                          setSleepTime(setHourPart(sleepTime, e.target.value));
                          setIsSaved(false);
                        }}
                        className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold rounded-lg px-2 py-1.5 text-neutral-800 focus:bg-white focus:outline-none"
                      >
                        {HOURS_LIST.map((h) => (
                          <option key={h} value={h}>{h} น.</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-neutral-400 font-bold mt-3">:</span>
                    <div className="flex-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">นาที</span>
                      <select
                        value={MINUTES_LIST.includes(getMinutePart(sleepTime)) ? getMinutePart(sleepTime) : '30'}
                        onChange={(e) => {
                          setSleepTime(setMinutePart(sleepTime, e.target.value));
                          setIsSaved(false);
                        }}
                        className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold rounded-lg px-2 py-1.5 text-neutral-800 focus:bg-white focus:outline-none"
                      >
                        {MINUTES_LIST.map((m) => (
                          <option key={m} value={m}>{m} น.</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Steppers */}
                  <div className="flex gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSleepTime(adjustMinutes(sleepTime, -30));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-indigo-100 text-[10px] font-bold text-neutral-600 hover:text-indigo-900 transition-colors"
                      title="ลด 30 นาที"
                    >
                      -30น.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSleepTime(adjustMinutes(sleepTime, -15));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-indigo-100 text-[10px] font-bold text-neutral-600 hover:text-indigo-900 transition-colors"
                      title="ลด 15 นาที"
                    >
                      -15น.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSleepTime(adjustMinutes(sleepTime, 15));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-indigo-100 text-[10px] font-bold text-neutral-600 hover:text-indigo-900 transition-colors"
                      title="เพิ่ม 15 นาที"
                    >
                      +15น.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSleepTime(adjustMinutes(sleepTime, 30));
                        setIsSaved(false);
                      }}
                      className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-indigo-100 text-[10px] font-bold text-neutral-600 hover:text-indigo-900 transition-colors"
                      title="เพิ่ม 30 นาที"
                    >
                      +30น.
                    </button>
                  </div>
                </div>
              </div>

              {/* In-Card Quick Save and Reset */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  id="chrono-inline-save-btn"
                  onClick={() => saveChronoSettings(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isSaved
                      ? 'bg-emerald-600 text-white shadow-emerald-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-200'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>บันทึกข้อมูลเรียบร้อยแล้ว ✓</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>บันทึกเวลาตื่นและเวลานอน</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWakeTime(DEFAULT_CHRONO.wakeTime);
                    setSleepTime(DEFAULT_CHRONO.sleepTime);
                    setIsSaved(false);
                    onToast('รีเซ็ตเป็นค่ามาตรฐาน (ตื่น 06:30 / นอน 22:30)');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="รีเซ็ตเป็นค่าเริ่มต้น"
                >
                  <RotateCcw size={14} />
                  <span>รีเซ็ต</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-neutral-200/60">
                <span className="text-[11px] font-bold text-neutral-500 block mb-2">⚡ พรีเซ็ตเวลายอดนิยม (คลิกเปลี่ยนทันที):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('05:30', '21:30', 'ตื่นเช้ามาก')}
                    className={`p-2 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      wakeTime === '05:30' && sleepTime === '21:30'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                        : 'bg-white hover:bg-indigo-50/50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    🌅 05:30 / 21:30
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('06:30', '22:30', 'เวลามาตรฐาน')}
                    className={`p-2 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      wakeTime === '06:30' && sleepTime === '22:30'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                        : 'bg-white hover:bg-indigo-50/50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    ☀️ 06:30 / 22:30
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('07:30', '23:30', 'นอนดึกตื่นสาย')}
                    className={`p-2 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      wakeTime === '07:30' && sleepTime === '23:30'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                        : 'bg-white hover:bg-indigo-50/50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    🌙 07:30 / 23:30
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('08:30', '00:30', 'กะดึก / นอนดึก')}
                    className={`p-2 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      wakeTime === '08:30' && sleepTime === '00:30'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                        : 'bg-white hover:bg-indigo-50/50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    🦉 08:30 / 00:30
                  </button>
                </div>
              </div>
            </div>

            {/* Goal Preference */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-800 block">🎯 เป้าหมายทางชีวภาพหลัก:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGoal('fat_loss');
                    setIsSaved(false);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    goal === 'fat_loss'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs ring-2 ring-amber-400/20'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base block mb-0.5">🔥</span>
                  <span className="text-xs block leading-tight">เร่งเผาผลาญ</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Fat Loss</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoal('muscle_growth');
                    setIsSaved(false);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    goal === 'muscle_growth'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs ring-2 ring-blue-400/20'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base block mb-0.5">💪</span>
                  <span className="text-xs block leading-tight">สร้างกล้ามเนื้อ</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Hypertrophy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoal('sleep_longevity');
                    setIsSaved(false);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    goal === 'sleep_longevity'
                      ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-xs ring-2 ring-purple-400/20'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base block mb-0.5">🧬</span>
                  <span className="text-xs block leading-tight">ชะลอวัย & หลับลึก</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Longevity</span>
                </button>
              </div>
            </div>

            {/* Circadian Schedule Breakdown */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-neutral-800 block">
                ตารางช่วงเวลารับประทานที่คำนวณตามเวลาตื่น ({wakeTime}) และนอน ({sleepTime}):
              </span>

              {/* Window 1 */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white font-bold text-xs shrink-0 mt-0.5 text-center min-w-[90px] shadow-xs">
                  {cortisolPeakWindow}
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <Sunrise size={14} className="text-amber-600" />
                    <span>มื้อเช้า / First Fuel Window (หลังตื่น 30-90 นาที)</span>
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    ฮอร์โมนคอร์ติซอลเริ่มลดลง เหมาะกับอาหารโปรตีนสูง (25-35g) เช่น ไข่ อกไก่ หรือเต้าหู้ เพื่อสร้างความอิ่มยาวนานและลดการหิวน้ำตาลตลอดวัน
                  </p>
                </div>
              </div>

              {/* Window 2 */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-600 text-white font-bold text-xs shrink-0 mt-0.5 text-center min-w-[90px] shadow-xs">
                  {insulinSensitivityPeak}
                </div>
                <div>
                  <h4 className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
                    <Sun size={14} className="text-sky-600" />
                    <span>มื้อกลางวัน / Metabolic Peak (มื้อใหญ่ที่สุดของวัน)</span>
                  </h4>
                  <p className="text-[11px] text-sky-800 mt-0.5 leading-relaxed">
                    ความไวต่ออินซูลิน (Insulin Sensitivity) และการทำงานของระบบย่อยอาหารสูงสุด ร่างกายจัดการคาร์โบไฮเดรตได้มีประสิทธิภาพที่สุดในเวลานี้
                  </p>
                </div>
              </div>

              {/* Window 3 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5 text-center min-w-[90px] shadow-xs">
                  ไม่เกิน {optimalLastBiteTime}
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                    <Moon size={14} className="text-indigo-600" />
                    <span>คำสุดท้ายของวัน / Last Bite (ก่อนนอนอย่างน้อย 3.5 ชม.)</span>
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                    หยุดทานอาหารอย่างน้อย 3.5 ชม. ก่อนนอน เพื่อให้อินซูลินลดลง เมลาโทนิน ({melatoninRiseTime} น.) หลั่งเต็มที่ เปิดโอกาสให้โกรทฮอร์โมน (Growth Hormone) ฟื้นฟูเซลล์ขณะหลับ
                  </p>
                </div>
              </div>
            </div>

            {/* Science Highlight */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Sparkles size={15} />
                <span>งานวิจัยโครโนนิวทริชัน (Chrono-Nutrition Science)</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                "กินแคลอรี่เท่ากัน แต่ทานมื้อสุดท้ายเร็วขึ้น 3 ชั่วโมง สามารถเพิ่มอัตราการเผาผลาญไขมันในขณะหลับได้ถึง 15% และลดการอักเสบระดับเซลล์อย่างมีนัยสำคัญ"
              </p>
            </div>
          </div>

          {/* ALWAYS-VISIBLE FIXED BOTTOM ACTION BAR */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-neutral-100 flex flex-col sm:flex-row gap-2 shrink-0 shadow-lg z-10">
            <button
              type="button"
              id="chrono-primary-save-btn"
              onClick={() => {
                saveChronoSettings(false);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>บันทึกเวลาและตารางชีวภาพ</span>
            </button>

            <button
              type="button"
              id="chrono-sync-reminders-btn"
              onClick={() => {
                saveChronoSettings(true);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Bell size={16} />
              <span>บันทึกพร้อมเปิดเตือนมื้ออาหาร</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
