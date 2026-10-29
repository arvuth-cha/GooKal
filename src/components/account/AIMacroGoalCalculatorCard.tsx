import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Sliders, 
  Save, 
  RotateCcw, 
  Info, 
  Droplet, 
  Plus, 
  Minus, 
  Check, 
  Target, 
  Scale, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  Flame,
  TrendingDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  calculateLocalSportsNutrition, 
  calculateAINutritionGoals,
  NutritionGoalParams, 
  CalculatedNutritionPlan 
} from '../../utils/aiNutritionCalculator';
import { playSuccessChime, triggerHaptic } from '../../utils/voiceService';

export interface UserProfile {
  weight: number;
  targetWeight?: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: number;
  goalType?: 'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom';
  targetCalories?: number;
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

interface AIMacroGoalCalculatorCardProps {
  userProfile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile, notifyUser?: boolean) => void;
  onToast: (msg: string) => void;
  onOpenDetailedModal?: () => void;
}

type GoalKey = 'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom';

interface DeficitPreset {
  id: string;
  label: string;
  offset: number;
  badge: string;
  sub: string;
  icon: string;
}

const DEFICIT_PRESETS: DeficitPreset[] = [
  {
    id: 'maintenance',
    label: 'รักษารูปร่าง (สมดุล)',
    offset: 0,
    badge: '0 kcal (สมดุล)',
    sub: 'รักษาน้ำหนักและคงระดับการเผาผลาญ',
    icon: '⚖️'
  },
  {
    id: 'mild_deficit',
    label: 'ลดไขมันชิลๆ',
    offset: -200,
    badge: '-200 kcal',
    sub: 'ไม่โหย ลดไขมัน ~0.8 กก./เดือน',
    icon: '🍃'
  },
  {
    id: 'standard_deficit',
    label: 'ลดไขมันมาตรฐาน',
    offset: -350,
    badge: '-350 kcal',
    sub: 'แนะนำทั่วไป ลดไขมัน ~1.4 กก./เดือน',
    icon: '🔥'
  },
  {
    id: 'fast_deficit',
    label: 'ลดไขมันเร่งด่วน',
    offset: -500,
    badge: '-500 kcal',
    sub: 'เข้มข้น ลดไขมัน ~2.0 กก./เดือน',
    icon: '⚡'
  },
  {
    id: 'lean_bulk',
    label: 'เพิ่มกล้ามลีน',
    offset: 200,
    badge: '+200 kcal',
    sub: 'Lean Bulk เสริมกล้ามเนื้อ ไม่เพิ่มไขมัน',
    icon: '💪'
  },
  {
    id: 'heavy_bulk',
    label: 'เพิ่มมวลรวม / น้ำหนัก',
    offset: 400,
    badge: '+400 kcal',
    sub: 'สำหรับคนผอม เพิ่มกล้าม & น้ำหนัก',
    icon: '🏋️'
  }
];

const GOAL_OPTIONS: { 
  id: GoalKey; 
  label: string; 
  sub: string;
  recommendedProteinPerKg: number;
  calorieOffset: number;
  carbRatio: number;
  fatRatio: number;
}[] = [
  { 
    id: 'muscle_maintain', 
    label: '🛡️ รักษากล้ามเนื้อ / ลีน', 
    sub: 'โปรตีน 1.6 g/kg (Deficit -250)',
    recommendedProteinPerKg: 1.6,
    calorieOffset: -250,
    carbRatio: 0.50,
    fatRatio: 0.25
  },
  { 
    id: 'muscle_build', 
    label: '💪 สร้างกล้ามเนื้อ / เพิ่มมวล', 
    sub: 'โปรตีน 1.8 - 2.0 g/kg (Surplus +250)',
    recommendedProteinPerKg: 1.8,
    calorieOffset: 250,
    carbRatio: 0.50,
    fatRatio: 0.25
  },
  { 
    id: 'fat_loss', 
    label: '⚡ ลดไขมันมาตรฐาน', 
    sub: 'โปรตีน 1.6 g/kg (Deficit -350)',
    recommendedProteinPerKg: 1.6,
    calorieOffset: -350,
    carbRatio: 0.45,
    fatRatio: 0.25
  },
  { 
    id: 'fat_loss_fast', 
    label: '🔥 ลดไขมันเร่งด่วน', 
    sub: 'โปรตีน 1.8 g/kg (Deficit -500)',
    recommendedProteinPerKg: 1.8,
    calorieOffset: -500,
    carbRatio: 0.40,
    fatRatio: 0.25
  },
  { 
    id: 'keto', 
    label: '🥑 โลว์คาร์บ / คีโต', 
    sub: 'โปรตีน 1.5 g/kg • Low Carb',
    recommendedProteinPerKg: 1.5,
    calorieOffset: -300,
    carbRatio: 0.15,
    fatRatio: 0.55
  },
  { 
    id: 'balanced', 
    label: '🥗 สุขภาพสมดุลทั่วไป', 
    sub: 'โปรตีน 1.2 g/kg (สมดุล TDEE)',
    recommendedProteinPerKg: 1.2,
    calorieOffset: 0,
    carbRatio: 0.50,
    fatRatio: 0.25
  },
];

export const AIMacroGoalCalculatorCard: React.FC<AIMacroGoalCalculatorCardProps> = ({
  userProfile,
  onSaveProfile,
  onToast,
  onOpenDetailedModal
}) => {
  const safeWeight = Math.max(30, Number(userProfile.weight) || 60);
  const safeHeight = Math.max(100, Number(userProfile.height) || 165);
  const safeAge = Math.max(12, Math.min(100, Number(userProfile.age) || 28));
  const safeGender = userProfile.gender || 'male';
  const safeAct = Number(userProfile.activityLevel) || 1.375;

  // Calculate live BMR & TDEE
  const calculatedBmr = safeGender === 'male'
    ? Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) + 5)
    : Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) - 161);
  const bmr = userProfile.customBmr || calculatedBmr;
  const calculatedTdee = Math.round(bmr * safeAct);
  const tdee = userProfile.customTdee || calculatedTdee;

  // Selected goal
  const [selectedGoal, setSelectedGoal] = useState<GoalKey>(
    userProfile.goalType || 'muscle_maintain'
  );
  
  const [isCalculatingAI, setIsCalculatingAI] = useState(false);
  const [showExplanationDetail, setShowExplanationDetail] = useState(false);
  const [plan, setPlan] = useState<CalculatedNutritionPlan | null>(null);

  // Protein adjustment mode: 'g_per_kg' vs 'grams_per_day'
  const [proteinInputMode, setProteinInputMode] = useState<'g_per_kg' | 'grams_per_day'>('g_per_kg');

  // Core interactive states
  const [proteinGrams, setProteinGrams] = useState<number>(() => {
    return userProfile.customMacros?.protein || Math.round(safeWeight * 1.6);
  });
  const [proteinPerKg, setProteinPerKg] = useState<number>(() => {
    return userProfile.proteinPerKg || Math.round(((userProfile.customMacros?.protein || Math.round(safeWeight * 1.6)) / safeWeight) * 10) / 10;
  });
  const [carbsGrams, setCarbsGrams] = useState<number>(() => {
    return userProfile.customMacros?.carbs || 180;
  });
  const [fatGrams, setFatGrams] = useState<number>(() => {
    return userProfile.customMacros?.fat || 50;
  });
  const [targetCalories, setTargetCalories] = useState<number>(() => {
    if (userProfile.targetCalories) return userProfile.targetCalories;
    if (userProfile.customMacros) {
      return (userProfile.customMacros.protein * 4) + (userProfile.customMacros.carbs * 4) + (userProfile.customMacros.fat * 9);
    }
    return Math.max(1200, tdee - 350);
  });

  const [sugarGrams, setSugarGrams] = useState<number>(userProfile.customMacros?.sugar || 24);
  const [sodiumMg, setSodiumMg] = useState<number>(userProfile.customMacros?.sodium || 2000);

  // Deficit / Surplus offset relative to TDEE
  const calorieDiffFromTdee = targetCalories - tdee;
  const isDeficit = calorieDiffFromTdee < 0;
  const isSurplus = calorieDiffFromTdee > 0;

  // Track if this initial state is synced with incoming userProfile changes
  const prevWeightRef = useRef(safeWeight);

  useEffect(() => {
    const params: NutritionGoalParams = {
      gender: safeGender,
      age: safeAge,
      weight: safeWeight,
      height: safeHeight,
      targetWeight: userProfile.targetWeight || safeWeight,
      activityLevel: safeAct,
      goalType: selectedGoal,
    };
    const localPlan = calculateLocalSportsNutrition(params);
    setPlan(localPlan);

    // If weight changed significantly from outside, adjust protein grams to match proteinPerKg
    if (Math.abs(prevWeightRef.current - safeWeight) >= 0.5) {
      prevWeightRef.current = safeWeight;
      const newP = Math.round(proteinPerKg * safeWeight);
      setProteinGrams(newP);
      const newCals = (newP * 4) + (carbsGrams * 4) + (fatGrams * 9);
      setTargetCalories(newCals);
    }
  }, [safeWeight, safeHeight, safeAge, safeGender, safeAct, selectedGoal]);

  // Sync with profile prop if customMacros changed externally
  useEffect(() => {
    if (userProfile.customMacros) {
      const p = Number(userProfile.customMacros.protein) || Math.round(safeWeight * 1.6);
      const c = Number(userProfile.customMacros.carbs) || 180;
      const f = Number(userProfile.customMacros.fat) || 50;
      const s = Number(userProfile.customMacros.sugar) || 24;
      const sod = Number(userProfile.customMacros.sodium) || 2000;
      setProteinGrams(p);
      setProteinPerKg(Math.round((p / safeWeight) * 10) / 10);
      setCarbsGrams(c);
      setFatGrams(f);
      setSugarGrams(s);
      setSodiumMg(sod);

      const calculatedTotal = (p * 4) + (c * 4) + (f * 9);
      setTargetCalories(userProfile.targetCalories || calculatedTotal);
    } else if (userProfile.targetCalories) {
      setTargetCalories(userProfile.targetCalories);
    }
  }, [userProfile.customMacros, userProfile.targetCalories]);

  // Derived calculations
  const proteinCals = proteinGrams * 4;
  const carbsCals = carbsGrams * 4;
  const fatCals = fatGrams * 9;
  const computedTotalCals = proteinCals + carbsCals + fatCals;

  const proteinPct = computedTotalCals > 0 ? Math.round((proteinCals / computedTotalCals) * 100) : 0;
  const carbsPct = computedTotalCals > 0 ? Math.round((carbsCals / computedTotalCals) * 100) : 0;
  const fatPct = computedTotalCals > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  // 1. Protein Change via g/kg
  const handleProteinPerKgChange = (newPerKg: number) => {
    const clamped = Math.max(0.6, Math.min(3.5, Math.round(newPerKg * 10) / 10));
    setProteinPerKg(clamped);
    const newGrams = Math.round(clamped * safeWeight);
    setProteinGrams(newGrams);
    const newTotalCals = (newGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
  };

  // 2. Protein Change via total grams/day
  const handleProteinGramsChange = (newGrams: number) => {
    const clamped = Math.max(20, Math.min(400, Math.round(newGrams)));
    setProteinGrams(clamped);
    const newPerKg = Math.round((clamped / safeWeight) * 10) / 10;
    setProteinPerKg(newPerKg);
    const newTotalCals = (clamped * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
  };

  // 3. Carbs Change
  const handleCarbsChange = (newCarbs: number) => {
    const clamped = Math.max(10, Math.min(800, Math.round(newCarbs)));
    setCarbsGrams(clamped);
    const newTotalCals = (proteinGrams * 4) + (clamped * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
  };

  // 4. Fat Change
  const handleFatChange = (newFat: number) => {
    const clamped = Math.max(10, Math.min(300, Math.round(newFat)));
    setFatGrams(clamped);
    const newTotalCals = (proteinGrams * 4) + (carbsGrams * 4) + (clamped * 9);
    setTargetCalories(newTotalCals);
  };

  // 5. Change Deficit / Surplus Offset directly
  const handleSelectDeficitPreset = (preset: DeficitPreset) => {
    const newCalories = Math.max(800, tdee + preset.offset);
    applyNewCaloriesWithLockedProtein(newCalories);
    triggerHaptic(20);
    onToast(`⚡ ปรับระดับพลังงาน: ${preset.label} (${preset.badge}) = ${newCalories.toLocaleString()} kcal/วัน`);
  };

  const handleAdjustDeficitStep = (stepDelta: number) => {
    // stepDelta: e.g. -50 to increase deficit (reduce calories), +50 to decrease deficit (increase calories)
    const newCals = Math.max(800, targetCalories + stepDelta);
    applyNewCaloriesWithLockedProtein(newCals);
    triggerHaptic(15);
  };

  // 6. Reverse Calculation: When Target Calories Change, recalculate Carbs and Fat while locking Protein
  const applyNewCaloriesWithLockedProtein = (newCalories: number) => {
    const clamped = Math.max(800, Math.min(5000, Math.round(newCalories)));
    setTargetCalories(clamped);

    // Keep protein locked to current requirement
    const pCals = proteinGrams * 4;
    const remainingCals = Math.max(200, clamped - pCals);

    // Current carbs-to-fat energy ratio
    const currentNonProteinEnergy = (carbsGrams * 4) + (fatGrams * 9);
    let carbRatio = 0.65;
    if (currentNonProteinEnergy > 0) {
      carbRatio = (carbsGrams * 4) / currentNonProteinEnergy;
    }
    carbRatio = Math.max(0.20, Math.min(0.85, carbRatio));

    const newCarbCals = remainingCals * carbRatio;
    const newFatCals = remainingCals * (1 - carbRatio);

    const newCarbs = Math.max(10, Math.round(newCarbCals / 4));
    const newFat = Math.max(10, Math.round(newFatCals / 9));

    setCarbsGrams(newCarbs);
    setFatGrams(newFat);
  };

  const handleTargetCaloriesChange = (newCals: number) => {
    applyNewCaloriesWithLockedProtein(newCals);
  };

  // 7. Apply Preset Macro Ratio Split (High Protein, Balanced, Low Carb, High Carb)
  const handleApplyMacroSplit = (pRatio: number, cRatio: number, fRatio: number, splitName: string) => {
    const total = targetCalories;
    const newP = Math.max(30, Math.round((total * pRatio) / 4));
    const newC = Math.max(20, Math.round((total * cRatio) / 4));
    const newF = Math.max(15, Math.round((total * fRatio) / 9));

    setProteinGrams(newP);
    setProteinPerKg(Math.round((newP / safeWeight) * 10) / 10);
    setCarbsGrams(newC);
    setFatGrams(newF);

    triggerHaptic(20);
    onToast(`สัดส่วน ${splitName}: โปรตีน ${newP}g • คาร์บ ${newC}g • ไขมัน ${newF}g`);
  };

  // 8. Goal Preset Handler
  const handleSelectGoalPreset = (item: typeof GOAL_OPTIONS[0]) => {
    setSelectedGoal(item.id);
    const recommendedProtein = Math.round(safeWeight * item.recommendedProteinPerKg);
    setProteinPerKg(item.recommendedProteinPerKg);
    setProteinGrams(recommendedProtein);

    const newCals = Math.max(1000, tdee + item.calorieOffset);
    setTargetCalories(newCals);

    const pCals = recommendedProtein * 4;
    const remainingCals = Math.max(200, newCals - pCals);

    const totalRatio = item.carbRatio + item.fatRatio;
    const cRatio = item.carbRatio / totalRatio;

    const newCarbs = Math.max(10, Math.round((remainingCals * cRatio) / 4));
    const newFat = Math.max(10, Math.round((remainingCals * (1 - cRatio)) / 9));

    setCarbsGrams(newCarbs);
    setFatGrams(newFat);

    triggerHaptic(25);
    onToast(`🎯 ปรับเป้าหมาย: ${item.label} (${newCals.toLocaleString()} kcal) โปรตีน ${recommendedProtein}g (${item.recommendedProteinPerKg} g/kg)`);
  };

  // 9. Save & Apply Profile Target Globally
  const handleSaveAndApplyGoals = () => {
    const finalCalories = computedTotalCals;
    const updatedProfile: UserProfile = {
      ...userProfile,
      goalType: selectedGoal,
      targetCalories: finalCalories,
      proteinPerKg: proteinPerKg,
      customMacros: {
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams,
        sugar: sugarGrams,
        sodium: sodiumMg
      }
    };

    onSaveProfile(updatedProfile, true);
    playSuccessChime();
    triggerHaptic([40, 20, 40]);
    onToast(`💾 บันทึกเป้าหมายสำเร็จ! แคลอรี่ ${finalCalories.toLocaleString()} kcal • โปรตีน ${proteinGrams}g (${proteinPerKg} g/kg) • คาร์บ ${carbsGrams}g • ไขมัน ${fatGrams}g`);
  };

  // 10. AI Smart Calculation Trigger
  const handleCalculateWithAI = async () => {
    setIsCalculatingAI(true);
    try {
      const params: NutritionGoalParams = {
        gender: safeGender,
        age: safeAge,
        weight: safeWeight,
        height: safeHeight,
        targetWeight: userProfile.targetWeight || safeWeight,
        activityLevel: safeAct,
        goalType: selectedGoal,
        customNotes: `เป้าหมาย: ${selectedGoal}`
      };

      const result = await calculateAINutritionGoals(params);
      setPlan(result);

      setTargetCalories(result.dailyCalories);
      setProteinGrams(result.proteinGrams);
      setProteinPerKg(result.proteinPerKg);
      setCarbsGrams(result.carbsGrams);
      setFatGrams(result.fatGrams);
      setSugarGrams(result.sugarGrams);
      setSodiumMg(result.sodiumMg);

      const updatedProfile: UserProfile = {
        ...userProfile,
        goalType: selectedGoal,
        targetCalories: result.dailyCalories,
        proteinPerKg: result.proteinPerKg,
        aiPlanTitle: result.planTitle,
        aiExplanation: result.explanation,
        aiKeyTips: result.keyTips,
        customMacros: {
          carbs: result.carbsGrams,
          protein: result.proteinGrams,
          fat: result.fatGrams,
          sugar: result.sugarGrams,
          sodium: result.sodiumMg,
        }
      };

      onSaveProfile(updatedProfile, true);
      playSuccessChime();
      triggerHaptic([30, 20, 30]);
      onToast(`✨ AI วิเคราะห์สรีระและคำนวณเป้าหมายสำเร็จ: ${result.dailyCalories} kcal • โปรตีน ${result.proteinGrams}g (${result.proteinPerKg}g/kg) • TDEE จริง ${result.tdee} kcal`);
    } catch (error) {
      console.error('Failed to calculate AI macros:', error);
      onToast('⚠️ เกิดข้อผิดพลาดในการเรียก AI จึงใช้สูตรมาตรฐานเวชศาสตร์การกีฬาแทน');
    } finally {
      setIsCalculatingAI(false);
    }
  };

  // 11. Reset to baseline sports calculation
  const handleResetToBaseline = () => {
    const params: NutritionGoalParams = {
      gender: safeGender,
      age: safeAge,
      weight: safeWeight,
      height: safeHeight,
      targetWeight: userProfile.targetWeight || safeWeight,
      activityLevel: safeAct,
      goalType: selectedGoal,
    };
    const basePlan = calculateLocalSportsNutrition(params);
    setPlan(basePlan);

    setTargetCalories(basePlan.dailyCalories);
    setProteinGrams(basePlan.proteinGrams);
    setProteinPerKg(basePlan.proteinPerKg);
    setCarbsGrams(basePlan.carbsGrams);
    setFatGrams(basePlan.fatGrams);
    setSugarGrams(basePlan.sugarGrams);
    setSodiumMg(basePlan.sodiumMg);

    const updatedProfile: UserProfile = {
      ...userProfile,
      goalType: selectedGoal,
      targetCalories: basePlan.dailyCalories,
      proteinPerKg: basePlan.proteinPerKg,
      customMacros: {
        carbs: basePlan.carbsGrams,
        protein: basePlan.proteinGrams,
        fat: basePlan.fatGrams,
        sugar: basePlan.sugarGrams,
        sodium: basePlan.sodiumMg,
      }
    };
    onSaveProfile(updatedProfile, true);
    triggerHaptic(20);
    onToast('🔄 รีเซ็ตค่าเป้าหมายกลับเป็นค่ามาตรฐานเวชศาสตร์การกีฬาเรียบร้อย');
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-neutral-100 space-y-4 sm:space-y-5 w-full max-w-full overflow-hidden">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                AI คำนวณโปรตีน & สารอาหารเฉพาะบุคคล
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black border border-orange-200">
                2-Way Calorie & Macro
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              ปรับระดับ Deficit, โปรตีน, คาร์บ, ไขมัน คำนวณแคลอรี่เรียลไทม์ และเกลี่ยสารอาหารอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Physical Metrics Pill */}
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3 py-1.5 text-xs text-neutral-600 self-start sm:self-auto shrink-0 shadow-2xs">
          <Scale size={13} className="text-orange-500" />
          <span className="font-bold text-neutral-800">นน. {safeWeight} kg</span>
          <span className="text-neutral-300">•</span>
          <span>TDEE: <b className="text-neutral-900">{tdee.toLocaleString()}</b> kcal</span>
        </div>
      </div>

      {/* 2. CALORIE DEFICIT & SURPLUS CONTROLS (NEW & DEDICATED) */}
      <div className="bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-neutral-50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-orange-200/90 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-orange-600" />
            <div>
              <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                <span>เลือกระดับ Calorie Deficit / Surplus</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                  isDeficit 
                    ? 'bg-rose-100 text-rose-800 border-rose-200' 
                    : isSurplus 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {isDeficit ? `Deficit ${calorieDiffFromTdee} kcal` : isSurplus ? `Surplus +${calorieDiffFromTdee} kcal` : 'สมดุล TDEE'}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                เทียบกับ TDEE เผาผลาญจริง ({tdee.toLocaleString()} kcal/วัน) ของสรีระคุณ
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-orange-950 block">
              เป้าหมายพลังงาน: <b className="text-base text-orange-600 font-black">{computedTotalCals.toLocaleString()}</b> kcal
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold">
              {calorieDiffFromTdee < 0 
                ? `คาดการณ์ลดไขมัน ~${(Math.abs(calorieDiffFromTdee) * 30 / 7700).toFixed(1)} กก./เดือน` 
                : calorieDiffFromTdee > 0 
                  ? `คาดการณ์เพิ่มมวล ~${(Math.abs(calorieDiffFromTdee) * 30 / 7700).toFixed(1)} กก./เดือน` 
                  : 'รักษาน้ำหนักคงที่'}
            </span>
          </div>
        </div>

        {/* Deficit Presets Grid - Clean, neat on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEFICIT_PRESETS.map((preset) => {
            const isCurrent = Math.abs(calorieDiffFromTdee - preset.offset) <= 25;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectDeficitPreset(preset)}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all border cursor-pointer relative ${
                  isCurrent
                    ? 'bg-white border-orange-500 text-orange-950 shadow-xs ring-2 ring-orange-400/30'
                    : 'bg-white/80 hover:bg-white border-neutral-200/90 text-neutral-700 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-extrabold flex items-center gap-1 truncate pr-1">
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </span>
                  {isCurrent && <Check size={14} className="text-orange-600 font-bold shrink-0" />}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-bold">
                    {(tdee + preset.offset).toLocaleString()} kcal
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 block leading-tight mt-1 line-clamp-1">
                  {preset.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Deficit Fine-Tuning Stepper Strip */}
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-orange-200/80 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Activity size={14} className="text-orange-600" />
            <span className="text-xs font-bold text-neutral-800">ปรับละเอียด Deficit / Surplus:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAdjustDeficitStep(-50)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-orange-100 text-neutral-700 hover:text-orange-800 text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 border border-neutral-200"
              title="เพิ่มการลดแคลอรี่ (Deficit เพิ่มอีก -50 kcal)"
            >
              <Minus size={13} />
              <span>ลด 50 kcal</span>
            </button>

            <span className="px-3 py-1 rounded-lg bg-orange-50 text-orange-700 font-black text-xs border border-orange-200 min-w-[90px] text-center">
              {calorieDiffFromTdee === 0 ? '0 kcal (สมดุล)' : `${calorieDiffFromTdee > 0 ? '+' : ''}${calorieDiffFromTdee} kcal`}
            </span>

            <button
              type="button"
              onClick={() => handleAdjustDeficitStep(50)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-orange-100 text-neutral-700 hover:text-orange-800 text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 border border-neutral-200"
              title="เพิ่มแคลอรี่ (+50 kcal)"
            >
              <Plus size={13} />
              <span>เพิ่ม 50 kcal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Goal Selection Presets (Compact & Neat) */}
      <div>
        <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Target size={14} className="text-orange-500" />
            <span>เลือกเป้าหมายสุขภาพตามประเภทรูปร่าง</span>
          </span>
          <span className="text-[11px] text-neutral-400 font-normal hidden sm:inline">
            (แตะเพื่อใส่สัดส่วนแนะนำอัตโนมัติ)
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
          {GOAL_OPTIONS.map((item) => {
            const isSelected = selectedGoal === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectGoalPreset(item)}
                className={`p-2.5 rounded-xl sm:rounded-2xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-2xs ring-1 ring-orange-300'
                    : 'bg-neutral-50/80 border-neutral-200/70 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold block truncate pr-1">{item.label}</span>
                  {isSelected && <Check size={13} className="text-orange-600 font-bold shrink-0" />}
                </div>
                <span className="text-[10px] text-neutral-500 block leading-tight truncate">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. FOUR CORE INTERACTIVE NUTRIENT & CALORIE CARDS (RE-DESIGNED FOR MOBILE NEATNESS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-orange-600" />
            <h3 className="text-sm font-extrabold text-neutral-900">
              ปรับแต่งสารอาหารหลัก (Macro Nutrients)
            </h3>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium bg-neutral-100 px-2.5 py-0.5 rounded-lg">
            ระบบคำนวณสองทิศทาง 4P + 4C + 9F
          </span>
        </div>

        {/* 2x2 Grid on Tablet/Desktop, 1 Column on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

          {/* CARD 1: 🥩 โปรตีน (PROTEIN) - FULLY ENHANCED WITH VISIBLE TOTAL GRAMS & G/KG */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-blue-200 shadow-2xs space-y-3 relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

            {/* Header: Name, Grams, and g/kg */}
            <div className="flex items-start justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-xl shrink-0 font-bold shadow-2xs">
                  🥩
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-blue-950">โปรตีน (Protein)</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-black border border-blue-200">
                      {proteinPerKg} g/kg
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">
                    {proteinCals} kcal • {proteinPct}% ของพลังงานรวม
                  </span>
                </div>
              </div>

              {/* PROMINENT TOTAL PROTEIN AMOUNT DISPLAY (SOLVES ISSUE 3) */}
              <div className="text-right shrink-0 bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-200">
                <div className="text-lg sm:text-xl font-black text-blue-700 leading-none">
                  {proteinGrams} <span className="text-xs font-bold text-blue-950">กรัม/วัน</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                  ต่อน้ำหนัก {safeWeight} กก.
                </span>
              </div>
            </div>

            {/* Mode Switcher: g/kg vs Grams/day */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-xs font-bold text-neutral-600">
                โหมดปรับปริมาณ:
              </span>
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setProteinInputMode('g_per_kg')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    proteinInputMode === 'g_per_kg'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  กรัม/กก. (g/kg)
                </button>
                <button
                  type="button"
                  onClick={() => setProteinInputMode('grams_per_day')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    proteinInputMode === 'grams_per_day'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  กรัม/วัน (Grams)
                </button>
              </div>
            </div>

            {/* Stepper & Numeric Input */}
            {proteinInputMode === 'g_per_kg' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProteinPerKgChange(proteinPerKg - 0.1)}
                    className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer border border-neutral-200"
                    title="ลด 0.1 g/kg"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.6"
                      max="3.5"
                      inputMode="decimal"
                      value={proteinPerKg}
                      onChange={(e) => handleProteinPerKgChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-blue-50/50 border border-blue-300 rounded-xl px-3 py-2 text-center text-lg font-black text-blue-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-blue-500 pointer-events-none">
                      g/kg
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProteinPerKgChange(proteinPerKg + 0.1)}
                    className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs shadow-blue-600/30"
                    title="เพิ่ม 0.1 g/kg"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Protein Highlight Box */}
                <div className="bg-blue-50/90 rounded-xl p-2 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">
                    💡 ปริมาณโปรตีนที่ได้รับ: <b className="text-sm font-black text-blue-700">{proteinGrams} กรัม/วัน</b>
                  </span>
                  <span className="text-[11px] font-bold text-blue-600">
                    ({proteinCals} kcal)
                  </span>
                </div>

                {/* Quick Density Chips (With Exact Grams Displayed) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500">เลือกความหนาแน่นโปรตีนยอดนิยม:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                    {[
                      { val: 1.2, name: 'สุขภาพ' },
                      { val: 1.4, name: 'ออกกำลัง' },
                      { val: 1.6, name: 'ลีน/คุมหิว' },
                      { val: 1.8, name: 'สร้างกล้าม' },
                      { val: 2.0, name: 'นักกีฬา' },
                      { val: 2.2, name: 'เพาะกาย' }
                    ].map((item) => {
                      const isSel = Math.abs(proteinPerKg - item.val) < 0.05;
                      const g = Math.round(item.val * safeWeight);
                      return (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleProteinPerKgChange(item.val)}
                          className={`text-center py-1.5 px-1 rounded-xl border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-neutral-50 hover:bg-blue-50 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          <span className="block text-[11px] font-black">{item.val}g</span>
                          <span className={`block text-[9px] ${isSel ? 'text-blue-100' : 'text-neutral-500'}`}>
                            {g} กรัม
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProteinGramsChange(proteinGrams - 5)}
                    className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer border border-neutral-200"
                    title="ลด 5 กรัม"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="5"
                      min="20"
                      max="400"
                      inputMode="numeric"
                      value={proteinGrams}
                      onChange={(e) => handleProteinGramsChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-blue-50/50 border border-blue-300 rounded-xl px-3 py-2 text-center text-lg font-black text-blue-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-blue-500 pointer-events-none">
                      กรัม/วัน
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProteinGramsChange(proteinGrams + 5)}
                    className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs shadow-blue-600/30"
                    title="เพิ่ม 5 กรัม"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="bg-blue-50/90 rounded-xl p-2 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">
                    เทียบเท่า: <b className="text-sm font-black text-blue-700">{proteinPerKg} g/kg</b> (นน. {safeWeight} kg)
                  </span>
                  <span className="text-[11px] font-bold text-blue-600">
                    ~{proteinCals} kcal
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: 🍞 คาร์โบไฮเดรต (CARBOHYDRATES) */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-amber-200 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />

            <div className="flex items-start justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-xl shrink-0 font-bold shadow-2xs">
                  🍞
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-amber-950">คาร์โบไฮเดรต (Carbs)</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-200">
                      {Math.round((carbsGrams / safeWeight) * 10) / 10} g/kg
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">
                    {carbsCals} kcal • {carbsPct}% ของพลังงานรวม
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200">
                <div className="text-lg sm:text-xl font-black text-amber-800 leading-none">
                  {carbsGrams} <span className="text-xs font-bold text-amber-950">กรัม/วัน</span>
                </div>
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                  แหล่งพลังงานหลัก
                </span>
              </div>
            </div>

            {/* Stepper & Numeric Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCarbsChange(carbsGrams - 10)}
                  className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer border border-neutral-200"
                  title="ลด 10 กรัม"
                >
                  <Minus size={18} />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="800"
                    inputMode="numeric"
                    value={carbsGrams}
                    onChange={(e) => handleCarbsChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-2 text-center text-lg font-black text-amber-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-500 pointer-events-none">
                    กรัม
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCarbsChange(carbsGrams + 10)}
                  className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs shadow-amber-500/30"
                  title="เพิ่ม 10 กรัม"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick Stepper Chips */}
              <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCarbsChange(carbsGrams - 25)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-bold border border-neutral-200 cursor-pointer"
                  >
                    -25g
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCarbsChange(carbsGrams + 25)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold cursor-pointer"
                  >
                    +25g
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCarbsChange(carbsGrams + 50)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold cursor-pointer"
                  >
                    +50g
                  </button>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">พลังงานกล้ามเนื้อ</span>
              </div>
            </div>
          </div>

          {/* CARD 3: 🥑 ไขมันดี (FAT) */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-emerald-200 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="flex items-start justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xl shrink-0 font-bold shadow-2xs">
                  🥑
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-emerald-950">ไขมันดี (Fat)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-200">
                      {Math.round((fatGrams / safeWeight) * 10) / 10} g/kg
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">
                    {fatCals} kcal • {fatPct}% ของพลังงานรวม
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                <div className="text-lg sm:text-xl font-black text-emerald-800 leading-none">
                  {fatGrams} <span className="text-xs font-bold text-emerald-950">กรัม/วัน</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  ฮอร์โมน & วิตามิน
                </span>
              </div>
            </div>

            {/* Stepper & Numeric Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFatChange(fatGrams - 5)}
                  className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer border border-neutral-200"
                  title="ลด 5 กรัม"
                >
                  <Minus size={18} />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="300"
                    inputMode="numeric"
                    value={fatGrams}
                    onChange={(e) => handleFatChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 text-center text-lg font-black text-emerald-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500 pointer-events-none">
                    กรัม
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleFatChange(fatGrams + 5)}
                  className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs shadow-emerald-600/30"
                  title="เพิ่ม 5 กรัม"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick Stepper Chips */}
              <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFatChange(fatGrams - 10)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-bold border border-neutral-200 cursor-pointer"
                  >
                    -10g
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFatChange(fatGrams + 10)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold cursor-pointer"
                  >
                    +10g
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFatChange(fatGrams + 20)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold cursor-pointer"
                  >
                    +20g
                  </button>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">ดูดซึมวิตามิน A,D,E,K</span>
              </div>
            </div>
          </div>

          {/* CARD 4: 🎯 เป้าหมายแคลอรี่รวมต่อวัน (DAILY CALORIES) */}
          <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-orange-500/5 rounded-2xl p-3.5 sm:p-4 border-2 border-orange-300 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />

            <div className="flex items-start justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl shrink-0 font-bold shadow-md shadow-orange-500/30">
                  🎯
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-orange-950">เป้าหมายแคลอรี่รวม</span>
                    <span className={`px-2 py-0.2 rounded-md text-[10px] font-black border ${
                      isDeficit 
                        ? 'bg-rose-100 text-rose-800 border-rose-200' 
                        : isSurplus 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {isDeficit ? `Deficit ${calorieDiffFromTdee} kcal` : isSurplus ? `Surplus +${calorieDiffFromTdee} kcal` : 'สมดุล TDEE'}
                    </span>
                  </div>
                  <span className="text-[11px] text-orange-900/80 font-medium block mt-0.5">
                    คำนวณจากสารอาหารจริง 4P + 4C + 9F
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 bg-white px-2.5 py-1.5 rounded-xl border border-orange-300 shadow-2xs">
                <div className="text-xl sm:text-2xl font-black text-orange-600 leading-none">
                  {computedTotalCals.toLocaleString()}
                </div>
                <span className="text-[10px] text-orange-500 font-bold block mt-0.5">
                  kcal / วัน
                </span>
              </div>
            </div>

            {/* Stepper & Numeric Input for Direct Calorie Adjustment */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTargetCaloriesChange(computedTotalCals - 50)}
                  className="w-11 h-11 rounded-xl bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center font-black text-xs active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
                  title="ลด 50 kcal"
                >
                  -50
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="50"
                    min="800"
                    max="5000"
                    inputMode="numeric"
                    value={targetCalories}
                    onChange={(e) => handleTargetCaloriesChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 text-center text-lg font-black text-orange-600 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-orange-400 pointer-events-none">
                    kcal/วัน
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTargetCaloriesChange(computedTotalCals + 50)}
                  className="w-11 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-black text-xs active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs shadow-orange-500/30"
                  title="เพิ่ม 50 kcal"
                >
                  +50
                </button>
              </div>

              {/* Quick Macro Ratio Presets */}
              <div className="pt-1 border-t border-orange-200/60">
                <span className="text-[10px] font-bold text-orange-950 block mb-1">
                  เกลี่ยสารอาหารอัตโนมัติตามสัดส่วนยอดนิยม:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  {[
                    { name: 'High Protein', p: 0.35, c: 0.40, f: 0.25 },
                    { name: 'Balanced', p: 0.25, c: 0.50, f: 0.25 },
                    { name: 'Low Carb', p: 0.30, c: 0.20, f: 0.50 },
                    { name: 'High Carb', p: 0.20, c: 0.60, f: 0.20 }
                  ].map((split, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyMacroSplit(split.p, split.c, split.f, split.name)}
                      className="text-[10px] font-bold py-1 px-1.5 rounded-lg bg-white hover:bg-orange-50 text-neutral-700 hover:text-orange-700 border border-orange-200 transition-all cursor-pointer text-center truncate"
                    >
                      {split.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. VISUAL MACRO ENERGY DISTRIBUTION BAR */}
      <div className="bg-neutral-50 rounded-2xl p-3 sm:p-4 border border-neutral-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-1">
          <span className="text-neutral-700 flex items-center gap-1.5 flex-wrap">
            <span>สัดส่วนพลังงาน (P/C/F):</span>
            <span className="text-blue-700 font-black">P {proteinPct}% ({proteinGrams}g)</span>
            <span className="text-neutral-300">•</span>
            <span className="text-amber-700 font-black">C {carbsPct}% ({carbsGrams}g)</span>
            <span className="text-neutral-300">•</span>
            <span className="text-emerald-700 font-black">F {fatPct}% ({fatGrams}g)</span>
          </span>
          <span className="text-orange-600 font-black">
            รวม {computedTotalCals.toLocaleString()} kcal
          </span>
        </div>

        <div className="w-full h-3.5 bg-neutral-200 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${proteinPct}%` }} 
            className="bg-blue-600 h-full transition-all duration-300"
            title={`โปรตีน: ${proteinGrams}g (${proteinCals} kcal)`}
          />
          <div 
            style={{ width: `${carbsPct}%` }} 
            className="bg-amber-500 h-full transition-all duration-300"
            title={`คาร์โบไฮเดรต: ${carbsGrams}g (${carbsCals} kcal)`}
          />
          <div 
            style={{ width: `${fatPct}%` }} 
            className="bg-emerald-500 h-full transition-all duration-300"
            title={`ไขมัน: ${fatGrams}g (${fatCals} kcal)`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>โปรตีน ({proteinCals} kcal)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>คาร์บ ({carbsCals} kcal)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>ไขมัน ({fatCals} kcal)</span>
          </span>
        </div>
      </div>

      {/* 6. ACTION BUTTONS: SAVE & AI TRIGGERS */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        {/* Main Save Button */}
        <button
          type="button"
          onClick={handleSaveAndApplyGoals}
          className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Save size={18} />
          <span>💾 บันทึกและนำเป้าหมายนี้ไปใช้ทั่วทั้งแอป</span>
        </button>

        {/* AI Re-Analyze Button */}
        <button
          type="button"
          onClick={handleCalculateWithAI}
          disabled={isCalculatingAI}
          className="py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-black active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-60 shrink-0"
        >
          {isCalculatingAI ? (
            <>
              <Loader2 size={16} className="animate-spin text-white" />
              <span>AI กำลังวิเคราะห์...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} className="text-amber-300" />
              <span>✨ AI ช่วยวิเคราะห์สรีระ</span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleResetToBaseline}
          className="py-3 px-3.5 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
          title="รีเซ็ตเป็นค่ามาตรฐานเวชศาสตร์การกีฬา"
        >
          <RotateCcw size={14} />
          <span>รีเซ็ต</span>
        </button>
      </div>

      {/* 7. AI Explanation Accordion */}
      {plan && (
        <div className="bg-neutral-50/80 rounded-2xl p-3.5 sm:p-4 border border-neutral-200/80">
          <button
            type="button"
            onClick={() => setShowExplanationDetail(!showExplanationDetail)}
            className="w-full flex items-center justify-between text-left font-bold text-xs text-neutral-800 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Info size={15} className="text-orange-500" />
              <span>หลักการทางเวชศาสตร์การกีฬา & เคล็ดลับโภชนาการสำหรับคุณ</span>
            </div>
            {showExplanationDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showExplanationDetail && (
            <div className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-600 space-y-2.5 animate-in fade-in duration-200">
              <p className="leading-relaxed text-neutral-700 font-medium">
                {userProfile.aiExplanation || plan.explanation}
              </p>

              {/* Key Tips */}
              <div className="space-y-1.5 pt-1">
                {((userProfile.aiKeyTips && userProfile.aiKeyTips.length > 0) ? userProfile.aiKeyTips : plan.keyTips).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] text-neutral-700">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-neutral-500 font-medium border-t border-neutral-100">
                <span className="flex items-center gap-1 text-blue-700 font-bold">
                  <Droplet size={12} className="text-blue-500" /> น้ำดื่มแนะนำ: ~{(plan.waterMl / 1000).toFixed(1)} ลิตร/วัน
                </span>
                <span>🧂 โซเดียม &lt; 2,000 mg/วัน</span>
                <span>🍬 น้ำตาล &lt; 25 g/วัน</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
