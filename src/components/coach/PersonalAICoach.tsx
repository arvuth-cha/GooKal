import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Flame,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Droplets,
  Moon,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Zap,
  Target,
  Smile,
  ShieldCheck,
  HelpCircle,
  ThumbsUp,
  Scale,
  Plus,
  ArrowRight,
  History,
  Info,
  RotateCcw,
  Mic,
  MicOff,
  Globe,
  ExternalLink,
  Download,
  Share2,
  FileText
} from 'lucide-react';
import { ThaiVoiceRecognizer } from '../../utils/voiceService';
import { CustomGoalSettings, CustomCoachGoals, GOAL_PRESETS } from './CustomGoalSettings';
import {
  getWaterTotalMlForDate,
  getWaterGoal,
  addWaterLog,
  subscribeWaterUpdates,
  clearWaterLogsForDate,
} from '../../utils/waterService';
import { formatDateDMY, formatDateDMYShort, formatFullThaiDate } from '../../utils/dateUtils';
import { formatNutrientValue } from '../../utils/aiNutritionCalculator';

export interface HistoryMealItem {
  id: string;
  date: string;
  foodName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  mealType: string;
}

interface PersonalAICoachProps {
  userProfile: {
    weight: number;
    targetWeight?: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activityLevel: number;
    targetCalories?: number;
    customBmr?: number;
    customTdee?: number;
    customMacros?: {
      carbs?: number;
      protein?: number;
      fat?: number;
      sugar?: number;
      sodium?: number;
    };
  };
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  recentMeals: Array<{
    id: string;
    foodName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    mealType: string;
  }>;
  allHistory?: HistoryMealItem[];
  initialAuditDate?: string;
  onToast?: (message: string) => void;
  onOpenRecipes?: () => void;
  onUpdateProfile?: (updatedProfile: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { title: string; uri: string }[];
}

interface DailyAuditReport {
  overallScore: number;
  grade: string;
  verdict: string;
  calorieStatus: string;
  proteinStatus: string;
  strengths: string[];
  improvements: string[];
  actionPlanForTomorrow: string[];
  coachQuote: string;
  auditDate?: string;
  generatedAt?: string;
}

interface HabitState {
  date?: string;
  waterGlasses: number;
  waterTarget: number;
  steps: number;
  stepsTarget: number;
  sleepHours: number;
  noLateSnack: boolean;
  workoutDone: boolean;
}

const QUICK_PROMPT_CHIPS = [
  { icon: '🥩', text: 'เย็นนี้โปรตีนขาด แนะนำเมนูโปรตีนสูงให้หน่อย' },
  { icon: '🥗', text: 'จะไปกินบุฟเฟต์/ชาบู เลือกกินยังไงไม่อ้วน' },
  { icon: '⚡', text: 'รู้สึกโหยขนมหวานตอนบ่าย มีอะไรทานแทนได้บ้าง' },
  { icon: '🏋️', text: 'ก่อนและหลังออกกำลังกาย ควรกินอะไรดีที่สุด' },
  { icon: '🎯', text: 'วิเคราะห์มื้ออาหารที่ผมกินวันนี้ให้หน่อย' },
  { icon: '🍵', text: 'อยากทำ IF 16/8 ควรเริ่มกินกี่โมงถึงกี่โมง' }
];

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const PersonalAICoach: React.FC<PersonalAICoachProps> = ({
  userProfile,
  bmr,
  tdee,
  calorieTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
  todayCalories,
  todayProtein,
  todayCarbs,
  todayFat,
  recentMeals,
  allHistory = [],
  initialAuditDate,
  onToast,
  onOpenRecipes,
  onUpdateProfile
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'goals' | 'audit' | 'habits' | 'transformation'>('chat');

  // Custom Coach Goals & Targets State (Persisted in localStorage)
  const [customGoals, setCustomGoals] = useState<CustomCoachGoals>(() => {
    try {
      const saved = localStorage.getItem('kalguru_custom_coach_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      primaryGoal: 'fat_loss',
      primaryGoalTitle: 'ลดไขมัน & กระชับรูปร่าง',
      calorieTargetMode: 'auto',
      customCalories: calorieTarget || (tdee ? Math.round(tdee - 350) : 1850),
      macroPreset: 'high_protein',
      customProtein: proteinTarget || (userProfile.customMacros?.protein || 120),
      customCarbs: carbsTarget || (userProfile.customMacros?.carbs || 200),
      customFat: fatTarget || (userProfile.customMacros?.fat || 50),
      customSugarMax: userProfile.customMacros?.sugar || 30,
      customSodiumMax: userProfile.customMacros?.sodium || 2000,
      targetWeight: userProfile.targetWeight || 55,
      waterTarget: 8,
      stepsTarget: 8000,
      sleepTarget: 7.5,
      ifWindow: 'none',
      dietaryRestrictions: '',
      coachPersona: 'friendly',
      notes: ''
    };
  });

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('kalguru_ai_coach_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `สวัสดีครับ! ผมคือ **โค้ช AI ประจำตัวของคุณ** 🏋️‍♂️\n\nผมพร้อมดูแลคุณตลอด 24 ชม. ไม่ว่าจะเป็นเรื่อง:\n- แนะนำเมนูอาหารที่สารอาหารพอดีกับเป้าหมาย\n- ช่วยคุมแคลอรีเมื่อต้องไปสังสรรค์หรือกินข้าวนอกบ้าน\n- แก้ปัญหาอาการโหยแป้ง โหยของหวาน\n- ตรวจการบ้านอาหารประจำวันและย้อนหลัง พร้อมจัดตารางโภชนาการ\n\nวันนี้มีข้อสงสัยหรืออยากให้โค้ชช่วยเรื่องอะไร ถามได้เลยนะครับ!`,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showContextInspector, setShowContextInspector] = useState(false);
  const voiceRecognizerRef = useRef<ThaiVoiceRecognizer | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize voice recognizer for coach
  useEffect(() => {
    voiceRecognizerRef.current = new ThaiVoiceRecognizer({
      lang: 'th-TH',
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsVoiceRecording(true);
      },
      onTranscriptChange: (text: string) => {
        if (text) {
          setInputPrompt(text);
        }
      },
      onError: (err: string) => {
        setIsVoiceRecording(false);
        if (onToast) onToast(`🎙️ ${err}`);
      },
      onEnd: () => {
        setIsVoiceRecording(false);
      }
    });

    return () => {
      voiceRecognizerRef.current?.abort();
    };
  }, [onToast]);

  const toggleCoachVoiceRecording = () => {
    if (!voiceRecognizerRef.current?.isSupported()) {
      if (onToast) onToast('⚠️ เบราว์เซอร์ไม่รองรับ Web Speech API');
      setInputPrompt('ช่วยแนะนำเมนูอาหารเย็นแคลอรีต่ำ โปรตีนสูงให้หน่อย');
      return;
    }

    if (isVoiceRecording) {
      voiceRecognizerRef.current.stop();
      setIsVoiceRecording(false);
    } else {
      setInputPrompt('');
      const started = voiceRecognizerRef.current.start();
      if (!started) {
        if (onToast) onToast('⚠️ ไม่สามารถเปิดไมโครโฟนได้');
      }
    }
  };

  // Selected Date for Audit (Supports Today & Any Historical Date)
  const todayDateStr = getLocalDateStr(new Date());
  const [selectedAuditDate, setSelectedAuditDate] = useState<string>(initialAuditDate || todayDateStr);

  // Multi-date Audits State: Record<DateString, DailyAuditReport>
  const [auditReportsByDate, setAuditReportsByDate] = useState<Record<string, DailyAuditReport>>(() => {
    try {
      const saved = localStorage.getItem('kalguru_ai_coach_audits_by_date');
      if (saved) return JSON.parse(saved);
      // Legacy single audit fallback
      const legacy = localStorage.getItem('kalguru_ai_coach_audit');
      if (legacy) {
        return { [todayDateStr]: JSON.parse(legacy) };
      }
    } catch {}
    return {};
  });

  const [isAuditing, setIsAuditing] = useState(false);

  // Daily Habits State (automatically resets water and daily habits to 0 on a new day)
  const [habits, setHabits] = useState<HabitState>(() => {
    try {
      const saved = localStorage.getItem('kalguru_personal_habits');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If from an earlier day, reset water and daily flags to 0 for the new day
        if (parsed.date && parsed.date !== todayDateStr) {
          return {
            ...parsed,
            date: todayDateStr,
            waterGlasses: 0,
            workoutDone: false
          };
        }
        return { ...parsed, date: todayDateStr };
      }
    } catch {}
    return {
      date: todayDateStr,
      waterGlasses: 0,
      waterTarget: 8,
      steps: 0,
      stepsTarget: 8000,
      sleepHours: 7.5,
      noLateSnack: true,
      workoutDone: false
    };
  });

  // Body Dimensions & Goals State (Waist & Hip in INCHES)
  const [bodyStats, setBodyStats] = useState(() => {
    try {
      const saved = localStorage.getItem('kalguru_body_stats_v2');
      if (saved) return JSON.parse(saved);
      // Legacy fallback conversion from cm if available
      const legacySaved = localStorage.getItem('kalguru_body_stats');
      if (legacySaved) {
        const parsed = JSON.parse(legacySaved);
        return {
          targetWeight: userProfile.targetWeight || parsed.targetWeight || 55,
          currentWeight: userProfile.weight || parsed.currentWeight || 60,
          waistInches: parsed.waistInches || (parsed.waistCm ? Math.round(parsed.waistCm / 2.54) : 30),
          hipInches: parsed.hipInches || (parsed.hipCm ? Math.round(parsed.hipCm / 2.54) : 36),
          bodyFatPercent: parsed.bodyFatPercent || 22,
          muscleMassKg: parsed.muscleMassKg || 45
        };
      }
    } catch {}
    return {
      targetWeight: userProfile.targetWeight || 55,
      currentWeight: userProfile.weight || 60,
      waistInches: 30, // นิ้ว
      hipInches: 36,   // นิ้ว
      bodyFatPercent: 22,
      muscleMassKg: 45
    };
  });

  // Save Chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kalguru_ai_coach_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Save Audits map to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kalguru_ai_coach_audits_by_date', JSON.stringify(auditReportsByDate));
    } catch (e) {
      console.error(e);
    }
  }, [auditReportsByDate]);

  // Save Habits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kalguru_personal_habits', JSON.stringify(habits));
    } catch (e) {
      console.error(e);
    }
  }, [habits]);

  // Save Body Stats
  useEffect(() => {
    try {
      localStorage.setItem('kalguru_body_stats_v2', JSON.stringify(bodyStats));
    } catch (e) {
      console.error(e);
    }
  }, [bodyStats]);

  // Real-time synchronization with global Water Service
  useEffect(() => {
    const syncWaterFromService = () => {
      const totalMl = getWaterTotalMlForDate(todayDateStr);
      const glassesFromMl = Math.floor(totalMl / 250);
      const goalObj = getWaterGoal();
      const targetGlasses = goalObj?.targetMl ? Math.round(goalObj.targetMl / 250) : 8;

      setHabits(prev => ({
        ...prev,
        waterGlasses: glassesFromMl,
        waterTarget: Math.max(1, targetGlasses)
      }));
    };

    syncWaterFromService();
    const unsubscribe = subscribeWaterUpdates(syncWaterFromService);
    return unsubscribe;
  }, [todayDateStr]);

  // Auto scroll chat
  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeSubTab]);

  // Derive meals and nutrition for the currently selected audit date
  const selectedDateMeals = useMemo(() => {
    if (!allHistory || allHistory.length === 0) {
      if (selectedAuditDate === todayDateStr) {
        return recentMeals;
      }
      return [];
    }

    const filtered = allHistory.filter((item) => {
      const itemDateStr = item.date ? item.date.slice(0, 10) : '';
      return itemDateStr === selectedAuditDate;
    });

    if (filtered.length === 0 && selectedAuditDate === todayDateStr && recentMeals.length > 0) {
      return recentMeals;
    }

    return filtered;
  }, [allHistory, selectedAuditDate, todayDateStr, recentMeals]);

  const auditDateNutrition = useMemo(() => {
    const totalCals = selectedDateMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalP = selectedDateMeals.reduce((sum, m) => sum + (m.proteinGrams || 0), 0);
    const totalC = selectedDateMeals.reduce((sum, m) => sum + (m.carbsGrams || 0), 0);
    const totalF = selectedDateMeals.reduce((sum, m) => sum + (m.fatGrams || 0), 0);
    return {
      calories: totalCals,
      protein: totalP,
      carbs: totalC,
      fat: totalF
    };
  }, [selectedDateMeals]);

  const currentAuditReport = auditReportsByDate[selectedAuditDate] || null;

  // Save Custom Goals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kalguru_custom_coach_goals', JSON.stringify(customGoals));
    } catch (e) {
      console.error(e);
    }
  }, [customGoals]);

  // Active targets derived from user's Account page as the primary source of truth
  const activeCalorieTarget = calorieTarget || userProfile.targetCalories || customGoals.customCalories || (tdee ? Math.round(tdee - 350) : 1850);
  const activeProteinTarget = proteinTarget || userProfile.customMacros?.protein || customGoals.customProtein || 120;
  const activeCarbsTarget = carbsTarget || userProfile.customMacros?.carbs || customGoals.customCarbs || 200;
  const activeFatTarget = fatTarget || userProfile.customMacros?.fat || customGoals.customFat || 50;
  const activeSugarMax = userProfile.customMacros?.sugar ?? customGoals.customSugarMax ?? 30;
  const activeSodiumMax = userProfile.customMacros?.sodium ?? customGoals.customSodiumMax ?? 2000;

  // Sync customGoals whenever Account page profile or target props change
  useEffect(() => {
    setCustomGoals(prev => {
      const targetCal = calorieTarget || userProfile.targetCalories || prev.customCalories;
      const targetProt = proteinTarget || userProfile.customMacros?.protein || prev.customProtein;
      const targetCarb = carbsTarget || userProfile.customMacros?.carbs || prev.customCarbs;
      const targetF = fatTarget || userProfile.customMacros?.fat || prev.customFat;
      const targetW = userProfile.targetWeight || prev.targetWeight;
      const targetSug = userProfile.customMacros?.sugar ?? prev.customSugarMax;
      const targetSod = userProfile.customMacros?.sodium ?? prev.customSodiumMax;

      if (
        prev.customCalories !== targetCal ||
        prev.customProtein !== targetProt ||
        prev.customCarbs !== targetCarb ||
        prev.customFat !== targetF ||
        prev.targetWeight !== targetW ||
        prev.customSugarMax !== targetSug ||
        prev.customSodiumMax !== targetSod
      ) {
        const updated: CustomCoachGoals = {
          ...prev,
          customCalories: targetCal,
          customProtein: targetProt,
          customCarbs: targetCarb,
          customFat: targetF,
          targetWeight: targetW,
          customSugarMax: targetSug,
          customSodiumMax: targetSod
        };
        try {
          localStorage.setItem('kalguru_custom_coach_goals', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      }
      return prev;
    });
  }, [calorieTarget, proteinTarget, carbsTarget, fatTarget, userProfile.targetCalories, userProfile.customMacros, userProfile.targetWeight]);

  // Sync bodyStats with userProfile
  useEffect(() => {
    setBodyStats(prev => {
      const curW = userProfile.weight || prev.currentWeight;
      const tarW = userProfile.targetWeight || prev.targetWeight;
      if (prev.currentWeight !== curW || prev.targetWeight !== tarW) {
        const updated = {
          ...prev,
          currentWeight: curW,
          targetWeight: tarW
        };
        try {
          localStorage.setItem('kalguru_body_stats_v2', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      }
      return prev;
    });
  }, [userProfile.weight, userProfile.targetWeight]);

  const handleSaveCustomGoals = (newGoals: CustomCoachGoals) => {
    setCustomGoals(newGoals);
    try {
      localStorage.setItem('kalguru_custom_coach_goals', JSON.stringify(newGoals));
    } catch (e) {
      console.error(e);
    }

    // Synchronize target weight in bodyStats
    setBodyStats(prev => ({
      ...prev,
      targetWeight: newGoals.targetWeight
    }));

    // Synchronize daily habits targets
    setHabits(prev => ({
      ...prev,
      waterTarget: newGoals.waterTarget,
      stepsTarget: newGoals.stepsTarget,
      sleepHours: newGoals.sleepTarget
    }));

    // Synchronize with App's global userProfile state if supported
    if (onUpdateProfile) {
      onUpdateProfile({
        ...userProfile,
        targetWeight: newGoals.targetWeight,
        targetCalories: newGoals.customCalories,
        customMacros: {
          protein: newGoals.customProtein,
          carbs: newGoals.customCarbs,
          fat: newGoals.customFat,
          sugar: newGoals.customSugarMax,
          sodium: newGoals.customSodiumMax
        }
      });
    }

    // Add an encouraging greeting message from AI Coach about new goals
    const botAckMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🎯 **บันทึกเป้าหมายสุขภาพใหม่เรียบร้อยแล้วครับ!**\n\n- **เป้าหมายหลัก:** ${newGoals.primaryGoalTitle}\n- **แคลอรีต่อวัน:** **${newGoals.customCalories} kcal**\n- **มาโครสารอาหาร:** โปรตีน **${newGoals.customProtein}g**, คาร์บ **${newGoals.customCarbs}g**, ไขมัน **${newGoals.customFat}g**\n- **วินัยประจำวัน:** น้ำดื่ม **${newGoals.waterTarget} แก้ว**, เดิน **${newGoals.stepsTarget.toLocaleString()} ก้าว**\n${newGoals.ifWindow && newGoals.ifWindow !== 'none' ? `- **ช่วงเวลา IF:** ${newGoals.ifWindow}\n` : ''}${newGoals.dietaryRestrictions ? `- **ข้อจำกัดอาหาร:** ${newGoals.dietaryRestrictions}\n` : ''}\nโค้ชพร้อมปรับคำแนะนำและเมนูอาหารให้ตรงกับเป้าหมายใหม่นี้แล้วครับ มีอะไรอยากให้โค้ชช่วยแนะนำมื้อถัดไปไหมครับ?`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, botAckMsg]);
  };

  // Comprehensive Dynamic User Context Builder
  const getDynamicUserContext = (targetDateStr = todayDateStr) => {
    const isToday = targetDateStr === todayDateStr;
    const cals = isToday ? todayCalories : auditDateNutrition.calories;
    const p = isToday ? todayProtein : auditDateNutrition.protein;
    const c = isToday ? todayCarbs : auditDateNutrition.carbs;
    const f = isToday ? todayFat : auditDateNutrition.fat;
    const meals = isToday ? recentMeals : selectedDateMeals;

    // Remaining budget
    const remCalories = Math.max(0, activeCalorieTarget - (cals || 0));
    const remProtein = Math.max(0, activeProteinTarget - (p || 0));
    const remCarbs = Math.max(0, activeCarbsTarget - (c || 0));
    const remFat = Math.max(0, activeFatTarget - (f || 0));

    // Dynamic Fasting context from localStorage
    let fastingSummary = customGoals.ifWindow && customGoals.ifWindow !== 'none' ? customGoals.ifWindow : '18/6 (อด 18 ชม. ทาน 6 ชม.)';
    let fastingStatus = 'ทำ IF 18/6';
    try {
      const savedSessionRaw = localStorage.getItem('kalguru_fasting_session_v1');
      if (savedSessionRaw) {
        const session = JSON.parse(savedSessionRaw);
        if (session && session.startTime) {
          const now = Date.now();
          const start = new Date(session.startTime).getTime();
          const elapsedMin = Math.max(0, Math.floor((now - start) / 60000));
          const elapsedHrs = (elapsedMin / 60).toFixed(1);
          const targetHrs = session.targetHours || 18;
          if (session.isActive) {
            fastingStatus = `กำลัง Fasting มาแล้ว ${elapsedHrs} ชม. (เป้าหมาย ${targetHrs} ชม.)`;
          } else {
            fastingStatus = `อยู่ในช่วงเวลาเปิดทานอาหาร (Eating Window)`;
          }
          fastingSummary = `${session.planId ? `IF ${session.planId.replace('_', '/')}` : `IF ${targetHrs}h`} [${fastingStatus}]`;
        }
      }
    } catch {}

    // Dynamic Dietary Restrictions & Allergens from localStorage
    const restrictionList: string[] = [];
    try {
      const savedAllergensRaw = localStorage.getItem('kalguru_allergen_settings');
      if (savedAllergensRaw) {
        const allergens: Array<{ id: string; name: string; enabled: boolean }> = JSON.parse(savedAllergensRaw);
        const activeAllergens = allergens.filter(a => a.enabled).map(a => a.name);
        restrictionList.push(...activeAllergens);
      }
    } catch {}

    if (customGoals.dietaryRestrictions && customGoals.dietaryRestrictions.trim()) {
      restrictionList.push(customGoals.dietaryRestrictions.trim());
    }

    if (restrictionList.length === 0) {
      restrictionList.push('งดน้ำตาลเติมแต่ง (Zero Added Sugar)', 'เน้นโปรตีนลีนและใยอาหาร');
    }

    const dietarySummary = Array.from(new Set(restrictionList)).join(', ');

    return {
      weight: bodyStats.currentWeight || userProfile.weight || 60,
      targetWeight: bodyStats.targetWeight || userProfile.targetWeight || customGoals.targetWeight || 55,
      currentWeight: bodyStats.currentWeight || userProfile.weight || 60,
      waistInches: bodyStats.waistInches,
      hipInches: bodyStats.hipInches,
      bodyFatPercent: bodyStats.bodyFatPercent,
      height: userProfile.height || 165,
      age: userProfile.age || 25,
      gender: userProfile.gender || 'female',
      activityLevel: userProfile.activityLevel || 1.2,
      bmr: bmr || 1400,
      tdee: tdee || 1900,
      goalTitle: customGoals.primaryGoalTitle || 'ลดไขมัน & กระชับสัดส่วน',
      primaryGoal: customGoals.primaryGoal || 'fat_loss',
      calorieTarget: activeCalorieTarget,
      proteinTarget: activeProteinTarget,
      carbsTarget: activeCarbsTarget,
      fatTarget: activeFatTarget,
      sugarMax: activeSugarMax,
      sodiumMax: activeSodiumMax,
      todayCalories: cals || 0,
      todayProtein: p || 0,
      todayCarbs: c || 0,
      todayFat: f || 0,
      remainingCalories: remCalories,
      remainingProtein: remProtein,
      remainingCarbs: remCarbs,
      remainingFat: remFat,
      ifWindow: fastingSummary,
      fastingStatus: fastingStatus,
      dietaryRestrictions: dietarySummary,
      recentMeals: (meals || []).map(m => ({
        foodName: m.foodName,
        calories: m.calories || 0,
        proteinGrams: m.proteinGrams || 0,
        carbsGrams: m.carbsGrams || 0,
        fatGrams: m.fatGrams || 0,
        mealType: m.mealType || 'อาหาร'
      })),
      customGoals: customGoals
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const dynamicContext = getDynamicUserContext(todayDateStr);

      const response = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map(m => ({ role: m.role, text: m.content })),
          userContext: dynamicContext
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'API failed');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'ขออภัยครับ ไม่สามารถให้คำตอบได้ในขณะนี้',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources && Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : undefined
      };
      setMessages([...newMessages, botMsg]);
    } catch (err: any) {
      console.error('Coach chat error:', err);
      const isRateLimit = err?.message?.includes('เกินขีดจำกัด') || err?.message?.includes('429');
      const remP = Math.max(0, activeProteinTarget - (todayProtein || 0));
      const remC = Math.max(0, activeCalorieTarget - (todayCalories || 0));
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isRateLimit
          ? '⏳ เกินขีดจำกัดการใช้งานชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้งนะครับ'
          : `💡 **คำแนะนำเบื้องต้นตามโควตาของคุณ (${customGoals?.primaryGoalTitle || 'ลดไขมัน'}):**\n\n- วันนี้คุณทานไปแล้ว **${todayCalories} / ${activeCalorieTarget} kcal** (เหลือโควตา **${remC} kcal**)\n- โปรตีนทานแล้ว **${todayProtein} / ${activeProteinTarget}g** (ยังขาดอีก **${remP}g**)\n- เงื่อนไข: **${customGoals.ifWindow !== 'none' ? customGoals.ifWindow : 'IF 18/6'}** และ **${customGoals.dietaryRestrictions || 'งดน้ำตาล'}**\n\nแนะนำเลือกเมนูโปรตีนลีน เช่น อกไก่ย่าง ไข่ต้ม 2 ฟอง หรือเต้าหู้ผัดเห็ด พร้อมดื่มน้ำให้เพียงพอครับ!`,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunAuditForDate = async (targetDateStr: string) => {
    setIsAuditing(true);

    const isToday = targetDateStr === todayDateStr;
    const dateObj = new Date(targetDateStr + 'T00:00:00');
    const thaiDateLabel = dateObj?.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const cals = isToday ? todayCalories : auditDateNutrition.calories;
    const p = isToday ? todayProtein : auditDateNutrition.protein;
    const c = isToday ? todayCarbs : auditDateNutrition.carbs;
    const f = isToday ? todayFat : auditDateNutrition.fat;
    const meals = selectedDateMeals;
    const waterMlForDate = getWaterTotalMlForDate(targetDateStr);
    const waterGlassesForDate = Math.floor(waterMlForDate / 250);

    try {
      const dynamicContext = getDynamicUserContext(targetDateStr);

      const response = await fetch('/api/coach-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userContext: {
            ...dynamicContext,
            waterGlasses: waterGlassesForDate,
            waterMl: waterMlForDate,
            sleepHours: habits?.sleepHours || 7,
            auditDate: targetDateStr,
            dateLabel: isToday ? 'วันนี้' : thaiDateLabel
          }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Audit API failed');
      }

      const rawData = await response.json();
      const data: DailyAuditReport = {
        overallScore: typeof rawData.overallScore === 'number' ? rawData.overallScore : 85,
        grade: rawData.grade || (rawData.overallScore >= 90 ? 'A+' : rawData.overallScore >= 80 ? 'A' : rawData.overallScore >= 70 ? 'B' : rawData.overallScore >= 60 ? 'C+' : 'B'),
        verdict: rawData.verdict || rawData.verdictTitle || `ผลการประเมินโภชนาการประจำวันที่ ${thaiDateLabel} เสร็จสมบูรณ์`,
        calorieStatus: rawData.calorieStatus || (cals > 0 ? `${cals} / ${activeCalorieTarget} kcal` : 'ยังไม่บันทึกแคลอรี'),
        proteinStatus: rawData.proteinStatus || (p > 0 ? `${formatNutrientValue(p)} / ${formatNutrientValue(activeProteinTarget)}g` : 'ยังไม่บันทึกโปรตีน'),
        strengths: Array.isArray(rawData.strengths) && rawData.strengths.length > 0 ? rawData.strengths : ['มีการติดตามและบันทึกโภชนาการอย่างต่อเนื่อง'],
        improvements: Array.isArray(rawData.improvements) && rawData.improvements.length > 0 ? rawData.improvements : ['รักษาสมดุลการดื่มน้ำและทานผักเพื่อเสริมใยอาหาร'],
        actionPlanForTomorrow: Array.isArray(rawData.actionPlanForTomorrow) && rawData.actionPlanForTomorrow.length > 0
          ? rawData.actionPlanForTomorrow
          : (Array.isArray(rawData.actionableTipForTomorrow) ? rawData.actionableTipForTomorrow : [rawData.actionableTipForTomorrow || '1. ควบคุมสัดส่วนโปรตีนให้ถึงเป้าหมาย', '2. ดื่มน้ำให้เพียงพอ 8 แก้วต่อวัน', '3. พักผ่อนให้เต็มที่ 7-8 ชั่วโมง']),
        coachQuote: rawData.coachQuote || '"ความสม่ำเสมอในแต่ละวัน สำคัญกว่าความสมบูรณ์แบบเพียงแค่วันเดียว ทำต่อไปนะครับ!"',
        auditDate: targetDateStr,
        generatedAt: new Date().toISOString()
      };

      setAuditReportsByDate(prev => ({
        ...prev,
        [targetDateStr]: data
      }));

      if (onToast) onToast(`✨ โค้ช AI ตรวจการบ้านวันที่ ${thaiDateLabel} เรียบร้อยแล้ว!`);
    } catch (err) {
      console.error(err);
      // Intelligent local calculation fallback
      const calorieDiff = cals - activeCalorieTarget;
      const isCalorieGood = Math.abs(calorieDiff) <= 200;
      const isProteinMet = p >= activeProteinTarget * 0.95;
      const isProteinExcess = p > activeProteinTarget * 1.35;
      const hasMeals = meals.length > 0;
      const score = hasMeals 
        ? ((isCalorieGood ? 50 : 35) + (isProteinMet ? 40 : 25) + (waterGlassesForDate >= (customGoals.waterTarget || 7) ? 10 : 5))
        : 20;

      let calculatedProteinStatus = 'ยังไม่บันทึกโปรตีน';
      if (p > 0) {
        if (isProteinExcess) {
          calculatedProteinStatus = `โปรตีนสูงกว่าเป้าหมาย (${formatNutrientValue(p)}g / ${formatNutrientValue(activeProteinTarget)}g)`;
        } else if (isProteinMet) {
          calculatedProteinStatus = `โปรตีนถึงเป้าหมายยอดเยี่ยม (${formatNutrientValue(p)}g / ${formatNutrientValue(activeProteinTarget)}g)`;
        } else {
          calculatedProteinStatus = `ควรเพิ่มโปรตีนอีก ${formatNutrientValue(Math.max(0, activeProteinTarget - p))}g (${formatNutrientValue(p)}g / ${formatNutrientValue(activeProteinTarget)}g)`;
        }
      }

      const fallbackReport: DailyAuditReport = {
        overallScore: Math.min(score, 98),
        grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : hasMeals ? 'C+' : 'N/A',
        verdict: hasMeals
          ? (isCalorieGood && isProteinMet
              ? `ผลงานของวันที่ ${thaiDateLabel} ยอดเยี่ยมมาก คุมแคลอรีและโปรตีนได้ตามเป้าหมาย "${customGoals.primaryGoalTitle}" อย่างมีวินัย!`
              : `ในวันที่ ${thaiDateLabel} บันทึกอาหารได้ดี ${isProteinMet ? 'ได้รับโปรตีนครบถ้วนแล้ว' : 'สามารถปรับสัดส่วนโปรตีนให้ตรงเป้าหมายมากขึ้น'} เพื่อผลลัพธ์ "${customGoals.primaryGoalTitle}"`)
          : `ยังไม่มีการบันทึกอาหารสำหรับวันที่ ${thaiDateLabel}`,
        calorieStatus: cals === 0 ? 'ยังไม่บันทึกแคลอรี' : (calorieDiff > 200 ? 'เกินเป้าหมายเล็กน้อย' : calorieDiff < -300 ? 'ต่ำกว่าเป้าหมาย' : 'อยู่ในเกณฑ์สมดุลดีมาก'),
        proteinStatus: calculatedProteinStatus,
        strengths: hasMeals ? [
          'มีการบันทึกอาหารเพื่อติดตามตนเองอย่างสม่ำเสมอ',
          isProteinMet ? `ได้รับโปรตีนคุณภาพดีเพียงพอต่อร่างกาย (${p}g)` : 'เลือกรับประทานอาหารหลากหลาย',
          'ความตั้งใจและมีวินัยในการควบคุมโภชนาการ'
        ] : ['เริ่มต้นบันทึกมื้ออาหารเพื่อผลลัพธ์ที่ดีขึ้น'],
        improvements: hasMeals ? [
          !isProteinMet 
            ? `เพิ่มแหล่งโปรตีนลีน เช่น ไข่ต้ม อกไก่ หรือเต้าหู้ อีก ${formatNutrientValue(Math.max(0, activeProteinTarget - p))}g` 
            : 'เน้นเพิ่มใยอาหารจากผักสดและผลไม้น้ำตาลต่ำเพื่อระบบขับถ่าย',
          cals > activeCalorieTarget ? 'ระวังน้ำมันที่ใช้ผัดหรือน้ำตาลแฝงในเครื่องดื่ม' : 'หลีกเลี่ยงการปล่อยให้ร่างกายหิวจนโหย'
        ] : ['บันทึกมื้ออาหารในแต่ละวันเพื่อการประเมินที่แม่นยำ'],
        actionPlanForTomorrow: [
          isProteinMet 
            ? `1. รักษาสมดุลการเลือกโปรตีนคุณภาพดี (${formatNutrientValue(activeProteinTarget)}g) อย่างสม่ำเสมอ`
            : `1. เติมโปรตีนลีนในแต่ละมื้อให้ถึงเป้าหมาย ${formatNutrientValue(activeProteinTarget)}g ต่อวัน`,
          `2. ดื่มน้ำให้เพียงพอ ${customGoals.waterTarget || 8} แก้วต่อวันเพื่อกระตุ้นระบบเผาผลาญ`,
          `3. พักผ่อนให้เต็มที่ ${customGoals.sleepTarget || 7.5} ชั่วโมงเพื่อคืนความสดชื่นให้กล้ามเนื้อ`
        ],
        coachQuote: '"ความสม่ำเสมอในแต่ละวัน สำคัญกว่าความสมบูรณ์แบบเพียงแค่วันเดียว ทำต่อไปนะครับ คุณมาถูกทางแล้ว!"',
        auditDate: targetDateStr,
        generatedAt: new Date().toISOString()
      };

      setAuditReportsByDate(prev => ({
        ...prev,
        [targetDateStr]: fallbackReport
      }));

      if (onToast) onToast(`✨ วิเคราะห์และประเมินผลโภชนาการวันที่ ${thaiDateLabel} เรียบร้อย`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onToast) onToast('คัดลอกข้อความเรียบร้อย');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('คุณต้องการล้างประวัติการแชททั้งหมดใช่หรือไม่?')) {
      const resetMsg: ChatMessage[] = [
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `สวัสดีครับ! ประวัติการสนทนาถูกรีเซ็ตแล้ว ผมพร้อมให้คำแนะนำโภชนาการและการดูแลสุขภาพแก่คุณเสมอครับ มีอะไรให้โค้ชช่วยถามได้เลย! 🥗`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(resetMsg);
      localStorage.setItem('kalguru_ai_coach_messages', JSON.stringify(resetMsg));
      if (onToast) onToast('ล้างประวัติการสนทนาเรียบร้อย');
    }
  };

  const handleSaveBodyStats = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        ...userProfile,
        weight: bodyStats.currentWeight,
        targetWeight: bodyStats.targetWeight
      });
    }
    if (onToast) onToast('✅ บันทึกสัดส่วน (นิ้ว) และน้ำหนักเป้าหมายสำเร็จแล้ว!');
  };

  // Past 7 dates list for quick date switching
  const pastDatesList = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = getLocalDateStr(d);
      list.push({
        dateStr: iso,
        isToday: i === 0,
        isYesterday: i === 1,
        dayNum: d.getDate(),
        weekdayTh: i === 0 ? 'วันนี้' : i === 1 ? 'เมื่อวาน' : d?.toLocaleDateString('th-TH', { weekday: 'short' }),
        fullDateTh: d?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      });
    }
    return list;
  }, []);

  // Calculate target weight difference
  const weightDiff = Number(((bodyStats.currentWeight || 60) - (bodyStats.targetWeight || 60)).toFixed(1)) || 0;
  const heightM = Math.max(0.5, (userProfile.height || 165) / 100);
  const rawCurBmi = (bodyStats.currentWeight || 60) / (heightM * heightM);
  const currentBmi = isNaN(rawCurBmi) ? "22.0" : rawCurBmi.toFixed(1);
  const rawTarBmi = (bodyStats.targetWeight || 60) / (heightM * heightM);
  const targetBmi = isNaN(rawTarBmi) ? "22.0" : rawTarBmi.toFixed(1);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-orange-950 text-white rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/30 text-orange-300 px-3 py-1 rounded-full text-xs font-bold">
              <Bot size={15} className="text-orange-400" />
              <span>Personal AI Nutrition Coach 24/7</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              โค้ช AI ดูแลสุขภาพส่วนตัว
            </h1>
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
              ที่ปรึกษาโภชนาการส่วนบุคคล ปรับแต่งเป้าหมายแคลอรี/มาโครเองได้ ตรวจการบ้านมื้ออาหารทั้งวันนี้และย้อนหลัง ติดตามสัดส่วน (นิ้ว) และน้ำหนักเป้าหมายอย่างแม่นยำ
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setActiveSubTab('goals')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-orange-400/30"
            >
              <Target size={16} className="text-white" />
              <span>🎯 กำหนดเป้าหมายเอง (Custom Goals)</span>
            </button>
          </div>
        </div>

        {/* Live Macro & Goal Badge Overlay */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div 
            onClick={() => setActiveSubTab('goals')}
            className="bg-white/5 hover:bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 cursor-pointer transition-all"
          >
            <span className="text-neutral-400 block text-[11px] flex items-center justify-between">
              <span>แคลอรีเป้าหมาย</span>
              <span className="text-[10px] text-orange-300 font-normal">กำหนดเอง</span>
            </span>
            <span className="font-extrabold text-orange-400 text-sm">
              {todayCalories} / {activeCalorieTarget} kcal
            </span>
          </div>
          <div 
            onClick={() => setActiveSubTab('goals')}
            className="bg-white/5 hover:bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 cursor-pointer transition-all"
          >
            <span className="text-neutral-400 block text-[11px] flex items-center justify-between">
              <span>โปรตีนเป้าหมาย</span>
              <span className="text-[10px] text-sky-300 font-normal">กำหนดเอง</span>
            </span>
            <span className="font-extrabold text-sky-400 text-sm">
              {formatNutrientValue(todayProtein)} / {formatNutrientValue(activeProteinTarget)}g
            </span>
          </div>
          <div 
            onClick={() => setActiveSubTab('transformation')}
            className="bg-white/5 hover:bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 cursor-pointer transition-all"
          >
            <span className="text-neutral-400 block text-[11px]">น้ำหนักปัจจุบัน/เป้าหมาย</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              {bodyStats.currentWeight} → {bodyStats.targetWeight} กก.
            </span>
          </div>
          <div 
            onClick={() => setActiveSubTab('goals')}
            className="bg-white/5 hover:bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 cursor-pointer transition-all"
          >
            <span className="text-neutral-400 block text-[11px]">แผนเป้าหมายหลัก</span>
            <span className="font-extrabold text-amber-300 text-xs truncate block">
              {customGoals.primaryGoalTitle || 'ลดไขมัน & กระชับสัดส่วน'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex bg-neutral-100 p-1 rounded-2xl gap-1 text-xs font-bold text-neutral-600 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'chat'
              ? 'bg-white text-neutral-900 shadow-xs font-black'
              : 'hover:text-neutral-900'
          }`}
        >
          <Bot size={16} className={activeSubTab === 'chat' ? 'text-orange-500' : ''} />
          <span>แชตปรึกษาโค้ช AI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('goals')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'goals'
              ? 'bg-white text-neutral-900 shadow-xs font-black'
              : 'hover:text-neutral-900'
          }`}
        >
          <Target size={16} className={activeSubTab === 'goals' ? 'text-orange-500' : ''} />
          <span>🎯 กำหนดเป้าหมายเอง</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-white text-neutral-900 shadow-xs font-black'
              : 'hover:text-neutral-900'
          }`}
        >
          <Award size={16} className={activeSubTab === 'audit' ? 'text-orange-500' : ''} />
          <span>ตรวจการบ้านอาหาร</span>
        </button>

        <button
          onClick={() => setActiveSubTab('habits')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'habits'
              ? 'bg-white text-neutral-900 shadow-xs font-black'
              : 'hover:text-neutral-900'
          }`}
        >
          <CheckCircle2 size={16} className={activeSubTab === 'habits' ? 'text-orange-500' : ''} />
          <span>เช็กลิสต์วินัย</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transformation')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'transformation'
              ? 'bg-white text-neutral-900 shadow-xs font-black'
              : 'hover:text-neutral-900'
          }`}
        >
          <TrendingUp size={16} className={activeSubTab === 'transformation' ? 'text-orange-500' : ''} />
          <span>สัดส่วน & น้ำหนัก</span>
        </button>
      </div>

      {/* TAB: Custom Goals View */}
      {activeSubTab === 'goals' && (
        <CustomGoalSettings
          currentGoals={customGoals}
          bmr={bmr}
          tdee={tdee}
          currentWeight={bodyStats.currentWeight}
          height={userProfile.height}
          onSaveGoals={handleSaveCustomGoals}
          onToast={onToast}
        />
      )}

      {/* TAB 1: AI Chat View */}
      {activeSubTab === 'chat' && (
        <div className="space-y-4">
          {/* Active Dynamic Context Live HUD */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 rounded-2xl p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Target size={14} className="text-orange-600" />
                  <span>AI เชื่อมต่อเป้าหมายของคุณแบบ Dynamic Context</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowContextInspector(!showContextInspector)}
                className="text-[11px] font-semibold text-orange-700 hover:text-orange-900 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-orange-200/60 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <span>{showContextInspector ? 'ซ่อนบริบท' : 'ดูบริบทที่ส่งให้ AI'}</span>
                <ChevronRight size={12} className={`transition-transform ${showContextInspector ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Quick Context Summary Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="bg-white/90 border border-neutral-200 text-neutral-800 px-2 py-0.5 rounded-lg font-medium">
                🎯 {customGoals.primaryGoalTitle || 'ลดไขมัน & กระชับสัดส่วน'}
              </span>
              <span className="bg-white/90 border border-orange-200 text-orange-800 px-2 py-0.5 rounded-lg font-bold">
                🔥 โควตา: {activeCalorieTarget} kcal (เหลือ {Math.max(0, activeCalorieTarget - (todayCalories || 0))} kcal)
              </span>
              <span className="bg-white/90 border border-sky-200 text-sky-800 px-2 py-0.5 rounded-lg font-bold">
                🥩 โปรตีน: {formatNutrientValue(activeProteinTarget)}g (ขาดอีก {formatNutrientValue(Math.max(0, activeProteinTarget - (todayProtein || 0)))}g)
              </span>
              <span className="bg-white/90 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg font-medium">
                ⚖️ เป้าหมาย: {bodyStats.targetWeight} กก.
              </span>
              <span className="bg-white/90 border border-purple-200 text-purple-800 px-2 py-0.5 rounded-lg font-medium">
                ⏳ {customGoals.ifWindow && customGoals.ifWindow !== 'none' ? customGoals.ifWindow : 'IF 18/6'}
              </span>
              <span className="bg-white/90 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-lg font-medium">
                🚫 {customGoals.dietaryRestrictions || 'งดน้ำตาล (Zero Added Sugar)'}
              </span>
            </div>

            {/* Context Inspector Expansion */}
            {showContextInspector && (
              <div className="mt-2 pt-2.5 border-t border-orange-200/60 bg-white/95 rounded-xl p-3 text-xs space-y-2 text-neutral-700 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-900">
                  <span>📋 ข้อมูล Dynamic Context Injection ที่ AI ใช้วิเคราะห์คำตอบ:</span>
                  <button
                    onClick={() => setActiveSubTab('goals')}
                    className="text-orange-600 hover:underline cursor-pointer"
                  >
                    ✏️ ปรับเปลี่ยนเป้าหมาย
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/70 space-y-1">
                    <div className="text-neutral-500 font-semibold">ข้อมูลร่างกายและสัดส่วน</div>
                    <div>• ส่วนสูง: <b>{userProfile.height || 165} ซม.</b> | น้ำหนักปัจจุบัน: <b>{bodyStats.currentWeight} กก.</b></div>
                    <div>• น้ำหนักเป้าหมาย: <b>{bodyStats.targetWeight} กก.</b> (BMR {bmr || 1400} / TDEE {tdee || 1900} kcal)</div>
                    <div>• สัดส่วน: เอว <b>{bodyStats.waistInches || '-'} นิ้ว</b> | สะโพก <b>{bodyStats.hipInches || '-'} นิ้ว</b></div>
                  </div>
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/70 space-y-1">
                    <div className="text-neutral-500 font-semibold">สถานะโควตาสารอาหารวันนี้</div>
                    <div>• แคลอรี: ทาน <b>{todayCalories || 0}</b> / <b>{activeCalorieTarget} kcal</b> (เหลือโควตา <b>{Math.max(0, activeCalorieTarget - (todayCalories || 0))} kcal</b>)</div>
                    <div>• โปรตีน: ทาน <b>{formatNutrientValue(todayProtein)}</b> / <b>{formatNutrientValue(activeProteinTarget)}g</b> (ยังขาดอีก <b>{formatNutrientValue(Math.max(0, activeProteinTarget - (todayProtein || 0)))}g</b>)</div>
                    <div>• เงื่อนไข: <b>{customGoals.ifWindow && customGoals.ifWindow !== 'none' ? customGoals.ifWindow : 'IF 18/6'}</b> | <b>{customGoals.dietaryRestrictions || 'งดน้ำตาล (Zero Sugar)'}</b></div>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-500 italic bg-orange-50/60 p-2 rounded-lg border border-orange-100">
                  🔒 <b>กฎเหล็ก AI:</b> โค้ชจะใช้ข้อมูลและตัวเลขโควตาคงเหลือจริงของผู้ใช้ข้างต้นในการคำนวณและปรับเมนูอาหารก่อนตอบเสมอ ห้ามให้คำตอบกว้างๆ สำเร็จรูป
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions Carousel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 px-1">
              <span className="flex items-center gap-1">
                <Sparkles size={14} className="text-orange-500" />
                คำถามเฉพาะเจาะจงที่ถามโค้ชได้ทันที (Context-First Prompts):
              </span>
              <button
                onClick={handleClearChat}
                className="text-neutral-400 hover:text-red-500 transition-colors text-[11px] cursor-pointer"
              >
                ล้างประวัติแชท
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => handleSendMessage(`ช่วยแนะนำมื้อเย็นที่เหมาะกับโควตาแคลอรีและโปรตีนที่เหลืออยู่ของผมวันนี้หน่อยครับ (งดน้ำตาลและทำ IF)`)}
                disabled={isTyping}
                className="bg-white hover:bg-orange-50 hover:border-orange-200 border border-neutral-200/80 px-3 py-2 rounded-2xl text-xs font-medium text-neutral-800 whitespace-nowrap shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span>🍱</span>
                <span>มื้อเย็นกินอะไรดี (คำนวณจากโควตาที่เหลือ)</span>
              </button>
              <button
                onClick={() => handleSendMessage(`วันนี้โปรตีนยังขาดอีก แนะนำเมนูโปรตีนสูงที่งดน้ำตาลและไม่เกินแคลอรีที่เหลือให้หน่อย`)}
                disabled={isTyping}
                className="bg-white hover:bg-orange-50 hover:border-orange-200 border border-neutral-200/80 px-3 py-2 rounded-2xl text-xs font-medium text-neutral-800 whitespace-nowrap shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span>🥩</span>
                <span>แนะนำเมนูโปรตีนสูงให้ถึงเป้าหมาย {formatNutrientValue(activeProteinTarget)}g</span>
              </button>
              <button
                onClick={() => handleSendMessage(`ช่วงนี้ทำ IF อยู่ ถ้าเริ่มหิวระหว่าง Fasting ดื่มหรือทานอะไรที่ไม่หลุด Fast ได้บ้าง`)}
                disabled={isTyping}
                className="bg-white hover:bg-orange-50 hover:border-orange-200 border border-neutral-200/80 px-3 py-2 rounded-2xl text-xs font-medium text-neutral-800 whitespace-nowrap shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span>🍵</span>
                <span>หิวช่วง Fasting ดื่ม/ทานอะไรได้บ้าง</span>
              </button>
              <button
                onClick={() => handleSendMessage(`อยากกินของหวานตอนบ่าย มีเมนูงดน้ำตาลอะไรที่ช่วยให้อิ่มท้องและไม่กระทบเป้าหมายลดไขมันไหม`)}
                disabled={isTyping}
                className="bg-white hover:bg-orange-50 hover:border-orange-200 border border-neutral-200/80 px-3 py-2 rounded-2xl text-xs font-medium text-neutral-800 whitespace-nowrap shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span>⚡</span>
                <span>โหยของหวาน แนะนำเมนูงดน้ำตาลแคลต่ำ</span>
              </button>
              <button
                onClick={() => handleSendMessage(`วิเคราะห์มื้ออาหารที่ผมกินวันนี้ทั้งหมด แล้วสรุปสิ่งที่ต้องปรับสำหรับมื้อต่อไปตามเป้าหมาย`)}
                disabled={isTyping}
                className="bg-white hover:bg-orange-50 hover:border-orange-200 border border-neutral-200/80 px-3 py-2 rounded-2xl text-xs font-medium text-neutral-800 whitespace-nowrap shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span>🎯</span>
                <span>วิเคราะห์ภาพรวมอาหารวันนี้ & มื้อถัดไป</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Box */}
          <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-4 sm:p-5 flex flex-col h-[520px]">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-neutral-900 text-white'
                          : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-xs'
                      }`}
                    >
                      {isUser ? <User size={15} /> : <Bot size={16} />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                        isUser
                          ? 'bg-neutral-900 text-white rounded-tr-xs'
                          : 'bg-neutral-50 border border-neutral-100 text-neutral-800 rounded-tl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>

                      {/* Google Search Grounded Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-neutral-200/80 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800">
                            <Globe size={12} className="text-emerald-600" />
                            <span>แหล่งข้อมูลอ้างอิงจาก Google Search</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-neutral-600 hover:text-emerald-700 bg-white/80 hover:bg-white px-2 py-1 rounded-lg border border-neutral-200/60 flex items-center justify-between gap-1 transition-all"
                              >
                                <span className="truncate">{src.title}</span>
                                <ExternalLink size={10} className="shrink-0 text-neutral-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer info: time & copy */}
                      <div
                        className={`flex items-center gap-2 mt-2 text-[10px] ${
                          isUser ? 'text-neutral-400 justify-end' : 'text-neutral-400 justify-between'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="opacity-60 hover:opacity-100 text-neutral-500 hover:text-orange-600 transition-opacity p-0.5 cursor-pointer"
                            title="คัดลอกข้อความ"
                          >
                            {copiedId === msg.id ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-neutral-50 border border-neutral-100 rounded-3xl rounded-tl-xs p-4 text-xs text-neutral-500 flex items-center gap-2">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>โค้ช AI กำลังคิดคำตอบและวิเคราะห์สารอาหาร...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-neutral-100 space-y-2">
              {isVoiceRecording && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold">🎙️ กำลังบันทึกเสียงถามโค้ช AI (พูดได้เลย)...</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleCoachVoiceRecording}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                  >
                    หยุดบันทึก
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="coach-chat-input-text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder={isVoiceRecording ? '🎙️ กำลังฟังเสียงของคุณ...' : "พิมพ์ถามโค้ช เช่น 'มื้อเย็นกินอะไรดี' หรือกดปุ่มไมค์เพื่อพูด..."}
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl pl-4 pr-11 py-3 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    disabled={isTyping}
                  />
                  <button
                    type="button"
                    id="coach-chat-voice-btn"
                    onClick={toggleCoachVoiceRecording}
                    disabled={isTyping}
                    title="บันทึกเสียงถามโค้ช AI"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all cursor-pointer ${
                      isVoiceRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : 'bg-white hover:bg-orange-50 text-neutral-500 hover:text-orange-600 border border-neutral-200 shadow-2xs'
                    }`}
                  >
                    {isVoiceRecording ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                </div>
                <button
                  id="coach-chat-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isTyping}
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white p-3 rounded-2xl font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Daily & Historical Meal Audit */}
      {activeSubTab === 'audit' && (
        <div className="space-y-5">
          {/* Date Selector Bar for Historical Audits */}
          <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-orange-500" />
                <h3 className="font-extrabold text-neutral-900 text-sm">
                  เลือกวันที่ต้องการให้โค้ชตรวจการบ้าน:
                </h3>
              </div>

              {/* Custom Date Picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium">ระบุวันที่ (วัน/เดือน/ปี):</span>
                <div className="relative flex items-center bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500 cursor-pointer">
                  <Calendar size={13} className="text-orange-500 mr-1.5 shrink-0" />
                  <span className="text-xs font-bold text-neutral-800 tracking-tight select-none mr-1">
                    {formatDateDMY(selectedAuditDate)}
                  </span>
                  <input
                    type="date"
                    value={selectedAuditDate}
                    max={todayDateStr}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedAuditDate(e.target.value);
                      }
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    title="เลือกวันที่ (วัน/เดือน/ปี)"
                  />
                </div>
              </div>
            </div>

            {/* Quick 7-day pill strip */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pastDatesList.map((item) => {
                const isSelected = selectedAuditDate === item.dateStr;
                const hasAudited = !!auditReportsByDate[item.dateStr];
                return (
                  <button
                    key={item.dateStr}
                    onClick={() => setSelectedAuditDate(item.dateStr)}
                    className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-100 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-80">{item.weekdayTh}</span>
                    <span className="text-sm font-black">{item.dayNum}</span>
                    {hasAudited && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-orange-400' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger & Date Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    {selectedAuditDate === todayDateStr ? `วันนี้ (${formatDateDMY(selectedAuditDate)})` : `${formatFullThaiDate(selectedAuditDate, true)} (${formatDateDMY(selectedAuditDate)})`}
                  </span>
                  {currentAuditReport && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      ตรวจแล้ว (เกรด {currentAuditReport.grade})
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-neutral-900 text-base sm:text-lg mt-1">
                  ระบบตรวจการบ้านอาหาร {selectedAuditDate === todayDateStr ? 'ประจำวัน' : 'ย้อนหลัง'}
                </h3>
                <p className="text-neutral-500 text-xs mt-0.5">
                  วิเคราะห์สารอาหาร พลังงาน และความสมดุลของมื้ออาหารในวันที่เลือก พร้อมให้แนวทางปรับปรุง
                </p>
              </div>

              <button
                onClick={() => handleRunAuditForDate(selectedAuditDate)}
                disabled={isAuditing}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 active:scale-98"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>กำลังตรวจการบ้าน...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{currentAuditReport ? '🔄 ตรวจการบ้านวันที่นี้ใหม่อีกครั้ง' : '🤖 กดให้โค้ชตรวจการบ้านวันที่นี้'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Selected Date's Meals Summary */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-700 block">
                  มื้ออาหารที่บันทึกไว้ในวันที่นี้ ({selectedDateMeals.length} รายการ):
                </span>
                <span className="text-[11px] font-bold text-neutral-600">
                  รวม: <span className="text-orange-600 font-black">{(selectedDateMeals || []).reduce((s, m) => s + (m?.calories || 0), 0)} kcal</span> (P:{formatNutrientValue((selectedDateMeals || []).reduce((s, m) => s + (m?.proteinGrams || 0), 0))}g C:{formatNutrientValue((selectedDateMeals || []).reduce((s, m) => s + (m?.carbsGrams || 0), 0))}g F:{formatNutrientValue((selectedDateMeals || []).reduce((s, m) => s + (m?.fatGrams || 0), 0))}g)
                </span>
              </div>

              {selectedDateMeals.length === 0 ? (
                <div className="bg-white p-4 rounded-xl border border-neutral-200/60 text-center space-y-1">
                  <p className="text-neutral-400 font-medium">ยังไม่มีรายการอาหารที่บันทึกในวันที่นี้</p>
                  <p className="text-[11px] text-neutral-400">คุณสามารถไปที่แท็บ &quot;ไดอารี่&quot; หรือ &quot;สแกนอาหาร&quot; เพื่อบันทึกอาหารย้อนหลังได้</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDateMeals.map((meal) => (
                    <div key={meal.id} className="bg-white p-3 rounded-xl border border-neutral-200/80 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-bold text-neutral-900 block">{meal.foodName}</span>
                        <span className="text-[11px] text-neutral-500">มื้อ: {meal.mealType} • โปรตีน {formatNutrientValue(meal.proteinGrams)}g</span>
                      </div>
                      <span className="font-extrabold text-orange-600 text-xs bg-orange-50 px-2.5 py-1 rounded-lg">
                        {meal.calories} kcal
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit Results View */}
          {currentAuditReport && (
            <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4">
              {/* Score & Grade Hero */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-orange-300 font-bold uppercase tracking-wider">
                      ผลการตรวจการบ้านโภชนาการ
                    </span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-neutral-300">
                      {new Date(selectedAuditDate + 'T00:00:00')?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {currentAuditReport.overallScore}
                    </span>
                    <span className="text-neutral-400 text-lg">/ 100 คะแนน</span>
                    <span className="bg-orange-500 text-white font-black text-sm px-3 py-1 rounded-full ml-2">
                      เกรด {currentAuditReport.grade}
                    </span>
                  </div>
                  <p className="text-neutral-300 text-xs pt-1 leading-relaxed">
                    {currentAuditReport.verdict}
                  </p>
                </div>

                {/* Status Chips */}
                <div className="space-y-2 shrink-0">
                  <div className="bg-white/10 px-3.5 py-2 rounded-xl text-xs border border-white/10">
                    <span className="text-neutral-400 block text-[10px]">สถานะแคลอรี:</span>
                    <span className={`font-bold ${
                      currentAuditReport.calorieStatus?.includes('พอดี') || currentAuditReport.calorieStatus?.includes('สมดุล')
                        ? 'text-emerald-300'
                        : currentAuditReport.calorieStatus?.includes('เกิน')
                          ? 'text-amber-300'
                          : 'text-sky-300'
                    }`}>
                      {currentAuditReport.calorieStatus}
                    </span>
                  </div>
                  <div className="bg-white/10 px-3.5 py-2 rounded-xl text-xs border border-white/10">
                    <span className="text-neutral-400 block text-[10px]">สถานะโปรตีน:</span>
                    <span className={`font-bold ${
                      currentAuditReport.proteinStatus?.includes('ถึงเป้า') || currentAuditReport.proteinStatus?.includes('เพียงพอ') || currentAuditReport.proteinStatus?.includes('ยอดเยี่ยม') || currentAuditReport.proteinStatus?.includes('ครบ')
                        ? 'text-emerald-300'
                        : currentAuditReport.proteinStatus?.includes('สูง') || currentAuditReport.proteinStatus?.includes('เกิน')
                          ? 'text-amber-300'
                          : 'text-rose-300'
                    }`}>
                      {currentAuditReport.proteinStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-950">
                    <ThumbsUp size={15} className="text-emerald-600" />
                    <span>จุดที่ทำได้ยอดเยี่ยม (Strengths)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-900">
                    {(currentAuditReport.strengths || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-950">
                    <AlertCircle size={15} className="text-amber-600" />
                    <span>จุดที่ควรระวัง & ปรับปรุง (Improvements)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-900">
                    {(currentAuditReport.improvements || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Zap size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-orange-950">
                  <Target size={15} className="text-orange-600" />
                  <span>3 แผนปฏิบัติการที่แนะนำ (Action Plan)</span>
                </div>
                <div className="space-y-2">
                  {(currentAuditReport.actionPlanForTomorrow || []).map((plan, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-orange-100 text-xs font-medium text-neutral-800">
                      {plan}
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Quote */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center italic text-xs text-neutral-600">
                "{currentAuditReport.coachQuote}"
              </div>

              {/* Action Buttons: Copy & Export Audit Report */}
              <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-neutral-400 font-medium">
                  ออกรายงาน: {formatFullThaiDate(selectedAuditDate)} ({formatDateDMY(selectedAuditDate)})
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `🤖 ผลการตรวจการบ้านโภชนาการ AI GooKal\n` +
                        `📅 วันที่: ${formatDateDMY(selectedAuditDate)} (${formatFullThaiDate(selectedAuditDate)})\n` +
                        `🏆 คะแนน: ${currentAuditReport.overallScore}/100 (เกรด ${currentAuditReport.grade})\n` +
                        `💬 ความเห็นโค้ช: ${currentAuditReport.verdict}\n` +
                        `🔥 สถานะแคลอรี: ${currentAuditReport.calorieStatus}\n` +
                        `🥩 สถานะโปรตีน: ${currentAuditReport.proteinStatus}\n\n` +
                        `✅ จุดเด่น:\n${(currentAuditReport.strengths || []).map(s => `• ${s}`).join('\n')}\n\n` +
                        `⚠️ จุดที่ควรปรับปรุง:\n${(currentAuditReport.improvements || []).map(imp => `• ${imp}`).join('\n')}\n\n` +
                        `🎯 แผนปฏิบัติการ:\n${(currentAuditReport.actionPlanForTomorrow || []).map((p, idx) => `${idx + 1}. ${p}`).join('\n')}\n\n` +
                        `✨ "${currentAuditReport.coachQuote}"`;

                      navigator.clipboard.writeText(text);
                      onToast('📋 คัดลอกผลตรวจการบ้านไปที่คลิปบอร์ดแล้ว! สามารถส่งแชร์ใน LINE ได้ทันที');
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Copy size={13} />
                    <span>คัดลอกผลตรวจ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = `=== รายงานตรวจการบ้านโภชนาการ GooKal AI ===\n` +
                        `วันที่ตรวจ: ${formatDateDMY(selectedAuditDate)} (${formatFullThaiDate(selectedAuditDate)})\n` +
                        `คะแนนรวม: ${currentAuditReport.overallScore}/100 | เกรด: ${currentAuditReport.grade}\n` +
                        `สรุปภาพรวม: ${currentAuditReport.verdict}\n` +
                        `สถานะแคลอรี: ${currentAuditReport.calorieStatus}\n` +
                        `สถานะโปรตีน: ${currentAuditReport.proteinStatus}\n\n` +
                        `[จุดที่ทำได้ยอดเยี่ยม]\n${(currentAuditReport.strengths || []).map(s => `- ${s}`).join('\n')}\n\n` +
                        `[จุดที่ควรระวัง & ปรับปรุง]\n${(currentAuditReport.improvements || []).map(imp => `- ${imp}`).join('\n')}\n\n` +
                        `[3 แผนปฏิบัติการที่แนะนำ]\n${(currentAuditReport.actionPlanForTomorrow || []).map((p, idx) => `${idx + 1}. ${p}`).join('\n')}\n\n` +
                        `คำคมกำลังใจ: "${currentAuditReport.coachQuote}"\n` +
                        `==============================================`;

                      const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `gookal_ai_audit_${selectedAuditDate}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      onToast('💾 ดาวน์โหลดไฟล์สรุปผลตรวจการบ้านเรียบร้อย!');
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Download size={13} />
                    <span>บันทึกเป็นไฟล์</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Habits & Daily Check-in */}
      {activeSubTab === 'habits' && (
        <div className="space-y-5">
          {/* Water Tracker */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Droplets size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-sm">การดื่มน้ำประจำวัน (Water Tracker)</h3>
                  <p className="text-neutral-500 text-xs">เป้าหมาย {habits.waterTarget} แก้ว (~{(habits.waterTarget * 250).toLocaleString()} มล.) เชื่อมโยงข้อมูลร่วมกันทั้งแอป</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-black text-sky-600 text-base block leading-tight">
                    {habits.waterGlasses} / {habits.waterTarget} แก้ว
                  </span>
                  <span className="text-[11px] text-sky-500 font-bold">
                    {(habits.waterGlasses * 250).toLocaleString()} ml
                  </span>
                </div>
                {habits.waterGlasses > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearWaterLogsForDate(todayDateStr);
                      setHabits(prev => ({ ...prev, waterGlasses: 0 }));
                      if (onToast) onToast('🔄 รีเซ็ตการดื่มน้ำของวันนี้เป็น 0 ml แล้ว');
                    }}
                    className="text-xs text-neutral-400 hover:text-rose-500 font-bold p-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                    title="รีเซ็ตเป็น 0 แก้ว"
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">รีเซ็ต</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Glasses */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {Array.from({ length: habits.waterTarget }).map((_, idx) => {
                const isDrunk = idx < habits.waterGlasses;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const currentTotalMl = getWaterTotalMlForDate(todayDateStr);
                      const targetGlasses = isDrunk ? idx : idx + 1;
                      const targetMl = targetGlasses * 250;
                      const diffMl = targetMl - currentTotalMl;

                      if (targetGlasses === 0) {
                        clearWaterLogsForDate(todayDateStr);
                      } else if (diffMl > 0) {
                        addWaterLog(diffMl, new Date());
                      } else if (diffMl < 0) {
                        clearWaterLogsForDate(todayDateStr);
                        if (targetMl > 0) {
                          addWaterLog(targetMl, new Date());
                        }
                      }
                      setHabits(prev => ({ ...prev, waterGlasses: targetGlasses }));
                      if (onToast) onToast(`💧 ดื่มน้ำแล้ว ${targetGlasses} แก้ว (~${targetGlasses * 250} ml)`);
                    }}
                    className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isDrunk
                        ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                        : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:bg-sky-50'
                    }`}
                  >
                    <Droplets size={16} />
                    <span className="text-[10px] font-bold">แก้วที่ {idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Healthy Habits Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>เช็กลิสต์วินัยสุขภาพประจำวัน (Daily Habit Checklist)</span>
            </h3>

            <div className="space-y-2.5">
              {/* Habit 1: Sleep */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Moon size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs">นอนหลับพักผ่อน 7-8 ชม.</h4>
                    <span className="text-[11px] text-neutral-500">บันทึก: {habits.sleepHours} ชั่วโมง</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[6, 7, 7.5, 8].map((hr) => (
                    <button
                      key={hr}
                      onClick={() => setHabits({ ...habits, sleepHours: hr })}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                        habits.sleepHours === hr
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {hr}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Habit 2: No Late Snack */}
              <div
                onClick={() => setHabits({ ...habits, noLateSnack: !habits.noLateSnack })}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs">งดกินจุกจิกหลัง 20:00 น.</h4>
                    <span className="text-[11px] text-neutral-500">ช่วยให้ร่างกายเข้าสู่ภาวะสลายไขมันตอนนอน</span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${habits.noLateSnack ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-transparent'}`}>
                  <Check size={14} />
                </div>
              </div>

              {/* Habit 3: Workout */}
              <div
                onClick={() => setHabits({ ...habits, workoutDone: !habits.workoutDone })}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                    <Flame size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs">ออกกำลังกาย / ขยับร่างกาย 30 นาที</h4>
                    <span className="text-[11px] text-neutral-500">เวทเทรนนิ่ง, วิ่ง, เดินเร็ว, หรือบอดี้เวท</span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${habits.workoutDone ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-transparent'}`}>
                  <Check size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Body Transformation & Goals (Inches & Target Weight) */}
      {activeSubTab === 'transformation' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-base">
                สัดส่วน (นิ้ว) & กำหนดน้ำหนักเป้าหมาย (Body Transformation & Goals)
              </h3>
              <p className="text-neutral-500 text-xs mt-0.5">
                ติดตามมิติรูปร่างเป็นหน่วยนิ้ว กำหนดเป้าหมายน้ำหนัก และคำนวณความคืบหน้าอย่างแม่นยำ
              </p>
            </div>

            {/* Target Weight Configuration Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-3xl border border-orange-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">
                    การจัดการเป้าหมายน้ำหนักตัว
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-neutral-900">
                      {bodyStats.currentWeight} <span className="text-sm font-bold text-neutral-500">กก. (ปัจจุบัน)</span>
                    </span>
                    <ArrowRight size={18} className="text-orange-500 mx-1" />
                    <span className="text-2xl font-black text-orange-600">
                      {bodyStats.targetWeight} <span className="text-sm font-bold text-orange-400">กก. (เป้าหมาย)</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-orange-200 shadow-2xs">
                  <Target size={18} className="text-orange-500 shrink-0" />
                  <div className="text-xs">
                    <span className="text-neutral-400 block text-[10px]">ส่วนต่างที่ต้องไปถึง:</span>
                    <span className="font-extrabold text-neutral-900">
                      {weightDiff > 0 ? `ลดอีก ${weightDiff} กก.` : weightDiff < 0 ? `เพิ่มอีก ${Math.abs(weightDiff)} กก.` : 'บรรลุเป้าหมายแล้ว!'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-3 bg-neutral-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, weightDiff <= 0 ? 100 : (100 - (weightDiff * 5))))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>BMI ปัจจุบัน: {currentBmi}</span>
                  <span className="font-bold text-orange-600">BMI เป้าหมาย: {targetBmi}</span>
                </div>
              </div>

              {/* Inputs for weight & target weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-orange-200/60">
                <div className="bg-white p-3 rounded-2xl border border-orange-100">
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                    น้ำหนักปัจจุบัน (กก.)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={bodyStats.currentWeight}
                      onChange={(e) => setBodyStats({ ...bodyStats, currentWeight: Number(e.target.value) || 0 })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-base font-black text-neutral-900 outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-bold text-neutral-400">กก.</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-orange-200 ring-2 ring-orange-400/20">
                  <label className="block text-[11px] font-bold text-orange-700 mb-1 flex items-center gap-1">
                    <Target size={13} className="text-orange-500" />
                    <span>น้ำหนักเป้าหมาย (กก.) *</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={bodyStats.targetWeight}
                      onChange={(e) => setBodyStats({ ...bodyStats, targetWeight: Number(e.target.value) || 0 })}
                      className="w-full bg-orange-50/50 border border-orange-300 rounded-xl px-3 py-2 text-base font-black text-orange-700 outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-bold text-orange-500">กก.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inches Measurements (Waist & Hips in Inches) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-neutral-900">
                  สัดส่วนรอบเอวและรอบสะโพก (หน่วยเป็นนิ้ว)
                </h4>
                <span className="text-[11px] bg-sky-50 text-sky-700 font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                  หน่วยวัด: นิ้ว (Inches)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Waist in Inches */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-700">
                    รอบเอว (นิ้ว / in)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={bodyStats.waistInches}
                      onChange={(e) => setBodyStats({ ...bodyStats, waistInches: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-base font-black text-neutral-900 outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-bold text-neutral-500">&quot;</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block pt-0.5">
                    ≈ {(bodyStats.waistInches * 2.54).toFixed(1)} ซม.
                  </span>
                </div>

                {/* Hip in Inches */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-700">
                    รอบสะโพก (นิ้ว / in)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={bodyStats.hipInches}
                      onChange={(e) => setBodyStats({ ...bodyStats, hipInches: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-base font-black text-neutral-900 outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-bold text-neutral-500">&quot;</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block pt-0.5">
                    ≈ {(bodyStats.hipInches * 2.54).toFixed(1)} ซม.
                  </span>
                </div>

                {/* Body Fat */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-700">
                    % ไขมัน (Body Fat)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={bodyStats.bodyFatPercent}
                      onChange={(e) => setBodyStats({ ...bodyStats, bodyFatPercent: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-base font-black text-neutral-900 outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-bold text-neutral-500">%</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block pt-0.5">
                    ระดับไขมันในร่างกาย
                  </span>
                </div>

                {/* Muscle Mass */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-700">
                    มวลกล้ามเนื้อ (กก.)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={bodyStats.muscleMassKg}
                      onChange={(e) => setBodyStats({ ...bodyStats, muscleMassKg: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-base font-black text-neutral-900 outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-bold text-neutral-500">กก.</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block pt-0.5">
                    มวลกล้ามเนื้อโครงร่าง
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveBodyStats}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-3.5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Check size={16} />
              <span>บันทึกการตั้งค่าน้ำหนักเป้าหมาย & สัดส่วน (นิ้ว)</span>
            </button>

            {/* Quick Recipe search callout */}
            {onOpenRecipes && (
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">ต้องการไอเดียเมนูสุขภาพเพื่อคุมสัดส่วน?</h4>
                  <p className="text-orange-100 text-[11px] mt-0.5">ค้นหาสูตรอาหารคลีนตามวัตถุดิบในตู้เย็นได้ทันที</p>
                </div>
                <button
                  onClick={onOpenRecipes}
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  ค้นหาสูตรอาหาร
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
