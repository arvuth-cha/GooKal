import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Activity,
  ShieldCheck,
  Scale,
  Flame,
  Sparkles,
  Droplets,
  Moon,
  Zap,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronUp,
  FileText,
  Dna,
  Stethoscope,
  Coffee,
  Footprints,
  Smile,
  Wind,
  Percent,
  RefreshCw,
  AlertCircle,
  Calendar,
  Award,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { QuickHealthNutritionSuiteHub } from './QuickHealthNutritionSuiteHub';
import { BioHackingInnovationsHub, InnovationCategory } from './BioHackingInnovationsHub';
import { FoodManagementSuiteHub } from '../food/FoodManagementSuiteHub';
import { formatDateDMY, formatDateDMYShort } from '../../utils/dateUtils';

export interface VitalsRecord {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  timestamp: number;
  weight?: number;
  waistCm?: number;
  systolicBp?: number;
  diastolicBp?: number;
  bloodSugarMgDl?: number;
  sleepHours?: number;
  stressLevel?: number; // 1-5
  notes?: string;
}

interface HealthCenterDashboardProps {
  userProfile: {
    age: number;
    gender: 'male' | 'female';
    weight: number;
    height: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
    targetWeight?: number;
  };
  todayCalories: number;
  calorieTarget: number;
  todayProtein: number;
  proteinTarget: number;
  todayWaterMl: number;
  waterTargetMl: number;
  fastingHoursElapsed?: number;
  fastingTargetHours?: number;
  onToast: (msg: string) => void;
  onOpenStreak: () => void;
  onOpenQuickFoodAdd: () => void;
  onOpenNutritionLabel: () => void;
  onOpenMealSwaps: () => void;
  onOpenCustomMeals: () => void;
  onOpenGrocery: () => void;
  onOpenDailyMood: () => void;
  onOpenBodyTracker: () => void;
  onOpenCalorieGoals: () => void;
  onOpenClinicalReport: () => void;
  onOpenMetabolicAge: () => void;
  onOpenGlucoseCrash: () => void;
  onOpenMicrobiome: () => void;
  onOpenCaffeineDecay: () => void;
  onOpenChronoNutrition: () => void;
  onOpenHydrationOptimizer: () => void;
  onOpenPostMealWalk: () => void;
  onOpenCravingSOS: () => void;
  onOpenVisualPhotoFat: () => void;
  onOpenBiomarkerSync: () => void;
  onOpenDiningMenu: () => void;
  onOpenExerciseBurn: () => void;
  onOpenLongevity: () => void;
  onOpenFastingStages: () => void;
  onOpenFridgeManager: () => void;
  onOpenSmartPantry: () => void;
  onOpenCookingAvatar: () => void;
  onOpenHealthyPlate: () => void;
  onOpenMetabolicHeatmap: () => void;
  onOpenAllergySafety: () => void;
  onOpenCheatMeal: () => void;
  onOpenHabitStack: () => void;
  onOpenSocialStory: () => void;
  onOpenStreetFood: () => void;
  onOpenWeeklyMealPlanner: () => void;
  onOpenSmartBarcode: () => void;
  onOpenMicronutrient: () => void;
  onOpenBackupRestore: () => void;
  onUpdateProfileWeight?: (newWeight: number) => void;
}

const VITALS_STORAGE_KEY = 'kalguru_vitals_records_v1';
const HEALTH_HABITS_KEY = 'kalguru_daily_health_habits_v1';

export const HealthCenterDashboard: React.FC<HealthCenterDashboardProps> = ({
  userProfile,
  todayCalories,
  calorieTarget,
  todayProtein,
  proteinTarget,
  todayWaterMl,
  waterTargetMl,
  fastingHoursElapsed = 0,
  fastingTargetHours = 16,
  onToast,
  onOpenStreak,
  onOpenQuickFoodAdd,
  onOpenNutritionLabel,
  onOpenMealSwaps,
  onOpenCustomMeals,
  onOpenGrocery,
  onOpenDailyMood,
  onOpenBodyTracker,
  onOpenCalorieGoals,
  onOpenClinicalReport,
  onOpenMetabolicAge,
  onOpenGlucoseCrash,
  onOpenMicrobiome,
  onOpenCaffeineDecay,
  onOpenChronoNutrition,
  onOpenHydrationOptimizer,
  onOpenPostMealWalk,
  onOpenCravingSOS,
  onOpenVisualPhotoFat,
  onOpenBiomarkerSync,
  onOpenDiningMenu,
  onOpenExerciseBurn,
  onOpenLongevity,
  onOpenFastingStages,
  onOpenFridgeManager,
  onOpenSmartPantry,
  onOpenCookingAvatar,
  onOpenHealthyPlate,
  onOpenMetabolicHeatmap,
  onOpenAllergySafety,
  onOpenCheatMeal,
  onOpenHabitStack,
  onOpenSocialStory,
  onOpenStreetFood,
  onOpenWeeklyMealPlanner,
  onOpenSmartBarcode,
  onOpenMicronutrient,
  onOpenBackupRestore,
  onUpdateProfileWeight
}) => {
  const [vitalsHistory, setVitalsHistory] = useState<VitalsRecord[]>([]);
  const [showVitalsModal, setShowVitalsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'risk_assessment' | 'habits'>('overview');
  
  // Section Accordion States (All collapsible)
  const [isHeaderStatsOpen, setIsHeaderStatsOpen] = useState<boolean>(true);
  const [isFoodManagementOpen, setIsFoodManagementOpen] = useState<boolean>(true);
  const [isQuickSuiteHubOpen, setIsQuickSuiteHubOpen] = useState<boolean>(true);
  const [isInnovationHubOpen, setIsInnovationHubOpen] = useState<boolean>(true);
  const [isBodyCompositionOpen, setIsBodyCompositionOpen] = useState<boolean>(true);
  const [isVitalsHistoryOpen, setIsVitalsHistoryOpen] = useState<boolean>(true);
  const [isRiskAssessmentOpen, setIsRiskAssessmentOpen] = useState<boolean>(true);
  const [isHabitsChecklistOpen, setIsHabitsChecklistOpen] = useState<boolean>(true);
  const [innovationCategory, setInnovationCategory] = useState<InnovationCategory>('all');

  // New Vitals Form State
  const [inputWeight, setInputWeight] = useState<string>(userProfile.weight ? userProfile.weight.toString() : '65');
  const [inputWaist, setInputWaist] = useState<string>('78');
  const [inputSystolic, setInputSystolic] = useState<string>('118');
  const [inputDiastolic, setInputDiastolic] = useState<string>('76');
  const [inputBloodSugar, setInputBloodSugar] = useState<string>('92');
  const [inputSleepHours, setInputSleepHours] = useState<string>('7.5');
  const [inputStressLevel, setInputStressLevel] = useState<number>(2);

  // Daily Health Checklist State
  const [dailyHabits, setDailyHabits] = useState<{ [key: string]: boolean }>({});

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VITALS_STORAGE_KEY);
      if (stored) {
        setVitalsHistory(JSON.parse(stored));
      }

      const todayKey = new Date().toISOString().split('T')[0];
      const storedHabits = localStorage.getItem(`${HEALTH_HABITS_KEY}_${todayKey}`);
      if (storedHabits) {
        setDailyHabits(JSON.parse(storedHabits));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleHabit = (habitId: string) => {
    const todayKey = new Date().toISOString().split('T')[0];
    const updated = { ...dailyHabits, [habitId]: !dailyHabits[habitId] };
    setDailyHabits(updated);
    try {
      localStorage.setItem(`${HEALTH_HABITS_KEY}_${todayKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (!dailyHabits[habitId]) {
      onToast('✨ ทำภารกิจสุขภาพสำเร็จแล้ว +10 คะแนนสุขภาพ!');
    }
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(inputWeight) || userProfile.weight;
    const waistNum = parseFloat(inputWaist) || undefined;
    const sysNum = parseInt(inputSystolic, 10) || undefined;
    const diaNum = parseInt(inputDiastolic, 10) || undefined;
    const bsNum = parseInt(inputBloodSugar, 10) || undefined;
    const sleepNum = parseFloat(inputSleepHours) || undefined;

    const newRecord: VitalsRecord = {
      id: `vital-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      weight: weightNum,
      waistCm: waistNum,
      systolicBp: sysNum,
      diastolicBp: diaNum,
      bloodSugarMgDl: bsNum,
      sleepHours: sleepNum,
      stressLevel: inputStressLevel
    };

    const updated = [newRecord, ...vitalsHistory.filter(r => r.date !== newRecord.date)];
    setVitalsHistory(updated);
    try {
      localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    if (onUpdateProfileWeight && weightNum) {
      onUpdateProfileWeight(weightNum);
    }

    setShowVitalsModal(false);
    onToast(`🩺 บันทึกข้อมูลสุขภาพประจำวันเรียบร้อย (น้ำหนัก ${weightNum} kg)`);
  };

  // Calculations
  const currentWeight = vitalsHistory.length > 0 && vitalsHistory[0].weight ? vitalsHistory[0].weight : userProfile.weight || 65;
  const heightM = (userProfile.height || 170) / 100;
  const bmi = parseFloat((currentWeight / (heightM * heightM)).toFixed(1));

  let bmiCategory = 'สมส่วน (Normal)';
  let bmiColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (bmi < 18.5) {
    bmiCategory = 'น้ำหนักน้อยกว่าเกณฑ์ (Underweight)';
    bmiColor = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (bmi >= 23 && bmi < 25) {
    bmiCategory = 'น้ำหนักเกินเกณฑ์มาตรฐานเอเชีย (Overweight)';
    bmiColor = 'text-orange-600 bg-orange-50 border-orange-200';
  } else if (bmi >= 25) {
    bmiCategory = 'เข้าข่ายโรคอ้วน (Obese)';
    bmiColor = 'text-rose-600 bg-rose-50 border-rose-200';
  }

  // Waist to Height Ratio (WHtR)
  const currentWaist = vitalsHistory.length > 0 && vitalsHistory[0].waistCm ? vitalsHistory[0].waistCm : 78;
  const whtr = parseFloat((currentWaist / userProfile.height).toFixed(2));
  let whtrStatus = 'ระดับดีเยี่ยม ไขมันในช่องท้องต่ำ';
  let whtrColor = 'text-emerald-600';
  if (whtr >= 0.5 && whtr < 0.6) {
    whtrStatus = 'มีความเสี่ยงสะสมไขมันช่องท้องปานกลาง';
    whtrColor = 'text-amber-600';
  } else if (whtr >= 0.6) {
    whtrStatus = 'ความเสี่ยงโรคหลอดเลือดและหัวใจสูง';
    whtrColor = 'text-rose-600';
  }

  // Blood Pressure Status
  const latestSys = vitalsHistory.length > 0 && vitalsHistory[0].systolicBp ? vitalsHistory[0].systolicBp : 118;
  const latestDia = vitalsHistory.length > 0 && vitalsHistory[0].diastolicBp ? vitalsHistory[0].diastolicBp : 76;
  let bpStatus = 'ความดันโลหิตปกติ (Optimal)';
  let bpColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (latestSys >= 130 || latestDia >= 85) {
    bpStatus = 'เริ่มมีความดันโลหิตสูงเล็กน้อย (Pre-hypertension)';
    bpColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (latestSys >= 140 || latestDia >= 90) {
    bpStatus = 'ความดันโลหิตสูงระดับ 1 (Hypertension)';
    bpColor = 'text-rose-700 bg-rose-50 border-rose-200';
  }

  // Blood Sugar Status
  const latestBs = vitalsHistory.length > 0 && vitalsHistory[0].bloodSugarMgDl ? vitalsHistory[0].bloodSugarMgDl : 92;
  let bsStatus = 'ระดับน้ำตาลปกติ (< 100 mg/dL)';
  let bsColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (latestBs >= 100 && latestBs <= 125) {
    bsStatus = 'ภาวะก่อนเบาหวาน (Pre-diabetes 100-125)';
    bsColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (latestBs > 125) {
    bsStatus = 'เสี่ยงภาวะเบาหวาน (> 125 mg/dL)';
    bsColor = 'text-rose-700 bg-rose-50 border-rose-200';
  }

  // Overall Health Score (0-100)
  let healthScore = 75;
  if (bmi >= 18.5 && bmi < 23) healthScore += 10;
  if (whtr < 0.5) healthScore += 5;
  if (latestSys < 120 && latestDia < 80) healthScore += 5;
  if (latestBs < 100) healthScore += 5;
  if (todayWaterMl >= waterTargetMl) healthScore += 5;
  if (todayProtein >= proteinTarget * 0.8) healthScore += 5;
  healthScore = Math.min(100, Math.max(40, healthScore));

  const habitItems = [
    { id: 'h_water', title: 'ดื่มน้ำครบเป้าหมาย', desc: `ดื่มแล้ว ${todayWaterMl.toLocaleString()} / ${waterTargetMl.toLocaleString()} ml`, icon: Droplets, color: 'text-cyan-600 bg-cyan-50' },
    { id: 'h_walk', title: 'เดินย่อย 15 นาทีหลังมื้ออาหาร', desc: 'กระตุ้น GLUT4 รับน้ำตาลเข้ากล้ามเนื้อ', icon: Footprints, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'h_protein', title: 'ทานโปรตีนคุณภาพถึงเกณฑ์', desc: `ได้โปรตีน ${todayProtein}g / ${proteinTarget}g`, icon: Flame, color: 'text-rose-600 bg-rose-50' },
    { id: 'h_sleep', title: 'นอนหลับ 7-8 ชั่วโมงอย่างมีคุณภาพ', desc: 'งดคาเฟอีนล่วงหน้า 8 ชม. ก่อนนอน', icon: Moon, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'h_fasting', title: 'รักษาช่วงเวลาอดอาหาร (Fasting)', desc: 'เปิดการเผาผลาญไขมันลึกและ Autophagy', icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { id: 'h_greens', title: 'เติมไฟเบอร์ & พืชหลากหลาย 25+ ชนิด/สัปดาห์', desc: 'บำรุงจุลินทรีย์สร้างกรดไขมันสายสั้น (SCFA)', icon: Dna, color: 'text-teal-600 bg-teal-50' }
  ];

  const completedHabitsCount = habitItems.filter(h => dailyHabits[h.id]).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 border border-white/20 shadow-inner">
                <Heart size={26} className="animate-pulse text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">ศูนย์สุขภาพองค์รวม</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase">
                    Holistic Health Hub
                  </span>
                </div>
                <p className="text-xs text-neutral-300 font-medium mt-0.5">
                  วิเคราะห์ชีวมาร์กเกอร์ ความดัน น้ำตาล สัดส่วนร่างกาย และความเสี่ยงเมตาบอลิก
                </p>
              </div>
            </div>

            {/* Quick Action Button & Collapse Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVitalsModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>บันทึกค่าวัดวันนี้</span>
              </button>

              <button
                type="button"
                onClick={onOpenClinicalReport}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
                title="ออกใบรายงานสรุปผลทางคลินิก (PDF)"
              >
                <FileText size={15} className="text-emerald-300" />
                <span className="hidden sm:inline">รายงานแพทย์</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHeaderStatsOpen(!isHeaderStatsOpen)}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 cursor-pointer flex items-center justify-center"
                title={isHeaderStatsOpen ? "ยุบสถิติภาพรวม" : "ขยายสถิติภาพรวม"}
                aria-label={isHeaderStatsOpen ? "ยุบสถิติภาพรวม" : "ขยายสถิติภาพรวม"}
              >
                <ChevronUp size={18} className={`text-neutral-300 transition-transform duration-300 ${isHeaderStatsOpen ? '' : 'rotate-180'}`} />
              </button>
            </div>
          </div>

          {/* Holistic Health Score Card */}
          <AnimatePresence>
            {isHeaderStatsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {/* Score */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-neutral-300 text-xs font-bold">
                      <span>คะแนนสุขภาพ</span>
                      <Sparkles size={14} className="text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-1.5 my-1">
                      <span className="text-3xl font-black text-emerald-300 font-mono">{healthScore}</span>
                      <span className="text-xs text-neutral-400 font-bold">/ 100</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-medium">สมดุลชีวภาพดีเยี่ยม</span>
                  </div>

                  {/* BMI */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-neutral-300 text-xs font-bold">
                      <span>ดัชนีมวลกาย BMI</span>
                      <Scale size={14} className="text-teal-400" />
                    </div>
                    <div className="flex items-baseline gap-1.5 my-1">
                      <span className="text-3xl font-black text-white font-mono">{bmi}</span>
                      <span className="text-[11px] text-neutral-400 font-bold">kg/m²</span>
                    </div>
                    <span className="text-[10px] text-teal-200 font-medium truncate">{bmiCategory.split(' ')[0]}</span>
                  </div>

                  {/* Blood Pressure */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-neutral-300 text-xs font-bold">
                      <span>ความดันโลหิต</span>
                      <Activity size={14} className="text-rose-400" />
                    </div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl font-black text-white font-mono">{latestSys}/{latestDia}</span>
                      <span className="text-[10px] text-neutral-400 font-bold">mmHg</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-medium">ระดับปลอดภัย</span>
                  </div>

                  {/* Fasting Glucose */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-neutral-300 text-xs font-bold">
                      <span>น้ำตาลก่อนอาหาร</span>
                      <Droplets size={14} className="text-amber-400" />
                    </div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-3xl font-black text-white font-mono">{latestBs}</span>
                      <span className="text-[10px] text-neutral-400 font-bold">mg/dL</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-medium">ระดับปกติ</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: '📊 ภาพรวมและอวัยวะ', icon: ShieldCheck },
          { id: 'vitals', label: '🩺 ค่าวัดและน้ำหนัก', icon: Activity },
          { id: 'risk_assessment', label: '🔬 ความเสี่ยงเมตาบอลิก', icon: Dna },
          { id: 'habits', label: '✅ กิจวัตรสุขภาพประจำวัน', icon: Award }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-neutral-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Hub */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 1. Food Management Suite (การจัดการอาหาร) */}
          <FoodManagementSuiteHub
            isOpen={isFoodManagementOpen}
            onToggleOpen={() => setIsFoodManagementOpen(!isFoodManagementOpen)}
            onOpenGrocery={onOpenGrocery}
            onOpenFridgeManager={onOpenFridgeManager}
            onOpenSmartPantry={onOpenSmartPantry}
            onOpenCookingAvatar={onOpenCookingAvatar}
            onOpenDiningMenu={onOpenDiningMenu}
            onOpenStreetFood={onOpenStreetFood}
            onOpenWeeklyMealPlanner={onOpenWeeklyMealPlanner}
            onOpenCustomMeals={onOpenCustomMeals}
            onOpenMealSwaps={onOpenMealSwaps}
            onToast={onToast}
          />

          {/* 2. Quick Health & Nutrition Suite Hub */}
          <QuickHealthNutritionSuiteHub
            isOpen={isQuickSuiteHubOpen}
            onToggleOpen={() => setIsQuickSuiteHubOpen(!isQuickSuiteHubOpen)}
            onOpenStreak={onOpenStreak}
            onOpenQuickFoodAdd={onOpenQuickFoodAdd}
            onOpenNutritionLabel={onOpenNutritionLabel}
            onOpenDailyMood={onOpenDailyMood}
            onOpenBodyTracker={onOpenBodyTracker}
            onOpenCalorieGoals={onOpenCalorieGoals}
            onOpenClinicalReport={onOpenClinicalReport}
            onOpenBackupRestore={onOpenBackupRestore}
          />

          {/* 20 AI Innovations & Bio-Hacking Hub */}
          <BioHackingInnovationsHub
            isOpen={isInnovationHubOpen}
            onToggleOpen={() => setIsInnovationHubOpen(!isInnovationHubOpen)}
            category={innovationCategory}
            onSelectCategory={setInnovationCategory}
            onOpenGlucoseModal={onOpenGlucoseCrash}
            onOpenDiningMenuModal={onOpenDiningMenu}
            onOpenExerciseBurnModal={onOpenExerciseBurn}
            onOpenChronoNutritionModal={onOpenChronoNutrition}
            onOpenLongevityModal={onOpenLongevity}
            onOpenMicrobiomeModal={onOpenMicrobiome}
            onOpenFastingStagesModal={onOpenFastingStages}
            onOpenHealthyPlateModal={onOpenHealthyPlate}
            onOpenMetabolicHeatmapModal={onOpenMetabolicHeatmap}
            onOpenAllergySafetyModal={onOpenAllergySafety}
            onOpenCheatMealModal={onOpenCheatMeal}
            onOpenCravingSOSModal={onOpenCravingSOS}
            onOpenHydrationOptimizerModal={onOpenHydrationOptimizer}
            onOpenHabitStackModal={onOpenHabitStack}
            onOpenSocialStoryModal={onOpenSocialStory}
            onOpenBiomarkerSyncModal={onOpenBiomarkerSync}
            onOpenCaffeineDecayModal={onOpenCaffeineDecay}
            onOpenStreetFoodModal={onOpenStreetFood}
            onOpenMetabolicAgeModal={onOpenMetabolicAge}
            onOpenWeeklyMealPlannerModal={onOpenWeeklyMealPlanner}
            onOpenSmartBarcodeModal={onOpenSmartBarcode}
            onOpenMicronutrientModal={onOpenMicronutrient}
            onOpenPostMealWalkModal={onOpenPostMealWalk}
            onOpenVisualPhotoModal={onOpenVisualPhotoFat}
          />


          {/* Body Composition Summary Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <Scale size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">การกระจายสัดส่วน & การเผาผลาญพลังงาน</h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    สัดส่วนรอบเอวต่อส่วนสูง (WHtR) และเป้าหมายน้ำหนักตัว
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer px-2 py-1 rounded-lg hover:bg-emerald-50"
                >
                  แก้ไขค่าวัด
                </button>
                <button
                  type="button"
                  onClick={() => setIsBodyCompositionOpen(!isBodyCompositionOpen)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                  title={isBodyCompositionOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
                  aria-label={isBodyCompositionOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
                >
                  <ChevronUp size={18} className={`transition-transform duration-300 ${isBodyCompositionOpen ? '' : 'rotate-180'}`} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isBodyCompositionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden pt-2"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                      <span className="text-[11px] text-neutral-500 font-bold block">น้ำหนักตัวปัจจุบัน</span>
                      <span className="text-xl font-black text-neutral-900 font-mono">{currentWeight} kg</span>
                      <span className="text-[10px] text-neutral-400 block">ส่วนสูง {userProfile.height} cm</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                      <span className="text-[11px] text-neutral-500 font-bold block">เป้าหมายน้ำหนัก</span>
                      <span className="text-xl font-black text-emerald-600 font-mono">{userProfile.targetWeight || currentWeight - 3} kg</span>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        {userProfile.targetWeight ? (userProfile.targetWeight < currentWeight ? `อีก -${(currentWeight - userProfile.targetWeight).toFixed(1)} kg` : `อีก +${(userProfile.targetWeight - currentWeight).toFixed(1)} kg`) : 'รักษาน้ำหนัก'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-neutral-500 font-bold block">รอบเอวต่อส่วนสูง (WHtR)</span>
                      <span className="text-xl font-black text-teal-700 font-mono">{whtr}</span>
                      <span className="text-[10px] text-neutral-500 font-medium block truncate">{whtrStatus.split(' ')[0]}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Tab 2: Vitals & History */}
      {activeTab === 'vitals' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-neutral-900 text-base">ประวัติการบันทึกค่าวัดทางชีวมาร์กเกอร์ (Vitals History)</h3>
                <p className="text-xs text-neutral-500 font-medium">บันทึกและติดตามแนวโน้มค่าวัดสุขภาพย้อนหลัง</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVitalsModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>บันทึกค่าใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVitalsHistoryOpen(!isVitalsHistoryOpen)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                title={isVitalsHistoryOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
                aria-label={isVitalsHistoryOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
              >
                <ChevronUp size={18} className={`transition-transform duration-300 ${isVitalsHistoryOpen ? '' : 'rotate-180'}`} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isVitalsHistoryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden pt-1"
              >
                {vitalsHistory.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-3">
                    <Activity size={36} className="mx-auto text-neutral-400" />
                    <h4 className="font-bold text-sm text-neutral-700">ยังไม่มีบันทึกค่าวัดทางสุขภาพ</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      เริ่มต้นบันทึกน้ำหนัก ความดัน น้ำตาลในเลือด หรือชั่วโมงการนอน เพื่อให้ระบบสร้างกราฟแนวโน้มสุขภาพของคุณ
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowVitalsModal(true)}
                      className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
                    >
                      บันทึกค่าวัดครั้งแรก
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vitalsHistory.map((record) => (
                      <div
                        key={record.id}
                        className="p-4 rounded-2xl bg-neutral-50/60 border border-neutral-200/80 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                          <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                            <Calendar size={13} className="text-emerald-600" />
                            {formatDateDMY(record.timestamp)} ({formatDateDMYShort(record.timestamp)})
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(record.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {record.weight && (
                            <div className="p-2 rounded-xl bg-white border border-neutral-100">
                              <span className="text-[10px] text-neutral-400 block">น้ำหนัก</span>
                              <span className="font-bold text-neutral-800">{record.weight} kg</span>
                            </div>
                          )}
                          {record.systolicBp && record.diastolicBp && (
                            <div className="p-2 rounded-xl bg-white border border-neutral-100">
                              <span className="text-[10px] text-neutral-400 block">ความดัน</span>
                              <span className="font-bold text-neutral-800">{record.systolicBp}/{record.diastolicBp} mmHg</span>
                            </div>
                          )}
                          {record.bloodSugarMgDl && (
                            <div className="p-2 rounded-xl bg-white border border-neutral-100">
                              <span className="text-[10px] text-neutral-400 block">น้ำตาลสะสม</span>
                              <span className="font-bold text-neutral-800">{record.bloodSugarMgDl} mg/dL</span>
                            </div>
                          )}
                          {record.sleepHours && (
                            <div className="p-2 rounded-xl bg-white border border-neutral-100">
                              <span className="text-[10px] text-neutral-400 block">การนอน</span>
                              <span className="font-bold text-neutral-800">{record.sleepHours} ชม.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tab 3: Risk Assessment */}
      {activeTab === 'risk_assessment' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-neutral-900 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope size={20} className="text-emerald-400" />
                <h3 className="font-bold text-sm">การประเมินความเสี่ยงโรคกลุ่ม NCDs และหลอดเลือดหัวใจ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRiskAssessmentOpen(!isRiskAssessmentOpen)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title={isRiskAssessmentOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
                aria-label={isRiskAssessmentOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
              >
                <ChevronUp size={18} className={`transition-transform duration-300 ${isRiskAssessmentOpen ? '' : 'rotate-180'}`} />
              </button>
            </div>
            <p className="text-xs text-neutral-300 font-medium leading-relaxed">
              คำนวณจากข้อมูลประชากร ดัชนีมวลกาย สัดส่วนรอบเอวต่อส่วนสูง และประวัติระดับน้ำตาลในเลือด
            </p>
          </div>

          <AnimatePresence>
            {isRiskAssessmentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Risk 1: Visceral Fat & Fatty Liver */}
                  <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900">1. ความเสี่ยงไขมันพอกตับ & ไขมันช่องท้อง</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${whtr < 0.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {whtr < 0.5 ? 'ความเสี่ยงต่ำ' : 'ควรระวัง'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      ค่า WHtR อยู่ที่ {whtr} (เกณฑ์ปลอดภัย &lt; 0.5) แนะนำออกกำลังกายแบบเวทเทรนนิ่งร่วมกับลดน้ำตาลฟรุกโตส
                    </p>
                  </div>

                  {/* Risk 2: Insulin Resistance */}
                  <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900">2. ภาวะดื้อต่ออินซูลิน (Insulin Resistance)</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${latestBs < 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {latestBs < 100 ? 'ไวต่ออินซูลินดี' : 'ภาวะก่อนเบาหวาน'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      ระดับน้ำตาลก่อนอาหาร {latestBs} mg/dL แนะนำการทำ Intermittent Fasting (16/8) เพื่อให้ตับอ่อนได้พัก
                    </p>
                  </div>

                  {/* Risk 3: Cardiovascular Pressure */}
                  <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900">3. สุขภาพหลอดเลือดและหัวใจ</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${latestSys < 120 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {latestSys < 120 ? 'ระดับเหมาะสม' : 'ควรติดตาม'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      ความดันโลหิต {latestSys}/{latestDia} mmHg แนะนำคุมโซเดียมไม่เกิน 2,000 mg/วัน และเสริมโพแทสเซียมจากผักใบเขียว
                    </p>
                  </div>

                  {/* Risk 4: Cellular Inflammation */}
                  <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900">4. ดัชนีการอักเสบระดับเซลล์ (Inflammation)</h4>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                        สมดุลต้านอนุมูลอิสระ
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      แนะนำเสริมสารต้านอนุมูลอิสระจากชาเขียว ผลไม้ตระกูลเบอร์รี่ และขมิ้นชันเพื่อชะลอการสั้นลงของ Telomere
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tab 4: Habits Checklist */}
      {activeTab === 'habits' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                <Award size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-neutral-900 text-base">กิจวัตรส่งเสริมสุขภาพประจำวัน (Daily Health Checklist)</h3>
                <p className="text-xs text-neutral-500 font-medium">สำเร็จแล้ว {completedHabitsCount} จาก {habitItems.length} กิจกรรม</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                {Math.round((completedHabitsCount / habitItems.length) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setIsHabitsChecklistOpen(!isHabitsChecklistOpen)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                title={isHabitsChecklistOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
                aria-label={isHabitsChecklistOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
              >
                <ChevronUp size={18} className={`transition-transform duration-300 ${isHabitsChecklistOpen ? '' : 'rotate-180'}`} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isHabitsChecklistOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 pt-2">
                  {habitItems.map((habit) => {
                    const Icon = habit.icon;
                    const isChecked = !!dailyHabits[habit.id];
                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => toggleHabit(habit.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                            : 'bg-white border-neutral-200/80 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${habit.color}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <h4 className={`font-bold text-xs ${isChecked ? 'text-emerald-950 line-through opacity-80' : 'text-neutral-900'}`}>
                              {habit.title}
                            </h4>
                            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                              {habit.desc}
                            </p>
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-neutral-300 text-transparent'
                        }`}>
                          <CheckCircle2 size={16} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Vitals Input Modal */}
      <AnimatePresence>
        {showVitalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Activity size={18} />
                  </div>
                  <h3 className="font-extrabold text-neutral-900 text-base">บันทึกค่าวัดชีวมาร์กเกอร์</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-xs font-bold p-1 cursor-pointer"
                >
                  ปิด
                </button>
              </div>

              <form onSubmit={handleSaveVitals} className="space-y-3.5">
                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <Scale size={13} className="text-emerald-600" /> น้ำหนักตัวปัจจุบัน (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inputWeight}
                    onChange={(e) => setInputWeight(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Waist */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">รอบเอวระดับสะดือ (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={inputWaist}
                    onChange={(e) => setInputWaist(e.target.value)}
                    placeholder="เช่น 78 cm"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Blood Pressure */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">ความดันตัวบน (Systolic)</label>
                    <input
                      type="number"
                      value={inputSystolic}
                      onChange={(e) => setInputSystolic(e.target.value)}
                      placeholder="120"
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">ความดันตัวล่าง (Diastolic)</label>
                    <input
                      type="number"
                      value={inputDiastolic}
                      onChange={(e) => setInputDiastolic(e.target.value)}
                      placeholder="80"
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Blood Sugar & Sleep */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">น้ำตาลก่อนอาหาร (mg/dL)</label>
                    <input
                      type="number"
                      value={inputBloodSugar}
                      onChange={(e) => setInputBloodSugar(e.target.value)}
                      placeholder="95"
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">ชั่วโมงการนอน (ชม.)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={inputSleepHours}
                      onChange={(e) => setInputSleepHours(e.target.value)}
                      placeholder="7.5"
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowVitalsModal(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
