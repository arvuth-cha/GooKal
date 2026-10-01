import React, { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { 
  calculateAINutritionGoals, 
  calculateLocalSportsNutrition, 
  CalculatedNutritionPlan, 
  NutritionGoalParams 
} from '../../utils/aiNutritionCalculator';

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
  customTdee?: number; // ค่า TDEE เผาผลาญจริง (ถ้ามีผลตรวจแล็บ)
  aiExplanation?: string;
  aiKeyTips?: string[];
  aiPlanTitle?: string;
  proteinPerKg?: number;
}

interface AIMacroGoalCalculatorCardProps {
  userProfile: UserProfile;
  onSaveProfile: (newProfile: UserProfile) => void;
  onToast: (message: string) => void;
  onOpenDetailedModal?: () => void;
}

export const AIMacroGoalCalculatorCard: React.FC<AIMacroGoalCalculatorCardProps> = ({
  userProfile,
  onSaveProfile,
  onToast,
  onOpenDetailedModal
}) => {
  const [selectedGoal, setSelectedGoal] = useState<'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom'>(
    userProfile.goalType || 'muscle_maintain'
  );
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [showExplanationDetail, setShowExplanationDetail] = useState(false);

  // Edit fields for manual overrides
  const [editCalories, setEditCalories] = useState<number>(
    userProfile.targetCalories || (userProfile.customMacros ? ((userProfile.customMacros.protein * 4) + (userProfile.customMacros.carbs * 4) + (userProfile.customMacros.fat * 9)) : 2000)
  );
  const [editProtein, setEditProtein] = useState<number>(
    userProfile.customMacros?.protein || 130
  );
  const [editCarbs, setEditCarbs] = useState<number>(
    userProfile.customMacros?.carbs || 200
  );
  const [editFat, setEditFat] = useState<number>(
    userProfile.customMacros?.fat || 50
  );
  const [editSugar, setEditSugar] = useState<number>(
    userProfile.customMacros?.sugar || 24
  );
  const [editSodium, setEditSodium] = useState<number>(
    userProfile.customMacros?.sodium || 2000
  );

  // Latest calculated plan state
  const [plan, setPlan] = useState<CalculatedNutritionPlan | null>(null);

  // Sync initial state from user profile or compute initial baseline
  useEffect(() => {
    const initialParams: NutritionGoalParams = {
      gender: userProfile.gender || 'male',
      age: userProfile.age || 28,
      weight: userProfile.weight || 68,
      height: userProfile.height || 172,
      targetWeight: userProfile.targetWeight || userProfile.weight || 68,
      activityLevel: userProfile.activityLevel || 1.375,
      goalType: selectedGoal,
    };

    const initialPlan = calculateLocalSportsNutrition(initialParams);
    setPlan(initialPlan);

    if (userProfile.targetCalories) {
      setEditCalories(userProfile.targetCalories);
    } else if (userProfile.customMacros) {
      const macroSum = (userProfile.customMacros.protein * 4) + (userProfile.customMacros.carbs * 4) + (userProfile.customMacros.fat * 9);
      if (macroSum > 0) {
        setEditCalories(macroSum);
      } else {
        setEditCalories(initialPlan.dailyCalories);
      }
    } else {
      setEditCalories(initialPlan.dailyCalories);
    }

    if (userProfile.customMacros) {
      setEditProtein(userProfile.customMacros.protein);
      setEditCarbs(userProfile.customMacros.carbs);
      setEditFat(userProfile.customMacros.fat);
      setEditSugar(userProfile.customMacros.sugar || 24);
      setEditSodium(userProfile.customMacros.sodium || 2000);
    } else {
      setEditProtein(initialPlan.proteinGrams);
      setEditCarbs(initialPlan.carbsGrams);
      setEditFat(initialPlan.fatGrams);
      setEditSugar(initialPlan.sugarGrams);
      setEditSodium(initialPlan.sodiumMg);
    }
  }, [userProfile.gender, userProfile.age, userProfile.weight, userProfile.height, userProfile.activityLevel, userProfile.targetCalories]);

  // Handle AI Calculation
  const handleCalculateWithAI = async () => {
    setIsCalculating(true);
    try {
      const params: NutritionGoalParams = {
        gender: userProfile.gender || 'male',
        age: userProfile.age || 28,
        weight: userProfile.weight || 68,
        height: userProfile.height || 172,
        targetWeight: userProfile.targetWeight || userProfile.weight || 68,
        activityLevel: userProfile.activityLevel || 1.375,
        goalType: selectedGoal,
        customNotes: `เป้าหมาย: ${selectedGoal}`
      };

      const result = await calculateAINutritionGoals(params);
      setPlan(result);

      // Auto-populate edit states
      setEditCalories(result.dailyCalories);
      setEditProtein(result.proteinGrams);
      setEditCarbs(result.carbsGrams);
      setEditFat(result.fatGrams);
      setEditSugar(result.sugarGrams);
      setEditSodium(result.sodiumMg);

      // Auto-apply to UserProfile as default baseline
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

      onSaveProfile(updatedProfile);
      onToast(`✨ AI คำนวณเป้าหมายสำเร็จ: เป้าหมาย ${result.dailyCalories} kcal • โปรตีน ${result.proteinGrams}g (${result.proteinPerKg}g/kg) • TDEE จริง ${result.tdee} kcal`);
    } catch (error) {
      console.error('Failed to calculate AI macros:', error);
      onToast('เกิดข้อผิดพลาดในการคำนวณ ใช้ค่ามาตรฐานวิทยาศาสตร์การกีฬาแทน');
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle Goal Change
  const handleGoalChange = (newGoal: typeof selectedGoal) => {
    setSelectedGoal(newGoal);
    
    // Recalculate preview immediately
    const params: NutritionGoalParams = {
      gender: userProfile.gender || 'male',
      age: userProfile.age || 28,
      weight: userProfile.weight || 68,
      height: userProfile.height || 172,
      targetWeight: userProfile.targetWeight || userProfile.weight || 68,
      activityLevel: userProfile.activityLevel || 1.375,
      goalType: newGoal,
    };

    const newPlan = calculateLocalSportsNutrition(params);
    setPlan(newPlan);
  };

  // Save manual overrides
  const handleSaveManualOverrides = () => {
    const updatedProfile: UserProfile = {
      ...userProfile,
      goalType: selectedGoal,
      targetCalories: Number(editCalories) || 2000,
      customMacros: {
        carbs: Number(editCarbs) || 0,
        protein: Number(editProtein) || 0,
        fat: Number(editFat) || 0,
        sugar: Number(editSugar) || 24,
        sodium: Number(editSodium) || 2000,
      }
    };
    onSaveProfile(updatedProfile);
    setShowCustomEditor(false);
    onToast(`💾 บันทึกค่าสารอาหารที่ปรับแต่งเรียบร้อย (เป้าหมาย ${editCalories} kcal • โปรตีน ${editProtein}g • คาร์บ ${editCarbs}g • ไขมัน ${editFat}g)`);
  };

  // Reset to AI recommendation
  const handleResetToAIRecommendation = () => {
    if (!plan) return;
    setEditCalories(plan.dailyCalories);
    setEditProtein(plan.proteinGrams);
    setEditCarbs(plan.carbsGrams);
    setEditFat(plan.fatGrams);
    setEditSugar(plan.sugarGrams);
    setEditSodium(plan.sodiumMg);

    const updatedProfile: UserProfile = {
      ...userProfile,
      goalType: selectedGoal,
      targetCalories: plan.dailyCalories,
      customMacros: {
        carbs: plan.carbsGrams,
        protein: plan.proteinGrams,
        fat: plan.fatGrams,
        sugar: plan.sugarGrams,
        sodium: plan.sodiumMg,
      }
    };
    onSaveProfile(updatedProfile);
    onToast('🔄 รีเซ็ตกลับเป็นค่าแนะนำของ AI สำเร็จ');
  };

  // Calculate current macro energy sum for live feedback in custom editor
  const manualMacroCals = (editProtein * 4) + (editCarbs * 4) + (editFat * 9);
  const isCustomized = Boolean(
    userProfile.customMacros && 
    plan && 
    (userProfile.customMacros.protein !== plan.proteinGrams || 
     userProfile.customMacros.carbs !== plan.carbsGrams || 
     userProfile.customMacros.fat !== plan.fatGrams ||
     (userProfile.targetCalories && userProfile.targetCalories !== plan.dailyCalories))
  );

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900">AI คำนวณโปรตีน & สารอาหารเฉพาะบุคคล</h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                Smart Baseline
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              คำนวณตามเพศ อายุ น้ำหนัก ส่วนสูง และเป้าหมายตามหลักเวชศาสตร์การกีฬา
            </p>
          </div>
        </div>
      </div>

      {/* Goal Selector Grid */}
      <div>
        <label className="block text-xs font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
          <Target size={14} className="text-orange-500" />
          เลือกความต้องการ / เป้าหมายสุขภาพของคุณ
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { 
              id: 'muscle_maintain', 
              label: '🛡️ รักษากล้ามเนื้อ', 
              sub: 'ลีนกระชับ (1.4-1.6g/kg)',
              color: 'hover:border-blue-300'
            },
            { 
              id: 'muscle_build', 
              label: '💪 สร้างกล้ามเนื้อ', 
              sub: 'เพิ่มมวล (1.8-2.0g/kg)',
              color: 'hover:border-emerald-300'
            },
            { 
              id: 'balanced', 
              label: '🥗 สมดุลสุขภาพ', 
              sub: 'สุขภาพดีทั่วไป (1.0g/kg)',
              color: 'hover:border-amber-300'
            },
            { 
              id: 'fat_loss', 
              label: '⚡ ลดไขมันมาตรฐาน', 
              sub: 'Deficit -400 kcal (1.6g/kg)',
              color: 'hover:border-rose-300'
            },
            { 
              id: 'fat_loss_fast', 
              label: '🔥 ลดไขมันเร่งด่วน', 
              sub: 'Deficit -500 kcal (1.8g/kg)',
              color: 'hover:border-red-300'
            },
            { 
              id: 'keto', 
              label: '🥑 โลว์คาร์บ / คีโต', 
              sub: 'Low Carb • ไขมันดี',
              color: 'hover:border-purple-300'
            },
          ].map((item) => {
            const isSelected = selectedGoal === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleGoalChange(item.id as any)}
                className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-orange-50/80 border-orange-400 text-orange-950 shadow-xs'
                    : `bg-neutral-50/70 border-neutral-200/70 text-neutral-700 ${item.color}`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold block">{item.label}</span>
                  {isSelected && <Check size={14} className="text-orange-600 font-bold" />}
                </div>
                <span className="text-[10px] text-neutral-500 block leading-tight">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Trigger Button */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={handleCalculateWithAI}
          disabled={isCalculating}
          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
        >
          {isCalculating ? (
            <>
              <Loader2 size={18} className="animate-spin text-white" />
              <span>AI กำลังวิเคราะห์สรีระและคำนวณเป้าหมาย...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="text-amber-200" />
              <span>✨ ให้ AI วิเคราะห์ & คำนวณเป้าหมาย (นำไปใช้เป็นค่าตั้งต้น)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowCustomEditor(!showCustomEditor)}
          className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            showCustomEditor
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
          }`}
        >
          <Sliders size={15} />
          <span>{showCustomEditor ? 'ปิดตัวปรับแต่ง' : '✏️ ปรับแต่งตัวเลขเอง'}</span>
        </button>
      </div>

      {/* Blueprint Results Card */}
      {plan && (
        <div className="bg-gradient-to-br from-neutral-50 to-orange-50/40 rounded-2xl p-4 border border-orange-200/70 space-y-3.5">
          {/* Header & Plan Name */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-black text-neutral-800 tracking-tight">
                  {userProfile.aiPlanTitle || plan.planTitle}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                อิงจากสรีระ: {userProfile.gender === 'female' ? 'หญิง' : 'ชาย'}, {userProfile.age} ปี, นน. {userProfile.weight} kg, สส. {userProfile.height} cm
              </p>
            </div>
            {isCustomized ? (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center gap-1">
                <Edit3 size={10} /> กำหนดค่าเอง
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                <Check size={10} /> แนะนำโดย AI
              </span>
            )}
          </div>

          {/* Core Macro & Calorie Target - Horizontal Cards */}
          <div className="flex flex-col gap-2.5">
            {(() => {
              const activeTarget = userProfile.targetCalories ?? (userProfile.customMacros ? ((userProfile.customMacros.protein * 4) + (userProfile.customMacros.carbs * 4) + (userProfile.customMacros.fat * 9)) : plan.dailyCalories);
              const actualTdee = userProfile.customTdee ?? plan.tdee;
              const pGrams = userProfile.customMacros?.protein ?? plan.proteinGrams;
              const cGrams = userProfile.customMacros?.carbs ?? plan.carbsGrams;
              const fGrams = userProfile.customMacros?.fat ?? plan.fatGrams;

              const diff = activeTarget - actualTdee;
              const deficitTag = diff === 0 
                ? 'รักษาน้ำหนัก' 
                : diff < 0 
                  ? `Deficit -${Math.abs(diff)} kcal` 
                  : `Surplus +${diff} kcal`;

              const deficit = actualTdee - activeTarget;
              const tdeeDetail = deficit > 0
                ? `TDEE จริง: ${actualTdee.toLocaleString()} kcal (Deficit -${deficit})`
                : deficit < 0
                  ? `TDEE จริง: ${actualTdee.toLocaleString()} kcal (Surplus +${Math.abs(deficit)})`
                  : `TDEE จริง: ${actualTdee.toLocaleString()} kcal (สมดุล)`;

              return (
                <>
                  {/* 1. โปรตีน (Horizontal Card) */}
                  <div className="bg-white hover:bg-blue-50/40 rounded-2xl p-3.5 sm:p-4 border border-blue-100/90 shadow-2xs flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-lg shrink-0">
                        🥩
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-blue-950">โปรตีน</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                            {Math.round((pGrams / (userProfile.weight || 1)) * 10) / 10} g/kg
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                          ~{(pGrams * 4)} kcal • {Math.round(((pGrams * 4) / (activeTarget || 1)) * 100)}% ของพลังงานทั้งหมด
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 text-right shrink-0 pl-2">
                      <span className="text-xl sm:text-2xl font-black text-blue-900 leading-none tracking-tight">
                        {pGrams}
                      </span>
                      <span className="text-xs font-bold text-neutral-400">กรัม/วัน</span>
                    </div>
                  </div>

                  {/* 2. คาร์โบไฮเดรต (Horizontal Card) */}
                  <div className="bg-white hover:bg-amber-50/40 rounded-2xl p-3.5 sm:p-4 border border-amber-100/90 shadow-2xs flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
                        🍚
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-amber-950">คาร์โบไฮเดรต</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/60">
                            พลังงานหลัก
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                          ~{(cGrams * 4)} kcal • {Math.round(((cGrams * 4) / (activeTarget || 1)) * 100)}% ของพลังงานทั้งหมด
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 text-right shrink-0 pl-2">
                      <span className="text-xl sm:text-2xl font-black text-amber-900 leading-none tracking-tight">
                        {cGrams}
                      </span>
                      <span className="text-xs font-bold text-neutral-400">กรัม/วัน</span>
                    </div>
                  </div>

                  {/* 3. ไขมันดี (Horizontal Card) */}
                  <div className="bg-white hover:bg-emerald-50/40 rounded-2xl p-3.5 sm:p-4 border border-emerald-100/90 shadow-2xs flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                        🥑
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-emerald-950">ไขมันดี</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                            ฮอร์โมน & เซลล์
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                          ~{(fGrams * 9)} kcal • {Math.round(((fGrams * 9) / (activeTarget || 1)) * 100)}% ของพลังงานทั้งหมด
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 text-right shrink-0 pl-2">
                      <span className="text-xl sm:text-2xl font-black text-emerald-900 leading-none tracking-tight">
                        {fGrams}
                      </span>
                      <span className="text-xs font-bold text-neutral-400">กรัม/วัน</span>
                    </div>
                  </div>

                  {/* 4. เป้าหมายแคลอรี (Horizontal Card) */}
                  <div className="bg-orange-50/90 hover:bg-orange-100/70 rounded-2xl p-3.5 sm:p-4 border border-orange-200/90 shadow-2xs flex items-center justify-between transition-all">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg shrink-0">
                        🎯
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-orange-950">เป้าหมายแคลอรี</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-orange-200/70 text-orange-800 text-[10px] font-bold border border-orange-300/60">
                            {deficitTag}
                          </span>
                        </div>
                        <div className="text-[11px] text-orange-700/80 font-medium truncate mt-0.5">
                          {tdeeDetail}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 text-right shrink-0 pl-2">
                      <span className="text-xl sm:text-2xl font-black text-orange-600 leading-none tracking-tight">
                        {activeTarget.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-orange-500">kcal/วัน</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* AI Explanation Accordion */}
          <div className="bg-white/80 rounded-xl p-3 border border-orange-100">
            <button
              type="button"
              onClick={() => setShowExplanationDetail(!showExplanationDetail)}
              className="w-full flex items-center justify-between text-left font-bold text-xs text-neutral-800 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Info size={14} className="text-orange-500" />
                <span>เหตุผลทางวิทยาศาสตร์ & เคล็ดลับโภชนาการ</span>
              </div>
              {showExplanationDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showExplanationDetail && (
              <div className="mt-2.5 pt-2.5 border-t border-neutral-100 text-xs text-neutral-600 space-y-2 animate-in fade-in duration-200">
                <p className="leading-relaxed text-neutral-700 font-medium">
                  {userProfile.aiExplanation || plan.explanation}
                </p>

                {/* Key Tips */}
                {((userProfile.aiKeyTips && userProfile.aiKeyTips.length > 0) ? userProfile.aiKeyTips : plan.keyTips).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-neutral-600">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>{tip}</span>
                  </div>
                ))}

                <div className="flex items-center gap-4 pt-1 text-[11px] text-neutral-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Droplet size={12} className="text-blue-500" /> น้ำดื่มแนะนำ: ~{(plan.waterMl / 1000).toFixed(1)} ลิตร/วัน
                  </span>
                  <span>🧂 โซเดียม &lt; 2,000 mg</span>
                  <span>🍬 น้ำตาล &lt; 25 g</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Custom Override Panel */}
      {showCustomEditor && (
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Sliders size={16} className="text-orange-500" />
                ปรับแต่งตัวเลขสารอาหารและแคลอรีด้วยตนเอง
              </h3>
              <p className="text-[11px] text-neutral-500">
                คุณสามารถพิมพ์ตัวเลขตามที่แพทย์หรือเทรนเนอร์แนะนำได้โดยตรง
              </p>
            </div>
            {plan && (
              <button
                type="button"
                onClick={handleResetToAIRecommendation}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200 cursor-pointer"
              >
                <RotateCcw size={12} /> รีเซ็ตเป็นค่า AI
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Calories Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                เป้าหมายแคลอรีรวม (kcal/วัน)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editCalories}
                  onChange={(e) => setEditCalories(Number(e.target.value) || 0)}
                  className="flex-1 bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-sm font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                />
                <span className="text-xs text-neutral-500 font-medium">kcal</span>
              </div>
            </div>

            {/* Protein Input */}
            <div>
              <label className="block text-xs font-bold text-blue-700 mb-1 flex items-center justify-between">
                <span>โปรตีน (กรัม/วัน)</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  ~{Math.round((editProtein / (userProfile.weight || 1)) * 10) / 10} g/kg
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editProtein}
                  onChange={(e) => setEditProtein(Number(e.target.value) || 0)}
                  className="flex-1 bg-white border border-blue-200 rounded-xl px-3.5 py-2 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-neutral-500 font-medium">g ({Math.round(((editProtein * 4) / (editCalories || 1)) * 100)}%)</span>
              </div>
            </div>

            {/* Carbs Input */}
            <div>
              <label className="block text-xs font-bold text-amber-700 mb-1">
                คาร์โบไฮเดรต (กรัม/วัน)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editCarbs}
                  onChange={(e) => setEditCarbs(Number(e.target.value) || 0)}
                  className="flex-1 bg-white border border-amber-200 rounded-xl px-3.5 py-2 text-sm font-bold text-amber-900 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-neutral-500 font-medium">g ({Math.round(((editCarbs * 4) / (editCalories || 1)) * 100)}%)</span>
              </div>
            </div>

            {/* Fat Input */}
            <div>
              <label className="block text-xs font-bold text-emerald-700 mb-1">
                ไขมัน (กรัม/วัน)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editFat}
                  onChange={(e) => setEditFat(Number(e.target.value) || 0)}
                  className="flex-1 bg-white border border-emerald-200 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-900 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-neutral-500 font-medium">g ({Math.round(((editFat * 9) / (editCalories || 1)) * 100)}%)</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Macro Splits */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-neutral-500 block mb-1.5">
              เลือกสัดส่วนยอดนิยมอัตโนมัติ (คำนวณจากแคลอรี {editCalories} kcal):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: '💪 High Protein (40C / 40P / 20F)', pPct: 0.40, cPct: 0.40, fPct: 0.20 },
                { name: '🥗 Balanced (50C / 30P / 20F)', pPct: 0.30, cPct: 0.50, fPct: 0.20 },
                { name: '🛡️ Recomp (45C / 35P / 20F)', pPct: 0.35, cPct: 0.45, fPct: 0.20 },
                { name: '🥑 Low Carb (15C / 35P / 50F)', pPct: 0.35, cPct: 0.15, fPct: 0.50 },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const c = Math.round((editCalories * preset.cPct) / 4);
                    const p = Math.round((editCalories * preset.pPct) / 4);
                    const f = Math.round((editCalories * preset.fPct) / 9);
                    setEditCarbs(c);
                    setEditProtein(p);
                    setEditFat(f);
                  }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 text-neutral-700 hover:text-orange-700 border border-neutral-200 transition-all cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calorie Sum check */}
          <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-neutral-200 text-xs">
            <span className="text-neutral-600 font-medium">
              ผลรวมพลังงานจากสารอาหาร (P+C+F):
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`font-black ${Math.abs(manualMacroCals - editCalories) > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {manualMacroCals} kcal
              </span>
              <span className="text-neutral-400">/ {editCalories} kcal</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveManualOverrides}
              className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Check size={14} /> บันทึกและนำค่าที่ปรับแต่งนี้ไปใช้
            </button>
            <button
              type="button"
              onClick={() => setShowCustomEditor(false)}
              className="py-2.5 px-4 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
