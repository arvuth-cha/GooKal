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
  Target, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Flame,
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
  isExpanded,
  onToggleExpand
}) => {
  const isCardExpanded = isExpanded !== undefined ? isExpanded : true;
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

  // Raw string states for inputs to allow seamless typing and backspacing without cursor jumping
  const [rawCalories, setRawCalories] = useState<string>(() => String(targetCalories));
  const [rawProtein, setRawProtein] = useState<string>(() => String(proteinGrams));
  const [rawCarbs, setRawCarbs] = useState<string>(() => String(carbsGrams));
  const [rawFat, setRawFat] = useState<string>(() => String(fatGrams));

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
      setRawProtein(String(newP));
      const newCals = (newP * 4) + (carbsGrams * 4) + (fatGrams * 9);
      setTargetCalories(newCals);
      setRawCalories(String(newCals));
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
      setRawProtein(String(p));
      setProteinPerKg(Math.round((p / safeWeight) * 10) / 10);
      setCarbsGrams(c);
      setRawCarbs(String(c));
      setFatGrams(f);
      setRawFat(String(f));
      setSugarGrams(s);
      setSodiumMg(sod);

      const calculatedTotal = (p * 4) + (c * 4) + (f * 9);
      const finalCals = userProfile.targetCalories || calculatedTotal;
      setTargetCalories(finalCals);
      setRawCalories(String(finalCals));
    } else if (userProfile.targetCalories) {
      setTargetCalories(userProfile.targetCalories);
      setRawCalories(String(userProfile.targetCalories));
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
    setRawProtein(String(newGrams));
    const newTotalCals = (newGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
  };

  // 2. Protein Change via total grams/day
  const handleProteinGramsChange = (newGrams: number, syncRaw: boolean = true) => {
    const clamped = Math.max(20, Math.min(400, Math.round(newGrams)));
    setProteinGrams(clamped);
    if (syncRaw) setRawProtein(String(clamped));
    const newPerKg = Math.round((clamped / safeWeight) * 10) / 10;
    setProteinPerKg(newPerKg);
    const newTotalCals = (clamped * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
  };

  // 3. Carbs Change
  const handleCarbsChange = (newCarbs: number, syncRaw: boolean = true) => {
    const clamped = Math.max(10, Math.min(800, Math.round(newCarbs)));
    setCarbsGrams(clamped);
    if (syncRaw) setRawCarbs(String(clamped));
    const newTotalCals = (proteinGrams * 4) + (clamped * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
  };

  // 4. Fat Change
  const handleFatChange = (newFat: number, syncRaw: boolean = true) => {
    const clamped = Math.max(10, Math.min(300, Math.round(newFat)));
    setFatGrams(clamped);
    if (syncRaw) setRawFat(String(clamped));
    const newTotalCals = (proteinGrams * 4) + (carbsGrams * 4) + (clamped * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
  };

  // 5. Change Deficit / Surplus Offset directly
  const handleSelectDeficitPreset = (preset: DeficitPreset) => {
    const newCalories = Math.max(800, tdee + preset.offset);
    applyNewCaloriesWithLockedProtein(newCalories, true);
    triggerHaptic(20);
    onToast(`⚡ ปรับระดับพลังงาน: ${preset.label} (${preset.badge}) = ${newCalories.toLocaleString()} kcal/วัน`);
  };

  const handleAdjustDeficitStep = (stepDelta: number) => {
    const newCals = Math.max(800, targetCalories + stepDelta);
    applyNewCaloriesWithLockedProtein(newCals, true);
    triggerHaptic(15);
  };

  // 6. Reverse Calculation: When Target Calories Change, recalculate Carbs and Fat while locking Protein
  const applyNewCaloriesWithLockedProtein = (newCalories: number, syncRaw: boolean = true) => {
    const clamped = Math.max(800, Math.min(5000, Math.round(newCalories)));
    setTargetCalories(clamped);
    if (syncRaw) setRawCalories(String(clamped));

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
    setRawCarbs(String(newCarbs));
    setFatGrams(newFat);
    setRawFat(String(newFat));
  };

  const handleTargetCaloriesChange = (newCals: number) => {
    applyNewCaloriesWithLockedProtein(newCals, true);
  };

  // 7. Apply Preset Macro Ratio Split
  const handleApplyMacroSplit = (pRatio: number, cRatio: number, fRatio: number, splitName: string) => {
    const total = targetCalories;
    const newP = Math.max(30, Math.round((total * pRatio) / 4));
    const newC = Math.max(20, Math.round((total * cRatio) / 4));
    const newF = Math.max(15, Math.round((total * fRatio) / 9));

    setProteinGrams(newP);
    setRawProtein(String(newP));
    setProteinPerKg(Math.round((newP / safeWeight) * 10) / 10);
    setCarbsGrams(newC);
    setRawCarbs(String(newC));
    setFatGrams(newF);
    setRawFat(String(newF));

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
      setRawCalories(String(result.dailyCalories));
      setProteinGrams(result.proteinGrams);
      setRawProtein(String(result.proteinGrams));
      setProteinPerKg(result.proteinPerKg);
      setCarbsGrams(result.carbsGrams);
      setRawCarbs(String(result.carbsGrams));
      setFatGrams(result.fatGrams);
      setRawFat(String(result.fatGrams));
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
    setRawCalories(String(basePlan.dailyCalories));
    setProteinGrams(basePlan.proteinGrams);
    setRawProtein(String(basePlan.proteinGrams));
    setProteinPerKg(basePlan.proteinPerKg);
    setCarbsGrams(basePlan.carbsGrams);
    setRawCarbs(String(basePlan.carbsGrams));
    setFatGrams(basePlan.fatGrams);
    setRawFat(String(basePlan.fatGrams));
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
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-neutral-100 space-y-3.5 w-full max-w-full overflow-hidden">
      
      {/* 1. COMPACT HEADER - Full horizontal width, no vertical breaking */}
      <div 
        onClick={onToggleExpand}
        className={`flex items-center justify-between gap-2.5 sm:gap-4 ${isCardExpanded ? 'border-b border-neutral-100 pb-3' : ''} ${onToggleExpand ? 'cursor-pointer select-none group' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-black text-neutral-900 tracking-tight group-hover:text-orange-600 transition-colors">
              AI คำนวณโปรตีน & สารอาหารเฉพาะบุคคล
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5 leading-normal">
              ปรับระดับ Deficit, โปรตีน, คาร์บ, ไขมัน คำนวณแคลอรี่เรียลไทม์ และเกลี่ยสารอาหารอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Header Right: Chevron Only (maximizing horizontal room for title & subtitle) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleExpand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
              title={isCardExpanded ? 'ยุบหมวด' : 'ขยายหมวด'}
            >
              {isCardExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {isCardExpanded && (
        <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">

          {/* 2. COMPACT GOAL & DEFICIT CONTROLS (UNIFIED 1-PANEL) */}
          <div className="bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-neutral-50 rounded-xl sm:rounded-2xl p-3 border border-orange-200/80 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                  isDeficit 
                    ? 'bg-rose-100 text-rose-800 border-rose-200' 
                    : isSurplus 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {isDeficit ? `Deficit ${calorieDiffFromTdee} kcal` : isSurplus ? `Surplus +${calorieDiffFromTdee} kcal` : 'สมดุล TDEE'}
                </span>
                <span className="text-[10px] text-neutral-500 font-bold">
                  {calorieDiffFromTdee < 0 
                    ? `~${(Math.abs(calorieDiffFromTdee) * 30 / 7700).toFixed(1)} กก./ด.` 
                    : calorieDiffFromTdee > 0 
                      ? `+${(Math.abs(calorieDiffFromTdee) * 30 / 7700).toFixed(1)} กก./ด.` 
                      : 'คงที่'}
                </span>
              </div>
            </div>

            {/* 2 Compact Dropdown Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1 flex items-center gap-1">
                  <Target size={12} className="text-orange-500" />
                  <span>เป้าหมายสุขภาพตามประเภทรูปร่าง</span>
                </label>
                <select
                  value={selectedGoal}
                  onChange={(e) => {
                    const match = GOAL_OPTIONS.find(o => o.id === e.target.value);
                    if (match) handleSelectGoalPreset(match);
                  }}
                  className="w-full bg-white border border-neutral-300 hover:border-orange-400 rounded-xl px-2.5 py-1.5 text-xs font-bold text-neutral-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 shadow-2xs transition-all cursor-pointer"
                >
                  {GOAL_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} (P {opt.recommendedProteinPerKg} g/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Flame size={12} className="text-orange-500" />
                    <span>เลือกระดับ Calorie Deficit / Surplus</span>
                  </span>
                  <span className="text-[10px] text-orange-600 font-bold">
                    {(tdee + (DEFICIT_PRESETS.find(p => Math.abs(calorieDiffFromTdee - p.offset) <= 25)?.offset || 0)).toLocaleString()} kcal
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={
                      DEFICIT_PRESETS.find(p => Math.abs(calorieDiffFromTdee - p.offset) <= 25)?.id || 'standard_deficit'
                    }
                    onChange={(e) => {
                      const match = DEFICIT_PRESETS.find(p => p.id === e.target.value);
                      if (match) handleSelectDeficitPreset(match);
                    }}
                    className="flex-1 bg-white border border-neutral-300 hover:border-orange-400 rounded-xl px-2.5 py-1.5 text-xs font-bold text-neutral-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 shadow-2xs transition-all cursor-pointer"
                  >
                    {DEFICIT_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.icon} {preset.label} ({preset.badge})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAdjustDeficitStep(-50)}
                    className="w-8 h-8 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-orange-600 hover:border-orange-300 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="ลดพลังงาน (-50 kcal)"
                  >
                    <Minus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustDeficitStep(50)}
                    className="w-8 h-8 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-orange-600 hover:border-orange-300 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="เพิ่มพลังงาน (+50 kcal)"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. FOUR DIRECT NUMERIC INPUT CARDS (EASY TYPING, NO MULTI-STEP CONFUSION) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                <Sliders size={14} className="text-orange-600" />
                <span>ปรับแต่งสารอาหาร (กรอกตัวเลขได้โดยตรง)</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded-md">
                คำนวณสองทิศทาง 4P + 4C + 9F
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">

              {/* CARD 1: 🎯 TARGET CALORIES */}
              <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white rounded-xl p-3 border-2 border-orange-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🎯</span>
                    <div>
                      <span className="text-xs font-black text-orange-950">เป้าหมายแคลอรี่รวม</span>
                      <span className="text-[10px] text-orange-700/80 block leading-tight">
                        {computedTotalCals.toLocaleString()} kcal/วัน
                      </span>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                    isDeficit ? 'bg-rose-100 text-rose-800 border-rose-200' : isSurplus ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {isDeficit ? `${calorieDiffFromTdee}` : isSurplus ? `+${calorieDiffFromTdee}` : 'สมดุล'} kcal
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTargetCaloriesChange(computedTotalCals - 50)}
                    className="w-8 h-8 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 text-orange-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="ลด 50 kcal"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="10"
                      min="800"
                      max="5000"
                      inputMode="numeric"
                      value={rawCalories}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRawCalories(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 500 && num <= 10000) {
                          applyNewCaloriesWithLockedProtein(num, false);
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(rawCalories, 10);
                        const clamped = isNaN(num) || num < 800 ? 800 : Math.min(5000, num);
                        applyNewCaloriesWithLockedProtein(clamped, true);
                      }}
                      className="w-full bg-white border border-orange-300 rounded-lg px-2 py-1.5 text-center text-base font-black text-orange-600 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTargetCaloriesChange(computedTotalCals + 50)}
                    className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="เพิ่ม 50 kcal"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs font-bold text-orange-600 shrink-0 min-w-[28px]">kcal</span>
                </div>
              </div>

              {/* CARD 2: 🥩 PROTEIN */}
              <div className="bg-blue-50/60 rounded-xl p-3 border-2 border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🥩</span>
                    <div>
                      <span className="text-xs font-black text-blue-950">โปรตีน (Protein)</span>
                      <span className="text-[10px] text-blue-700/80 block leading-tight">
                        {proteinCals} kcal • {proteinPct}% ของพลังงาน
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-100/80 px-1.5 py-0.5 rounded text-[10px] font-black text-blue-800 border border-blue-200">
                    <span>{proteinPerKg} g/kg</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleProteinGramsChange(proteinGrams - 5)}
                    className="w-8 h-8 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="ลด 5 กรัม"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      min="20"
                      max="400"
                      inputMode="numeric"
                      value={rawProtein}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRawProtein(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 10 && num <= 600) {
                          handleProteinGramsChange(num, false);
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(rawProtein, 10);
                        const clamped = isNaN(num) || num < 20 ? 20 : Math.min(400, num);
                        handleProteinGramsChange(clamped, true);
                      }}
                      className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-center text-base font-black text-blue-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProteinGramsChange(proteinGrams + 5)}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="เพิ่ม 5 กรัม"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs font-bold text-blue-700 shrink-0 min-w-[28px]">กรัม</span>
                </div>

                {/* Quick g/kg buttons strip */}
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 pt-0.5">
                  <span>เลือกความหนาแน่น:</span>
                  <div className="flex items-center gap-1">
                    {[1.2, 1.6, 1.8, 2.0].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleProteinPerKgChange(val)}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          Math.abs(proteinPerKg - val) < 0.05
                            ? 'bg-blue-600 text-white font-black'
                            : 'bg-white hover:bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {val}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 3: 🍞 CARBOHYDRATES */}
              <div className="bg-amber-50/60 rounded-xl p-3 border-2 border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🍞</span>
                    <div>
                      <span className="text-xs font-black text-amber-950">คาร์โบไฮเดรต (Carbs)</span>
                      <span className="text-[10px] text-amber-700/80 block leading-tight">
                        {carbsCals} kcal • {carbsPct}% ของพลังงาน
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    {Math.round((carbsGrams / safeWeight) * 10) / 10} g/kg
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCarbsChange(carbsGrams - 10)}
                    className="w-8 h-8 rounded-lg bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="ลด 10 กรัม"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      min="10"
                      max="800"
                      inputMode="numeric"
                      value={rawCarbs}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRawCarbs(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 0 && num <= 1000) {
                          handleCarbsChange(num, false);
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(rawCarbs, 10);
                        const clamped = isNaN(num) || num < 10 ? 10 : Math.min(800, num);
                        handleCarbsChange(clamped, true);
                      }}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-center text-base font-black text-amber-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCarbsChange(carbsGrams + 10)}
                    className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="เพิ่ม 10 กรัม"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs font-bold text-amber-700 shrink-0 min-w-[28px]">กรัม</span>
                </div>
              </div>

              {/* CARD 4: 🥑 FAT */}
              <div className="bg-emerald-50/60 rounded-xl p-3 border-2 border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🥑</span>
                    <div>
                      <span className="text-xs font-black text-emerald-950">ไขมันดี (Fat)</span>
                      <span className="text-[10px] text-emerald-700/80 block leading-tight">
                        {fatCals} kcal • {fatPct}% ของพลังงาน
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                    {Math.round((fatGrams / safeWeight) * 10) / 10} g/kg
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFatChange(fatGrams - 5)}
                    className="w-8 h-8 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="ลด 5 กรัม"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      min="10"
                      max="300"
                      inputMode="numeric"
                      value={rawFat}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRawFat(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 0 && num <= 500) {
                          handleFatChange(num, false);
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(rawFat, 10);
                        const clamped = isNaN(num) || num < 10 ? 10 : Math.min(300, num);
                        handleFatChange(clamped, true);
                      }}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-center text-base font-black text-emerald-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFatChange(fatGrams + 5)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    title="เพิ่ม 5 กรัม"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs font-bold text-emerald-700 shrink-0 min-w-[28px]">กรัม</span>
                </div>
              </div>

            </div>
          </div>

          {/* 4. SLIM VISUAL MACRO ENERGY BAR & QUICK RATIOS */}
          <div className="bg-neutral-50 rounded-xl p-2.5 sm:p-3 border border-neutral-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold flex-wrap gap-1">
              <span className="text-neutral-700 flex items-center gap-1.5">
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

            <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${proteinPct}%` }} 
                className="bg-blue-600 h-full transition-all duration-300"
                title={`โปรตีน: ${proteinGrams}g (${proteinCals} kcal)`}
              />
              <div 
                style={{ width: `${carbsPct}%` }} 
                className="bg-amber-500 h-full transition-all duration-300"
                title={`คาร์บ: ${carbsGrams}g (${carbsCals} kcal)`}
              />
              <div 
                style={{ width: `${fatPct}%` }} 
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`ไขมัน: ${fatGrams}g (${fatCals} kcal)`}
              />
            </div>

            {/* Quick split buttons */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
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
                  className="text-[10px] font-bold py-1 px-1 rounded-lg bg-white hover:bg-orange-50 text-neutral-600 hover:text-orange-700 border border-neutral-200 hover:border-orange-200 transition-all cursor-pointer text-center truncate"
                >
                  {split.name}
                </button>
              ))}
            </div>
          </div>

          {/* 5. COMPACT ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveAndApplyGoals}
              className="flex-1 py-2.5 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-xs sm:text-sm shadow-sm shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Save size={16} />
              <span>💾 บันทึกเป้าหมายสารอาหาร</span>
            </button>

            <button
              type="button"
              onClick={handleCalculateWithAI}
              disabled={isCalculatingAI}
              className="py-2.5 px-3 rounded-xl sm:rounded-2xl bg-neutral-900 hover:bg-black active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 shrink-0"
            >
              {isCalculatingAI ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>AI กำลังวิเคราะห์...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-300" />
                  <span>✨ AI คำนวณ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetToBaseline}
              className="py-2.5 px-3 rounded-xl sm:rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
              title="รีเซ็ตเป็นค่ามาตรฐานเวชศาสตร์การกีฬา"
            >
              <RotateCcw size={13} />
              <span>รีเซ็ต</span>
            </button>
          </div>

          {/* 6. COLLAPSIBLE AI EXPLANATION DRAWER */}
          {plan && (
            <div className="bg-neutral-50/80 rounded-xl p-2.5 sm:p-3 border border-neutral-200/80">
              <button
                type="button"
                onClick={() => setShowExplanationDetail(!showExplanationDetail)}
                className="w-full flex items-center justify-between text-left font-bold text-xs text-neutral-800 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Info size={14} className="text-orange-500" />
                  <span>หลักการเวชศาสตร์การกีฬา & เคล็ดลับโภชนาการ</span>
                </div>
                {showExplanationDetail ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showExplanationDetail && (
                <div className="mt-2.5 pt-2.5 border-t border-neutral-200 text-xs text-neutral-600 space-y-2 animate-in fade-in duration-200">
                  <p className="leading-relaxed text-neutral-700 font-medium">
                    {userProfile.aiExplanation || plan.explanation}
                  </p>

                  <div className="space-y-1 pt-1">
                    {((userProfile.aiKeyTips && userProfile.aiKeyTips.length > 0) ? userProfile.aiKeyTips : plan.keyTips).map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-neutral-700">
                        <span className="text-orange-500 font-bold shrink-0">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1.5 text-[11px] text-neutral-500 font-medium border-t border-neutral-100">
                    <span className="flex items-center gap-1 text-blue-700 font-bold">
                      <Droplet size={11} className="text-blue-500" /> น้ำดื่ม: ~{(plan.waterMl / 1000).toFixed(1)} ลิตร/วัน
                    </span>
                    <span>🧂 โซเดียม &lt; 2,000 mg</span>
                    <span>🍬 น้ำตาล &lt; 25 g</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
