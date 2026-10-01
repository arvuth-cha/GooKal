import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Coffee, AlertTriangle, CheckCircle2, Clock, BatteryCharging, Sparkles, Activity, Plus, Minus, Droplets, Utensils } from 'lucide-react';
import { addWaterLog } from '../../utils/waterService';

interface CaffeineSleepDecayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogMeal?: (meal: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onToast: (msg: string) => void;
}

interface BeveragePreset {
  id: string;
  name: string;
  caffeineMg: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  icon: string;
  category: 'coffee' | 'tea' | 'energy' | 'soda' | 'preworkout';
}

const BEVERAGE_PRESETS: BeveragePreset[] = [
  { id: 'espresso', name: 'เอสเพรสโซ่ (Espresso Double)', caffeineMg: 150, calories: 10, protein: 1, carbs: 1, fat: 0, icon: '☕', category: 'coffee' },
  { id: 'americano', name: 'อเมริกาโน่เย็น ไม่หวาน (Iced Americano)', caffeineMg: 140, calories: 15, protein: 1, carbs: 2, fat: 0, icon: '🧊', category: 'coffee' },
  { id: 'latte', name: 'ลาเต้ / คาปูชิโน่ (Latte)', caffeineMg: 120, calories: 140, protein: 7, carbs: 12, fat: 6, icon: '🥛', category: 'coffee' },
  { id: 'matcha', name: 'มัทฉะเข้มข้น (Ceremonial Matcha)', caffeineMg: 70, calories: 35, protein: 2, carbs: 5, fat: 1, icon: '🍵', category: 'tea' },
  { id: 'black_tea', name: 'ชาดำ / ชาไทย (Black / Thai Tea)', caffeineMg: 55, calories: 80, protein: 2, carbs: 16, fat: 1, icon: '🧋', category: 'tea' },
  { id: 'energy_drink', name: 'เครื่องดื่มชูกำลัง (Energy Drink)', caffeineMg: 80, calories: 110, protein: 0, carbs: 27, fat: 0, icon: '⚡', category: 'energy' },
  { id: 'pre_workout', name: 'Pre-Workout Powder', caffeineMg: 250, calories: 10, protein: 0, carbs: 2, fat: 0, icon: '💥', category: 'preworkout' },
  { id: 'coke_zero', name: 'โคล่า / น้ำอัดลมไม่มีน้ำตาล (325ml)', caffeineMg: 35, calories: 0, protein: 0, carbs: 0, fat: 0, icon: '🥤', category: 'soda' },
];

const BEDTIME_PRESETS = ['21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00'];
const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_LIST = ['00', '15', '30', '45'];

export const CaffeineSleepDecayModal: React.FC<CaffeineSleepDecayModalProps> = ({
  isOpen,
  onClose,
  onLogMeal,
  onToast
}) => {
  const [totalCaffeineMg, setTotalCaffeineMg] = useState<number>(150);
  const [selectedPreset, setSelectedPreset] = useState<BeveragePreset>(BEVERAGE_PRESETS[1]);
  const [bedtimeTimeStr, setBedtimeTimeStr] = useState<string>('23:00'); // HH:MM
  const [consumedTimeStr, setConsumedTimeStr] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() - 2);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [halfLifeHours, setHalfLifeHours] = useState<number>(5.5); // Average 5.5 hours
  const [detectedDiaryDrink, setDetectedDiaryDrink] = useState<string | null>(null);

  // Scan diary for caffeine on open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('kalguru_history_v2');
      if (raw) {
        const history = JSON.parse(raw);
        if (Array.isArray(history) && history.length > 0) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayMeals = history.filter((m: any) => new Date(m.date).getTime() >= todayStart.getTime());
          
          const keywords = ['กาแฟ', 'coffee', 'espresso', 'americano', 'latte', 'ชา', 'tea', 'matcha', 'โคล่า', 'cola', 'pepsi', 'coke', 'energy drink'];
          const matchedMeal = todayMeals.find((m: any) => 
            keywords.some(kw => (m.foodName || '').toLowerCase().includes(kw))
          );

          if (matchedMeal) {
            setDetectedDiaryDrink(matchedMeal.foodName);
            // Match preset
            const lowerName = matchedMeal.foodName.toLowerCase();
            if (lowerName.includes('latte') || lowerName.includes('ลาเต้')) {
              setSelectedPreset(BEVERAGE_PRESETS[2]);
              setTotalCaffeineMg(120);
            } else if (lowerName.includes('matcha') || lowerName.includes('มัทฉะ')) {
              setSelectedPreset(BEVERAGE_PRESETS[3]);
              setTotalCaffeineMg(70);
            } else if (lowerName.includes('espresso') || lowerName.includes('เอสเพรสโซ่')) {
              setSelectedPreset(BEVERAGE_PRESETS[0]);
              setTotalCaffeineMg(150);
            } else {
              setSelectedPreset(BEVERAGE_PRESETS[1]);
              setTotalCaffeineMg(140);
            }
          }
        }
      }
    } catch {}
  }, [isOpen]);

  // Parse bedtime to decimal hours (0.0 to 24.0)
  const [bH, bM] = bedtimeTimeStr.split(':').map(Number);
  const targetBedtimeDecimal = (isNaN(bH) ? 23 : bH) + (isNaN(bM) ? 0 : bM) / 60;

  // Parse consumed time
  const [cH, cM] = consumedTimeStr.split(':').map(Number);
  const consumedDecimal = (isNaN(cH) ? 0 : cH) + (isNaN(cM) ? 0 : cM) / 60;

  // Current decimal hour
  const now = new Date();
  const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
  
  // Calculate consumed hours ago
  let consumedHoursAgo = currentHourDecimal - consumedDecimal;
  if (consumedHoursAgo < 0) {
    consumedHoursAgo += 24; // Cross-day assumption
  }
  
  // Calculate hours until bedtime
  let hoursUntilBedtime = targetBedtimeDecimal - currentHourDecimal;
  if (hoursUntilBedtime < 0) {
    hoursUntilBedtime += 24;
  }

  // Current remaining caffeine
  const currentRemainingMg = Math.round(totalCaffeineMg * Math.pow(0.5, consumedHoursAgo / halfLifeHours));

  // Caffeine at bedtime
  const bedtimeRemainingMg = Math.round(totalCaffeineMg * Math.pow(0.5, (consumedHoursAgo + hoursUntilBedtime) / halfLifeHours));

  // Sleep Quality Impact
  let sleepQualityStatus: { title: string; color: string; desc: string; icon: any } = {
    title: 'หลับลึกสมบูรณ์ (Deep Sleep Ready 🟢)',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    desc: 'ปริมาณคาเฟอีนเหลือน้อยกว่า 25 mg ไม่รบกวน Adenosine Receptors ในสมอง ช่วยให้วงจร REM และ Deep Sleep ทำงานเต็มที่',
    icon: CheckCircle2
  };

  if (bedtimeRemainingMg > 75) {
    sleepQualityStatus = {
      title: 'ความเสี่ยงนอนไม่หลับสูง (Severe Insomnia Risk 🔴)',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      desc: 'คาเฟอีนตกค้างสูงเกิน 75 mg จะบล็อก Adenosine ทำให้หลับยาก ตื่นกลางดึกบ่อย และลดคลื่นสมอง Slow-Wave Deep Sleep ถึง 40%',
      icon: AlertTriangle
    };
  } else if (bedtimeRemainingMg > 35) {
    sleepQualityStatus = {
      title: 'อาจหลับตื้นและฝันสะดุด (Moderate Sleep Disruption 🟡)',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      desc: 'คาเฟอีนเหลือ 35-75 mg อาจทำให้หัวใจเต้นเร็วขึ้นเล็กน้อย และลดระยะเวลาหลับลึก (Deep Sleep) ลง',
      icon: Clock
    };
  }

  // Recommended Cutoff Time
  // Formula: targetBedtime - (halfLife * log2(totalCaffeine / 25))
  const hoursNeededForClearance = Math.max(0, halfLifeHours * (Math.log2(Math.max(1, totalCaffeineMg / 25))));
  let cutoffDecimal = (targetBedtimeDecimal - hoursNeededForClearance + 24) % 24;
  const cutoffH = Math.floor(cutoffDecimal);
  const cutoffM = Math.round((cutoffDecimal - cutoffH) * 60);
  const formattedCutoffTime = `${String(cutoffH).padStart(2, '0')}:${String(cutoffM % 60).padStart(2, '0')} น.`;

  const handleSelectPreset = (preset: BeveragePreset) => {
    setSelectedPreset(preset);
    setTotalCaffeineMg(preset.caffeineMg);
    onToast(`☕ เลือก ${preset.name} (${preset.caffeineMg} mg คาเฟอีน)`);
  };

  const handleLogDrinkToDiary = () => {
    if (onLogMeal) {
      onLogMeal({
        name: selectedPreset.name,
        calories: selectedPreset.calories,
        protein: selectedPreset.protein,
        carbs: selectedPreset.carbs,
        fat: selectedPreset.fat
      });
    } else {
      try {
        const raw = localStorage.getItem('kalguru_history_v2');
        const history = raw ? JSON.parse(raw) : [];
        const newMeal = {
          id: 'drink_' + Date.now(),
          date: new Date().toISOString(),
          foodName: selectedPreset.name,
          calories: selectedPreset.calories,
          proteinGrams: selectedPreset.protein,
          carbsGrams: selectedPreset.carbs,
          fatGrams: selectedPreset.fat,
          category: 'เครื่องดื่ม'
        };
        localStorage.setItem('kalguru_history_v2', JSON.stringify([newMeal, ...history]));
        window.dispatchEvent(new Event('kalguru_meal_logged'));
      } catch {}
    }
    onToast(`🍽️ บันทึก "${selectedPreset.name}" ลงบันทึกมื้ออาหารวันนี้เรียบร้อย!`);
  };

  const handleCompensateWater = () => {
    addWaterLog(300, new Date());
    onToast('💧 บันทึกดื่มน้ำชดเชย +300 ml สำเร็จ! ข้อมูลซิงค์ไปยัง Water Tracker ทันที');
  };

  const handleAdjustBedtime = (deltaMinutes: number) => {
    const [h, m] = bedtimeTimeStr.split(':').map(Number);
    let totalMins = (h || 0) * 60 + (m || 0) + deltaMinutes;
    if (totalMins < 0) totalMins += 24 * 60;
    totalMins = totalMins % (24 * 60);

    const newH = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const newM = (totalMins % 60).toString().padStart(2, '0');
    setBedtimeTimeStr(`${newH}:${newM}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-amber-50 via-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-700 text-white flex items-center justify-center shadow-md">
                <Coffee size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">กราฟการสลายคาเฟอีน & คุณภาพการนอนหลับ</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                    Caffeine Decay Half-Life
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">จำลองครึ่งชีวิตของคาเฟอีน (Half-Life) และคำนวณเวลางดกาแฟที่เหมาะสม</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-500 hover:text-neutral-800 flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Auto-detected drink from diary */}
            {detectedDiaryDrink && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-medium">
                  <Sparkles size={15} className="text-amber-600 shrink-0" />
                  <span>ตรวจพบล่าสุดในไดอารี่อาหารวันนี้: <strong>{detectedDiaryDrink}</strong></span>
                </div>
                <span className="text-[10px] bg-amber-200/60 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  ซิงค์อัตโนมัติ
                </span>
              </div>
            )}

            {/* Quick Beverage Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700 block">เลือกเครื่องดื่มที่ดื่มล่าสุด:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogDrinkToDiary}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 border border-amber-200 cursor-pointer"
                    title="บันทึกเครื่องดื่มนี้ลงไดอารี่อาหาร"
                  >
                    <Utensils size={12} />
                    <span>+ ลงไดอารี่อาหาร</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCompensateWater}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 border border-sky-200 cursor-pointer"
                    title="ดื่มน้ำชดเชยคาเฟอีนเพื่อรักษาสมดุลน้ำในร่างกาย"
                  >
                    <Droplets size={12} />
                    <span>+ ดื่มน้ำ 300ml</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BEVERAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      totalCaffeineMg === preset.caffeineMg
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs'
                        : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    <span className="text-base block mb-0.5">{preset.icon}</span>
                    <div className="text-[11px] font-bold leading-tight truncate">{preset.name}</div>
                    <span className="text-[10px] text-amber-700 font-semibold">{preset.caffeineMg} mg</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter Adjustment Panel */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              {/* Total Caffeine */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1.5">
                  <span>ปริมาณคาเฟอีนทั้งหมด:</span>
                  <span className="text-amber-800 font-mono text-sm">{totalCaffeineMg} mg</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="20"
                    max="400"
                    step="10"
                    value={totalCaffeineMg}
                    onChange={(e) => setTotalCaffeineMg(Number(e.target.value))}
                    className="flex-1 accent-amber-700 cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTotalCaffeineMg(Math.max(10, totalCaffeineMg - 20))}
                      className="p-1 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                      title="-20 mg"
                    >
                      <Minus size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalCaffeineMg(Math.min(500, totalCaffeineMg + 20))}
                      className="p-1 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                      title="+20 mg"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Consumed Time Input */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-indigo-600" /> เวลาที่ดื่มไป:
                  </span>
                  <span className="text-indigo-800 font-mono text-sm font-bold">{consumedTimeStr} น.</span>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-neutral-200">
                  <input
                    type="time"
                    value={consumedTimeStr}
                    onChange={(e) => setConsumedTimeStr(e.target.value)}
                    className="flex-1 text-sm font-bold bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200 text-neutral-800 outline-none cursor-pointer"
                  />
                  <div className="flex flex-col text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-xl">
                    <span>ผ่านมาแล้ว</span>
                    <span>{Math.floor(consumedHoursAgo)} ชม. {Math.round((consumedHoursAgo % 1) * 60)} นาที</span>
                  </div>
                </div>
              </div>

              {/* Target Bedtime Input */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Moon size={13} className="text-purple-600" /> เป้าหมายเวลาเข้านอน:
                  </span>
                  <span className="text-purple-800 font-mono text-sm font-bold">{bedtimeTimeStr} น.</span>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {BEDTIME_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBedtimeTimeStr(preset)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bedtimeTimeStr === preset
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Steppers & Dropdowns */}
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-neutral-200">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustBedtime(-30)}
                      className="px-2 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      -30น.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustBedtime(+30)}
                      className="px-2 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      +30น.
                    </button>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-neutral-50 border border-neutral-200">
                    <Clock size={13} className="text-purple-600" />
                    <select
                      value={bedtimeTimeStr.split(':')[0] || '23'}
                      onChange={(e) => {
                        const m = bedtimeTimeStr.split(':')[1] || '00';
                        setBedtimeTimeStr(`${e.target.value}:${m}`);
                      }}
                      className="text-xs font-bold bg-transparent text-neutral-800 outline-none cursor-pointer pr-1"
                    >
                      {HOURS_LIST.map((h) => (
                        <option key={h} value={h}>{h} น.</option>
                      ))}
                    </select>
                    <span className="text-neutral-400 font-bold">:</span>
                    <select
                      value={bedtimeTimeStr.split(':')[1] || '00'}
                      onChange={(e) => {
                        const h = bedtimeTimeStr.split(':')[0] || '23';
                        setBedtimeTimeStr(`${h}:${e.target.value}`);
                      }}
                      className="text-xs font-bold bg-transparent text-neutral-800 outline-none cursor-pointer pl-1"
                    >
                      {MINUTES_LIST.map((m) => (
                        <option key={m} value={m}>{m} น.</option>
                      ))}
                    </select>
                  </div>

                  <input 
                    type="time" 
                    value={bedtimeTimeStr}
                    onChange={(e) => setBedtimeTimeStr(e.target.value)}
                    className="text-xs font-bold bg-neutral-50 px-2 py-1 rounded-xl border border-neutral-200 text-neutral-800 outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Results Live Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">คาเฟอีนในกระแสเลือดตอนนี้</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-amber-950">{currentRemainingMg}</span>
                  <span className="text-xs text-amber-800 font-semibold">mg</span>
                </div>
                <span className="text-[10px] text-amber-700 block font-medium">สลายไปแล้ว {totalCaffeineMg - currentRemainingMg} mg</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block flex items-center gap-1">
                  <Moon size={12} /> คาเฟอีนเมื่อถึงเวลาเข้านอน
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-indigo-950">{bedtimeRemainingMg}</span>
                  <span className="text-xs text-indigo-800 font-semibold">mg</span>
                </div>
                <span className="text-[10px] text-indigo-700 block font-medium">เป้าหมาย &lt; 25 mg เพื่อหลับลึก</span>
              </div>
            </div>

            {/* Sleep Impact Diagnosis */}
            <div className={`p-4 rounded-2xl border space-y-1.5 ${sleepQualityStatus.color}`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                <sleepQualityStatus.icon size={16} />
                <span>{sleepQualityStatus.title}</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {sleepQualityStatus.desc}
              </p>
            </div>

            {/* Optimal Cutoff Recommendation */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-purple-900 block flex items-center gap-1">
                  <Sparkles size={13} className="text-purple-600" /> เวลางดกาแฟแก้วสุดท้ายที่แนะนำ (Caffeine Cutoff)
                </span>
                <p className="text-[11px] text-purple-700">ควรงดก่อนเวลานี้เพื่อให้ร่างกายขับคาเฟอีนทันก่อนเข้านอน</p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-purple-700 text-white font-black text-sm shadow-xs font-mono">
                {formattedCutoffTime}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
