import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Flame,
  Zap,
  TrendingDown,
  Dumbbell,
  Scale,
  Sparkles,
  Check,
  RotateCcw,
  Bot,
  Droplets,
  Moon,
  Clock,
  Heart,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Footprints,
  Activity,
  Wheat,
  Beef,
  Droplet
} from 'lucide-react';

export interface CustomCoachGoals {
  primaryGoal: 'fat_loss' | 'muscle_gain' | 'maintenance' | 'athletic' | 'low_carb' | 'sugar_control' | 'custom';
  primaryGoalTitle: string;
  calorieTargetMode: 'auto' | 'custom';
  customCalories: number;
  macroPreset: 'balanced' | 'high_protein' | 'low_carb' | 'keto' | 'fat_loss' | 'custom';
  customProtein: number; // grams
  customCarbs: number; // grams
  customFat: number; // grams
  customSugarMax?: number; // grams
  customSodiumMax?: number; // mg
  // Body targets
  targetWeight: number; // kg
  targetWaistInches?: number; // inches
  targetHipInches?: number; // inches
  targetBodyFatPercent?: number; // %
  // Daily habits
  waterTarget: number; // glasses
  stepsTarget: number; // steps
  sleepTarget: number; // hours
  ifWindow: string; // e.g., 'none', '16/8', '18/6', '20/4', or custom string
  dietaryRestrictions: string; // text
  // AI Coach style
  coachPersona: 'friendly' | 'strict_trainer' | 'clinical_dietitian' | 'mindful_holistic';
  notes: string;
}

export interface CustomGoalSettingsProps {
  currentGoals: CustomCoachGoals;
  bmr: number;
  tdee: number;
  currentWeight: number;
  height: number;
  onSaveGoals: (updatedGoals: CustomCoachGoals) => void;
  onToast?: (message: string) => void;
}

export const GOAL_PRESETS = [
  {
    id: 'fat_loss' as const,
    title: 'ลดไขมัน & กระชับรูปร่าง',
    subtitle: 'Calorie Deficit ปลอดภัย เน้นโปรตีนสูงรักษากล้ามเนื้อ',
    icon: '📉',
    color: 'from-orange-500 to-red-500',
    calorieOffset: -350,
    proteinRatio: 0.35,
    carbsRatio: 0.40,
    fatRatio: 0.25,
    water: 9,
    steps: 10000,
    sleep: 7.5,
    ifWindow: '16/8 (ทาน 12:00 - 20:00)',
    persona: 'friendly' as const
  },
  {
    id: 'muscle_gain' as const,
    title: 'เพิ่มกล้ามเนื้อ & ลีนเนื้อแน่น',
    subtitle: 'Calorie Surplus เล็กน้อย โปรตีนจัดเต็ม พักผ่อนเต็มอิ่ม',
    icon: '💪',
    color: 'from-blue-600 to-indigo-600',
    calorieOffset: 300,
    proteinRatio: 0.35,
    carbsRatio: 0.45,
    fatRatio: 0.20,
    water: 10,
    steps: 8000,
    sleep: 8.0,
    ifWindow: 'none',
    persona: 'strict_trainer' as const
  },
  {
    id: 'maintenance' as const,
    title: 'รักษาน้ำหนัก & สุขภาพยืนยาว',
    subtitle: 'สารอาหารสมดุลคงที่ สดชื่น มีพลังตลอดวัน',
    icon: '⚖️',
    color: 'from-emerald-500 to-teal-600',
    calorieOffset: 0,
    proteinRatio: 0.30,
    carbsRatio: 0.45,
    fatRatio: 0.25,
    water: 8,
    steps: 8000,
    sleep: 7.5,
    ifWindow: 'none',
    persona: 'mindful_holistic' as const
  },
  {
    id: 'low_carb' as const,
    title: 'คีโต / ลดแป้ง & ตัดน้ำตาล',
    subtitle: 'เน้นไขมันดี โปรตีนพอดี จำกัดคาร์บต่ำมาก เผาผลาญคีโตน',
    icon: '🥑',
    color: 'from-amber-500 to-yellow-600',
    calorieOffset: -250,
    proteinRatio: 0.25,
    carbsRatio: 0.10,
    fatRatio: 0.65,
    water: 10,
    steps: 9000,
    sleep: 7.5,
    ifWindow: '16/8 (ทาน 12:00 - 20:00)',
    persona: 'clinical_dietitian' as const
  },
  {
    id: 'sugar_control' as const,
    title: 'คุมน้ำตาลในเลือด & ชะลอวัย',
    subtitle: 'เน้น Low Glycemic Index ไฟเบอร์สูง โซเดียมน้อย สุขภาพหลอดเลือด',
    icon: '🩸',
    color: 'from-rose-500 to-pink-600',
    calorieOffset: 0,
    proteinRatio: 0.30,
    carbsRatio: 0.45,
    fatRatio: 0.25,
    water: 9,
    steps: 8500,
    sleep: 8.0,
    ifWindow: '14/10 (ทาน 08:00 - 18:00)',
    persona: 'clinical_dietitian' as const
  },
  {
    id: 'athletic' as const,
    title: 'นักวิ่ง & ออกกำลังกายเข้มข้น',
    subtitle: 'พลังงานสูง คาร์บเชิงซ้อนเพียงพอ ฟื้นฟูกล้ามเนื้อไว',
    icon: '🏃‍♂️',
    color: 'from-cyan-500 to-blue-600',
    calorieOffset: 250,
    proteinRatio: 0.25,
    carbsRatio: 0.55,
    fatRatio: 0.20,
    water: 10,
    steps: 12000,
    sleep: 8.0,
    ifWindow: 'none',
    persona: 'strict_trainer' as const
  },
  {
    id: 'custom' as const,
    title: 'กำหนดเป้าหมายเองอิสระ 100%',
    subtitle: 'ปรับแต่งตัวเลขแคลอรี โปรตีน คาร์บ ไขมัน และคำแนะนำตามใจคุณ',
    icon: '✍️',
    color: 'from-neutral-700 to-neutral-900',
    calorieOffset: 0,
    proteinRatio: 0.30,
    carbsRatio: 0.45,
    fatRatio: 0.25,
    water: 8,
    steps: 8000,
    sleep: 7.5,
    ifWindow: 'none',
    persona: 'friendly' as const
  }
];

export const CustomGoalSettings: React.FC<CustomGoalSettingsProps> = ({
  currentGoals,
  bmr,
  tdee,
  currentWeight,
  height,
  onSaveGoals,
  onToast
}) => {
  const [goals, setGoals] = useState<CustomCoachGoals>(currentGoals);
  const [activeSubSection, setActiveSubSection] = useState<'preset' | 'calories_macros' | 'habits_body' | 'coach_style'>('preset');

  // Synchronize when currentGoals prop updates from Account profile
  useEffect(() => {
    setGoals(currentGoals);
  }, [currentGoals]);

  // Helper to recalculate macros when calorie or preset changes
  const applyPreset = (presetId: CustomCoachGoals['primaryGoal']) => {
    const found = GOAL_PRESETS.find(p => p.id === presetId);
    if (!found) return;

    const baseCal = Math.max(1200, Math.round(tdee + found.calorieOffset));
    const pGrams = Math.round((baseCal * found.proteinRatio) / 4);
    const cGrams = Math.round((baseCal * found.carbsRatio) / 4);
    const fGrams = Math.round((baseCal * found.fatRatio) / 9);

    setGoals(prev => ({
      ...prev,
      primaryGoal: found.id,
      primaryGoalTitle: found.title,
      calorieTargetMode: found.id === 'custom' ? 'custom' : 'auto',
      customCalories: baseCal,
      customProtein: pGrams,
      customCarbs: cGrams,
      customFat: fGrams,
      customSugarMax: found.id === 'low_carb' ? 20 : found.id === 'sugar_control' ? 25 : 40,
      customSodiumMax: found.id === 'sugar_control' ? 1800 : 2200,
      waterTarget: found.water,
      stepsTarget: found.steps,
      sleepTarget: found.sleep,
      ifWindow: found.ifWindow,
      coachPersona: found.persona
    }));

    if (onToast) {
      onToast(`🎯 โหลดการตั้งค่าสำเร็จรูป "${found.title}" เรียบร้อยแล้ว! ปรับแต่งตัวเลขเพิ่มเติมได้ตามต้องการ`);
    }
  };

  // Calculate calories from current macro grams
  const calculatedCaloriesFromMacros = (goals.customProtein * 4) + (goals.customCarbs * 4) + (goals.customFat * 9);
  const totalMacroGrams = goals.customProtein + goals.customCarbs + goals.customFat;
  const proteinPct = totalMacroGrams > 0 ? Math.round(((goals.customProtein * 4) / calculatedCaloriesFromMacros) * 100) || 0 : 0;
  const carbsPct = totalMacroGrams > 0 ? Math.round(((goals.customCarbs * 4) / calculatedCaloriesFromMacros) * 100) || 0 : 0;
  const fatPct = totalMacroGrams > 0 ? Math.round(((goals.customFat * 9) / calculatedCaloriesFromMacros) * 100) || 0 : 0;

  const handleSave = () => {
    onSaveGoals(goals);
    if (onToast) {
      onToast('✨ บันทึกเป้าหมายสุขภาพส่วนตัวสำเร็จ! โค้ช AI ปรับแผนดูแลคุณทันที');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
              <Target size={14} className="text-orange-500" />
              <span>Custom Health & Nutrition Goals</span>
            </div>
            <h3 className="text-xl font-black text-neutral-900 mt-1">
              กำหนดเป้าหมายสุขภาพและโภชนาการของคุณเอง
            </h3>
            <p className="text-neutral-500 text-xs mt-0.5">
              ตั้งค่าเป้าหมายหลัก แคลอรี สัดส่วนมาโคร วินัยประจำวัน และบุคลิกโค้ช AI เพื่อให้คำแนะนำสอดคล้องกับคุณที่สุด
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Check size={16} />
            <span>บันทึกเป้าหมาย (Save Goals)</span>
          </button>
        </div>

        {/* Current Target Live Summary Card */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white p-4 sm:p-5 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {GOAL_PRESETS.find(p => p.id === goals.primaryGoal)?.icon || '🎯'}
              </span>
              <div>
                <span className="text-[10px] text-neutral-400 font-medium block">เป้าหมายปัจจุบัน</span>
                <h4 className="font-extrabold text-white text-sm">
                  {goals.primaryGoalTitle || 'ดูแลสุขภาพและควบคุมโภชนาการ'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white/10 px-2.5 py-1 rounded-xl text-neutral-300 font-bold">
                TDEE คำนวณ: {tdee} kcal
              </span>
              <span className="bg-orange-500/30 text-orange-300 border border-orange-400/30 px-3 py-1 rounded-xl font-black">
                เป้าหมาย: {goals.customCalories} kcal/วัน
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-neutral-400 text-[10px] block">🥩 โปรตีนเป้าหมาย</span>
              <span className="font-black text-sky-400 text-sm">{goals.customProtein}g</span>
              <span className="text-neutral-400 text-[10px] ml-1">({proteinPct}%)</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-neutral-400 text-[10px] block">🍚 คาร์บเป้าหมาย</span>
              <span className="font-black text-emerald-400 text-sm">{goals.customCarbs}g</span>
              <span className="text-neutral-400 text-[10px] ml-1">({carbsPct}%)</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-neutral-400 text-[10px] block">🥑 ไขมันเป้าหมาย</span>
              <span className="font-black text-amber-400 text-sm">{goals.customFat}g</span>
              <span className="text-neutral-400 text-[10px] ml-1">({fatPct}%)</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-neutral-400 text-[10px] block">💧 น้ำ / 🚶 ก้าว</span>
              <span className="font-black text-teal-400 text-sm">{goals.waterTarget} แก้ว</span>
              <span className="text-neutral-400 text-[10px] ml-1">/ {goals.stepsTarget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Setting Navigation Pills */}
        <div className="flex bg-neutral-100 p-1 rounded-2xl gap-1 text-xs font-bold text-neutral-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubSection('preset')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubSection === 'preset'
                ? 'bg-white text-neutral-900 shadow-xs font-black'
                : 'hover:text-neutral-900'
            }`}
          >
            <Sparkles size={15} className={activeSubSection === 'preset' ? 'text-orange-500' : ''} />
            <span>1. เลือกเป้าหมายหลัก</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('calories_macros')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubSection === 'calories_macros'
                ? 'bg-white text-neutral-900 shadow-xs font-black'
                : 'hover:text-neutral-900'
            }`}
          >
            <Flame size={15} className={activeSubSection === 'calories_macros' ? 'text-orange-500' : ''} />
            <span>2. แคลอรี & สารอาหาร</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('habits_body')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubSection === 'habits_body'
                ? 'bg-white text-neutral-900 shadow-xs font-black'
                : 'hover:text-neutral-900'
            }`}
          >
            <Activity size={15} className={activeSubSection === 'habits_body' ? 'text-orange-500' : ''} />
            <span>3. น้ำหนัก & วินัยประจำวัน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('coach_style')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubSection === 'coach_style'
                ? 'bg-white text-neutral-900 shadow-xs font-black'
                : 'hover:text-neutral-900'
            }`}
          >
            <Bot size={15} className={activeSubSection === 'coach_style' ? 'text-orange-500' : ''} />
            <span>4. สไตล์โค้ช & โน้ต</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Goal Presets Selector */}
      {activeSubSection === 'preset' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-extrabold text-neutral-900 text-sm sm:text-base flex items-center gap-1.5">
              <span>เลือกแผนเป้าหมายสุขภาพยอดนิยม (หรือปรับแต่งเอง)</span>
            </h4>
            <span className="text-[11px] text-neutral-400 font-medium">คลิกเพื่อเลือกแผนที่ต้องการ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_PRESETS.map((preset) => {
              const isSelected = goals.primaryGoal === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-orange-50/50 border-orange-400 ring-2 ring-orange-400/20 shadow-sm'
                      : 'bg-white border-neutral-200/80 hover:border-orange-200 hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl p-2 rounded-2xl bg-neutral-100 shrink-0">
                      {preset.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-neutral-900 text-sm sm:text-base">
                          {preset.title}
                        </h5>
                        {isSelected && (
                          <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check size={11} /> ใช้งานอยู่
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-500 text-xs leading-relaxed">
                        {preset.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-[11px]">
                    <span className="bg-neutral-100 font-bold text-neutral-700 px-2.5 py-1 rounded-xl">
                      {preset.calorieOffset === 0 ? 'แคลอรีพอดี TDEE' : preset.calorieOffset > 0 ? `+${preset.calorieOffset} kcal` : `${preset.calorieOffset} kcal`}
                    </span>
                    <span className="bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-xl">
                      โปรตีน {Math.round(preset.proteinRatio * 100)}%
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-xl">
                      คาร์บ {Math.round(preset.carbsRatio * 100)}%
                    </span>
                    <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-xl">
                      ไขมัน {Math.round(preset.fatRatio * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <Sparkles size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <p>
              <strong>เคล็ดลับจากโค้ช AI:</strong> เมื่อเลือกเป้าหมายแล้ว คุณสามารถไปที่แท็บ <strong>"2. แคลอรี & สารอาหาร"</strong> เพื่อปรับตัวเลขกรัมและแคลอรีให้ตรงกับความต้องการเฉพาะบุคคลของคุณได้อย่างอิสระ
            </p>
          </div>
        </div>
      )}

      {/* SECTION 2: Calories & Macro Nutrients Fine-Tuning */}
      {activeSubSection === 'calories_macros' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h4 className="font-extrabold text-neutral-900 text-base">
              ปรับแต่งแคลอรีและสัดส่วนสารอาหารหลัก (Calories & Macros)
            </h4>
            <p className="text-neutral-500 text-xs mt-0.5">
              คุณสามารถระบุตัวเลขแคลอรีและจำนวนกรัมโปรตีน คาร์โบไฮเดรต และไขมันที่ต้องการต่อวันได้โดยตรง
            </p>
          </div>

          {/* Calorie Target Box */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-3xl border border-orange-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">
                  แคลอรีเป้าหมายต่อวัน (Daily Calorie Target)
                </label>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-orange-600">
                    {goals.customCalories}
                  </span>
                  <span className="text-sm font-bold text-orange-400">kcal / วัน</span>
                </div>
              </div>

              {/* Quick offset buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGoals({ ...goals, customCalories: Math.max(1000, goals.customCalories - 100) })}
                  className="px-3 py-1.5 rounded-xl bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all cursor-pointer"
                >
                  -100
                </button>
                <button
                  type="button"
                  onClick={() => setGoals({ ...goals, customCalories: Math.max(1000, goals.customCalories - 50) })}
                  className="px-3 py-1.5 rounded-xl bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all cursor-pointer"
                >
                  -50
                </button>
                <button
                  type="button"
                  onClick={() => setGoals({ ...goals, customCalories: goals.customCalories + 50 })}
                  className="px-3 py-1.5 rounded-xl bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all cursor-pointer"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => setGoals({ ...goals, customCalories: goals.customCalories + 100 })}
                  className="px-3 py-1.5 rounded-xl bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all cursor-pointer"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => setGoals({ ...goals, customCalories: tdee })}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  รีเซ็ตเป็น TDEE ({tdee})
                </button>
              </div>
            </div>

            {/* Direct Calorie Input */}
            <div className="pt-2 border-t border-orange-200/60 flex items-center gap-3">
              <input
                type="number"
                step="25"
                min="1000"
                max="5000"
                value={goals.customCalories}
                onChange={(e) => setGoals({ ...goals, customCalories: Number(e.target.value) || 1200 })}
                className="w-40 bg-white border border-orange-300 rounded-xl px-3 py-2 text-base font-black text-neutral-900 outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-xs font-semibold text-orange-800">
                {goals.customCalories < tdee
                  ? `(Deficit -${tdee - goals.customCalories} kcal จาก TDEE • TDEE > Target)`
                  : goals.customCalories > tdee
                    ? `(Surplus +${goals.customCalories - tdee} kcal จาก TDEE • TDEE < Target)`
                    : '(เท่ากับ TDEE • รักษาน้ำหนัก)'}
              </span>
            </div>
          </div>

          {/* Macro Nutrient Grams Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-neutral-900 text-sm">
                กำหนดกรัมของสารอาหารหลัก (Macronutrients Target)
              </h5>
              <span className="text-xs font-bold text-neutral-500">
                พลังงานรวมจากมาโคร: <strong className="text-neutral-900">{calculatedCaloriesFromMacros} kcal</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Protein Input */}
              <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-sky-800 flex items-center gap-1.5">
                    <Beef size={15} className="text-sky-600" />
                    <span>โปรตีน (Protein)</span>
                  </label>
                  <span className="text-[11px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-md">
                    {proteinPct}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="5"
                    min="30"
                    max="350"
                    value={goals.customProtein}
                    onChange={(e) => setGoals({ ...goals, customProtein: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-base font-black text-sky-900 outline-none focus:border-sky-500"
                  />
                  <span className="text-xs font-bold text-sky-600">กรัม/วัน</span>
                </div>
                <span className="text-[10px] text-sky-600 block">
                  ≈ {(((goals.customProtein || 0) / (currentWeight || 60)) || 0).toFixed(1)} กรัม/กก. ของน้ำหนักตัว
                </span>
              </div>

              {/* Carbs Input */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <Wheat size={15} className="text-emerald-600" />
                    <span>คาร์โบไฮเดรต (Carbs)</span>
                  </label>
                  <span className="text-[11px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                    {carbsPct}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="600"
                    value={goals.customCarbs}
                    onChange={(e) => setGoals({ ...goals, customCarbs: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-base font-black text-emerald-900 outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-600">กรัม/วัน</span>
                </div>
                <span className="text-[10px] text-emerald-600 block">
                  ให้พลังงาน {(goals.customCarbs * 4)} kcal
                </span>
              </div>

              {/* Fat Input */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                    <Droplet size={15} className="text-amber-600" />
                    <span>ไขมันดี (Healthy Fat)</span>
                  </label>
                  <span className="text-[11px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md">
                    {fatPct}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="5"
                    min="15"
                    max="200"
                    value={goals.customFat}
                    onChange={(e) => setGoals({ ...goals, customFat: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-base font-black text-amber-900 outline-none focus:border-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-600">กรัม/วัน</span>
                </div>
                <span className="text-[10px] text-amber-600 block">
                  ให้พลังงาน {(goals.customFat * 9)} kcal
                </span>
              </div>
            </div>
          </div>

          {/* Micro Nutrients Limits (Sugar & Sodium) */}
          <div className="pt-2 border-t border-neutral-100 space-y-3">
            <h5 className="font-extrabold text-neutral-900 text-sm">
              ขีดจำกัดน้ำตาลและโซเดียมต่อวัน (Sugar & Sodium Limits)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100 space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  🍭 น้ำตาลไม่เกิน (Sugar Limit)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="5"
                    value={goals.customSugarMax || 30}
                    onChange={(e) => setGoals({ ...goals, customSugarMax: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-sm font-black text-neutral-800 outline-none focus:border-orange-500"
                  />
                  <span className="text-xs font-bold text-neutral-400">กรัม/วัน</span>
                </div>
                <span className="text-[10px] text-neutral-400">มาตรฐานแนะนำ: ไม่เกิน 24-36 กรัม</span>
              </div>

              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100 space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  🧂 โซเดียมไม่เกิน (Sodium Limit)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="100"
                    value={goals.customSodiumMax || 2000}
                    onChange={(e) => setGoals({ ...goals, customSodiumMax: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-sm font-black text-neutral-800 outline-none focus:border-orange-500"
                  />
                  <span className="text-xs font-bold text-neutral-400">มิลลิกรัม (mg)</span>
                </div>
                <span className="text-[10px] text-neutral-400">มาตรฐานแนะนำ: ไม่เกิน 2,000 มิลลิกรัม</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Habits, Lifestyle & Body Targets */}
      {activeSubSection === 'habits_body' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h4 className="font-extrabold text-neutral-900 text-base">
              เป้าหมายวินัยประจำวัน & รูปร่าง (Habits, Lifestyle & Body)
            </h4>
            <p className="text-neutral-500 text-xs mt-0.5">
              กำหนดเป้าหมายน้ำดื่ม ก้าวเดิน ชั่วโมงการนอน และระยะเวลาอด/ทานอาหาร (IF)
            </p>
          </div>

          {/* Daily Habits Target Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Water Target */}
            <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-100 space-y-2">
              <label className="text-xs font-extrabold text-teal-800 flex items-center gap-1.5">
                <Droplets size={15} className="text-teal-600" />
                <span>ดื่มน้ำเป้าหมาย</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={goals.waterTarget}
                  onChange={(e) => setGoals({ ...goals, waterTarget: Number(e.target.value) || 8 })}
                  className="w-full bg-white border border-teal-200 rounded-xl px-3 py-2 text-base font-black text-teal-900 outline-none focus:border-teal-500"
                />
                <span className="text-xs font-bold text-teal-600">แก้ว/วัน</span>
              </div>
              <span className="text-[10px] text-teal-600">
                ≈ {(goals.waterTarget * 0.25).toFixed(1)} ลิตรต่อวัน
              </span>
            </div>

            {/* Steps Target */}
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
              <label className="text-xs font-extrabold text-indigo-800 flex items-center gap-1.5">
                <Footprints size={15} className="text-indigo-600" />
                <span>ก้าวเดินเป้าหมาย</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="500"
                  min="2000"
                  max="40000"
                  value={goals.stepsTarget}
                  onChange={(e) => setGoals({ ...goals, stepsTarget: Number(e.target.value) || 8000 })}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-base font-black text-indigo-900 outline-none focus:border-indigo-500"
                />
                <span className="text-xs font-bold text-indigo-600">ก้าว/วัน</span>
              </div>
              <span className="text-[10px] text-indigo-600">
                เผาผลาญประมาณ {Math.round(goals.stepsTarget * 0.04)} kcal
              </span>
            </div>

            {/* Sleep Target */}
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-2">
              <label className="text-xs font-extrabold text-purple-800 flex items-center gap-1.5">
                <Moon size={15} className="text-purple-600" />
                <span>การนอนหลับเป้าหมาย</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="12"
                  value={goals.sleepTarget}
                  onChange={(e) => setGoals({ ...goals, sleepTarget: Number(e.target.value) || 7.5 })}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-base font-black text-purple-900 outline-none focus:border-purple-500"
                />
                <span className="text-xs font-bold text-purple-600">ชม./คืน</span>
              </div>
              <span className="text-[10px] text-purple-600">
                เพื่อการฟื้นฟูและฮอร์โมนที่สมบูรณ์
              </span>
            </div>
          </div>

          {/* IF Fasting Window & Dietary Restrictions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-2">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Clock size={15} className="text-orange-500" />
                <span>การทำ IF (Fasting Window)</span>
              </label>
              <input
                type="text"
                value={goals.ifWindow}
                onChange={(e) => setGoals({ ...goals, ifWindow: e.target.value })}
                placeholder="เช่น 16/8 (ทาน 12:00 - 20:00) หรือ ไม่ได้ทำ IF"
                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 outline-none focus:border-orange-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['ไม่มี (กิน 3 มื้อ)', 'IF 16/8 (12:00-20:00)', 'IF 18/6 (12:00-18:00)', 'IF 14/10'].map((presetIf, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGoals({ ...goals, ifWindow: presetIf })}
                    className="text-[10px] bg-white border border-neutral-200 hover:border-orange-300 text-neutral-600 px-2 py-0.5 rounded-md cursor-pointer"
                  >
                    {presetIf}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-2">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>ข้อจำกัดอาหาร / แพ้อาหาร (Dietary Preferences)</span>
              </label>
              <input
                type="text"
                value={goals.dietaryRestrictions}
                onChange={(e) => setGoals({ ...goals, dietaryRestrictions: e.target.value })}
                placeholder="เช่น ไม่ทานเนื้อวัว, แพ้อาหารทะเล, มังสวิรัติ, ไม่ชอบหวาน"
                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-neutral-400 block">
                โค้ช AI จะนำข้อจำกัดนี้ไปคัดกรองเมนูอาหารที่แนะนำคุณเสมอ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: AI Coach Style & Custom Notes */}
      {activeSubSection === 'coach_style' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h4 className="font-extrabold text-neutral-900 text-base">
              เลือกบุคลิกและสไตล์ของโค้ช AI (Coach Persona)
            </h4>
            <p className="text-neutral-500 text-xs mt-0.5">
              เลือกวิธีที่โค้ช AI จะพูดคุย ให้กำลังใจ และตรวจการบ้านมื้ออาหารของคุณ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'friendly' as const,
                title: '🌟 โค้ชใจดี สายให้กำลังใจ (Friendly & Empathetic)',
                desc: 'อ่อนโยน เข้าใจความเหนื่อย ไม่ตัดสิน ให้กำลังใจเต็มเปี่ยม ช่วยหาทางออกเมื่อเผลอกินหลุด'
              },
              {
                id: 'strict_trainer' as const,
                title: '🔥 โค้ชสายยิม จริงจังเน้นวินัย (Strict Trainer)',
                desc: 'ตรงไปตรงมา ผลักดันให้ชนะใจตัวเอง ท้าทายให้มีวินัย เหมาะกับคนที่ต้องการแรงกระตุ้นสูง'
              },
              {
                id: 'clinical_dietitian' as const,
                title: '🔬 นักกำหนดอาหาร สายวิทยาศาสตร์ (Clinical Dietitian)',
                desc: 'อธิบายกลไกทางชีวเคมี ดัชนีน้ำตาล (GI) และข้อมูลโภชนาบำบัดเชิงลึกที่แม่นยำ'
              },
              {
                id: 'mindful_holistic' as const,
                title: '🌿 โค้ชสายสุขภาพองค์รวม (Mindful & Holistic)',
                desc: 'เน้นความสุขในการกิน ไม่ตึงเครียด ปรับเปลี่ยนพฤติกรรมอย่างยั่งยืนเพื่อสุขภาพระยะยาว'
              }
            ].map((persona) => {
              const isSelected = goals.coachPersona === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => setGoals({ ...goals, coachPersona: persona.id })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-orange-50/60 border-orange-400 ring-2 ring-orange-400/20 shadow-xs'
                      : 'bg-white border-neutral-200/80 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs sm:text-sm text-neutral-900">
                      {persona.title}
                    </h5>
                    {isSelected && (
                      <Check size={14} className="text-orange-600 font-bold" />
                    )}
                  </div>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    {persona.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Custom Note to Coach */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <span>✍️ โน้ต/เป้าหมายพิเศษที่อยากบอกโค้ช AI (Custom Special Instructions):</span>
            </label>
            <textarea
              rows={3}
              value={goals.notes}
              onChange={(e) => setGoals({ ...goals, notes: e.target.value })}
              placeholder="พิมพ์บอกโค้ชได้ทุกเรื่อง เช่น: 'อยากลดพุงก่อนงานแต่งเดือนหน้า', 'ไม่สะดวกทำกับข้าวเอง ขอแนะนำเมนูเซเว่นง่ายๆ', 'ช่วงนี้เครียดงาน ชอบหิวตอนดึก'..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-xs font-medium text-neutral-800 outline-none focus:bg-white focus:border-orange-500 transition-all leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Save Button Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-neutral-100 shadow-sm">
        <div className="text-xs text-neutral-500">
          เมื่อกดบันทึก โค้ช AI และระบบคำนวณสารอาหารของแอปจะอัปเดตเป้าหมายใหม่ทันที
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Check size={16} />
          <span>บันทึกการตั้งค่าเป้าหมายทั้งหมด</span>
        </button>
      </div>
    </div>
  );
};
