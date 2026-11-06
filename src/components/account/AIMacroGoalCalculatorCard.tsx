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
  const [rawProteinPerKg, setRawProteinPerKg] = useState<string>(() => String(proteinPerKg));
  const [rawCarbs, setRawCarbs] = useState<string>(() => String(carbsGrams));
  const [rawFat, setRawFat] = useState<string>(() => String(fatGrams));
  const [rawDeficit, setRawDeficit] = useState<string>(() => String(targetCalories - tdee));

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
  const handleProteinPerKgChange = (newPerKg: number, syncRaw: boolean = true) => {
    const clamped = Math.max(0.6, Math.min(3.5, Math.round(newPerKg * 10) / 10));
    setProteinPerKg(clamped);
    if (syncRaw) setRawProteinPerKg(String(clamped));
    const newGrams = Math.round(clamped * safeWeight);
    setProteinGrams(newGrams);
    setRawProtein(String(newGrams));
    const newTotalCals = (newGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
    setRawDeficit(String(newTotalCals - tdee));
  };

  // 2. Protein Change via total grams/day
  const handleProteinGramsChange = (newGrams: number, syncRaw: boolean = true) => {
    const clamped = Math.max(20, Math.min(400, Math.round(newGrams)));
    setProteinGrams(clamped);
    if (syncRaw) setRawProtein(String(clamped));
    const newPerKg = Math.round((clamped / safeWeight) * 10) / 10;
    setProteinPerKg(newPerKg);
    setRawProteinPerKg(String(newPerKg));
    const newTotalCals = (clamped * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
    setRawDeficit(String(newTotalCals - tdee));
  };

  // 3. Carbs Change
  const handleCarbsChange = (newCarbs: number, syncRaw: boolean = true) => {
    const clamped = Math.max(10, Math.min(800, Math.round(newCarbs)));
    setCarbsGrams(clamped);
    if (syncRaw) setRawCarbs(String(clamped));
    const newTotalCals = (proteinGrams * 4) + (clamped * 4) + (fatGrams * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
    setRawDeficit(String(newTotalCals - tdee));
  };

  // 4. Fat Change
  const handleFatChange = (newFat: number, syncRaw: boolean = true) => {
    const clamped = Math.max(10, Math.min(300, Math.round(newFat)));
    setFatGrams(clamped);
    if (syncRaw) setRawFat(String(clamped));
    const newTotalCals = (proteinGrams * 4) + (carbsGrams * 4) + (clamped * 9);
    setTargetCalories(newTotalCals);
    setRawCalories(String(newTotalCals));
    setRawDeficit(String(newTotalCals - tdee));
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
    setRawDeficit(String(clamped - tdee));

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
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-neutral-100 space-y-3 w-full max-w-full overflow-hidden">
      
      {/* HEADER */}
      <div 
        onClick={onToggleExpand}
        className={`flex items-center justify-between gap-1.5 sm:gap-2 ${isCardExpanded ? 'border-b border-neutral-100 pb-2 sm:pb-2.5' : ''} ${onToggleExpand ? 'cursor-pointer select-none group' : ''}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles size={13} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="text-xs sm:text-sm font-black text-neutral-900 group-hover:text-orange-600 transition-colors whitespace-nowrap tracking-tight">
              AI คำนวณโปรตีน & สารอาหารเฉพาะบุคคล
            </h2>
            <p className="text-[10px] text-neutral-400 font-medium whitespace-nowrap truncate mt-0.5">
              กรอกตัวเลขโดยตรง • คำนวณแคลอรี่และสารอาหารอัตโนมัติ
            </p>
          </div>
        </div>
        {onToggleExpand && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0 cursor-pointer ml-1">
            {isCardExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {isCardExpanded && (
        <div className="space-y-2.5 animate-in fade-in duration-200">

          {/* MACRO SUMMARY BAR */}
          <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${isDeficit ? 'bg-rose-50 text-rose-700 border-rose-200' : isSurplus ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {isDeficit ? `Deficit ${calorieDiffFromTdee}` : isSurplus ? `Surplus +${calorieDiffFromTdee}` : 'สมดุล'} kcal
            </span>
            <span className="text-blue-600">P{proteinPct}%</span>
            <span className="text-amber-600">C{carbsPct}%</span>
            <span className="text-emerald-600">F{fatPct}%</span>
            <span className="ml-auto text-orange-600 font-black">{computedTotalCals.toLocaleString()} kcal</span>
          </div>

          {/* STACKED BAR */}
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden flex">
            <div style={{ width: `${proteinPct}%` }} className="bg-blue-500 h-full transition-all duration-300" />
            <div style={{ width: `${carbsPct}%` }} className="bg-amber-500 h-full transition-all duration-300" />
            <div style={{ width: `${fatPct}%` }} className="bg-emerald-500 h-full transition-all duration-300" />
          </div>

          {/* NUMERIC-ONLY INPUT ROWS — each is a single horizontal row */}
          <div className="space-y-1.5">
            {/* 🎯 Target Calories */}
            <div className="flex items-center gap-2 bg-orange-50/60 rounded-xl px-2.5 py-1.5 border border-orange-200/60">
              <span className="text-base shrink-0">🎯</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[50px] shrink-0">แคลอรี่</span>
              <input type="number" inputMode="numeric" step="10" min="800" max="5000"
                value={rawCalories}
                onChange={(e) => { setRawCalories(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 500) applyNewCaloriesWithLockedProtein(n, false); }}
                onBlur={() => { const n = parseInt(rawCalories, 10); applyNewCaloriesWithLockedProtein(isNaN(n) || n < 800 ? 800 : Math.min(5000, n), true); }}
                className="flex-1 min-w-0 bg-white border border-orange-300 rounded-lg px-2 py-1 text-xs font-black text-orange-600 text-center outline-none focus:ring-1 focus:ring-orange-400"
              />
              <span className="text-[11px] font-bold text-orange-500 shrink-0">kcal</span>
            </div>

            {/* ⚡ Deficit from TDEE */}
            <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-2.5 py-1.5 border border-neutral-200">
              <span className="text-base shrink-0">⚡</span>
              <div className="min-w-[50px] shrink-0 flex flex-col leading-tight">
                <span className="text-xs font-bold text-neutral-700">Deficit</span>
                <span className="text-[8px] text-neutral-400">จาก TDEE</span>
              </div>
              <input type="number" inputMode="numeric" step="50" min="-1500" max="1500"
                value={rawDeficit}
                onChange={(e) => {
                  setRawDeficit(e.target.value);
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n >= -1500 && n <= 1500) {
                    const newCals = tdee + n;
                    if (newCals >= 800 && newCals <= 5000) applyNewCaloriesWithLockedProtein(newCals, true);
                  }
                }}
                onBlur={() => {
                  const n = parseInt(rawDeficit, 10);
                  const val = isNaN(n) ? (targetCalories - tdee) : Math.max(-1500, Math.min(1500, n));
                  setRawDeficit(String(val));
                  applyNewCaloriesWithLockedProtein(Math.max(800, Math.min(5000, tdee + val)), true);
                }}
                className="flex-1 min-w-0 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-neutral-700 text-center outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <span className="text-[11px] font-bold text-neutral-400 shrink-0">kcal</span>
            </div>

            {/* 🥩 Protein (Grams + g/kg in one row) */}
            <div className="flex items-center gap-2 bg-blue-50/60 rounded-xl px-2.5 py-1.5 border border-blue-200/60">
              <span className="text-base shrink-0">🥩</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[50px] shrink-0">โปรตีน</span>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <input type="number" inputMode="numeric" step="1" min="20" max="400"
                    value={rawProtein}
                    onChange={(e) => { setRawProtein(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 10) handleProteinGramsChange(n, false); }}
                    onBlur={() => { const n = parseInt(rawProtein, 10); handleProteinGramsChange(isNaN(n) || n < 20 ? 20 : Math.min(400, n), true); }}
                    className="w-full bg-white border border-blue-300 rounded-lg pl-1.5 pr-5 py-1 text-xs font-black text-blue-700 text-center outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400 pointer-events-none">g</span>
                </div>
                <div className="relative w-20 shrink-0">
                  <input type="number" inputMode="decimal" step="0.1" min="0.6" max="3.5"
                    value={rawProteinPerKg}
                    onChange={(e) => {
                      setRawProteinPerKg(e.target.value);
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n >= 0.5 && n <= 4) handleProteinPerKgChange(n, false);
                    }}
                    onBlur={() => {
                      const n = parseFloat(rawProteinPerKg);
                      handleProteinPerKgChange(isNaN(n) || n < 0.6 ? 0.6 : Math.min(3.5, n), true);
                    }}
                    className="w-full bg-white border border-blue-300 rounded-lg pl-1 pr-6 py-1 text-xs font-black text-blue-700 text-center outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-blue-400 pointer-events-none">g/kg</span>
                </div>
              </div>
            </div>

            {/* 🍞 Carbs */}
            <div className="flex items-center gap-2 bg-amber-50/60 rounded-xl px-2.5 py-1.5 border border-amber-200/60">
              <span className="text-base shrink-0">🍞</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[50px] shrink-0">คาร์บ</span>
              <input type="number" inputMode="numeric" step="1" min="10" max="800"
                value={rawCarbs}
                onChange={(e) => { setRawCarbs(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 0) handleCarbsChange(n, false); }}
                onBlur={() => { const n = parseInt(rawCarbs, 10); handleCarbsChange(isNaN(n) || n < 10 ? 10 : Math.min(800, n), true); }}
                className="flex-1 min-w-0 bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-black text-amber-700 text-center outline-none focus:ring-1 focus:ring-amber-400"
              />
              <span className="text-[11px] font-bold text-amber-500 shrink-0">g</span>
              <span className="text-[10px] font-bold text-amber-400 shrink-0">({carbsCals} kcal)</span>
            </div>

            {/* 🥑 Fat */}
            <div className="flex items-center gap-2 bg-emerald-50/60 rounded-xl px-2.5 py-1.5 border border-emerald-200/60">
              <span className="text-base shrink-0">🥑</span>
              <span className="text-xs font-bold text-neutral-700 min-w-[50px] shrink-0">ไขมัน</span>
              <input type="number" inputMode="numeric" step="1" min="10" max="300"
                value={rawFat}
                onChange={(e) => { setRawFat(e.target.value); const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 0) handleFatChange(n, false); }}
                onBlur={() => { const n = parseInt(rawFat, 10); handleFatChange(isNaN(n) || n < 10 ? 10 : Math.min(300, n), true); }}
                className="flex-1 min-w-0 bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs font-black text-emerald-700 text-center outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <span className="text-[11px] font-bold text-emerald-500 shrink-0">g</span>
              <span className="text-[10px] font-bold text-emerald-400 shrink-0">({fatCals} kcal)</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2 pt-0.5">
            <button type="button" onClick={handleSaveAndApplyGoals}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer">
              <Save size={13} /><span>บันทึก</span>
            </button>
            <button type="button" onClick={handleCalculateWithAI} disabled={isCalculatingAI}
              className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-black active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60">
              {isCalculatingAI ? <><Loader2 size={12} className="animate-spin" /><span>AI...</span></> : <><Sparkles size={12} className="text-amber-300" /><span>AI</span></>}
            </button>
            <button type="button" onClick={handleResetToBaseline}
              className="py-2 px-3 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-500 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer">
              <RotateCcw size={12} /><span>รีเซ็ต</span>
            </button>
          </div>

          {/* AI EXPLANATION (collapsed by default) */}
          {plan && (
            <div className="bg-neutral-50/80 rounded-lg p-2 border border-neutral-200/60">
              <button type="button" onClick={() => setShowExplanationDetail(!showExplanationDetail)}
                className="w-full flex items-center justify-between text-left font-bold text-[11px] text-neutral-600 cursor-pointer">
                <div className="flex items-center gap-1"><Info size={12} className="text-orange-400" /><span>เคล็ดลับโภชนาการ</span></div>
                {showExplanationDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showExplanationDetail && (
                <div className="mt-2 pt-2 border-t border-neutral-200 text-[11px] text-neutral-600 space-y-1.5">
                  <p className="leading-relaxed">{userProfile.aiExplanation || plan.explanation}</p>
                  {((userProfile.aiKeyTips && userProfile.aiKeyTips.length > 0) ? userProfile.aiKeyTips : plan.keyTips).map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-[10px]"><span className="text-orange-400 shrink-0">•</span><span>{tip}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
