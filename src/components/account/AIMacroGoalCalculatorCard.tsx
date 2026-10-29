import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Target, 
  Dumbbell, 
  Flame, 
  Activity, 
  Info, 
  Check, 
  RotateCcw, 
  Sliders, 
  Edit3, 
  Scale, 
  Droplet, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Loader2,
  HelpCircle,
  Save,
  Plus,
  Minus,
  ArrowRightLeft,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  calculateAINutritionGoals, 
  calculateLocalSportsNutrition, 
  CalculatedNutritionPlan, 
  NutritionGoalParams 
} from '../../utils/aiNutritionCalculator';
import { triggerHaptic, playSuccessChime } from '../../utils/voiceService';

export interface UserProfile {
  weight: number; // kg
  targetWeight?: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: number;
  goalType?: 'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom';
  targetCalories?: number; // เป้าหมายแคลอรีที่ต้องทำตามต่อวัน
  customMacros?: {
    carbs: number;
    protein: number;
    fat: number;
    sugar?: number;
    sodium?: number;
  };
  customBmr?: number;
  customTdee?: number; // ค่า TDEE เผาผลาญจริง
  aiExplanation?: string;
  aiKeyTips?: string[];
  aiPlanTitle?: string;
  proteinPerKg?: number;
  name?: string;
}

interface AIMacroGoalCalculatorCardProps {
  userProfile: UserProfile;
  onSaveProfile: (newProfile: UserProfile, notify?: boolean) => void;
  onToast: (message: string) => void;
  onOpenDetailedModal?: () => void;
}

type GoalKey = 'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom';

interface GoalOption {
  id: GoalKey;
  label: string;
  sub: string;
  recommendedProteinPerKg: number;
  calorieOffset: number; // vs TDEE
  carbRatio: number;
  fatRatio: number;
}

const GOAL_OPTIONS: GoalOption[] = [
  { 
    id: 'muscle_maintain', 
    label: '🛡️ รักษากล้ามเนื้อ / ลีน', 
    sub: 'โปรตีน 1.5 - 1.6 g/kg (Deficit -200)',
    recommendedProteinPerKg: 1.6,
    calorieOffset: -200,
    carbRatio: 0.45,
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
    sub: 'โปรตีน 1.5 g/kg • Low Carb • High Fat',
    recommendedProteinPerKg: 1.5,
    calorieOffset: -300,
    carbRatio: 0.15,
    fatRatio: 0.55
  },
  { 
    id: 'balanced', 
    label: '🥗 สมดุลสุขภาพทั่วไป', 
    sub: 'โปรตีน 1.0 - 1.2 g/kg (สมดุล TDEE)',
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
    return Math.max(1200, tdee - 200);
  });

  const [sugarGrams, setSugarGrams] = useState<number>(userProfile.customMacros?.sugar || 24);
  const [sodiumMg, setSodiumMg] = useState<number>(userProfile.customMacros?.sodium || 2000);

  // Track if this initial state is synced with incoming userProfile changes (e.g. weight edited above)
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

  const calorieDiffFromTdee = computedTotalCals - tdee;
  const isDeficit = calorieDiffFromTdee < -50;
  const isSurplus = calorieDiffFromTdee > 50;
  const isBalanced = !isDeficit && !isSurplus;

  // ----------------------------------------------------
  // TWO-WAY INTERACTIVE HANDLERS
  // ----------------------------------------------------

  // 1. When Protein changes via g/kg
  const handleProteinPerKgChange = (newPerKg: number) => {
    const safePerKg = Math.max(0.6, Math.min(3.5, Math.round(newPerKg * 10) / 10));
    setProteinPerKg(safePerKg);
    const newGrams = Math.round(safePerKg * safeWeight);
    setProteinGrams(newGrams);

    // Auto-update total calories to match new macro sum
    const newTotal = (newGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotal);
    triggerHaptic(15);
  };

  // 2. When Protein changes via grams/day
  const handleProteinGramsChange = (newGrams: number) => {
    const safeGrams = Math.max(30, Math.min(350, Math.round(newGrams)));
    setProteinGrams(safeGrams);
    const newPerKg = Math.round((safeGrams / safeWeight) * 10) / 10;
    setProteinPerKg(newPerKg);

    // Auto-update total calories
    const newTotal = (safeGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
    setTargetCalories(newTotal);
    triggerHaptic(15);
  };

  // 3. When Carbs changes (grams)
  const handleCarbsChange = (newCarbs: number) => {
    const safeCarbs = Math.max(10, Math.min(700, Math.round(newCarbs)));
    setCarbsGrams(safeCarbs);

    // Auto-update total calories
    const newTotal = (proteinGrams * 4) + (safeCarbs * 4) + (fatGrams * 9);
    setTargetCalories(newTotal);
    triggerHaptic(15);
  };

  // 4. When Fat changes (grams)
  const handleFatChange = (newFat: number) => {
    const safeFat = Math.max(15, Math.min(250, Math.round(newFat)));
    setFatGrams(safeFat);

    // Auto-update total calories
    const newTotal = (proteinGrams * 4) + (carbsGrams * 4) + (safeFat * 9);
    setTargetCalories(newTotal);
    triggerHaptic(15);
  };

  // 5. REVERSE CALCULATION: When User Changes Target Calories
  // "ในทางกลับกันถ้าเลือกเปลี่ยนเป้าหมายแคลอรี่ก็ให้คำนวณกลับไปเป็นสารอาหารให้เองอัตโนมัติ"
  const handleTargetCaloriesChange = (newCals: number) => {
    const safeCals = Math.max(800, Math.min(5000, Math.round(newCals)));
    setTargetCalories(safeCals);

    // Sports Science Rule: Keep protein density (e.g. 1.6 g/kg) intact to protect muscle mass
    const pKcal = proteinGrams * 4;
    const remainingKcal = Math.max(200, safeCals - pKcal);

    // Maintain current ratio between Carbs and Fat
    const currentCarbKcal = carbsGrams * 4;
    const currentFatKcal = fatGrams * 9;
    const currentNonProteinTotal = Math.max(1, currentCarbKcal + currentFatKcal);
    const carbShare = currentCarbKcal / currentNonProteinTotal; // e.g. 0.60
    const fatShare = currentFatKcal / currentNonProteinTotal;   // e.g. 0.40

    const newCarbKcal = remainingKcal * carbShare;
    const newFatKcal = remainingKcal * fatShare;

    const newCarbs = Math.max(20, Math.round(newCarbKcal / 4));
    const newFat = Math.max(15, Math.round(newFatKcal / 9));

    setCarbsGrams(newCarbs);
    setFatGrams(newFat);
    triggerHaptic(15);
  };

  // 6. Apply Quick Macro Split Preset (e.g. 40C / 35P / 25F)
  const handleApplyMacroSplit = (pPct: number, cPct: number, fPct: number, name: string) => {
    const cals = targetCalories > 0 ? targetCalories : computedTotalCals;
    const newP = Math.round((cals * pPct) / 4);
    const newC = Math.round((cals * cPct) / 4);
    const newF = Math.round((cals * fPct) / 9);

    setProteinGrams(newP);
    setProteinPerKg(Math.round((newP / safeWeight) * 10) / 10);
    setCarbsGrams(newC);
    setFatGrams(newF);

    const exactCals = (newP * 4) + (newC * 4) + (newF * 9);
    setTargetCalories(exactCals);
    triggerHaptic([20, 20]);
    onToast(`สัดส่วน ${name}: โปรตีน ${newP}g • คาร์บ ${newC}g • ไขมัน ${newF}g (${exactCals} kcal)`);
  };

  // 7. Goal preset clicked
  const handleSelectGoalPreset = (option: GoalOption) => {
    setSelectedGoal(option.id);
    const targetC = Math.max(1200, tdee + option.calorieOffset);
    const pGrams = Math.round(safeWeight * option.recommendedProteinPerKg);
    const pKcal = pGrams * 4;
    const remainingKcal = Math.max(200, targetC - pKcal);

    const nonProteinRatio = option.carbRatio + option.fatRatio;
    const cKcal = remainingKcal * (option.carbRatio / nonProteinRatio);
    const fKcal = remainingKcal * (option.fatRatio / nonProteinRatio);

    const cGrams = Math.round(cKcal / 4);
    const fGrams = Math.max(15, Math.round(fKcal / 9));
    const exactSum = (pGrams * 4) + (cGrams * 4) + (fGrams * 9);

    setProteinGrams(pGrams);
    setProteinPerKg(option.recommendedProteinPerKg);
    setCarbsGrams(cGrams);
    setFatGrams(fGrams);
    setTargetCalories(exactSum);

    triggerHaptic([30, 20]);
  };

  // 8. Save & Apply Profile Target Globally
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
    onToast(`💾 บันทึกเป้าหมายโภชนาการสำเร็จ! เป้าหมาย ${finalCalories.toLocaleString()} kcal • โปรตีน ${proteinGrams}g (${proteinPerKg} g/kg) • คาร์บ ${carbsGrams}g • ไขมัน ${fatGrams}g`);
  };

  // 9. AI Smart Calculation Trigger
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

  // 10. Reset to baseline sports calculation
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
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-neutral-100 space-y-5 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                AI คำนวณโปรตีน & สารอาหารเฉพาะบุคคล
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black border border-orange-200">
                2-Way Calculator
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              ปรับเพิ่ม-ลดโปรตีน คาร์บ ไขมัน แล้วคำนวณแคลอรี่ทันที หรือเปลี่ยนแคลอรี่เพื่อเกลี่ยสารอาหารอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Physical Metrics Pill */}
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3 py-1.5 text-xs text-neutral-600 self-start sm:self-auto shrink-0 shadow-2xs">
          <Scale size={14} className="text-orange-500" />
          <span className="font-bold text-neutral-800">นน. {safeWeight} kg</span>
          <span className="text-neutral-300">•</span>
          <span>TDEE: <b className="text-neutral-900">{tdee.toLocaleString()}</b> kcal</span>
        </div>
      </div>

      {/* Goal Selector Grid */}
      <div>
        <label className="block text-xs font-bold text-neutral-700 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Target size={14} className="text-orange-500" />
            1. เลือกเป้าหมายสุขภาพ / ความต้องการหลักของคุณ
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            (แตะเพื่อใส่ค่าแนะนำอัตโนมัติตามสรีระ)
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GOAL_OPTIONS.map((item) => {
            const isSelected = selectedGoal === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectGoalPreset(item)}
                className={`p-3 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-orange-50/90 border-orange-400 text-orange-950 shadow-xs ring-1 ring-orange-300'
                    : 'bg-neutral-50/70 border-neutral-200/80 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold block truncate pr-1">{item.label}</span>
                  {isSelected && <Check size={14} className="text-orange-600 font-bold shrink-0" />}
                </div>
                <span className="text-[10px] text-neutral-500 block leading-tight">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TWO-WAY INTERACTIVE CALCULATOR SECTION */}
      <div className="bg-gradient-to-br from-neutral-50 to-orange-50/30 rounded-3xl p-4 sm:p-5 border border-orange-200/80 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-orange-600" />
            <h3 className="text-sm font-extrabold text-neutral-900">
              2. ปรับแต่งสารอาหาร & แคลอรี่ (คำนวณแบบสองทิศทาง)
            </h3>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium bg-white px-2 py-0.5 rounded-lg border border-neutral-200">
            กดปุ่ม +/- หรือพิมพ์ตัวเลขได้ตามต้องการ
          </span>
        </div>

        {/* 4 Core Macro/Calorie Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* CARD 1: 🥩 โปรตีน (Protein) */}
          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-base shrink-0 font-bold">
                  🥩
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-blue-950">โปรตีน (Protein)</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                      {proteinPerKg} g/kg
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    ~{proteinCals} kcal • {proteinPct}% ของพลังงานรวม
                  </span>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setProteinInputMode('g_per_kg')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    proteinInputMode === 'g_per_kg'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  g/kg
                </button>
                <button
                  type="button"
                  onClick={() => setProteinInputMode('grams_per_day')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    proteinInputMode === 'grams_per_day'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  กรัม/วัน
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
                    className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="ลด 0.1 g/kg"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.6"
                      max="3.5"
                      value={proteinPerKg}
                      onChange={(e) => handleProteinPerKgChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3 py-2 text-center text-lg font-black text-blue-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400 pointer-events-none">
                      g/kg
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProteinPerKgChange(proteinPerKg + 0.1)}
                    className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="เพิ่ม 0.1 g/kg"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Quick Density Chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                  {[1.2, 1.4, 1.6, 1.8, 2.0, 2.2].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleProteinPerKgChange(val)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                        proteinPerKg === val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-blue-50'
                      }`}
                    >
                      {val}g
                    </button>
                  ))}
                  <span className="text-[10px] text-blue-700 font-bold ml-auto shrink-0">
                    = {proteinGrams} กรัม/วัน
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProteinGramsChange(proteinGrams - 5)}
                    className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="ลด 5 กรัม"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      min="30"
                      max="350"
                      value={proteinGrams}
                      onChange={(e) => handleProteinGramsChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-3 py-2 text-center text-lg font-black text-blue-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400 pointer-events-none">
                      กรัม
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProteinGramsChange(proteinGrams + 5)}
                    className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="เพิ่ม 5 กรัม"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                  <span>คิดเป็น: <b className="text-blue-900">{proteinPerKg} g/kg</b> ต่อน้ำหนัก {safeWeight} kg</span>
                  <span className="font-bold text-blue-700">~{proteinCals} kcal</span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: 🍞 คาร์โบไฮเดรต (Carbohydrates) */}
          <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-base shrink-0 font-bold">
                  🍞
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-950">คาร์โบไฮเดรต (Carbs)</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                      {Math.round((carbsGrams / safeWeight) * 10) / 10} g/kg
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    ~{carbsCals} kcal • {carbsPct}% ของพลังงานรวม
                  </span>
                </div>
              </div>
              <span className="text-base font-black text-amber-900">{carbsGrams}g</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCarbsChange(carbsGrams - 10)}
                className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                title="ลด 10 กรัม"
              >
                <Minus size={16} />
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="700"
                  value={carbsGrams}
                  onChange={(e) => handleCarbsChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-amber-50/40 border border-amber-200 rounded-xl px-3 py-2 text-center text-lg font-black text-amber-900 outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 pointer-events-none">
                  กรัม
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCarbsChange(carbsGrams + 10)}
                className="w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                title="เพิ่ม 10 กรัม"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Adjustment Chips */}
            <div className="flex items-center justify-between text-[10px] pt-0.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCarbsChange(carbsGrams - 25)}
                  className="px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 font-bold"
                >
                  -25g
                </button>
                <button
                  type="button"
                  onClick={() => handleCarbsChange(carbsGrams + 25)}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold"
                >
                  +25g
                </button>
              </div>
              <span className="text-neutral-500 font-medium">แหล่งพลังงานกล้ามเนื้อ</span>
            </div>
          </div>

          {/* CARD 3: 🥑 ไขมัน (Fat) */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-base shrink-0 font-bold">
                  🥑
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-emerald-950">ไขมันดี (Fat)</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      {Math.round((fatGrams / safeWeight) * 10) / 10} g/kg
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    ~{fatCals} kcal • {fatPct}% ของพลังงานรวม
                  </span>
                </div>
              </div>
              <span className="text-base font-black text-emerald-900">{fatGrams}g</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFatChange(fatGrams - 5)}
                className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                title="ลด 5 กรัม"
              >
                <Minus size={16} />
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="5"
                  min="15"
                  max="250"
                  value={fatGrams}
                  onChange={(e) => handleFatChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-emerald-50/40 border border-emerald-200 rounded-xl px-3 py-2 text-center text-lg font-black text-emerald-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 pointer-events-none">
                  กรัม
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFatChange(fatGrams + 5)}
                className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                title="เพิ่ม 5 กรัม"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Adjustment Chips */}
            <div className="flex items-center justify-between text-[10px] pt-0.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleFatChange(fatGrams - 10)}
                  className="px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 font-bold"
                >
                  -10g
                </button>
                <button
                  type="button"
                  onClick={() => handleFatChange(fatGrams + 10)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold"
                >
                  +10g
                </button>
              </div>
              <span className="text-neutral-500 font-medium">ฮอร์โมน & ดูดซึมวิตามิน</span>
            </div>
          </div>

          {/* CARD 4: 🎯 เป้าหมายแคลอรี่ต่อวัน (Daily Calories) & Reverse Calculation */}
          <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-orange-500/5 rounded-2xl p-4 border-2 border-orange-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center text-base shrink-0 font-bold shadow-md shadow-orange-500/30">
                  🎯
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-orange-950">เป้าหมายแคลอรี่รวม</span>
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
                  <span className="text-[10px] text-orange-800/80 font-medium">
                    {calorieDiffFromTdee < 0 
                      ? `ลดไขมันได้ ~${(Math.abs(calorieDiffFromTdee) * 30 / 7700).toFixed(1)} กก./เดือน` 
                      : calorieDiffFromTdee > 0 
                        ? 'เสริมสร้างมวลกล้ามเนื้อและน้ำหนัก' 
                        : 'รักษาน้ำหนักคงที่'}
                  </span>
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black text-orange-600 leading-none">
                {computedTotalCals.toLocaleString()}
              </span>
            </div>

            {/* Stepper & Numeric Input for Direct Calorie Adjustment */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTargetCaloriesChange(computedTotalCals - 50)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center font-bold text-xs active:scale-95 transition-all shrink-0 cursor-pointer"
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
                  value={targetCalories}
                  onChange={(e) => handleTargetCaloriesChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 text-center text-lg font-black text-orange-600 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-400 pointer-events-none">
                  kcal/วัน
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTargetCaloriesChange(computedTotalCals + 50)}
                className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-bold text-xs active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm shadow-orange-500/30"
                title="เพิ่ม 50 kcal"
              >
                +50
              </button>
            </div>

            {/* Quick Macro Ratio Presets */}
            <div className="pt-1 border-t border-orange-200/60">
              <span className="text-[10px] font-bold text-orange-900 block mb-1">
                เกลี่ยสารอาหารอัตโนมัติตามสัดส่วนยอดนิยม:
              </span>
              <div className="flex flex-wrap gap-1">
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
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white hover:bg-orange-50 text-neutral-700 hover:text-orange-700 border border-orange-200 transition-all cursor-pointer"
                  >
                    {split.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Macro Energy Distribution Bar */}
        <div className="bg-white rounded-2xl p-3 border border-neutral-200 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-neutral-700 flex items-center gap-1.5">
              <span>สัดส่วนพลังงาน (P/C/F Split):</span>
              <span className="text-blue-700">P {proteinPct}%</span>
              <span className="text-neutral-300">•</span>
              <span className="text-amber-700">C {carbsPct}%</span>
              <span className="text-neutral-300">•</span>
              <span className="text-emerald-700">F {fatPct}%</span>
            </span>
            <span className="text-orange-600 font-black">
              รวม {computedTotalCals.toLocaleString()} kcal
            </span>
          </div>

          <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${proteinPct}%` }} 
              className="bg-blue-500 h-full transition-all duration-300"
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
        </div>

        {/* ACTION BUTTONS: Primary Save & AI Trigger */}
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
      </div>

      {/* AI Explanation Accordion */}
      {plan && (
        <div className="bg-neutral-50/80 rounded-2xl p-4 border border-neutral-200/80">
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
