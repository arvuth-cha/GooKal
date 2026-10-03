import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  Flame, 
  TrendingDown, 
  TrendingUp, 
  Check, 
  X, 
  Sparkles, 
  Calculator, 
  Calendar,
  Zap,
  Info,
  ShieldAlert,
  Sliders,
  RotateCcw,
  User,
  Scale,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { 
  calculateAINutritionGoals, 
  calculateLocalSportsNutrition, 
  CalculatedNutritionPlan, 
  NutritionGoalParams 
} from '../../utils/aiNutritionCalculator';
import { formatDateDMY, formatDateDMYShort } from '../../utils/dateUtils';

export interface UserProfile {
  weight: number; // kg
  targetWeight?: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: number;
  goalType?: 'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom';
  targetCalories?: number; // เป้าหมายแคลอรีต่อวัน
  customMacros?: {
    carbs: number;
    protein: number;
    fat: number;
    sugar?: number;
    sodium?: number;
  };
  customBmr?: number;
  customTdee?: number;
  aiExplanation?: string;
  aiKeyTips?: string[];
  aiPlanTitle?: string;
  proteinPerKg?: number;
}

export interface CalorieTargetGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: number;
  bmr?: number;
  tdee?: number;
  currentTdee?: number;
  onSave?: (targetCalories: number, customMacros?: { carbs: number; protein: number; fat: number; sugar?: number; sodium?: number }) => void;
  onSaveGoal?: (targetCalories: number, customMacros?: { carbs: number; protein: number; fat: number; sugar?: number; sodium?: number }) => void;
  onSaveProfile?: (profile: any) => void;
  onToast?: (msg: string) => void;
}

export const CalorieTargetGoalModal: React.FC<CalorieTargetGoalModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  currentWeight: propWeight,
  targetWeight: propTargetWeight,
  height: propHeight,
  age: propAge,
  gender: propGender,
  activityLevel: propActivityLevel,
  bmr: propBmr,
  tdee: propTdee,
  currentTdee: propCurrentTdee,
  onSave,
  onSaveGoal,
  onSaveProfile,
  onToast
}) => {
  // Profile Stats State (can be tweaked live in the calculator)
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [weight, setWeight] = useState<number>(60);
  const [targetWeight, setTargetWeight] = useState<number>(55);
  const [height, setHeight] = useState<number>(165);
  const [age, setAge] = useState<number>(25);
  const [activityLevel, setActivityLevel] = useState<number>(1.2);
  const [showProfileTweaks, setShowProfileTweaks] = useState<boolean>(false);

  // Goal Mode State
  const [selectedGoalMode, setSelectedGoalMode] = useState<
    'lose_fast' | 'lose_moderate' | 'lose_slow' | 'maintain' | 'bulk_lean' | 'bulk_fast' | 'custom'
  >('lose_moderate');
  const [customOffset, setCustomOffset] = useState<number>(-350);
  const [directCalorieInput, setDirectCalorieInput] = useState<string>('');
  const [isDirectInputMode, setIsDirectInputMode] = useState<boolean>(false);

  // Macro Split State
  const [selectedMacroSplit, setSelectedMacroSplit] = useState<
    'high_protein' | 'balanced' | 'low_carb' | 'keto' | 'muscle_builder' | 'custom'
  >('high_protein');
  const [customMacroPercent, setCustomMacroPercent] = useState<{ protein: number; carbs: number; fat: number }>({
    protein: 35,
    carbs: 40,
    fat: 25
  });

  // AI Calculation State
  const [isAiCalculating, setIsAiCalculating] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<CalculatedNutritionPlan | null>(null);
  const [showAiReasoning, setShowAiReasoning] = useState<boolean>(false);

  // Sync state whenever modal opens or props update
  useEffect(() => {
    if (isOpen) {
      const g = propGender || userProfile?.gender || 'female';
      const w = propWeight || userProfile?.weight || 60;
      const tw = propTargetWeight || userProfile?.targetWeight || (w > 50 ? w - 5 : 50);
      const h = propHeight || userProfile?.height || 165;
      const a = propAge || userProfile?.age || 25;
      const act = propActivityLevel || userProfile?.activityLevel || 1.2;

      setGender(g);
      setWeight(w);
      setTargetWeight(tw);
      setHeight(h);
      setAge(a);
      setActivityLevel(act);

      // If user already has custom macros in profile, map them
      if (userProfile?.customMacros) {
        setSelectedMacroSplit('custom');
        const cP = userProfile.customMacros.protein;
        const cC = userProfile.customMacros.carbs;
        const cF = userProfile.customMacros.fat;
        const totalCals = (cP * 4) + (cC * 4) + (cF * 9);
        if (totalCals > 0) {
          setCustomMacroPercent({
            protein: Math.round(((cP * 4) / totalCals) * 100),
            carbs: Math.round(((cC * 4) / totalCals) * 100),
            fat: Math.max(0, 100 - Math.round(((cP * 4) / totalCals) * 100) - Math.round(((cC * 4) / totalCals) * 100)),
          });
        }
      }

      // If user already has a custom goal, initialize nicely
      if (userProfile?.targetCalories) {
        setDirectCalorieInput(userProfile.targetCalories.toString());
      } else if (userProfile?.customTdee) {
        setDirectCalorieInput(userProfile.customTdee.toString());
      }
    }
  }, [isOpen, userProfile, propGender, propWeight, propTargetWeight, propHeight, propAge, propActivityLevel]);

  // AI Auto-Pilot Handler
  const handleAiAutoPilot = async () => {
    setIsAiCalculating(true);
    try {
      // Map current goal mode to AI nutrition goal
      let mappedGoalType: 'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom' = 'fat_loss';
      if (selectedGoalMode === 'maintain') mappedGoalType = 'balanced';
      else if (selectedGoalMode === 'lose_fast') mappedGoalType = 'fat_loss_fast';
      else if (selectedGoalMode === 'lose_moderate') mappedGoalType = 'fat_loss';
      else if (selectedGoalMode === 'lose_slow') mappedGoalType = 'muscle_maintain';
      else if (selectedGoalMode === 'bulk_lean' || selectedGoalMode === 'bulk_fast') mappedGoalType = 'muscle_build';
      if (selectedMacroSplit === 'keto') mappedGoalType = 'keto';

      const params: NutritionGoalParams = {
        gender: gender,
        age: Number(age) || 25,
        weight: Number(weight) || 60,
        height: Number(height) || 165,
        targetWeight: Number(targetWeight) || 55,
        activityLevel: Number(activityLevel) || 1.2,
        goalType: mappedGoalType,
        customNotes: `คำนวณเป้าหมายให้แม่นยำที่สุดสำหรับเป้าหมาย ${selectedGoalMode}`
      };

      const plan = await calculateAINutritionGoals(params);
      setAiResult(plan);

      // Auto-set the exact daily calories and macro percentages
      setIsDirectInputMode(true);
      setDirectCalorieInput(plan.dailyCalories.toString());

      // Set exact macro split
      setSelectedMacroSplit('custom');
      setCustomMacroPercent({
        protein: plan.proteinPct,
        carbs: plan.carbsPct,
        fat: plan.fatPct,
      });

      setShowAiReasoning(true);

      if (onToast) {
        onToast(`✨ AI ตั้งค่าให้เสร็จสมบูรณ์: พลังงาน ${plan.dailyCalories} kcal • โปรตีน ${plan.proteinGrams}g (${plan.proteinPerKg}g/kg)`);
      }
    } catch (err) {
      console.error('AI Calculation error:', err);
      if (onToast) {
        onToast('เกิดข้อผิดพลาดในการเรียก AI กำลังใช้สูตรมาตรฐานเวชศาสตร์การกีฬาแทน');
      }
    } finally {
      setIsAiCalculating(false);
    }
  };

  // Real-time BMR (Mifflin-St Jeor Formula)
  const calculatedBmr = useMemo(() => {
    const w = Number(weight) || 60;
    const h = Number(height) || 165;
    const a = Number(age) || 25;
    if (gender === 'male') {
      return Math.round(10 * w + 6.25 * h - 5 * a + 5);
    } else {
      return Math.round(10 * w + 6.25 * h - 5 * a - 161);
    }
  }, [weight, height, age, gender]);

  // Real-time Baseline Maintenance TDEE
  const calculatedTdee = useMemo(() => {
    const act = Number(activityLevel) || 1.2;
    return Math.round(calculatedBmr * act);
  }, [calculatedBmr, activityLevel]);

  // Calorie Offset logic
  const getCalorieOffset = () => {
    switch (selectedGoalMode) {
      case 'lose_fast': return -500;
      case 'lose_moderate': return -350;
      case 'lose_slow': return -200;
      case 'maintain': return 0;
      case 'bulk_lean': return 250;
      case 'bulk_fast': return 500;
      case 'custom': return customOffset;
    }
  };

  const offset = getCalorieOffset();

  // Final Target Calories per day
  const calculatedDailyCalories = useMemo(() => {
    if (isDirectInputMode && directCalorieInput) {
      const parsed = Number(directCalorieInput);
      return isNaN(parsed) || parsed <= 0 ? calculatedTdee : Math.round(parsed);
    }
    return Math.max(800, Math.round(calculatedTdee + offset));
  }, [calculatedTdee, offset, isDirectInputMode, directCalorieInput]);

  // Macro calculations
  const macros = useMemo(() => {
    let pPct = 35;
    let cPct = 40;
    let fPct = 25;

    if (selectedMacroSplit === 'balanced') {
      pPct = 30;
      cPct = 45;
      fPct = 25;
    } else if (selectedMacroSplit === 'low_carb') {
      pPct = 35;
      cPct = 20;
      fPct = 45;
    } else if (selectedMacroSplit === 'keto') {
      pPct = 20;
      cPct = 5;
      fPct = 75;
    } else if (selectedMacroSplit === 'muscle_builder') {
      pPct = 30;
      cPct = 50;
      fPct = 20;
    } else if (selectedMacroSplit === 'custom') {
      pPct = customMacroPercent.protein;
      cPct = customMacroPercent.carbs;
      fPct = customMacroPercent.fat;
    }

    const proteinG = Math.max(10, Math.round((calculatedDailyCalories * (pPct / 100)) / 4));
    const carbsG = Math.max(10, Math.round((calculatedDailyCalories * (cPct / 100)) / 4));
    const fatG = Math.max(10, Math.round((calculatedDailyCalories * (fPct / 100)) / 9));
    const sugarG = Math.min(30, Math.max(15, Math.round((calculatedDailyCalories * 0.05) / 4)));
    const sodiumMg = 2000;

    return {
      proteinG,
      carbsG,
      fatG,
      sugarG,
      sodiumMg,
      pPct,
      cPct,
      fPct
    };
  }, [calculatedDailyCalories, selectedMacroSplit, customMacroPercent]);

  // Timeline Estimator
  const timeline = useMemo(() => {
    const w = Number(weight) || 60;
    const tw = Number(targetWeight) || w;
    const diff = Math.abs(w - tw);
    const dailyBalance = calculatedDailyCalories - calculatedTdee; // negative is deficit, positive is surplus
    const weeklyKgChange = (dailyBalance * 7) / 7700; // 7,700 kcal ≈ 1 kg fat

    if (diff === 0 || weeklyKgChange === 0) {
      return {
        weeks: 0,
        weeklyChangeStr: 'คงที่',
        targetDateStr: 'ถึงเป้าหมายแล้ว',
        isRealistic: true
      };
    }

    // Check if goal direction matches weight direction
    const isLosing = tw < w;
    const isGaining = tw > w;
    const isCorrectDirection = (isLosing && dailyBalance < 0) || (isGaining && dailyBalance > 0);

    const rawWeeks = Math.ceil(diff / Math.abs(weeklyKgChange));
    const weeks = isNaN(rawWeeks) || !isFinite(rawWeeks) ? 0 : Math.min(150, rawWeeks);

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + weeks * 7);
    const targetDateStr = `${formatDateDMYShort(projectedDate)} (${formatDateDMY(projectedDate)})`;

    return {
      weeks,
      weeklyChangeStr: `${weeklyKgChange > 0 ? '+' : ''}${weeklyKgChange.toFixed(2)} kg / สัปดาห์`,
      targetDateStr,
      isRealistic: isCorrectDirection
    };
  }, [weight, targetWeight, calculatedDailyCalories, calculatedTdee]);

  if (!isOpen) return null;

  const handleApply = () => {
    const finalMacros = {
      protein: macros.proteinG,
      carbs: macros.carbsG,
      fat: macros.fatG,
      sugar: macros.sugarG,
      sodium: macros.sodiumMg
    };

    // Call callbacks
    if (onSave) {
      onSave(calculatedDailyCalories, finalMacros);
    }
    if (onSaveGoal) {
      onSaveGoal(calculatedDailyCalories, finalMacros);
    }

    const updated = {
      ...(userProfile || {}),
      weight: Number(weight) || userProfile?.weight || 59,
      targetWeight: Number(targetWeight) || userProfile?.targetWeight || 59,
      height: Number(height) || userProfile?.height || 167,
      age: Number(age) || userProfile?.age || 59,
      gender: gender,
      activityLevel: Number(activityLevel) || 1.375,
      customTdee: calculatedTdee,
      targetCalories: calculatedDailyCalories,
      customMacros: finalMacros
    };

    if (onSaveProfile) {
      onSaveProfile(updated);
    }

    try {
      localStorage.setItem('kalguru_profile', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to sync to profile storage:', e);
    }

    if (onToast) {
      onToast(`🎯 บันทึกเป้าหมายแคลอรีใหม่ ${calculatedDailyCalories.toLocaleString()} kcal/วัน เรียบร้อย!`);
    }

    onClose();
  };

  const isBelowBmr = calculatedDailyCalories < calculatedBmr;
  const isTooLow = (gender === 'female' && calculatedDailyCalories < 1200) || (gender === 'male' && calculatedDailyCalories < 1400);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-amber-50/50 via-orange-50/20 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Target size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight flex items-center gap-1.5">
                คำนวณเป้าหมายแคลอรี & มาโคร
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  TDEE & Deficit
                </span>
              </h2>
              <p className="text-xs text-neutral-500 font-medium">คำนวณพลังงานที่เหมาะสมตามสรีระและเป้าหมายหุ่นของคุณ</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 🌟 AI AUTO-PILOT BANNER & ONE-CLICK NUTRITION OPTIMIZER 🌟 */}
          <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-200/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                    ให้ AI จัดการคำนวณ & ตั้งค่าอัตโนมัติ
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-600 text-white shadow-2xs">
                      AI Auto-Pilot
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-600 font-medium">
                    คำนวณแคลอรี โปรตีน (g/kg) คาร์บ ไขมัน โซเดียม และน้ำตาลที่แม่นยำตามหลักโภชนาการคลินิก
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAiAutoPilot}
                disabled={isAiCalculating}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isAiCalculating ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>AI กำลังวิเคราะห์สรีระ & มาโครสารอาหาร...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="text-amber-200" />
                    <span>✨ ให้ AI คำนวณและตั้งค่าสารอาหารทั้งหมดให้ทันที</span>
                  </>
                )}
              </button>

              {aiResult && (
                <button
                  type="button"
                  onClick={() => setShowAiReasoning(!showAiReasoning)}
                  className="py-2.5 px-3 rounded-2xl bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Info size={14} />
                  {showAiReasoning ? 'ซ่อนบทวิเคราะห์ AI' : 'ดูบทวิเคราะห์ AI'}
                </button>
              )}
            </div>

            {/* AI Reasoning Insight Box */}
            {aiResult && showAiReasoning && (
              <div className="p-3.5 rounded-2xl bg-white/95 border border-orange-200/90 text-xs text-neutral-700 space-y-2 animate-in fade-in duration-200 shadow-2xs">
                <div className="flex items-center justify-between font-bold text-orange-800 border-b border-orange-100 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-green-600" />
                    {aiResult.planTitle}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    โปรตีน {aiResult.proteinPerKg}g / กก.
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-600">
                  {aiResult.explanation}
                </p>
                {aiResult.keyTips && aiResult.keyTips.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-neutral-100">
                    <span className="text-[10px] font-bold text-neutral-500 block">💡 เคล็ดลับจาก AI:</span>
                    <ul className="space-y-0.5 text-[11px] text-neutral-600 list-disc list-inside">
                      {aiResult.keyTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Base Stats Preview & Quick Profile Tweaks */}
          <div className="bg-neutral-50 rounded-3xl p-4 border border-neutral-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-orange-500" />
                <span className="text-xs font-bold text-neutral-700">ค่าพลังงานพื้นฐานของคุณ (Mifflin-St Jeor)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileTweaks(!showProfileTweaks)}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-xl border border-neutral-200 shadow-2xs"
              >
                <Sliders size={12} />
                {showProfileTweaks ? 'ซ่อนแก้ไขสรีระ' : 'แก้ไขข้อมูลสรีระ'}
                {showProfileTweaks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {/* Profile Inputs Accordion */}
            {showProfileTweaks && (
              <div className="pt-3 border-t border-neutral-200/70 grid grid-cols-2 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">เพศ</label>
                  <div className="flex rounded-xl bg-white border border-neutral-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${gender === 'female' ? 'bg-orange-500 text-white' : 'text-neutral-600'}`}
                    >
                      หญิง
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${gender === 'male' ? 'bg-orange-500 text-white' : 'text-neutral-600'}`}
                    >
                      ชาย
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">น้ำหนักปัจจุบัน (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">ส่วนสูง (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">น้ำหนักเป้าหมาย (kg)</label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-600 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-neutral-500 block mb-1">ระดับกิจกรรม</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-neutral-800 outline-none focus:border-orange-500"
                  >
                    <option value={1.2}>นั่งทำงาน (1.2)</option>
                    <option value={1.375}>เบา 1-3 วัน (1.375)</option>
                    <option value={1.55}>ปานกลาง 3-5 วัน (1.55)</option>
                    <option value={1.725}>หนัก 6-7 วัน (1.725)</option>
                    <option value={1.9}>หนักมาก/นักกีฬา (1.9)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Live BMR & TDEE Pills */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">BMR เผาผลาญพื้นฐาน</span>
                  <span className="text-[10px] font-medium text-neutral-400">นอนเฉยๆ</span>
                </div>
                <p className="text-base sm:text-lg font-black text-neutral-800 mt-0.5">
                  {calculatedBmr.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kcal</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-500 uppercase">TDEE เผาผลาญรวม</span>
                  <span className="text-[10px] font-medium text-amber-600 font-bold">บวกกิจกรรม</span>
                </div>
                <p className="text-base sm:text-lg font-black text-amber-600 mt-0.5">
                  {calculatedTdee.toLocaleString()} <span className="text-xs font-normal text-neutral-500">kcal</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Goal Selectors */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Flame size={14} className="text-orange-500" />
                1. เลือกทิศทางเป้าหมายพลังงาน:
              </label>
              <button
                type="button"
                onClick={() => setIsDirectInputMode(!isDirectInputMode)}
                className="text-[11px] font-bold text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
              >
                {isDirectInputMode ? '🔄 ใช้โหมดพรีเซ็ต Deficit' : '✍️ กรอกตัวเลขแคลอรีตรงๆ'}
              </button>
            </div>

            {isDirectInputMode ? (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <label className="text-xs font-bold text-neutral-700 block">ระบุเป้าหมายแคลอรีต่อวัน (Target Intake Goal):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={directCalorieInput}
                    onChange={(e) => setDirectCalorieInput(e.target.value)}
                    placeholder={calculatedTdee.toString()}
                    className="flex-1 bg-white border border-amber-300 rounded-xl px-4 py-2 text-base font-black text-neutral-900 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-neutral-500">kcal / วัน</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  TDEE เผาผลาญจริงของคุณคือ <strong>{calculatedTdee} kcal</strong> | 
                  {Number(directCalorieInput) < calculatedTdee ? (
                    <span className="text-emerald-700 font-bold ml-1">
                      Deficit -{calculatedTdee - Number(directCalorieInput)} kcal (TDEE {calculatedTdee} &gt; เป้าหมาย {directCalorieInput})
                    </span>
                  ) : Number(directCalorieInput) > calculatedTdee ? (
                    <span className="text-rose-700 font-bold ml-1">
                      Surplus +{Number(directCalorieInput) - calculatedTdee} kcal (TDEE {calculatedTdee} &lt; เป้าหมาย {directCalorieInput})
                    </span>
                  ) : (
                    <span className="text-neutral-700 font-bold ml-1">เท่ากับ TDEE (รักษาน้ำหนัก)</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'lose_moderate', name: '🥗 ลดไขมันมาตรฐาน (Deficit -350 kcal)', desc: 'TDEE > เป้าหมาย • ลด ~0.35 kg/สัปดาห์', badge: 'แนะนำ' },
                  { id: 'lose_fast', name: '⚡ ลดไขมันเร่งด่วน (Deficit -500 kcal)', desc: 'TDEE > เป้าหมาย • ลด ~0.5 kg/สัปดาห์ ปลอดภัย' },
                  { id: 'lose_slow', name: '🥑 ลดไขมันสบายๆ (Deficit -200 kcal)', desc: 'TDEE > เป้าหมาย • ชิลๆ ค่อยเป็นค่อยไป' },
                  { id: 'maintain', name: '⚖️ รักษาน้ำหนักคงที่ (เท่า TDEE)', desc: 'ทานเท่าอัตราเผาผลาญ รักษารูปร่างเดิม' },
                  { id: 'bulk_lean', name: '💪 เพิ่มกล้ามเนื้อลีน (Surplus +250 kcal)', desc: 'TDEE < เป้าหมาย • เสริมสร้างกล้ามเนื้อ' },
                  { id: 'bulk_fast', name: '🚀 เพิ่มน้ำหนัก/บัลค์กล้าม (Surplus +500 kcal)', desc: 'TDEE < เป้าหมาย • สำหรับคนผอมมาก' }
                ].map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoalMode(g.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      selectedGoalMode === g.id
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                        : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs">{g.name}</div>
                      {g.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${selectedGoalMode === g.id ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                          {g.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-1 ${selectedGoalMode === g.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {g.desc}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Calculated Energy Highlight Card */}
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-5 text-white shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                <Sparkles size={14} />
                เป้าหมายแคลอรีที่ต้องทานต่อวัน (Target Goal)
              </span>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
                {calculatedDailyCalories - calculatedTdee > 0 
                  ? `Surplus +${calculatedDailyCalories - calculatedTdee}` 
                  : calculatedDailyCalories - calculatedTdee < 0 
                    ? `Deficit -${Math.abs(calculatedDailyCalories - calculatedTdee)}` 
                    : 'Maintenance (0)'} kcal
              </span>
            </div>

            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
                {calculatedDailyCalories.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-amber-100">kcal / วัน</span>
            </div>

            {/* TDEE & Deficit / Surplus Formula Note */}
            <div className="pt-2.5 border-t border-white/20 text-[11px] font-semibold text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 relative z-10">
              <span>BMR (พักผ่อน): <strong>{calculatedBmr} kcal</strong></span>
              <span>
                {calculatedDailyCalories < calculatedTdee ? (
                  <>TDEE จริง: <strong>{calculatedTdee} kcal</strong> &gt; เป้าหมาย ({calculatedDailyCalories} kcal) | Deficit = {calculatedTdee - calculatedDailyCalories} kcal</>
                ) : calculatedDailyCalories > calculatedTdee ? (
                  <>TDEE จริง: <strong>{calculatedTdee} kcal</strong> &lt; เป้าหมาย ({calculatedDailyCalories} kcal) | Surplus = +{calculatedDailyCalories - calculatedTdee} kcal</>
                ) : (
                  <>TDEE จริง: <strong>{calculatedTdee} kcal</strong> = เป้าหมาย (ทานเท่าอัตราเผาผลาญ)</>
                )}
              </span>
            </div>

            {/* Timeline & Projection */}
            {timeline.weeks > 0 && targetWeight && (
              <div className="pt-2.5 border-t border-white/20 text-xs text-amber-50 space-y-1 relative z-10">
                <div className="flex items-center gap-1.5 font-bold">
                  <Calendar size={14} className="shrink-0" />
                  <span>
                    คาดว่าจะถึงเป้าหมาย <strong className="text-white underline">{targetWeight} kg</strong> ในอีกประมาณ <strong className="text-white">{timeline.weeks} สัปดาห์</strong> ({Math.round(timeline.weeks / 4.3) || 1} เดือน)
                  </span>
                </div>
                <div className="text-[11px] text-amber-100/90 pl-5">
                  ความเร็วเป้าหมาย: <strong>{timeline.weeklyChangeStr}</strong> (ประมาณการวันที่ {timeline.targetDateStr})
                </div>
              </div>
            )}
          </div>

          {/* Safety Notice if too low */}
          {isBelowBmr && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">ข้อแนะนำด้านสุขภาพ:</strong>
                เป้าหมายนี้ต่ำกว่าอัตราเผาผลาญพื้นฐาน BMR ({calculatedBmr} kcal) แนะนำไม่ควรทำต่อเนื่องเกิน 4-6 สัปดาห์ หรือปรับเพิ่มคาร์บ/โปรตีนให้เพียงพอเพื่อป้องกันกล้ามเนื้อสลาย
              </div>
            </div>
          )}

          {/* Section 3: Macro Split Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Zap size={14} className="text-orange-500" />
              2. เลือกสัดส่วนสารอาหารหลัก (Macronutrient Split):
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'high_protein', label: '🥩 เน้นโปรตีนสูง', desc: 'P35 C40 F25 (แนะนำลีน)' },
                { id: 'balanced', label: '🥗 สมดุลสุขภาพ', desc: 'P30 C45 F25 (ทั่วไป)' },
                { id: 'low_carb', label: '🥑 โลว์คาร์บ', desc: 'P35 C20 F45 (ลดแป้ง)' },
                { id: 'keto', label: '🧀 คีโตเจนิค', desc: 'P20 C5 F75 (ตัดแป้ง)' },
                { id: 'muscle_builder', label: '🏋️ เพาะกายสร้างกล้าม', desc: 'P30 C50 F20 (High Carb)' },
                { id: 'custom', label: '⚙️ กำหนดสัดส่วนเอง', desc: 'ปรับสไลเดอร์ตามใจ' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMacroSplit(m.id as any)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedMacroSplit === m.id
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="font-bold text-xs">{m.label}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedMacroSplit === m.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Macro Sliders if custom is selected */}
            {selectedMacroSplit === 'custom' && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                  <span>ปรับเปอร์เซ็นต์ (รวมต้องได้ 100%):</span>
                  <span className={`font-black ${customMacroPercent.protein + customMacroPercent.carbs + customMacroPercent.fat === 100 ? 'text-green-600' : 'text-red-500'}`}>
                    รวม: {customMacroPercent.protein + customMacroPercent.carbs + customMacroPercent.fat}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 font-bold">โปรตีน (Protein)</span>
                    <span className="font-black text-rose-600">{customMacroPercent.protein}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={customMacroPercent.protein}
                    onChange={(e) => setCustomMacroPercent(prev => ({ ...prev, protein: Number(e.target.value) }))}
                    className="w-full accent-rose-500"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 font-bold">คาร์โบไฮเดรต (Carbs)</span>
                    <span className="font-black text-amber-600">{customMacroPercent.carbs}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    value={customMacroPercent.carbs}
                    onChange={(e) => setCustomMacroPercent(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                    className="w-full accent-amber-500"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 font-bold">ไขมัน (Fat)</span>
                    <span className="font-black text-blue-600">{customMacroPercent.fat}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={customMacroPercent.fat}
                    onChange={(e) => setCustomMacroPercent(prev => ({ ...prev, fat: Number(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Calculated Grams breakdown */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-center">
                <span className="text-[10px] font-bold text-rose-700 block">โปรตีน ({macros.pPct}%)</span>
                <strong className="text-rose-950 text-base sm:text-lg font-black block mt-0.5">{macros.proteinG}g</strong>
                <span className="text-[10px] text-rose-600 font-medium">~{macros.proteinG * 4} kcal</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
                <span className="text-[10px] font-bold text-amber-700 block">คาร์โบไฮเดรต ({macros.cPct}%)</span>
                <strong className="text-amber-950 text-base sm:text-lg font-black block mt-0.5">{macros.carbsG}g</strong>
                <span className="text-[10px] text-amber-600 font-medium">~{macros.carbsG * 4} kcal</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center">
                <span className="text-[10px] font-bold text-blue-700 block">ไขมัน ({macros.fPct}%)</span>
                <strong className="text-blue-950 text-base sm:text-lg font-black block mt-0.5">{macros.fatG}g</strong>
                <span className="text-[10px] text-blue-600 font-medium">~{macros.fatG * 9} kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} className="text-orange-400" />
            บันทึกและนำเป้าหมายนี้ไปใช้ ({calculatedDailyCalories.toLocaleString()} kcal)
          </button>
        </div>
      </div>
    </div>
  );
};
