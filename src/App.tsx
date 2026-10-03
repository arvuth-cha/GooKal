import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Camera, Share, Loader2, Utensils, AlertCircle, History, Plus, Activity, Sunrise, Sun, Moon, Trash2, Home, Calendar, BarChart2, User, LogIn, MoreHorizontal, Target, Dumbbell, ChevronUp, ChevronRight, ChevronLeft, CalendarDays, Check, Lock, Image as ImageIcon, X, Download, Upload, Cloud, FileSpreadsheet, FileJson, FileText, Copy, Share2, CheckCircle2, TrendingUp, Sparkle, Wifi, WifiOff, HardDrive, Bot, Award, Star, MessageSquare, ChefHat, BookOpen, Bell, BellRing, Droplet, Timer, Scale, Heart, Mic, MicOff, Scan, Zap, ShoppingCart, ArrowRightLeft, Smile, Printer, FileCheck, Layers, Coffee, Flame, RefreshCw, Edit3, Volume2, VolumeX, Filter, Search, ArrowUpDown, BookmarkCheck, Repeat, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { ExportInsightsModal } from './components/ExportInsightsModal';
import { ExportInsightsParams } from './utils/insightsExport';
import { HealthyRecipeSearch } from './components/recipes/HealthyRecipeSearch';
import { PersonalAICoach } from './components/coach/PersonalAICoach';
import { EnergyBalanceChart } from './components/insights/EnergyBalanceChart';
import { MealReminderModal } from './components/notifications/MealReminderModal';
import { MealReminderCard } from './components/notifications/MealReminderCard';
import { InAppMealNotificationBanner } from './components/notifications/InAppMealNotificationBanner';
import { GoogleGroundingSearchModal } from './components/search/GoogleGroundingSearchModal';
import { 
  loadReminderSettings, 
  checkAndTriggerScheduledReminders, 
  getNotificationPermission 
} from './utils/notificationService';
import { MealReminderConfig } from './types/notifications';
import { getWaterTotalMlForDate } from './utils/waterService';
import { IntermittentFastingTracker } from './components/fasting/IntermittentFastingTracker';
import { WaterTracker } from './components/water/WaterTracker';
import { BodyMeasurementTracker } from './components/body/BodyMeasurementTracker';
import { MealPortionSelector } from './components/meals/MealPortionSelector';
import { QuickCleanPresetBar } from './components/meals/QuickCleanPresetBar';
import { CopyYesterdayMealModal } from './components/meals/CopyYesterdayMealModal';
import { NutrientQualityScoreCard } from './components/insights/NutrientQualityScoreCard';
import { CustomMealLibraryModal } from './components/meals/CustomMealLibraryModal';
import { CalorieTargetGoalModal } from './components/goals/CalorieTargetGoalModal';
import { ThaiVoiceRecognizer, speakThai, stopSpeaking, playSuccessChime, playWaterDropSound, triggerHaptic } from './utils/voiceService';
import { NutritionLabelScannerModal } from './components/scanner/NutritionLabelScannerModal';
import { NutritionSafetyBadge } from './components/scanner/NutritionSafetyBadge';
import { QuickFoodAddModal } from './components/meals/QuickFoodAddModal';
import { GroceryShoppingListModal } from './components/grocery/GroceryShoppingListModal';
import { MealComparisonAndSwapsModal } from './components/meals/MealComparisonAndSwapsModal';
import { StreakAchievementsModal } from './components/gamification/StreakAchievementsModal';
import { DailyMoodDigestiveModal } from './components/mood/DailyMoodDigestiveModal';
import { BackupRestoreModal } from './components/backup/BackupRestoreModal';
import { PrintableClinicalReportModal } from './components/report/PrintableClinicalReportModal';
import { HealthCenterDashboard } from './components/health/HealthCenterDashboard';
import { QuickHealthNutritionSuiteHub } from './components/health/QuickHealthNutritionSuiteHub';
import { BioHackingInnovationsHub, InnovationCategory } from './components/health/BioHackingInnovationsHub';
import { AIMacroGoalCalculatorCard } from './components/account/AIMacroGoalCalculatorCard';
import { CustomMealItem, OfflineFoodDatabaseItem } from './types/extendedFeatures';
import { loadInventory, InventoryItem } from './utils/foodPantryStore';

// 20 AI Innovation & Bio-Hack Modules
import { GlucoseCrashPredictorModal } from './components/innovations/GlucoseCrashPredictorModal';
import { DiningOutMenuScannerModal } from './components/innovations/DiningOutMenuScannerModal';
import { ExerciseBurnOffsetModal } from './components/innovations/ExerciseBurnOffsetModal';
import { ChronoNutritionOptimizerModal } from './components/innovations/ChronoNutritionOptimizerModal';
import { LongevityInflammationScoreModal } from './components/innovations/LongevityInflammationScoreModal';
import { InteractiveCookingAvatarModal } from './components/innovations/InteractiveCookingAvatarModal';
import { SmartMicrobiomeTrackerModal } from './components/innovations/SmartMicrobiomeTrackerModal';
import { FastingStagesVisualizerModal } from './components/innovations/FastingStagesVisualizerModal';
import { FridgeExpiryManagerModal } from './components/innovations/FridgeExpiryManagerModal';
import { SmartPantryWizardModal } from './components/innovations/SmartPantryWizardModal';
import { HealthyPlateVisualizerModal } from './components/innovations/HealthyPlateVisualizerModal';
import { MetabolicHeatmapModal } from './components/innovations/MetabolicHeatmapModal';
import { AllergySafetySettingsModal } from './components/innovations/AllergySafetySettingsModal';
import { SocialCheatMealRecoveryModal } from './components/innovations/SocialCheatMealRecoveryModal';
import { SocialStoryCardModal } from './components/innovations/SocialStoryCardModal';
import { MicroHabitStackerModal } from './components/innovations/MicroHabitStackerModal';
import { HydrationElectrolyteOptimizerModal } from './components/innovations/HydrationElectrolyteOptimizerModal';
import { CravingEmergencySOSModal } from './components/innovations/CravingEmergencySOSModal';
import { BiomarkerSyncSimulatorModal } from './components/innovations/BiomarkerSyncSimulatorModal';
import { CaffeineSleepDecayModal } from './components/innovations/CaffeineSleepDecayModal';
import { StreetFoodSurvivalGuideModal } from './components/innovations/StreetFoodSurvivalGuideModal';
import { MetabolicAgeCalculatorModal } from './components/innovations/MetabolicAgeCalculatorModal';
import { WeeklyMealPlannerModal } from './components/innovations/WeeklyMealPlannerModal';
import { SmartBarcodeScannerModal } from './components/innovations/SmartBarcodeScannerModal';
import { MicronutrientTrackerModal } from './components/innovations/MicronutrientTrackerModal';
import { PostMealWalkReminderModal } from './components/innovations/PostMealWalkReminderModal';
import { VisualPhotoComparisonModal } from './components/innovations/VisualPhotoComparisonModal';
import { AccessibilityAndThemeModal } from './components/innovations/AccessibilityAndThemeModal';
import { AccessibilitySettingsCard } from './components/account/AccessibilitySettingsCard';
import { 
  DashboardSkeleton, 
  InsightsSkeleton, 
  MealSuggestionSkeleton, 
  AnalysisResultSkeleton 
} from './components/skeletons';
import { formatDateDMY, formatDateDMYShort, formatFullThaiDate } from './utils/dateUtils';
import { GoogleUser, getCurrentUser, logoutUser, getScopedStorageKey, saveUserSession } from './services/authService';
import { GoogleLoginModal } from './components/auth/GoogleLoginModal';


interface AnalysisResult {
  foodName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sugarGrams?: number;
  sodiumMg?: number;
  explanation: string;
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface UserProfile {
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


interface MealSuggestion {
  foodName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  explanation: string;
}
interface HistoryItem extends AnalysisResult {
  id: string;
  date: number;
  image: string;
  mealType: MealType;
}

const addDeletedMealId = (id: string, userId?: string): string[] => {
  if (!id) return [];
  try {
    const delKey = getScopedStorageKey('kalguru_deleted_meals_v1', userId);
    const existing: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
    if (!existing.includes(id)) {
      existing.push(id);
      const trimmed = existing.slice(-1000);
      localStorage.setItem(delKey, JSON.stringify(trimmed));
      if (!userId) {
        localStorage.setItem('kalguru_deleted_meals_v1', JSON.stringify(trimmed));
      }
      return trimmed;
    }
    return existing;
  } catch (e) {
    return [id];
  }
};

const getDeletedMealIds = (userId?: string): Set<string> => {
  try {
    const delKey = getScopedStorageKey('kalguru_deleted_meals_v1', userId);
    const saved = localStorage.getItem(delKey) || (!userId ? localStorage.getItem('kalguru_deleted_meals_v1') : null);
    const list: string[] = saved ? JSON.parse(saved) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch (e) {
    return new Set();
  }
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'scan' | 'insights' | 'account' | 'coach' | 'recipes' | 'health'>('dashboard');
  const [toasts, setToasts] = useState<{id: string, message: string}[]>([]);
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [isSpeakingResult, setIsSpeakingResult] = useState<boolean>(false);
  const [showCopyYesterdayModal, setShowCopyYesterdayModal] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyMealFilter, setHistoryMealFilter] = useState<string>('all');
  const [historySortBy, setHistorySortBy] = useState<'time_desc' | 'calories_desc' | 'calories_asc'>('time_desc');
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  const [hiddenFrequentMealIds, setHiddenFrequentMealIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kalguru_hidden_frequent_meals');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const persistHistorySafely = (newHistory: HistoryItem[], newlyDeletedIds: string[] = [], targetUserId?: string) => {
    const effectiveUserId = targetUserId !== undefined ? targetUserId : currentGoogleUser?.id;
    const historyKey = getScopedStorageKey('kalguru_history_v2', effectiveUserId);
    const deletedSet = getDeletedMealIds(effectiveUserId);
    newlyDeletedIds.forEach(id => deletedSet.add(id));

    // Ensure no deleted items are kept
    const filteredHistory = (newHistory || []).filter(item => item && item.id && !deletedSet.has(item.id));

    // 1. First attempt: keep base64 images only for the 3 most recent meals to conserve localStorage quota
    let saved = false;
    try {
      const sanitized = filteredHistory.map((item, index) => {
        if (index >= 3 && item.image && item.image.startsWith('data:')) {
          return { ...item, image: '' };
        }
        return item;
      });
      localStorage.setItem(historyKey, JSON.stringify(sanitized));
      if (!effectiveUserId) {
        localStorage.setItem('kalguru_history_v2', JSON.stringify(sanitized));
      }
      saved = true;
    } catch (e) {
      console.warn('[GooKal] Quota limit reached, stripping all base64 images from history:', e);
    }

    // 2. Fallback if quota exceeded: strip ALL images, but NEVER slice or drop meal records!
    if (!saved) {
      try {
        const noImages = filteredHistory.map(item => ({ ...item, image: '' }));
        localStorage.setItem(historyKey, JSON.stringify(noImages));
        if (!effectiveUserId) {
          localStorage.setItem('kalguru_history_v2', JSON.stringify(noImages));
        }
        saved = true;
      } catch (err) {
        console.error('[GooKal] Critical localStorage failure:', err);
      }
    }

    // 3. Auto-sync to Cloud Server in background if logged in
    const syncId = effectiveUserId;
    if (syncId) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: syncId,
          email: currentGoogleUser?.email || '',
          history: filteredHistory,
          profile: userProfile,
          deletedIds: Array.from(deletedSet),
          lastUpdated: Date.now()
        })
      }).then(() => {
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date());
      }).catch(err => {
        console.warn('[GooKal] Background cloud sync error:', err);
      });
    }
  };

  const updateAndPersistHistory = (newHistory: HistoryItem[]) => {
    const deletedSet = getDeletedMealIds(currentGoogleUser?.id);
    const sanitized = (newHistory || [])
      .filter(item => item && item.id && !deletedSet.has(item.id))
      .map((item, idx) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        calories: Number(item.calories) || 0,
        proteinGrams: Number(item.proteinGrams) || 0,
        carbsGrams: Number(item.carbsGrams) || 0,
        fatGrams: Number(item.fatGrams) || 0,
        date: Number(item.date) || Date.now(),
        mealType: item.mealType || 'lunch',
        foodName: item.foodName || 'รายการอาหาร'
      }));

    setHistory(sanitized);
    persistHistorySafely(sanitized);
  };

  const handleLogRecipeMeal = (mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }) => {
    const newItem: HistoryItem = {
      id: `recipe-log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      foodName: mealData.name,
      calories: mealData.calories,
      proteinGrams: mealData.protein,
      carbsGrams: mealData.carbs,
      fatGrams: mealData.fat,
      date: selectedDate.getTime(),
      image: '',
      mealType: mealData.mealType === 'snack' ? 'lunch' : mealData.mealType,
      explanation: 'บันทึกจากระบบค้นหาสูตรอาหารคลีน (AI Healthy Recipes)'
    };
    const newHistory = [newItem, ...history];
    updateAndPersistHistory(newHistory);
    showToast(`🍳 บันทึกเมนู "${mealData.name}" (${mealData.calories} kcal) ลงในมื้ออาหารเรียบร้อย!`);
    setActiveTab('history');
  };
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const curr = getCurrentUser();
      const scopedKey = getScopedStorageKey('kalguru_profile', curr?.id);
      const saved = localStorage.getItem(scopedKey) || localStorage.getItem('kalguru_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.weight) return parsed;
      }
    } catch {}
    return {
      weight: 59,
      height: 167,
      age: 59,
      gender: 'male',
      activityLevel: 1.375,
      targetWeight: 59,
      name: 'arvuth'
    };
  });
  const [dailyGoal, setDailyGoal] = useState<number>(1861);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Google Authentication State
  const [currentGoogleUser, setCurrentGoogleUser] = useState<GoogleUser | null>(() => getCurrentUser());
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState<boolean>(() => !getCurrentUser());
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  // Cloud Sync State
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<Date | null>(null);

  const triggerManualCloudSync = async (userToSync = currentGoogleUser) => {
    if (!userToSync) {
      setShowGoogleLoginModal(true);
      return;
    }
    setIsSyncingWithCloud(true);
    setCloudSyncStatus('syncing');
    try {
      const historyKey = getScopedStorageKey('kalguru_history_v2', userToSync.id);
      const profileKey = getScopedStorageKey('kalguru_profile', userToSync.id);

      // Read local history directly from localStorage
      let localHistory: HistoryItem[] = [];
      try {
        const rawLocal = localStorage.getItem(historyKey) || localStorage.getItem('kalguru_history_v2');
        if (rawLocal) {
          localHistory = JSON.parse(rawLocal);
        }
      } catch {}

      const syncUrl = `/api/user/sync?userId=${encodeURIComponent(userToSync.id)}&email=${encodeURIComponent(userToSync.email || '')}`;
      const res = await fetch(syncUrl);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const result = await res.json();

      let finalHistory: HistoryItem[] = [];
      let finalProfile = { ...userProfile };

      if (result?.success && result?.data) {
        const delKey = getScopedStorageKey('kalguru_deleted_meals_v1', userToSync.id);
        const localDel: string[] = JSON.parse(localStorage.getItem(delKey) || '[]');
        const serverDel: string[] = Array.isArray(result.data.deletedIds) ? result.data.deletedIds : [];
        const combinedDelSet = new Set([...localDel, ...serverDel]);
        localStorage.setItem(delKey, JSON.stringify(Array.from(combinedDelSet)));

        const serverHistory: HistoryItem[] = Array.isArray(result.data.history) 
          ? result.data.history.filter((h: any) => h && h.id && !combinedDelSet.has(h.id))
          : [];
        const cleanLocal = localHistory.filter(h => h && h.id && !combinedDelSet.has(h.id));

        // Union merge: All server meals + local meals
        const historyMap = new Map<string, HistoryItem>();
        serverHistory.forEach(item => historyMap.set(item.id, item));
        cleanLocal.forEach(item => {
          if (!historyMap.has(item.id)) {
            historyMap.set(item.id, item);
          }
        });

        finalHistory = Array.from(historyMap.values()).sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
        setHistory(finalHistory);
        persistHistorySafely(finalHistory, [], userToSync.id);

        if (result.data.profile && Object.keys(result.data.profile).length > 0) {
          finalProfile = { ...userProfile, ...result.data.profile };
          setUserProfile(finalProfile);
          try {
            localStorage.setItem(profileKey, JSON.stringify(finalProfile));
            localStorage.setItem('kalguru_profile', JSON.stringify(finalProfile));
          } catch {}
        }
      } else {
        finalHistory = localHistory;
        setHistory(finalHistory);
        persistHistorySafely(finalHistory, [], userToSync.id);
      }

      const delKey = getScopedStorageKey('kalguru_deleted_meals_v1', userToSync.id);
      const allDeleted = JSON.parse(localStorage.getItem(delKey) || '[]');

      // Push merged data back to server
      const postRes = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToSync.id,
          email: userToSync.email,
          history: finalHistory,
          profile: finalProfile,
          deletedIds: allDeleted,
          lastUpdated: Date.now()
        })
      });
      if (!postRes.ok) {
        throw new Error(`Server returned status ${postRes.status} on save`);
      }

      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date());
      playSuccessChime();
      triggerHaptic([30, 50]);
      showToast(`☁️ ซิงค์ข้อมูลกับคลาวด์สำเร็จ! (ประวัติอาหาร ${finalHistory.length} รายการ)`);
    } catch (err) {
      console.warn('Manual sync failed:', err);
      setCloudSyncStatus('error');
      showToast('⚠️ ไม่สามารถเชื่อมต่อกับคลาวด์ได้');
    } finally {
      setIsSyncingWithCloud(false);
    }
  };

  const handleGoogleLogout = () => {
    logoutUser();
    setCurrentGoogleUser(null);
    setShowUserDropdown(false);
    setShowGoogleLoginModal(true);
    setCloudSyncStatus('idle');
    showToast('🔒 ออกจากระบบเรียบร้อยแล้ว');
  };

  const handleGoogleLoginSuccess = (user: GoogleUser) => {
    saveUserSession(user);
    setCurrentGoogleUser(user);
    setShowGoogleLoginModal(false);
    if (user.name) {
      setUserProfile(prev => ({ ...prev, name: user.name }));
    }
    triggerManualCloudSync(user);
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePicSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentGoogleUser) return;
    try {
      const compressedBase64 = await compressImage(file);
      const updatedUser = { ...currentGoogleUser, picture: compressedBase64 };
      setCurrentGoogleUser(updatedUser);
      saveUserSession(updatedUser);
      showToast('📸 อัปเดตรูปโปรไฟล์สำเร็จแล้ว!');
    } catch (err) {
      showToast('❌ ไม่สามารถอัปเดตรูปโปรไฟล์ได้');
    }
    if (profilePicInputRef.current) {
      profilePicInputRef.current.value = '';
    }
  };

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('📶 เชื่อมต่ออินเทอร์เน็ตแล้ว');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚡ เข้าสู่โหมดออฟไลน์: ดูประวัติและแดชบอร์ดได้ตามปกติ');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const historyKey = getScopedStorageKey('kalguru_history_v2', currentGoogleUser?.id);
    const profileKey = getScopedStorageKey('kalguru_profile', currentGoogleUser?.id);

    let savedHistory = localStorage.getItem(historyKey);
    let savedProfile = localStorage.getItem(profileKey);

    // Migration logic: If logged in but scoped data is missing, migrate from unscoped (guest) data
    if (currentGoogleUser) {
      if (!savedHistory) {
        savedHistory = localStorage.getItem('kalguru_history_v2');
        if (savedHistory) localStorage.setItem(historyKey, savedHistory);
      }
      if (!savedProfile) {
        savedProfile = localStorage.getItem('kalguru_profile');
        if (savedProfile) localStorage.setItem(profileKey, savedProfile);
      }
    } else {
      // Guest fallback
      if (!savedHistory) savedHistory = localStorage.getItem('kalguru_history_v2');
      if (!savedProfile) savedProfile = localStorage.getItem('kalguru_profile');
    }

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          const delSet = getDeletedMealIds(currentGoogleUser?.id);
          const sanitized = parsed
            .filter(item => item && item.id && !delSet.has(item.id))
            .map((item, idx) => ({
              ...item,
              id: item.id || `item-legacy-${idx}-${Date.now()}`,
              calories: Number(item.calories) || 0,
              proteinGrams: Number(item.proteinGrams) || 0,
              carbsGrams: Number(item.carbsGrams) || 0,
              fatGrams: Number(item.fatGrams) || 0,
              date: Number(item.date) || Date.now(),
              mealType: item.mealType || 'lunch',
              foodName: item.foodName || 'รายการอาหาร'
            }));
          setHistory(sanitized);
        } else {
          setHistory([]);
        }
      } catch (e) {
        console.error('Failed to load history');
        setHistory([]);
      }
    } else {
      setHistory([]);
    }

    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      } catch (e) {
        console.error('Failed to load profile');
      }
    } else if (currentGoogleUser?.name) {
      setUserProfile(prev => ({ ...prev, name: currentGoogleUser.name }));
    }

    // Automatic Server Cloud Sync in background
    if (currentGoogleUser) {
      setCloudSyncStatus('syncing');
      const syncUrl = `/api/user/sync?userId=${encodeURIComponent(currentGoogleUser.id)}&email=${encodeURIComponent(currentGoogleUser.email || '')}`;
      fetch(syncUrl)
        .then(res => res.json())
        .then(result => {
          if (result && result.success && result.data) {
            const serverData = result.data;
            let currentLocal: HistoryItem[] = [];
            try {
              currentLocal = savedHistory ? JSON.parse(savedHistory) : [];
            } catch (e) {
              currentLocal = [];
            }

            const delKey = getScopedStorageKey('kalguru_deleted_meals_v1', currentGoogleUser.id);
            let localDel: string[] = [];
            try {
              localDel = JSON.parse(localStorage.getItem(delKey) || '[]');
            } catch (e) {}
            const serverDel: string[] = Array.isArray(serverData.deletedIds) ? serverData.deletedIds : [];
            const combinedDelSet = new Set([...localDel, ...serverDel]);
            try {
              localStorage.setItem(delKey, JSON.stringify(Array.from(combinedDelSet)));
            } catch (e) {}

            const serverHistory: HistoryItem[] = Array.isArray(serverData.history) 
              ? serverData.history.filter((h: any) => h && h.id && !combinedDelSet.has(h.id))
              : [];
            const cleanLocal = currentLocal.filter(h => h && h.id && !combinedDelSet.has(h.id));

            // Union merge: All server meals + local meals
            const historyMap = new Map<string, HistoryItem>();
            serverHistory.forEach(item => historyMap.set(item.id, item));
            cleanLocal.forEach(item => {
              if (!historyMap.has(item.id)) {
                historyMap.set(item.id, item);
              }
            });

            const merged = Array.from(historyMap.values()).sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
            setHistory(merged);
            persistHistorySafely(merged, [], currentGoogleUser.id);

            if (serverData.profile && Object.keys(serverData.profile).length > 0) {
              setUserProfile(prev => {
                const mergedProfile = { ...prev, ...serverData.profile };
                try {
                  localStorage.setItem(profileKey, JSON.stringify(mergedProfile));
                  localStorage.setItem('kalguru_profile', JSON.stringify(mergedProfile));
                } catch {}
                return mergedProfile;
              });
            }

            setCloudSyncStatus('synced');
            setLastCloudSyncTime(new Date());
          } else if (result && result.success && result.data === null) {
            if (savedHistory || savedProfile) {
              const localHistoryParsed = savedHistory ? JSON.parse(savedHistory) : [];
              if (localHistoryParsed.length > 0) {
                const delKey = getScopedStorageKey('kalguru_deleted_meals_v1', currentGoogleUser.id);
                let localDel: string[] = [];
                try {
                  localDel = JSON.parse(localStorage.getItem(delKey) || '[]');
                } catch (e) {}

                fetch('/api/user/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: currentGoogleUser.id,
                    email: currentGoogleUser.email,
                    history: localHistoryParsed,
                    profile: savedProfile ? JSON.parse(savedProfile) : {},
                    deletedIds: localDel,
                    lastUpdated: Date.now()
                  })
                }).catch(() => {});
              }
            }
            setCloudSyncStatus('synced');
            setLastCloudSyncTime(new Date());
          }
        })
        .catch(err => {
          console.warn('[GooKal] Background cloud sync error:', err);
          setCloudSyncStatus('error');
        });
    }
  }, [currentGoogleUser?.id]);

  useEffect(() => {
    // Calculate BMR
    let calculatedBmr = 0;
    if (userProfile.gender === 'male') {
      calculatedBmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5;
    } else {
      calculatedBmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) - 161;
    }
    // Calculate Actual TDEE
    const act = Number(userProfile.activityLevel) || 1.2;
    const calculatedTdee = Math.round(calculatedBmr * act);
    
    // Check if custom macros exist from Account tab and calculate their calorie sum
    const macroCalories = userProfile.customMacros
      ? Math.round((userProfile.customMacros.protein * 4) + (userProfile.customMacros.carbs * 4) + (userProfile.customMacros.fat * 9))
      : undefined;

    // Daily target goal優先: targetCalories -> macro sum -> calculatedTdee
    const targetToSet = userProfile.targetCalories ?? (macroCalories && macroCalories > 500 ? macroCalories : (userProfile.customTdee ?? calculatedTdee));
    setDailyGoal(targetToSet);
  }, [userProfile]);

  const saveProfile = (newProfile: UserProfile, notifyUser = false) => {
    setUserProfile(newProfile);
    const profileKey = getScopedStorageKey('kalguru_profile', currentGoogleUser?.id);
    try {
      localStorage.setItem(profileKey, JSON.stringify(newProfile));
      localStorage.setItem('kalguru_profile', JSON.stringify(newProfile));
    } catch (e) {}

    if (notifyUser) {
      showToast('💾 บันทึกและซิงค์ข้อมูลสรีระเรียบร้อย!');
    }

    // Auto-sync to Cloud in background if logged in
    if (currentGoogleUser) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentGoogleUser.id,
          email: currentGoogleUser.email,
          history: history,
          profile: newProfile,
          lastUpdated: Date.now()
        })
      }).then(() => {
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date());
      }).catch(err => {
        console.warn('[GooKal] Background profile sync failed:', err);
      });
    }
  };

  const getSuggestedMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    return 'dinner';
  };

  const deleteHistoryItem = (id: string, foodName?: string) => {
    if (!id) return;

    // 1. Add to tombstone set immediately
    addDeletedMealId(id, currentGoogleUser?.id);

    // 2. Functional state update prevents any stale closures
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item && item.id !== id);
      persistHistorySafely(newHistory, [id]);
      return newHistory;
    });

    playSuccessChime();
    triggerHaptic(20);
    showToast(foodName ? `🗑️ ลบ "${foodName}" เรียบร้อยแล้ว` : '🗑️ ลบรายการอาหารเรียบร้อยแล้ว');
  };

  const handleResetAllData = () => {
    if (window.confirm('คุณต้องการลบข้อมูลทั้งหมดในแอปใช่หรือไม่?\n(การกระทำนี้ไม่สามารถย้อนกลับได้)')) {
      const historyKey = getScopedStorageKey('kalguru_history_v2', currentGoogleUser?.id);
      const profileKey = getScopedStorageKey('kalguru_profile', currentGoogleUser?.id);
      const delKey = getScopedStorageKey('kalguru_deleted_meals_v1', currentGoogleUser?.id);
      localStorage.removeItem(historyKey);
      localStorage.removeItem(profileKey);
      localStorage.removeItem(delKey);
      if (!currentGoogleUser) {
        localStorage.removeItem('kalguru_history_v2');
        localStorage.removeItem('kalguru_profile');
        localStorage.removeItem('kalguru_deleted_meals_v1');
      }
      setHistory([]);
      setUserProfile({
        weight: 60,
        height: 165,
        age: 30,
        gender: 'female',
        activityLevel: 1.55,
      });
      window.location.reload();
    }
  };

  const handleSpeakAnalysisResult = () => {
    if (!result) return;
    if (isSpeakingResult) {
      stopSpeaking();
      setIsSpeakingResult(false);
      return;
    }
    const mult = portionMultiplier || 1.0;
    const p = Math.round(result.proteinGrams * mult * 10) / 10;
    const c = Math.round(result.carbsGrams * mult * 10) / 10;
    const f = Math.round(result.fatGrams * mult * 10) / 10;
    const cals = Math.round((p * 4) + (c * 4) + (f * 9));
    const speechText = `เมนู ${result.foodName} พลังงานรวม ${cals} กิโลแคลอรี โปรตีน ${p} กรัม คาร์โบไฮเดรต ${c} กรัม ไขมัน ${f} กรัม ${result.explanation ? 'ข้อแนะนำ ' + result.explanation : ''}`;
    
    setIsSpeakingResult(true);
    speakThai(speechText, () => {
      setIsSpeakingResult(false);
    });
  };

  const handleCopyMealsFromYesterday = (mealsToCopy: HistoryItem[]) => {
    const newItems: HistoryItem[] = mealsToCopy.map(m => ({
      ...m,
      id: `copy-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      date: selectedDate.getTime(),
    }));
    const newHistory = [...newItems, ...history];
    updateAndPersistHistory(newHistory);
  };

  const saveToHistory = () => {
    if (!result) return;
    
    const mult = portionMultiplier || 1.0;
    const p = Math.round(result.proteinGrams * mult * 10) / 10;
    const c = Math.round(result.carbsGrams * mult * 10) / 10;
    const f = Math.round(result.fatGrams * mult * 10) / 10;
    const exactCal = Math.round((p * 4) + (c * 4) + (f * 9));
    
    const finalResult = {
      ...result,
      calories: exactCal,
      proteinGrams: p,
      carbsGrams: c,
      fatGrams: f,
      sugarGrams: result.sugarGrams !== undefined ? Math.round(Math.min(result.sugarGrams * mult, c) * 10) / 10 : undefined,
      sodiumMg: result.sodiumMg !== undefined ? Math.round(result.sodiumMg * mult) : undefined,
    };

    const newItem: HistoryItem = {
      ...finalResult,
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: selectedDate.getTime(),
      image: image || '',
      mealType: selectedMeal
    };
    
    const newHistory = [newItem, ...history];
    updateAndPersistHistory(newHistory);
    
    playSuccessChime();
    triggerHaptic([30, 50]);
    stopSpeaking();
    showToast(`✨ บันทึกเมนู "${finalResult.foodName}" (${finalResult.calories} kcal) เรียบร้อย!`);
    resetApp();
    setActiveTab('history');
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 640;
          const MAX_HEIGHT = 640;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const compressedBase64 = await compressImage(file);
      setImage(compressedBase64);
      analyzeImage(compressedBase64);
    } catch (err) {
      setError('ไม่สามารถประมวลผลรูปภาพได้');
      setLoading(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const [textInput, setTextInput] = useState('');
  const [isMainVoiceListening, setIsMainVoiceListening] = useState(false);
  const mainVoiceRecognizerRef = useRef<ThaiVoiceRecognizer | null>(null);

  // Initialize main voice recognizer
  useEffect(() => {
    mainVoiceRecognizerRef.current = new ThaiVoiceRecognizer({
      lang: 'th-TH',
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsMainVoiceListening(true);
      },
      onTranscriptChange: (text: string) => {
        if (text) {
          setTextInput(text);
        }
      },
      onError: (err: string) => {
        setIsMainVoiceListening(false);
        showToast(`🎙️ ${err}`);
      },
      onEnd: () => {
        setIsMainVoiceListening(false);
      }
    });

    return () => {
      mainVoiceRecognizerRef.current?.abort();
    };
  }, []);

  const toggleMainVoiceRecognition = () => {
    if (!mainVoiceRecognizerRef.current?.isSupported()) {
      showToast('⚠️ เบราว์เซอร์ไม่รองรับ Web Speech API คุณสามารถพิมพ์ชื่ออาหารแทนได้');
      setTextInput('ข้าวกะเพราไก่ไข่ดาว ไม่ใส่น้ำตาล 1 จาน');
      return;
    }

    if (isMainVoiceListening) {
      mainVoiceRecognizerRef.current.stop();
      setIsMainVoiceListening(false);
    } else {
      setTextInput('');
      const started = mainVoiceRecognizerRef.current.start();
      if (!started) {
        showToast('⚠️ ไม่สามารถเปิดไมโครโฟนได้ กรุณาตรวจสอบสิทธิ์การใช้งาน');
      } else {
        showToast('🎙️ กำลังฟังเสียง... พูดชื่ออาหารได้เลย');
      }
    }
  };

  const analyzeImage = async (base64Data: string) => {
    if (!navigator.onLine) {
      setError('คุณกำลังอยู่ในโหมดออฟไลน์ การวิเคราะห์รูปภาพด้วย AI จำเป็นต้องเชื่อมต่ออินเทอร์เน็ต แต่คุณยังดูประวัติและแดชบอร์ดได้ตามปกติ');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedMeal(getSuggestedMealType());

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'การวิเคราะห์ผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดบางอย่าง');
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async () => {
    const query = textInput.trim();
    if (!query) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    setImage(null);
    setSelectedMeal(getSuggestedMealType());

    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, textQuery: query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'การวิเคราะห์ผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setTextInput('');
      playSuccessChime();
      triggerHaptic([30, 20, 30]);
    } catch (err: any) {
      console.warn('AI analysis fallback triggered:', err);
      // Fail-safe client side estimation if server is unreachable
      const lower = query.toLowerCase();
      
      // Detailed matching for accurate fallback
      let matchedCal = 500;
      let p = 22, c = 60, f = 18, s = 4, sod = 850;
      let matchedName = query;

      if (lower.includes('ส้มโอ')) {
        const pieceMatch = lower.match(/(\d+)\s*กลีบ/);
        const pieces = pieceMatch ? parseInt(pieceMatch[1], 10) : 2;
        matchedCal = 30 * pieces;
        p = 0.5 * pieces; c = 7 * pieces; f = 0; s = 5 * pieces; sod = 1 * pieces;
        matchedName = `ส้มโอ ${pieces} กลีบ`;
      } else if (lower.includes('กล้วยหอม')) {
        const countMatch = lower.match(/(\d+)\s*(ลูก|ผล)/);
        const count = countMatch ? parseInt(countMatch[1], 10) : 1;
        matchedCal = 105 * count; p = 1.3 * count; c = 27 * count; f = 0.3 * count; s = 14 * count; sod = 1 * count;
      } else if (lower.includes('กล้วยน้ำว้า')) {
        matchedCal = 60; p = 0.8; c = 15; f = 0.1; s = 9; sod = 1;
      } else if (lower.includes('แอปเปิ้ล')) {
        matchedCal = 85; p = 0.5; c = 21; f = 0.3; s = 16; sod = 2;
      } else if (lower.includes('กะเพราหมูกรอบ')) {
        matchedCal = 730; p = 20; c = 65; f = 42; s = 4; sod = 1060;
        matchedName = 'ข้าวกะเพราหมูกรอบ';
      } else if (lower.includes('กะเพราหมู')) {
        matchedCal = 580; p = 24; c = 65; f = 24; s = 4; sod = 960;
        matchedName = 'ข้าวกะเพราหมูสับ';
      } else if (lower.includes('กะเพราไก่')) {
        matchedCal = 520; p = 26; c = 65; f = 17; s = 4; sod = 900;
        matchedName = 'ข้าวกะเพราไก่';
      } else if (lower.includes('ข้าวมันไก่ทอด')) {
        matchedCal = 710; p = 20; c = 74; f = 36; s = 4; sod = 980;
        matchedName = 'ข้าวมันไก่ทอด';
      } else if (lower.includes('ข้าวมันไก่')) {
        matchedCal = 590; p = 24; c = 68; f = 23; s = 2; sod = 890;
        matchedName = 'ข้าวมันไก่ต้ม';
      } else if (lower.includes('ข้าวขาหมู')) {
        matchedCal = 690; p = 24; c = 65; f = 36; s = 10; sod = 1150;
        matchedName = 'ข้าวขาหมู';
      } else if (lower.includes('ข้าวหมูแดง')) {
        matchedCal = 540; p = 20; c = 75; f = 16; s = 14; sod = 890;
        matchedName = 'ข้าวหมูแดง';
      } else if (lower.includes('ผัดไทย')) {
        matchedCal = 590; p = 22; c = 70; f = 24; s = 16; sod = 1190;
        matchedName = 'ผัดไทย';
      } else if (lower.includes('ผัดซีอิ๊ว')) {
        matchedCal = 630; p = 24; c = 62; f = 30; s = 8; sod = 1140;
        matchedName = 'ผัดซีอิ๊ว';
      } else if (lower.includes('ส้มตำ')) {
        matchedCal = 120; p = 4; c = 26; f = 1; s = 14; sod = 980;
        matchedName = 'ส้มตำไทย';
      } else if (lower.includes('อกไก่')) {
        matchedCal = 140; p = 28; c = 1; f = 3; s = 0; sod = 120;
        matchedName = 'อกไก่ต้ม';
      } else if (lower.includes('สลัด')) {
        matchedCal = 220; p = 20; c = 14; f = 8; s = 4; sod = 400;
        matchedName = 'สลัดอกไก่';
      } else if (lower.includes('ก๋วยเตี๋ยว') || lower.includes('บะหมี่')) {
        matchedCal = 420; p = 20; c = 55; f = 12; s = 6; sod = 1500;
        matchedName = 'ก๋วยเตี๋ยวน้ำ';
      } else if (lower.includes('อเมริกาโน่') || lower.includes('กาแฟดำ')) {
        matchedCal = 15; p = 1; c = 2; f = 0; s = 0; sod = 10;
        matchedName = 'อเมริกาโน่เย็นไม่หวาน';
      } else if (lower.includes('ชาไทย') || lower.includes('ชานม')) {
        matchedCal = 280; p = 4; c = 45; f = 9; s = 34; sod = 90;
        matchedName = 'ชาไทยเย็น';
      }

      // Quantity multiplier
      const amountMatch = query.match(/(\d+(?:\.\d+)?)\s*(จาน|ชาม|ถ้วย|แก้ว|กล่อง|ห่อ|ชิ้น|ฟอง|ลูก|เสิร์ฟ)/i);
      if (amountMatch) {
        const num = parseFloat(amountMatch[1]);
        if (num > 0 && num <= 20) {
          matchedCal = Math.round(matchedCal * num);
          p = Math.round(p * num);
          c = Math.round(c * num);
          f = Math.round(f * num);
          s = Math.round(s * num);
          sod = Math.round(sod * num);
        }
      }

      if (lower.includes('ไข่ดาว') && !matchedName.includes('ไข่ดาว')) {
        p += 6.3; c += 0.6; f += 11.5; sod += 140;
      }
      if (lower.includes('ไข่ต้ม') && !matchedName.includes('ไข่ต้ม')) {
        p += 6.3; c += 0.6; f += 5.3; sod += 65;
      }

      const finalP = Math.round(p * 10) / 10;
      const finalC = Math.round(c * 10) / 10;
      const finalF = Math.round(f * 10) / 10;
      const exactCal = Math.round((finalP * 4) + (finalC * 4) + (finalF * 9));

      setResult({
        foodName: matchedName,
        calories: exactCal,
        proteinGrams: finalP,
        carbsGrams: finalC,
        fatGrams: finalF,
        sugarGrams: Math.round(Math.min(s, finalC) * 10) / 10,
        sodiumMg: Math.round(sod),
        explanation: 'ประเมินคุณค่าทางโภชนาการตามมาตรฐานฐานข้อมูลอาหารไทย (Thai Food Composition)'
      });
      setTextInput('');
    } finally {
      setLoading(false);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const resetApp = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setTextInput('');
    setPortionMultiplier(1.0);
    stopSpeaking();
    setIsSpeakingResult(false);
  };

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const getLocalISODate = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const displayDate = selectedDate;
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const [chartTimeframe, setChartTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  const weeklyData = past7Days.map(date => {
    const dayHistory = (history || []).filter(item => isSameDay(new Date(item.date), date));
    const calories = dayHistory.reduce((sum, item) => sum + (item?.calories || 0), 0);
    const fatGrams = dayHistory.reduce((sum, item) => sum + (item?.fatGrams || 0), 0);
    const proteinGrams = dayHistory.reduce((sum, item) => sum + (item?.proteinGrams || 0), 0);
    const carbsGrams = dayHistory.reduce((sum, item) => sum + (item?.carbsGrams || 0), 0);
    
    return {
      name: date?.toLocaleDateString('th-TH', { weekday: 'short' }).replace('.', ''),
      calories,
      fatCals: fatGrams * 9,
      proteinCals: proteinGrams * 4,
      carbsCals: carbsGrams * 4,
      proteinGrams: proteinGrams,
      fullDate: date,
    };
  });

  const monthlyData = Array.from({ length: 4 }).map((_, i) => {
    const dEnd = new Date();
    dEnd.setDate(dEnd.getDate() - (3 - i) * 7);
    const dStart = new Date(dEnd);
    dStart.setDate(dStart.getDate() - 6);
    
    const weekHistory = (history || []).filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0,0,0,0);
      const start = new Date(dStart); start.setHours(0,0,0,0);
      const end = new Date(dEnd); end.setHours(23,59,59,999);
      return itemDate >= start && itemDate <= end;
    });
    
    const calories = weekHistory.reduce((sum, item) => sum + (item?.calories || 0), 0);
    const fatGrams = weekHistory.reduce((sum, item) => sum + (item?.fatGrams || 0), 0);
    const proteinGrams = weekHistory.reduce((sum, item) => sum + (item?.proteinGrams || 0), 0);
    const carbsGrams = weekHistory.reduce((sum, item) => sum + (item?.carbsGrams || 0), 0);
    
    return {
      name: `สัปดาห์ ${i + 1}`,
      calories: Math.round(calories / 7),
      fatCals: Math.round((fatGrams * 9) / 7),
      proteinCals: Math.round((proteinGrams * 4) / 7),
      carbsCals: Math.round((carbsGrams * 4) / 7),
      proteinGrams: Math.round(proteinGrams / 7),
      fullDate: dStart,
    };
  });

  const displayHistory = (history || []).filter(item => isSameDay(new Date(item.date), displayDate));
  const totalCaloriesDisplay = displayHistory.reduce((sum, item) => sum + (item.calories || 0), 0);
  const safeDailyGoal = dailyGoal > 0 ? dailyGoal : 2000;
  const caloriesLeft = Math.max(0, safeDailyGoal - totalCaloriesDisplay);
  const progressPercent = safeDailyGoal > 0 ? (totalCaloriesDisplay / safeDailyGoal) * 100 : 0;

  const mealLabels = {
    breakfast: { label: 'มื้อเช้า', icon: Sunrise },
    lunch: { label: 'มื้อกลางวัน', icon: Sun },
    dinner: { label: 'มื้อเย็น', icon: Moon }
  };

  const totalProtein = displayHistory.reduce((sum, item) => sum + (item.proteinGrams || 0), 0);
  const totalCarbs = displayHistory.reduce((sum, item) => sum + (item.carbsGrams || 0), 0);
  const totalFat = displayHistory.reduce((sum, item) => sum + (item.fatGrams || 0), 0);
  const totalSugar = displayHistory.reduce((sum, item) => sum + (item.sugarGrams || 0), 0);
  const totalSodium = displayHistory.reduce((sum, item) => sum + (item.sodiumMg || 0), 0);
  const macroData = [
    { name: 'โปรตีน', value: totalProtein, color: '#3b82f6' },
    { name: 'คาร์บ', value: totalCarbs, color: '#f59e0b' },
    { name: 'ไขมัน', value: totalFat, color: '#ef4444' },
  ];

  const userWeight = Number(userProfile.weight) || 65;
  const userHeight = Number(userProfile.height) || 170;
  const userAge = Number(userProfile.age) || 25;
  const rawBmi = userHeight > 0 ? (userWeight / Math.pow(userHeight / 100, 2)) : 22;
  const bmi = isNaN(rawBmi) ? "22.0" : rawBmi.toFixed(1);

  const getBmiStatus = (bmiValue: number) => {
    const val = isNaN(bmiValue) ? 22 : bmiValue;
    if (val < 18.5) return { text: 'น้ำหนักน้อย', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (val < 23) return { text: 'น้ำหนักเหมาะสม', color: 'text-green-600', bg: 'bg-green-50' };
    if (val < 25) return { text: 'ท้วม', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (val < 30) return { text: 'อ้วน', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'อ้วนมาก', color: 'text-red-600', bg: 'bg-red-50' };
  };
  const bmiStatus = getBmiStatus(parseFloat(bmi));

  const calculatedBmr = userProfile.gender === 'male' 
    ? Math.round((10 * userWeight) + (6.25 * userHeight) - (5 * userAge) + 5)
    : Math.round((10 * userWeight) + (6.25 * userHeight) - (5 * userAge) - 161);
  const bmr = userProfile.customBmr ?? (isNaN(calculatedBmr) || calculatedBmr <= 0 ? 1500 : calculatedBmr);
    
  const actLevel = Number(userProfile.activityLevel) || 1.2;
  const calculatedTdee = Math.round(bmr * actLevel);
  const tdee = userProfile.customTdee ?? (isNaN(calculatedTdee) || calculatedTdee <= 0 ? 2000 : calculatedTdee);

  const carbsGoal = Math.max(1, userProfile.customMacros?.carbs ?? Math.round((safeDailyGoal * 0.5) / 4));
  const proteinGoal = Math.max(1, userProfile.customMacros?.protein ?? Math.round((safeDailyGoal * 0.3) / 4));
  const fatGoal = Math.max(1, userProfile.customMacros?.fat ?? Math.round((safeDailyGoal * 0.2) / 9));
  const sugarGoal = Math.max(1, userProfile.customMacros?.sugar ?? 24);
  const sodiumGoal = Math.max(1, userProfile.customMacros?.sodium ?? 2000);
  const [showMacroEditor, setShowMacroEditor] = useState(false);
  const [editingMacros, setEditingMacros] = useState<{carbs: string | number, protein: string | number, fat: string | number, sugar: string | number, sodium: string | number}>({ carbs: carbsGoal, protein: proteinGoal, fat: fatGoal, sugar: sugarGoal, sodium: sodiumGoal });

  // Update editingMacros when opening editor if they changed
  useEffect(() => {
    if (showMacroEditor) {
      setEditingMacros({ carbs: carbsGoal, protein: proteinGoal, fat: fatGoal, sugar: sugarGoal, sodium: sodiumGoal });
    }
  }, [showMacroEditor, carbsGoal, proteinGoal, fatGoal, sugarGoal, sodiumGoal]);

  const handleSaveMacros = () => {
    const p = Number(editingMacros.protein) || 0;
    const c = Number(editingMacros.carbs) || 0;
    const f = Number(editingMacros.fat) || 0;
    const calculatedTarget = Math.round((p * 4) + (c * 4) + (f * 9));

    const updated: UserProfile = {
      ...userProfile,
      targetCalories: calculatedTarget > 500 ? calculatedTarget : userProfile.targetCalories,
      customMacros: {
        carbs: c,
        protein: p,
        fat: f,
        sugar: Number(editingMacros.sugar) || 0,
        sodium: Number(editingMacros.sodium) || 0
      }
    };
    saveProfile(updated);
    if (calculatedTarget > 500) {
      setDailyGoal(calculatedTarget);
    }
    setShowMacroEditor(false);
    showToast(`🥗 บันทึกเป้าหมายสารอาหารเรียบร้อย (เป้าหมายแคลอรีสัมพันธ์กัน ${calculatedTarget.toLocaleString()} kcal)`);
  };
  
  const handleResetMacros = () => {
    const { customMacros, ...restProfile } = userProfile;
    saveProfile(restProfile);
    setShowMacroEditor(false);
  };

  const [showInsightsExportModal, setShowInsightsExportModal] = useState(false);
  const [insightsExportInitialSection, setInsightsExportInitialSection] = useState<'all' | 'calories' | 'macros' | 'protein'>('all');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderSettings, setReminderSettings] = useState(loadReminderSettings);
  const [activeInAppReminder, setActiveInAppReminder] = useState<MealReminderConfig | null>(null);

  // Extended 20 Features Modal & View States
  const [showFastingModal, setShowFastingModal] = useState<boolean>(false);
  const [showWaterModal, setShowWaterModal] = useState<boolean>(false);
  const [showBodyTrackerModal, setShowBodyTrackerModal] = useState<boolean>(false);
  const [showCustomMealsModal, setShowCustomMealsModal] = useState<boolean>(false);
  const [showCalorieGoalsModal, setShowCalorieGoalsModal] = useState<boolean>(false);
  const [showNutritionLabelModal, setShowNutritionLabelModal] = useState<boolean>(false);
  const [showQuickFoodAddModal, setShowQuickFoodAddModal] = useState<boolean>(false);
  const [showGroceryModal, setShowGroceryModal] = useState<boolean>(false);
  const [showMealSwapsModal, setShowMealSwapsModal] = useState<boolean>(false);
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);
  const [showDailyMoodModal, setShowDailyMoodModal] = useState<boolean>(false);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState<boolean>(false);
  const [showClinicalReportModal, setShowClinicalReportModal] = useState<boolean>(false);
  const [showGoogleSearchModal, setShowGoogleSearchModal] = useState<boolean>(false);
  const [googleSearchDefaultCategory, setGoogleSearchDefaultCategory] = useState<string>('all');

  // 20 AI Innovation Modules State
  const [showGlucoseModal, setShowGlucoseModal] = useState<boolean>(false);
  const [showDiningMenuModal, setShowDiningMenuModal] = useState<boolean>(false);
  const [showExerciseBurnModal, setShowExerciseBurnModal] = useState<boolean>(false);
  const [showChronoNutritionModal, setShowChronoNutritionModal] = useState<boolean>(false);
  const [showLongevityModal, setShowLongevityModal] = useState<boolean>(false);
  const [showCookingAvatarModal, setShowCookingAvatarModal] = useState<boolean>(false);
  const [showMicrobiomeModal, setShowMicrobiomeModal] = useState<boolean>(false);
  const [showFastingStagesModal, setShowFastingStagesModal] = useState<boolean>(false);
  const [showFridgeManagerModal, setShowFridgeManagerModal] = useState<boolean>(false);
  const [showSmartPantryModal, setShowSmartPantryModal] = useState<boolean>(false);
  const [showHealthyPlateModal, setShowHealthyPlateModal] = useState<boolean>(false);
  const [showMetabolicHeatmapModal, setShowMetabolicHeatmapModal] = useState<boolean>(false);
  const [showAllergySafetyModal, setShowAllergySafetyModal] = useState<boolean>(false);
  const [showCheatMealModal, setShowCheatMealModal] = useState<boolean>(false);
  const [showSocialStoryModal, setShowSocialStoryModal] = useState<boolean>(false);
  const [showHabitStackModal, setShowHabitStackModal] = useState<boolean>(false);
  const [showHydrationOptimizerModal, setShowHydrationOptimizerModal] = useState<boolean>(false);
  const [showCravingSOSModal, setShowCravingSOSModal] = useState<boolean>(false);
  const [showBiomarkerSyncModal, setShowBiomarkerSyncModal] = useState<boolean>(false);
  const [showCaffeineDecayModal, setShowCaffeineDecayModal] = useState<boolean>(false);
  const [showStreetFoodModal, setShowStreetFoodModal] = useState<boolean>(false);
  const [showMetabolicAgeModal, setShowMetabolicAgeModal] = useState<boolean>(false);
  const [showWeeklyMealPlannerModal, setShowWeeklyMealPlannerModal] = useState<boolean>(false);
  const [showSmartBarcodeModal, setShowSmartBarcodeModal] = useState<boolean>(false);
  const [showMicronutrientModal, setShowMicronutrientModal] = useState<boolean>(false);
  const [showPostMealWalkModal, setShowPostMealWalkModal] = useState<boolean>(false);
  const [showVisualPhotoModal, setShowVisualPhotoModal] = useState<boolean>(false);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState<boolean>(false);

  // Innovation Hub category filter
  const [innovationCategory, setInnovationCategory] = useState<'all' | 'metabolic' | 'kitchen' | 'recovery' | 'habits'>('all');
  const [isInnovationHubOpen, setIsInnovationHubOpen] = useState<boolean>(true);

  // Active cooking recipe state
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<any>(undefined);
  const [pantryCookIngredients, setPantryCookIngredients] = useState<string[]>([]);
  const [recipeSearchIngredients, setRecipeSearchIngredients] = useState<string[]>([]);
  const [dashboardInventory, setDashboardInventory] = useState<InventoryItem[]>(() => loadInventory());
  const [isPantryRecipeSpotlightOpen, setIsPantryRecipeSpotlightOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kalguru_pantry_spotlight_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  // Listen for inventory updates across the app for Dashboard Spotlight Card
  useEffect(() => {
    const handleInvUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setDashboardInventory(e.detail);
      } else {
        setDashboardInventory(loadInventory());
      }
    };
    window.addEventListener('kalguru_inventory_updated', handleInvUpdate);
    return () => window.removeEventListener('kalguru_inventory_updated', handleInvUpdate);
  }, []);

  const handleOpenRecipeSearchWithIngredients = (ingredients?: string[]) => {
    if (ingredients && ingredients.length > 0) {
      setRecipeSearchIngredients(ingredients);
    }
    setActiveTab('recipes');
  };

  // Helper handlers for extended feature integration
  const handleLogCustomMeal = (meal: CustomMealItem) => {
    const newItem: HistoryItem = {
      id: `custom-meal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      foodName: meal.name,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
      sugarGrams: meal.sugarGrams,
      sodiumMg: meal.sodiumMg,
      date: selectedDate.getTime(),
      image: '',
      mealType: selectedMeal,
      explanation: `บันทึกจากคลังเมนูโปรด (${meal.servingSize})`
    };
    const newHistory = [newItem, ...history];
    updateAndPersistHistory(newHistory);
    showToast(`🍽️ บันทึกเมนูโปรด "${meal.name}" (${meal.calories} kcal) เรียบร้อย!`);
    setShowCustomMealsModal(false);
  };

  const handleSelectFoodFromDatabase = (food: OfflineFoodDatabaseItem) => {
    const newItem: HistoryItem = {
      id: `quick-db-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      foodName: food.name,
      calories: food.calories,
      proteinGrams: food.protein,
      carbsGrams: food.carbs,
      fatGrams: food.fat,
      sugarGrams: food.sugar,
      sodiumMg: food.sodium,
      date: selectedDate.getTime(),
      image: '',
      mealType: selectedMeal,
      explanation: `บันทึกด่วนจากฐานข้อมูลอาหาร (${food.portion})`
    };
    const newHistory = [newItem, ...history];
    updateAndPersistHistory(newHistory);
    showToast(`⚡ บันทึก "${food.name}" (${food.calories} kcal) ลงใน ${selectedMeal === 'breakfast' ? 'มื้อเช้า' : selectedMeal === 'lunch' ? 'มื้อเที่ยง' : 'มื้อเย็น'} แล้ว!`);
    setShowQuickFoodAddModal(false);
    setShowMealSwapsModal(false);
  };

  const handleLogGroundedSearchMeal = (meal: {
    foodName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sugarGrams?: number;
    sodiumMg?: number;
    explanation: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }) => {
    const newItem: HistoryItem = {
      id: `grounded-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      foodName: meal.foodName,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
      sugarGrams: meal.sugarGrams || 0,
      sodiumMg: meal.sodiumMg || 0,
      date: selectedDate.getTime(),
      image: '',
      mealType: meal.mealType as MealType,
      explanation: meal.explanation
    };
    const newHistory = [newItem, ...history];
    updateAndPersistHistory(newHistory);
  };

  // Frequent Meals (Top 10 most eaten meals from history + smart Thai health staples fallback)
  interface FrequentMealItem {
    id: string;
    foodName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sugarGrams?: number;
    sodiumMg?: number;
    explanation: string;
    image?: string;
    frequencyCount: number;
    isFromHistory: boolean;
  }

  const frequentMeals: FrequentMealItem[] = useMemo(() => {
    const frequencyMap = new Map<string, { count: number; item: HistoryItem }>();
    
    (history || []).forEach(item => {
      if (!item?.foodName) return;
      const key = item.foodName.trim().toLowerCase();
      if (!frequencyMap.has(key)) {
        frequencyMap.set(key, { count: 1, item });
      } else {
        const current = frequencyMap.get(key)!;
        current.count += 1;
        current.item = item;
      }
    });

    const sortedFromHistory: FrequentMealItem[] = Array.from(frequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .map(entry => ({
        id: entry.item.id || `freq-${entry.item.foodName}`,
        foodName: entry.item.foodName,
        calories: entry.item.calories,
        proteinGrams: entry.item.proteinGrams,
        carbsGrams: entry.item.carbsGrams,
        fatGrams: entry.item.fatGrams,
        sugarGrams: entry.item.sugarGrams,
        sodiumMg: entry.item.sodiumMg,
        explanation: entry.item.explanation || `เมนูที่บันทึกทานบ่อยในประวัติส่วนตัว (${entry.count} ครั้ง)`,
        image: entry.item.image || '',
        frequencyCount: entry.count,
        isFromHistory: true,
      }));

    const defaultThaiStaples: Array<Omit<FrequentMealItem, 'id' | 'frequencyCount' | 'isFromHistory'>> = [
      { foodName: 'ข้าวกะเพราอกไก่ ไข่ดาว', calories: 480, proteinGrams: 36, carbsGrams: 52, fatGrams: 14, sugarGrams: 2, sodiumMg: 780, explanation: 'อาหารจานด่วนโปรตีนสูง คุมมัน เหมาะสำหรับการคุมน้ำหนัก' },
      { foodName: 'ข้าวมันไก่ต้มไม่เอาหนัง', calories: 490, proteinGrams: 30, carbsGrams: 66, fatGrams: 12, sugarGrams: 2, sodiumMg: 790, explanation: 'ข้าวมันไก่ต้มลีน ลดไขมันได้ดี โปรตีนคุณภาพสูง' },
      { foodName: 'ส้มตำไทย + อกไก่ย่าง', calories: 300, proteinGrams: 38, carbsGrams: 25, fatGrams: 6, sugarGrams: 12, sodiumMg: 1150, explanation: 'เมนูคลีนแซ่บ แคลอรี่ต่ำ อิ่มนาน โปรตีนแน่น' },
      { foodName: 'เกาเหลาหมูน้ำใส ผักรวม', calories: 220, proteinGrams: 25, carbsGrams: 8, fatGrams: 9, sugarGrams: 3, sodiumMg: 1250, explanation: 'เมนูโลว์คาร์บ อุดมด้วยโปรตีนและไฟเบอร์ผักสด' },
      { foodName: 'สุกี้น้ำรวมมิตร', calories: 320, proteinGrams: 24, carbsGrams: 32, fatGrams: 9, sugarGrams: 6, sodiumMg: 1100, explanation: 'สุกี้น้ำวุ้นเส้นผักรวม ซดคล่องคอ แคลอรี่ปานกลาง' },
      { foodName: 'สลัดอกไก่ย่าง น้ำสลัดใส', calories: 260, proteinGrams: 28, carbsGrams: 16, fatGrams: 8, sugarGrams: 5, sodiumMg: 420, explanation: 'สลัดผักไฮโดรโปนิกส์ อกไก่ย่างลีน โซเดียมต่ำ' },
      { foodName: 'อเมริกาโน่เย็น (ไม่หวาน)', calories: 15, proteinGrams: 1, carbsGrams: 2, fatGrams: 0, sugarGrams: 0, sodiumMg: 10, explanation: 'กาแฟดำ 0% Sugar ช่วยกระตุ้นระบบเผาผลาญ' },
      { foodName: 'ข้าวผัดกุ้ง', calories: 520, proteinGrams: 22, carbsGrams: 68, fatGrams: 17, sugarGrams: 3, sodiumMg: 950, explanation: 'ข้าวผัดกุ้งสดหอมกลิ่นกระทะ พลังงานสมดุล' },
      { foodName: 'เวย์โปรตีน 1 สกู๊ป', calories: 140, proteinGrams: 25, carbsGrams: 3, fatGrams: 2, sugarGrams: 1, sodiumMg: 140, explanation: 'เสริมโปรตีนดูดซึมไว ช่วยฟื้นฟูและสร้างกล้ามเนื้อ' },
      { foodName: 'ไข่ต้ม 2 ฟอง + กล้วยหอม', calories: 240, proteinGrams: 14, carbsGrams: 28, fatGrams: 10, sugarGrams: 14, sodiumMg: 140, explanation: 'ของว่างเพิ่มพลังงานก่อน/หลังออกกำลังกาย' },
    ];

    const resultList: FrequentMealItem[] = [...sortedFromHistory];
    for (const staple of defaultThaiStaples) {
      if (resultList.length >= 10) break;
      const isDuplicate = resultList.some(r => r.foodName.trim().toLowerCase() === staple.foodName.trim().toLowerCase());
      if (!isDuplicate) {
        resultList.push({
          id: `staple-${staple.foodName}`,
          ...staple,
          frequencyCount: 0,
          isFromHistory: false,
        });
      }
    }

    // Filter out meals deleted/hidden by user
    const filteredList = resultList.filter(item => !hiddenFrequentMealIds.includes(item.id) && !hiddenFrequentMealIds.includes(`freq-${item.foodName.trim().toLowerCase()}`) && !hiddenFrequentMealIds.includes(`staple-${item.foodName.trim().toLowerCase()}`) && !hiddenFrequentMealIds.includes(item.foodName.trim().toLowerCase()));

    return filteredList.slice(0, 10);
  }, [history, hiddenFrequentMealIds]);

  // Remove meal from frequent meals list (with undo/storage)
  const handleRemoveFrequentMeal = (meal: FrequentMealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const mealKey = meal.id || meal.foodName.trim().toLowerCase();
    const newHidden = Array.from(new Set([...hiddenFrequentMealIds, mealKey, meal.foodName.trim().toLowerCase()]));
    setHiddenFrequentMealIds(newHidden);
    try {
      localStorage.setItem('kalguru_hidden_frequent_meals', JSON.stringify(newHidden));
    } catch (err) {
      console.error(err);
    }
    triggerHaptic([25]);
    showToast(`🗑️ ลบ "${meal.foodName}" ออกจากเมนูที่ทานเป็นประจำแล้ว`);
  };

  // Restore all deleted frequent meals
  const handleRestoreFrequentMeals = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenFrequentMealIds([]);
    try {
      localStorage.removeItem('kalguru_hidden_frequent_meals');
    } catch (err) {
      console.error(err);
    }
    triggerHaptic([30, 20]);
    showToast('🔄 กู้คืนรายการอาหารที่ทานเป็นประจำทั้งหมดเรียบร้อยแล้ว');
  };

  // Load frequent meal data directly into Result Review mode without AI API call
  const handleSelectFrequentMeal = (meal: FrequentMealItem) => {
    setResult({
      foodName: meal.foodName,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
      sugarGrams: meal.sugarGrams,
      sodiumMg: meal.sodiumMg,
      explanation: meal.explanation || (meal.isFromHistory ? `เมนูจากประวัติที่คุณทานเป็นประจำ (ทานแล้ว ${meal.frequencyCount} ครั้ง)` : 'เมนูยอดนิยมเพื่อสุขภาพ')
    });
    setImage(meal.image || null);
    setSelectedMeal(getSuggestedMealType());
    setPortionMultiplier(1.0);
    playSuccessChime();
    triggerHaptic([30, 20]);
    showToast(`⚡ โหลดข้อมูล "${meal.foodName}" (${meal.calories} kcal) สำเร็จ พร้อมบันทึกทันทีไม่ต้องรอ AI`);
  };

  // 1-Tap Quick Save frequent meal directly to today's history log
  const handleDirectLogFrequentMeal = (meal: FrequentMealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const suggestedMeal = getSuggestedMealType();
    const newItem: HistoryItem = {
      id: `freq-log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      foodName: meal.foodName,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
      sugarGrams: meal.sugarGrams,
      sodiumMg: meal.sodiumMg,
      date: selectedDate.getTime(),
      image: meal.image || '',
      mealType: suggestedMeal,
      explanation: meal.explanation || (meal.isFromHistory ? `บันทึกด่วนจากเมนูที่ทานเป็นประจำ (${meal.frequencyCount} ครั้ง)` : 'บันทึกด่วนจากเมนูยอดนิยม')
    };

    const newHistory = [newItem, ...history];
    updateAndPersistHistory(newHistory);
    playSuccessChime();
    triggerHaptic([40, 30, 40]);
    const mealNameLabel = suggestedMeal === 'breakfast' ? 'มื้อเช้า' : suggestedMeal === 'lunch' ? 'มื้อกลางวัน' : 'มื้อเย็น';
    showToast(`⚡ บันทึก "${meal.foodName}" (${meal.calories} kcal) ลงใน${mealNameLabel} เรียบร้อย!`);
    setActiveTab('history');
  };

  const handleLogScannedNutritionLabel = (mealData: {
    foodName: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sugarGrams?: number;
    sodiumMg?: number;
    explanation: string;
  }) => {
    const newItem: HistoryItem = {
      id: `label-scan-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      foodName: mealData.foodName,
      calories: mealData.calories,
      proteinGrams: mealData.proteinGrams,
      carbsGrams: mealData.carbsGrams,
      fatGrams: mealData.fatGrams,
      sugarGrams: mealData.sugarGrams,
      sodiumMg: mealData.sodiumMg,
      date: selectedDate.getTime(),
      image: '',
      mealType: selectedMeal,
      explanation: mealData.explanation || 'สแกนจากฉลากโภชนาการด้วย AI'
    };
    const newHistory = [newItem, ...history];
    updateAndPersistHistory(newHistory);
    showToast(`🏷️ บันทึกข้อมูลโภชนาการ "${mealData.foodName}" (${mealData.calories} kcal) เรียบร้อย!`);
    setShowNutritionLabelModal(false);
  };

  const handleSaveCalorieGoals = (targetGoal: number, customMacros?: { carbs: number; protein: number; fat: number; sugar?: number; sodium?: number }) => {
    const updated: UserProfile = {
      ...userProfile,
      targetCalories: targetGoal,
      customMacros: customMacros ? {
        carbs: customMacros.carbs,
        protein: customMacros.protein,
        fat: customMacros.fat,
        sugar: customMacros.sugar ?? userProfile.customMacros?.sugar ?? 24,
        sodium: customMacros.sodium ?? userProfile.customMacros?.sodium ?? 2000
      } : userProfile.customMacros
    };
    saveProfile(updated);
    setDailyGoal(targetGoal);
    showToast(`🎯 บันทึกเป้าหมายแคลอรีใหม่ (${targetGoal.toLocaleString()} kcal/วัน) เรียบร้อย!`);
  };

  const handleUpdateWeight = (newWeight: number) => {
    const updated = { ...userProfile, weight: newWeight };
    saveProfile(updated);
    showToast(`⚖️ บันทึกน้ำหนักปัจจุบัน ${newWeight} kg เรียบร้อย!`);
  };

  const handleVoiceMealInput = async (mealText: string) => {
    if (!mealText || !mealText.trim()) return;
    try {
      setLoading(true);
      showToast(`🎙️ กำลังวิเคราะห์ข้อความเสียง "${mealText.trim()}" ด้วย AI...`);
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mealDescription: mealText.trim(),
          textQuery: mealText.trim()
        })
      });
      if (!response.ok) {
        throw new Error('ไม่สามารถวิเคราะห์เสียงได้');
      }
      const data = await response.json();
      if (data.foodName) {
        setResult(data);
        setImage(null);
        setSelectedMeal(getSuggestedMealType());
        setActiveTab('scan');
        playSuccessChime();
        triggerHaptic([40, 20, 40]);
        showToast(`✨ วิเคราะห์เสร็จสิ้น: ${data.foodName} (${data.calories} kcal)`);
      }
    } catch (err: any) {
      showToast(`⚠️ เกิดข้อผิดพลาด: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setLoading(false);
    }
  };

  // Background reminder scheduler loop (runs every 15 seconds for responsive timing)
  useEffect(() => {
    // Initial check
    checkAndTriggerScheduledReminders(history, (reminder) => {
      setActiveInAppReminder(reminder);
      showToast(`🔔 ถึงเวลาบันทึก "${reminder.label}" แล้ว! (${reminder.time} น.)`);
    });

    const interval = setInterval(() => {
      checkAndTriggerScheduledReminders(history, (reminder) => {
        setActiveInAppReminder(reminder);
        showToast(`🔔 ถึงเวลาบันทึก "${reminder.label}" แล้ว! (${reminder.time} น.)`);
      });
      setReminderSettings(loadReminderSettings());
    }, 15000);

    return () => clearInterval(interval);
  }, [history]);

  // Handle Service Worker notification click navigation and URL hash navigation
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TAB' && event.data.tab === 'scan') {
        setActiveTab('scan');
        if (event.data.mealType) {
          setSelectedMeal(event.data.mealType);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    const handleHash = () => {
      if (window.location.hash === '#scan') {
        setActiveTab('scan');
      }
    };

    window.addEventListener('hashchange', handleHash);
    if (window.location.hash === '#scan') {
      setActiveTab('scan');
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  // Global Keyboard Shortcuts (Escape to close modals, Alt+N for quick food, Alt+W for water, Alt+C for coach, Alt+F for fasting)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.key === 'Escape') {
        setShowFastingModal(false);
        setShowWaterModal(false);
        setShowBodyTrackerModal(false);
        setShowCustomMealsModal(false);
        setShowCalorieGoalsModal(false);
        setShowNutritionLabelModal(false);
        setShowQuickFoodAddModal(false);
        setShowGroceryModal(false);
        setShowMealSwapsModal(false);
        setShowStreakModal(false);
        setShowDailyMoodModal(false);
        setShowBackupRestoreModal(false);
        setShowClinicalReportModal(false);
        setShowGlucoseModal(false);
        setShowDiningMenuModal(false);
        setShowExerciseBurnModal(false);
        setShowChronoNutritionModal(false);
        setShowLongevityModal(false);
        setShowCookingAvatarModal(false);
        setShowMicrobiomeModal(false);
        setShowFastingStagesModal(false);
        setShowFridgeManagerModal(false);
        setShowSmartPantryModal(false);
        setShowHealthyPlateModal(false);
        setShowMetabolicHeatmapModal(false);
        setShowAllergySafetyModal(false);
        setShowCheatMealModal(false);
        setShowSocialStoryModal(false);
        setShowHabitStackModal(false);
        setShowHydrationOptimizerModal(false);
        setShowCravingSOSModal(false);
        setShowBiomarkerSyncModal(false);
        setShowCaffeineDecayModal(false);
        setShowStreetFoodModal(false);
        setShowMetabolicAgeModal(false);
        setShowWeeklyMealPlannerModal(false);
        setShowSmartBarcodeModal(false);
        setShowMicronutrientModal(false);
        setShowPostMealWalkModal(false);
        setShowVisualPhotoModal(false);
        setShowAccessibilityModal(false);
        return;
      }

      if (e.altKey && !isInputActive) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setShowQuickFoodAddModal(true);
        } else if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          setShowWaterModal(true);
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setActiveTab('coach');
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setShowFastingModal(true);
        } else if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setActiveTab('health');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const showToast = (message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Macro calorie distribution for insights and export
  const currentInsightDataset = chartTimeframe === 'weekly' ? weeklyData : monthlyData;
  const totalCarbsCals = currentInsightDataset.reduce((sum, item) => sum + (item.carbsCals || 0), 0);
  const totalProteinCals = currentInsightDataset.reduce((sum, item) => sum + (item.proteinCals || 0), 0);
  const totalFatCals = currentInsightDataset.reduce((sum, item) => sum + (item.fatCals || 0), 0);
  const totalMacroCals = totalCarbsCals + totalProteinCals + totalFatCals;

  const carbsPct = totalMacroCals > 0 ? Math.round((totalCarbsCals / totalMacroCals) * 100) : 0;
  const proteinPct = totalMacroCals > 0 ? Math.round((totalProteinCals / totalMacroCals) * 100) : 0;
  const fatPct = totalMacroCals > 0 ? Math.max(0, 100 - carbsPct - proteinPct) : 0;

  const macroDistributionData = [
    { name: 'คาร์โบไฮเดรต', label: 'คาร์บ', value: totalCarbsCals, percent: carbsPct, color: '#22C55E', icon: '🍞' },
    { name: 'โปรตีน', label: 'โปรตีน', value: totalProteinCals, percent: proteinPct, color: '#3B82F6', icon: '🥩' },
    { name: 'ไขมัน', label: 'ไขมัน', value: totalFatCals, percent: fatPct, color: '#FBBF24', icon: '🥑' },
  ];

  const insightsExportParams: ExportInsightsParams = {
    history,
    userProfile,
    bmr,
    tdee,
    dailyGoal,
    carbsGoal,
    proteinGoal,
    fatGoal,
    sugarGoal,
    sodiumGoal,
    weeklyData,
    monthlyData,
    chartTimeframe,
    macroDistributionData,
    totalMacroCals,
  };

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          appName: "GooKal",
          appVersion: "2.0",
          totalMealsRecorded: history.length,
        },
        userProfile: {
          ...userProfile,
          calculatedBmr: bmr,
          calculatedTdee: tdee,
          dailyCalorieGoal: dailyGoal,
        },
        nutritionalGoals: {
          calories: dailyGoal,
          carbsGrams: carbsGoal,
          proteinGrams: proteinGoal,
          fatGrams: fatGoal,
          sugarGrams: sugarGoal,
          sodiumMg: sodiumGoal,
        },
        history: history,
      };

      const jsonString = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `gookal-nutrition-data-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Account Page Data Import State & Handlers
  interface PendingImportData {
    fileName: string;
    fileSizeKb: number;
    meals: HistoryItem[];
    profile?: UserProfile;
    exportDate?: string;
    hasExtraData: boolean;
    rawPayload: any;
  }

  const accountImportFileRef = useRef<HTMLInputElement>(null);
  const [pendingImportData, setPendingImportData] = useState<PendingImportData | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const handleAccountImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('⚠️ กรุณาเลือกไฟล์นามสกุล .json เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
          throw new Error('โครงสร้างไฟล์ JSON ไม่ถูกต้อง');
        }

        // Extract history items from multiple known formats
        let extractedMeals: HistoryItem[] = [];
        if (Array.isArray(data)) {
          extractedMeals = data;
        } else if (Array.isArray(data.history)) {
          extractedMeals = data.history;
        } else if (Array.isArray(data.kalguru_history_v2)) {
          extractedMeals = data.kalguru_history_v2;
        }

        extractedMeals = extractedMeals.filter(m => m && (m.foodName || m.calories !== undefined));

        // Extract profile from known formats
        let extractedProfile: UserProfile | undefined = undefined;
        if (data.userProfile && typeof data.userProfile === 'object') {
          extractedProfile = data.userProfile;
        } else if (data.kalguru_profile && typeof data.kalguru_profile === 'object') {
          extractedProfile = data.kalguru_profile;
        }

        const hasExtraData = !!(
          data.kalguru_water_logs_v1 ||
          data.kalguru_fasting_history_v1 ||
          data.kalguru_weight_records_v1 ||
          data.kalguru_custom_meals_v1
        );

        if (extractedMeals.length === 0 && !extractedProfile && !hasExtraData) {
          showToast('⚠️ ไม่พบข้อมูลโภชนาการหรือประวัติอาหารในไฟล์นี้');
          return;
        }

        setPendingImportData({
          fileName: file.name,
          fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
          meals: extractedMeals,
          profile: extractedProfile,
          exportDate: data.exportDate || data.exportMetadata?.exportedAt,
          hasExtraData,
          rawPayload: data
        });
      } catch (err: any) {
        console.error('Failed to parse import JSON:', err);
        showToast('❌ ไม่สามารถอ่านไฟล์ JSON ได้ (ไฟล์อาจชำรุดหรือไม่ถูกต้อง)');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = (mode: 'merge' | 'replace') => {
    if (!pendingImportData) return;
    setIsProcessingImport(true);

    try {
      const { meals, profile, rawPayload } = pendingImportData;
      let finalHistory: HistoryItem[] = [];

      if (mode === 'merge') {
        const existingIds = new Set(history.map(h => h.id));
        const newUniqueMeals = meals.map(m => {
          if (existingIds.has(m.id)) {
            return { ...m, id: `${m.id}-imported-${Date.now()}-${Math.random().toString(36).substring(7)}` };
          }
          return m;
        });
        finalHistory = [...newUniqueMeals, ...history];
      } else {
        finalHistory = meals;
      }

      // Update and persist history (respects Google user scope!)
      updateAndPersistHistory(finalHistory);

      // If profile exists in import file, update and persist profile
      if (profile) {
        const mergedProfile = { ...userProfile, ...profile };
        saveProfile(mergedProfile);
      }

      // If full backup payload exists, restore extra data to localStorage
      if (rawPayload && typeof rawPayload === 'object') {
        if (rawPayload.kalguru_water_logs_v1) localStorage.setItem('kalguru_water_logs_v1', JSON.stringify(rawPayload.kalguru_water_logs_v1));
        if (rawPayload.kalguru_water_goal_v1) localStorage.setItem('kalguru_water_goal_v1', JSON.stringify(rawPayload.kalguru_water_goal_v1));
        if (rawPayload.kalguru_fasting_session_v1) localStorage.setItem('kalguru_fasting_session_v1', JSON.stringify(rawPayload.kalguru_fasting_session_v1));
        if (rawPayload.kalguru_fasting_history_v1) localStorage.setItem('kalguru_fasting_history_v1', JSON.stringify(rawPayload.kalguru_fasting_history_v1));
        if (rawPayload.kalguru_weight_records_v1) localStorage.setItem('kalguru_weight_records_v1', JSON.stringify(rawPayload.kalguru_weight_records_v1));
        if (rawPayload.kalguru_body_stats_v2) localStorage.setItem('kalguru_body_stats_v2', JSON.stringify(rawPayload.kalguru_body_stats_v2));
        if (rawPayload.kalguru_custom_meals_v1) localStorage.setItem('kalguru_custom_meals_v1', JSON.stringify(rawPayload.kalguru_custom_meals_v1));
        if (rawPayload.kalguru_daily_mood_logs_v1) localStorage.setItem('kalguru_daily_mood_logs_v1', JSON.stringify(rawPayload.kalguru_daily_mood_logs_v1));
        if (rawPayload.kalguru_reminder_settings_v1) localStorage.setItem('kalguru_reminder_settings_v1', JSON.stringify(rawPayload.kalguru_reminder_settings_v1));
        if (rawPayload.kalguru_food_pantry_v1) {
          localStorage.setItem('kalguru_food_pantry_v1', JSON.stringify(rawPayload.kalguru_food_pantry_v1));
          window.dispatchEvent(new CustomEvent('kalguru_inventory_updated', { detail: rawPayload.kalguru_food_pantry_v1 }));
        }
      }

      playSuccessChime();
      triggerHaptic([30, 50, 30]);

      const countMsg = mode === 'merge' 
        ? `ผสานรวมประวัติอาหารสำเร็จ (${meals.length} รายการ, รวมปัจจุบัน ${finalHistory.length} รายการ)`
        : `แทนที่และนำเข้าประวัติอาหาร ${meals.length} รายการเรียบร้อย`;

      showToast(`🎉 ${countMsg}!`);
      setPendingImportData(null);
    } catch (err) {
      console.error('Import execution error:', err);
      showToast('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลนำเข้า');
    } finally {
      setIsProcessingImport(false);
    }
  };

  const [showEnergyEditor, setShowEnergyEditor] = useState(false);
  const [editingEnergy, setEditingEnergy] = useState<{bmr: string | number, tdee: string | number, targetCalories: string | number}>({ bmr: bmr, tdee: tdee, targetCalories: safeDailyGoal });
  const [showDiaryMonthCalendar, setShowDiaryMonthCalendar] = useState(false);
  const [diaryCalendarMonth, setDiaryCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (showEnergyEditor) {
      setEditingEnergy({ bmr: bmr, tdee: tdee, targetCalories: safeDailyGoal });
    }
  }, [showEnergyEditor, bmr, tdee, safeDailyGoal]);

  const handleSaveEnergy = () => {
    const targetC = Number(editingEnergy.targetCalories) || undefined;
    saveProfile({
      ...userProfile,
      customBmr: Number(editingEnergy.bmr) || undefined,
      customTdee: Number(editingEnergy.tdee) || undefined,
      targetCalories: targetC
    });
    if (targetC) {
      setDailyGoal(targetC);
    }
    setShowEnergyEditor(false);
    showToast('⚡ บันทึกค่า BMR, TDEE เผาผลาญจริง และเป้าหมายแคลอรีเรียบร้อย!');
  };

  const handleResetEnergy = () => {
    const { customBmr, customTdee, targetCalories, ...restProfile } = userProfile;
    saveProfile(restProfile);
    setShowEnergyEditor(false);
    showToast('🔄 รีเซ็ตค่าพลังงานกลับเป็นค่ามาตรฐานจากการคำนวณแล้ว');
  };
  

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const dateKey = getLocalISODate(selectedDate);
    
    const checkExceeded = (name: string, current: number, limit: number) => {
      const toastKey = `${dateKey}-${name}`;
      if (current >= limit && !shownToasts.has(toastKey)) {
        const newToast = {
          id: toastKey,
          message: `⚠️ คุณรับประทาน${name}เกินเป้าหมายแล้ว! (${current.toLocaleString()} / ${limit.toLocaleString()})`
        };
        setToasts(prev => [...prev, newToast]);
        
        setShownToasts(prev => {
          const newSet = new Set(prev);
          newSet.add(toastKey);
          return newSet;
        });

        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastKey));
        }, 5000);
      }
    };

    checkExceeded('แคลอรี', totalCaloriesDisplay, safeDailyGoal);
    checkExceeded('คาร์บ', totalCarbs, carbsGoal);
    checkExceeded('โปรตีน', totalProtein, proteinGoal);
    checkExceeded('ไขมัน', totalFat, fatGoal);
    checkExceeded('น้ำตาล', totalSugar, sugarGoal);
    checkExceeded('โซเดียม', totalSodium, sodiumGoal);
  }, [activeTab, selectedDate, totalCaloriesDisplay, totalCarbs, totalProtein, totalFat, totalSugar, totalSodium, tdee, carbsGoal, proteinGoal, fatGoal, sugarGoal, sodiumGoal]);

  const [isHealthDataOpen, setIsHealthDataOpen] = useState(true);
  const [isMealSuggestionsOpen, setIsMealSuggestionsOpen] = useState(true);
  const [isCalorieCardOpen, setIsCalorieCardOpen] = useState(true);
  const [isNutrientsCardOpen, setIsNutrientsCardOpen] = useState(true);
  const [isQuickSuiteHubOpen, setIsQuickSuiteHubOpen] = useState(true);
  const [isWaterTrackerOpen, setIsWaterTrackerOpen] = useState(true);
  const [isFastingTrackerOpen, setIsFastingTrackerOpen] = useState(true);
  const [isAiCoachSpotlightOpen, setIsAiCoachSpotlightOpen] = useState(true);
  const [isRecipeSpotlightOpen, setIsRecipeSpotlightOpen] = useState(true);
  const [isFrequentMealsOpen, setIsFrequentMealsOpen] = useState(true);

  const areAllDashboardCardsCollapsed = !isCalorieCardOpen && !isNutrientsCardOpen && !isWaterTrackerOpen && !isFastingTrackerOpen && !isMealSuggestionsOpen && !isAiCoachSpotlightOpen && !isRecipeSpotlightOpen && !isHealthDataOpen;

  const toggleAllDashboardCards = (targetState?: boolean) => {
    const nextState = targetState !== undefined 
      ? targetState 
      : areAllDashboardCardsCollapsed;
    
    setIsCalorieCardOpen(nextState);
    setIsNutrientsCardOpen(nextState);
    setIsWaterTrackerOpen(nextState);
    setIsFastingTrackerOpen(nextState);
    setIsMealSuggestionsOpen(nextState);
    setIsAiCoachSpotlightOpen(nextState);
    setIsRecipeSpotlightOpen(nextState);
    setIsHealthDataOpen(nextState);
  };

  const [suggestedMeals, setSuggestedMeals] = useState<MealSuggestion[] | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);



  
  const handleSuggestMeals = async () => {
    if (!navigator.onLine) {
      showToast('⚡ อยู่ในโหมดออฟไลน์: ฟังก์ชันแนะนำเมนูอาหารใหม่ต้องใช้อินเทอร์เน็ต');
      return;
    }
    setIsSuggesting(true);
    setSuggestedMeals(null);
    try {
      const remainingCalories = Math.max(0, safeDailyGoal - totalCaloriesDisplay);
      const remainingProtein = Math.max(0, proteinGoal - totalProtein);
      const remainingCarbs = Math.max(0, carbsGoal - totalCarbs);
      const remainingFat = Math.max(0, fatGoal - totalFat);

      const response = await fetch('/api/suggest-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remainingCalories, remainingCarbs, remainingProtein, remainingFat })
      });
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestedMeals(data);
    } catch (e) {
      console.error(e);
      const dateKey = getLocalISODate(selectedDate);
      setToasts(prev => [...prev, { id: Date.now().toString(), message: 'ไม่สามารถแนะนำอาหารได้ในขณะนี้' }]);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 font-sans sm:p-4 md:p-8 flex items-center justify-center">
      <div className={`w-full ${activeTab === 'crm' || activeTab === 'recipes' ? 'max-w-4xl' : 'max-w-md'} h-[100dvh] sm:h-[850px] bg-white sm:rounded-[40px] sm:shadow-2xl sm:shadow-orange-900/10 sm:ring-8 ring-white/50 relative overflow-hidden flex flex-col transition-all duration-300`}>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50/50 pb-24 relative">
          {/* Offline Mode Banner */}
          {!isOnline && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-amber-900 text-xs font-semibold shrink-0 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <WifiOff size={14} className="text-amber-600 shrink-0" />
                <span>โหมดออฟไลน์ (ดูประวัติ & แดชบอร์ดได้)</span>
              </div>
              <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full text-amber-900 font-bold">Offline Cached</span>
            </div>
          )}

          {/* Global Floating Toasts */}
          <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
              <div key={toast.id} className="bg-neutral-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-orange-400 shrink-0" />
                  <p className="text-xs font-bold leading-snug">{toast.message}</p>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-neutral-400 hover:text-white transition-colors p-1"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          
          {activeTab === 'dashboard' && (
            isDashboardLoading ? (
              <DashboardSkeleton />
            ) : (
            <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-300 relative">

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">แดชบอร์ด</h1>
                  <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                    <span>{formatFullThaiDate(displayDate)}</span>
                    <span className="text-[11px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">
                      {formatDateDMY(displayDate)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-header-google-search"
                    onClick={() => {
                      setGoogleSearchDefaultCategory('all');
                      setShowGoogleSearchModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 font-bold text-xs px-3 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
                    title="ค้นหาข้อมูลร้านดัง เมนู และสุขภาพด้วย Google Search (Google Grounding)"
                  >
                    <Globe size={15} className="text-emerald-600 animate-pulse" />
                    <span>ค้นหา Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReminderModal(true)}
                    className={`relative p-2 rounded-2xl border transition-all cursor-pointer ${
                      reminderSettings.enabled
                        ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 shadow-xs'
                        : 'bg-white hover:bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}
                    title="ตั้งเวลาแจ้งเตือนมื้ออาหาร (Meal Reminders)"
                  >
                    {reminderSettings.enabled ? (
                      <BellRing size={16} className="text-orange-500" />
                    ) : (
                      <Bell size={16} />
                    )}
                    {reminderSettings.enabled && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('health')}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs px-3 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
                    title="เปิดศูนย์สุขภาพองค์รวม & ชีวมาร์กเกอร์"
                  >
                    <Heart size={15} className="text-emerald-600" />
                    <span>ศูนย์สุขภาพ</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('recipes')}
                    className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 font-bold text-xs px-3 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
                    title="ค้นหาสูตรอาหารคลีนด้วย AI"
                  >
                    <ChefHat size={15} className="text-orange-600" />
                    <span>สูตรอาหาร</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('coach')}
                    className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
                    title="เปิดโค้ช AI ดูแลสุขภาพส่วนตัว"
                  >
                    <Bot size={16} className="text-orange-400" />
                    <span>โค้ช AI</span>
                  </button>

                  {/* Google User Profile & Auth Pill */}
                  <div className="relative">
                    {currentGoogleUser ? (
                      <button
                        type="button"
                        onClick={() => setShowUserDropdown(prev => !prev)}
                        className="flex items-center gap-2 bg-white hover:bg-neutral-50 border border-neutral-200/90 rounded-2xl p-1 pr-3 transition-all cursor-pointer shadow-2xs group"
                        title="จัดการบัญชี Google"
                      >
                        <img 
                          src={currentGoogleUser.picture} 
                          alt={currentGoogleUser.name} 
                          className="w-7 h-7 rounded-xl object-cover ring-1 ring-orange-200"
                        />
                        <span className="text-xs font-bold text-neutral-800 max-w-[100px] truncate">
                          {currentGoogleUser.name}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowGoogleLoginModal(true)}
                        className="flex items-center gap-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 font-bold text-xs px-3 py-2 rounded-2xl shadow-xs transition-all cursor-pointer"
                        title="เข้าสู่ระบบด้วย Google"
                      >
                        <LogIn size={15} className="text-orange-500" />
                        <span>เข้าสู่ระบบ</span>
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    {showUserDropdown && currentGoogleUser && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
                          <img 
                            src={currentGoogleUser.picture} 
                            alt={currentGoogleUser.name} 
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-orange-100"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-neutral-900 truncate">{currentGoogleUser.name}</h4>
                            <p className="text-[10px] text-neutral-500 truncate">{currentGoogleUser.email}</p>
                            <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                              Google Account ✓
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserDropdown(false);
                              setShowGoogleLoginModal(true);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>สลับบัญชี Google</span>
                            <ChevronRight size={14} className="text-neutral-400" />
                          </button>

                          <button
                            type="button"
                            onClick={handleGoogleLogout}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>ออกจากระบบ</span>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 7 Days Strip */}
              <div className="flex gap-1.5 w-full justify-between">
                {past7Days.map((date, i) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());
                  
                  const dayHistory = (history || []).filter(item => isSameDay(new Date(item.date), date));
                  const carbsGrams = dayHistory.reduce((sum, item) => sum + (item?.carbsGrams || 0), 0);
                  const proteinGrams = dayHistory.reduce((sum, item) => sum + (item?.proteinGrams || 0), 0);
                  const fatGrams = dayHistory.reduce((sum, item) => sum + (item?.fatGrams || 0), 0);
                  const totalMacros = carbsGrams + proteinGrams + fatGrams;
                  const carbsPct = totalMacros > 0 ? (carbsGrams / totalMacros) * 100 : 0;
                  const proteinPct = totalMacros > 0 ? (proteinGrams / totalMacros) * 100 : 0;
                  const fatPct = totalMacros > 0 ? (fatGrams / totalMacros) * 100 : 0;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all shadow-sm ${
                        isSelected 
                          ? 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-1 ring-offset-neutral-50' 
                          : 'bg-white text-neutral-500 border border-neutral-100 hover:bg-neutral-50 active:scale-95'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase mb-1">
                        {date?.toLocaleDateString('th-TH', { weekday: 'short' })}
                      </span>
                      <div className="relative w-8 h-8 flex items-center justify-center mb-1">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                          {totalMacros > 0 ? (
                            <>
                              {/* Carbs */}
                              <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#22c55e" strokeWidth="3.5" strokeDasharray={`${carbsPct} 100`} strokeDashoffset="0" />
                              {/* Protein */}
                              <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray={`${proteinPct} 100`} strokeDashoffset={`-${carbsPct}`} />
                              {/* Fat */}
                              <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray={`${fatPct} 100`} strokeDashoffset={`-${carbsPct + proteinPct}`} />
                            </>
                          ) : (
                            <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke={isSelected ? "rgba(255,255,255,0.3)" : "#f5f5f5"} strokeWidth="3.5" />
                          )}
                        </svg>
                        <span className={`relative text-sm sm:text-base font-black ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                          {date.getDate()}
                        </span>
                      </div>
                      {isToday && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Google Search Grounding Intelligence Banner */}
              <div 
                id="banner-dashboard-google-grounding-search"
                onClick={() => {
                  setGoogleSearchDefaultCategory('all');
                  setShowGoogleSearchModal(true);
                }}
                className="w-full bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white hover:from-emerald-100/60 hover:via-teal-100/60 hover:to-emerald-50/50 p-4 rounded-3xl border border-emerald-200/90 flex items-center justify-between gap-3 shadow-xs cursor-pointer transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                    <Globe size={20} className="group-hover:scale-110 transition-transform animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-neutral-900 truncate">ค้นหาข้อมูลด้วย Google Search Grounding</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                        Live Web Data
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      เมนูแบรนด์ดัง (Starbucks, Amazon, 7-11), แคลอรี่, โรคประจำตัว, อาหารเสริม...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-emerald-200/70 text-xs font-bold text-emerald-800 shrink-0 shadow-2xs group-hover:border-emerald-400 transition-colors">
                  <Search size={14} className="text-emerald-600" />
                  <span>ค้นหาข้อมูล</span>
                </div>
              </div>

              {/* Dashboard Master Collapse/Expand Toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100/80 rounded-2xl border border-neutral-200/60 text-xs font-bold text-neutral-600">
                <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                  <Layers size={13} className="text-orange-500" />
                  <span>หัวข้อทั้งหมดในแดชบอร์ด</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllDashboardCards(true)}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 shadow-xs border border-neutral-200/80 text-[11px] font-bold transition-all cursor-pointer hover:text-orange-600"
                  >
                    ขยายทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllDashboardCards(false)}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 shadow-xs border border-neutral-200/80 text-[11px] font-bold transition-all cursor-pointer hover:text-orange-600"
                  >
                    ยุบทั้งหมด
                  </button>
                </div>
              </div>

              {/* Calorie Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 flex flex-col relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900">แคลอรี</h2>
                    {!isCalorieCardOpen && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        {totalCaloriesDisplay.toLocaleString()} / {safeDailyGoal.toLocaleString()} kcal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCalorieGoalsModal(true); }}
                      className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-colors relative z-50 cursor-pointer pointer-events-auto flex items-center gap-1 border border-orange-200"
                      title="คำนวณเป้าหมายแคลอรี Deficit / Surplus"
                    >
                      <Target size={13} className="text-orange-500" />
                      คำนวณเป้าหมาย
                    </button>
                    <button type="button" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEnergyEditor(true); }}
                      className="text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-full transition-colors relative z-50 cursor-pointer pointer-events-auto"
                      title="แก้ไขค่า BMR/TDEE โดยตรง"
                    >
                      แก้ไขตัวเลข
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCalorieCardOpen(!isCalorieCardOpen)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                      title={isCalorieCardOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
                    >
                      <ChevronUp size={18} className={`transition-transform duration-300 ${isCalorieCardOpen ? '' : 'rotate-180'}`} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isCalorieCardOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {showEnergyEditor ? (
                        <div className="bg-neutral-50 rounded-2xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-neutral-900 text-sm">กำหนดค่าพลังงานและเป้าหมายแคลอรี</h3>
                              <p className="text-[11px] text-neutral-500">แยกชัดเจนระหว่างอัตราเผาผลาญจริง (TDEE) กับเป้าหมายที่ต้องทำตาม (Target Goal)</p>
                            </div>
                          </div>
                          <div className="space-y-3 mb-5">
                            <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-neutral-200">
                              <div>
                                <label className="text-xs font-bold text-neutral-700 block">1. BMR (อัตราเผาผลาญพื้นฐาน)</label>
                                <span className="text-[10px] text-neutral-400">พลังงานขั้นต่ำที่อวัยวะใช้ตอนพักผ่อน</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" 
                                  value={editingEnergy.bmr} 
                                  onChange={(e) => setEditingEnergy({...editingEnergy, bmr: e.target.value})}
                                  className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-right outline-none focus:border-orange-500"
                                />
                                <span className="text-[10px] text-neutral-500 font-semibold">kcal</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-blue-200">
                              <div>
                                <label className="text-xs font-bold text-blue-700 block">2. TDEE จริง (อัตราเผาผลาญทั้งหมดต่อวัน)</label>
                                <span className="text-[10px] text-neutral-500">
                                  {(() => {
                                    const t = Number(editingEnergy.tdee) || 0;
                                    const tgt = Number(editingEnergy.targetCalories) || 0;
                                    const def = t - tgt;
                                    if (def > 0) {
                                      // TDEE มีค่ามากกว่า target เมื่อมี deficit
                                      return `TDEE มีค่ามากกว่าเป้าหมาย: TDEE (${t}) = เป้าหมาย (${tgt}) + Deficit (${def})`;
                                    } else if (def < 0) {
                                      // TDEE มีค่าน้อยกว่า target เมื่อมี surplus
                                      return `TDEE มีค่าน้อยกว่าเป้าหมาย: TDEE (${t}) = เป้าหมาย (${tgt}) - Surplus (${Math.abs(def)})`;
                                    } else {
                                      return `TDEE (${t}) = เป้าหมาย (รักษาน้ำหนัก)`;
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" 
                                  value={editingEnergy.tdee} 
                                  onChange={(e) => setEditingEnergy({...editingEnergy, tdee: e.target.value})}
                                  className="w-20 bg-blue-50/50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-900 text-right outline-none focus:border-blue-500"
                                />
                                <span className="text-[10px] text-neutral-500 font-semibold">kcal</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-orange-200 bg-orange-50/30">
                              <div>
                                <label className="text-xs font-bold text-orange-700 block">3. เป้าหมายแคลอรีต่อวัน (Target Goal)</label>
                                <span className="text-[10px] text-neutral-500">
                                  {(Number(editingEnergy.tdee) || 0) > (Number(editingEnergy.targetCalories) || 0) 
                                    ? `Deficit -${(Number(editingEnergy.tdee) || 0) - (Number(editingEnergy.targetCalories) || 0)} kcal จาก TDEE (Target = TDEE - Deficit)` 
                                    : (Number(editingEnergy.tdee) || 0) < (Number(editingEnergy.targetCalories) || 0)
                                      ? `Surplus +${(Number(editingEnergy.targetCalories) || 0) - (Number(editingEnergy.tdee) || 0)} kcal จาก TDEE (Target = TDEE + Surplus)`
                                      : 'เท่ากับ TDEE (รักษาน้ำหนัก)'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" 
                                  value={editingEnergy.targetCalories} 
                                  onChange={(e) => setEditingEnergy({...editingEnergy, targetCalories: e.target.value})}
                                  className="w-20 bg-white border border-orange-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-orange-600 text-right outline-none focus:border-orange-500"
                                />
                                <span className="text-[10px] text-orange-700 font-semibold">kcal</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button type="button" 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveEnergy(); }}
                              className="flex-1 bg-neutral-900 text-white font-bold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors text-xs cursor-pointer"
                            >
                              บันทึกการตั้งค่า
                            </button>
                            <button type="button" 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleResetEnergy(); }}
                              className="flex-1 bg-white text-neutral-600 font-bold py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-xs cursor-pointer"
                            >
                              รีเซ็ตค่ามาตรฐาน
                            </button>
                          </div>
                          <div className="mt-2.5 pt-2.5 border-t border-neutral-200/80">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowEnergyEditor(false);
                                setShowCalorieGoalsModal(true);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-orange-200"
                            >
                              <Target size={14} className="text-orange-600" />
                              🎯 ให้ระบบคำนวณเป้าหมาย Deficit / Surplus ให้สัมพันธ์กับระยะเวลา
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col mb-2">
                          {/* 3 Horizontal Metric Cards */}
                          <div className="flex flex-col gap-2.5 mb-4">
                            {/* 1. ทานแล้ว (Intake) - Horizontal Card (Blue Theme) */}
                            <div className="bg-blue-50/90 hover:bg-blue-100/80 rounded-2xl p-3 sm:p-3.5 border border-blue-200/80 flex items-center justify-between transition-all shadow-2xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-200/80 flex items-center justify-center text-blue-700 shrink-0">
                                  <Utensils size={18} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">ทานแล้ว</div>
                                  <div className="text-[11px] text-blue-600/90 font-medium truncate mt-0.5">
                                    {Math.round((totalCaloriesDisplay / safeDailyGoal) * 100)}% ของเป้าหมาย
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-baseline gap-1 shrink-0 pl-2">
                                <span className="text-xl sm:text-2xl font-black text-blue-600 leading-none tracking-tight">
                                  {totalCaloriesDisplay.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-blue-400">kcal</span>
                              </div>
                            </div>

                            {/* 2. เป้าหมาย (Target Goal) - Horizontal Card */}
                            <div className="bg-orange-50/80 hover:bg-orange-100/70 rounded-2xl p-3 sm:p-3.5 border border-orange-200/80 flex items-center justify-between transition-all shadow-2xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-orange-200/80 flex items-center justify-center text-orange-700 shrink-0">
                                  <Target size={18} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">เป้าหมาย</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      safeDailyGoal < tdee 
                                        ? 'bg-orange-200 text-orange-900' 
                                        : safeDailyGoal > tdee 
                                          ? 'bg-blue-200 text-blue-900' 
                                          : 'bg-neutral-200 text-neutral-800'
                                    }`}>
                                      {safeDailyGoal === tdee 
                                        ? 'เท่า TDEE' 
                                        : safeDailyGoal < tdee 
                                          ? `Deficit -${(tdee - safeDailyGoal).toLocaleString()} kcal` 
                                          : `Surplus +${(safeDailyGoal - tdee).toLocaleString()} kcal`}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-orange-800/80 font-medium truncate mt-0.5" title={`TDEE จริง: ${tdee.toLocaleString()} kcal`}>
                                    TDEE จริง: {tdee.toLocaleString()} kcal
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-baseline gap-1 shrink-0 pl-2">
                                <span className="text-xl sm:text-2xl font-black text-orange-600 leading-none tracking-tight">
                                  {safeDailyGoal.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-orange-600/70">kcal</span>
                              </div>
                            </div>

                            {/* 3. คงเหลือถึงเป้า / ทานเกินเป้า (Remaining / Exceeded) - Horizontal Card */}
                            {(() => {
                              const remaining = safeDailyGoal - totalCaloriesDisplay;
                              const isExceeded = remaining < 0;
                              const isExact = remaining === 0;

                              return (
                                <div className={`rounded-2xl p-3 sm:p-3.5 border flex items-center justify-between transition-all shadow-2xs ${
                                  isExceeded 
                                    ? 'bg-rose-50/90 hover:bg-rose-100/70 border-rose-200/80' 
                                    : isExact 
                                      ? 'bg-emerald-50/90 hover:bg-emerald-100/70 border-emerald-200/80' 
                                      : 'bg-emerald-50/60 hover:bg-emerald-100/50 border-emerald-200/70'
                                }`}>
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                      isExceeded 
                                        ? 'bg-rose-200/80 text-rose-700' 
                                        : 'bg-emerald-200/80 text-emerald-700'
                                    }`}>
                                      {isExceeded ? (
                                        <AlertCircle size={18} />
                                      ) : isExact ? (
                                        <CheckCircle2 size={18} />
                                      ) : (
                                        <Sparkles size={18} />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className={`text-xs font-bold uppercase tracking-wider ${
                                        isExceeded ? 'text-rose-700' : isExact ? 'text-emerald-800' : 'text-emerald-800'
                                      }`}>
                                        {isExceeded ? 'ทานเกินเป้า' : isExact ? 'ครบตามเป้าหมาย' : 'คงเหลือถึงเป้า'}
                                      </div>
                                      <div className={`text-[11px] font-medium truncate mt-0.5 ${
                                        isExceeded ? 'text-rose-600' : isExact ? 'text-emerald-700' : 'text-emerald-700/90'
                                      }`}>
                                        {isExceeded 
                                          ? `เกินเป้าหมาย ${Math.abs(remaining).toLocaleString()} kcal` 
                                          : isExact 
                                            ? '🎯 ครบตามเป้าหมายพอดี 100%' 
                                            : `ทานได้อีก ${remaining.toLocaleString()} kcal`}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-baseline gap-1 shrink-0 pl-2">
                                    <span className={`text-xl sm:text-2xl font-black leading-none tracking-tight ${
                                      isExceeded 
                                        ? 'text-rose-600' 
                                        : isExact 
                                          ? 'text-emerald-600' 
                                          : 'text-emerald-700'
                                    }`}>
                                      {isExceeded ? `+${Math.abs(remaining).toLocaleString()}` : remaining.toLocaleString()}
                                    </span>
                                    <span className={`text-xs font-bold ${
                                      isExceeded ? 'text-rose-500' : 'text-emerald-600'
                                    }`}>kcal</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Linear Progress Bar with Target on Top & BMR/TDEE Below */}
                          <div className="relative w-full mt-7 mb-7 px-1">
                            {/* Target Marker ABOVE the bar */}
                            {(() => {
                              const safeBmr = isNaN(bmr) || bmr <= 0 ? 1500 : bmr;
                              const safeTdee = isNaN(tdee) || tdee <= 0 ? 2000 : tdee;
                              const safeTarget = safeDailyGoal > 0 ? safeDailyGoal : 2000;
                              const safeTotalCals = isNaN(totalCaloriesDisplay) ? 0 : totalCaloriesDisplay;
                              const maxDisplay = Math.max(safeTdee, safeTarget, safeTotalCals, 2000) * 1.08;
                              const widthTarget = Math.min(95, Math.max(5, (safeTarget / maxDisplay) * 100)) || 0;

                              return (
                                <div 
                                  className="absolute -top-6 -ml-9 w-18 flex flex-col items-center pointer-events-none z-30 transition-all" 
                                  style={{ left: `${widthTarget}%` }}
                                >
                                  <div className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 whitespace-nowrap leading-tight">
                                    <span>🎯 เป้า {safeTarget.toLocaleString()}</span>
                                  </div>
                                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-orange-500"></div>
                                </div>
                              );
                            })()}

                            {/* Bar Container */}
                            <div className="relative w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex shadow-inner">
                              {(() => {
                                const safeBmr = isNaN(bmr) || bmr <= 0 ? 1500 : bmr;
                                const safeTdee = isNaN(tdee) || tdee <= 0 ? 2000 : tdee;
                                const safeTarget = safeDailyGoal > 0 ? safeDailyGoal : 2000;
                                const safeTotalCals = isNaN(totalCaloriesDisplay) ? 0 : totalCaloriesDisplay;
                                const maxDisplay = Math.max(safeTdee, safeTarget, safeTotalCals, 2000) * 1.08;
                                
                                const widthBmr = Math.min(100, Math.max(0, (safeBmr / maxDisplay) * 100)) || 0;
                                const widthTarget = Math.min(100, Math.max(0, (safeTarget / maxDisplay) * 100)) || 0;
                                const widthTdee = Math.min(100, Math.max(0, (safeTdee / maxDisplay) * 100)) || 0;
                                
                                let barColor = 'bg-amber-400';
                                if (safeTotalCals >= safeBmr && safeTotalCals <= safeTarget) barColor = 'bg-emerald-500';
                                else if (safeTotalCals > safeTarget && safeTotalCals <= safeTdee) barColor = 'bg-orange-500';
                                else if (safeTotalCals > safeTdee) barColor = 'bg-rose-500'; 
                                
                                const progressWidth = Math.min(100, Math.max(0, (safeTotalCals / maxDisplay) * 100)) || 0;
                                
                                return (
                                  <>
                                    {/* BMR marker (in bar) - Blue Line */}
                                    <div className="absolute top-0 bottom-0 border-l-[2px] border-blue-600 z-20" style={{ left: `${widthBmr}%` }} title={`BMR: ${safeBmr} kcal`}></div>
                                    {/* Target marker (in bar) */}
                                    <div className="absolute top-0 bottom-0 border-l-[2px] border-orange-600/90 z-30" style={{ left: `${widthTarget}%` }} title={`เป้าหมาย: ${safeTarget} kcal`}></div>
                                    {/* TDEE marker (in bar) */}
                                    <div className="absolute top-0 bottom-0 border-l-[1.5px] border-indigo-600/90 z-20" style={{ left: `${widthTdee}%` }} title={`TDEE: ${safeTdee} kcal`}></div>
                                    
                                    {/* Main Progress Bar */}
                                    <div 
                                      className={`h-full ${barColor} transition-all duration-500 rounded-full`} 
                                      style={{ width: `${progressWidth}%` }}
                                    ></div>
                                  </>
                                );
                              })()}
                            </div>
                            
                            {/* Markers BELOW bar (BMR & TDEE) */}
                            {(() => {
                              const safeBmr = isNaN(bmr) || bmr <= 0 ? 1500 : bmr;
                              const safeTdee = isNaN(tdee) || tdee <= 0 ? 2000 : tdee;
                              const safeTarget = safeDailyGoal > 0 ? safeDailyGoal : 2000;
                              const safeTotalCals = isNaN(totalCaloriesDisplay) ? 0 : totalCaloriesDisplay;
                              const maxDisplay = Math.max(safeTdee, safeTarget, safeTotalCals, 2000) * 1.08;
                              
                              const widthBmr = Math.min(96, Math.max(3, (safeBmr / maxDisplay) * 100)) || 0;
                              const widthTdee = Math.min(96, Math.max(3, (safeTdee / maxDisplay) * 100)) || 0;
                              
                              return (
                                <>
                                  <div className="absolute top-[12px] -ml-6 w-12 flex flex-col items-center pointer-events-none z-20" style={{ left: `${widthBmr}%` }}>
                                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-blue-600 mb-0.5"></div>
                                    <span className="text-[9px] font-bold text-blue-600 leading-none">BMR</span>
                                    <span className="text-[8px] font-medium text-blue-500 leading-none mt-0.5">{safeBmr.toLocaleString()}</span>
                                  </div>
                                  <div className="absolute top-[12px] -ml-6 w-12 flex flex-col items-center pointer-events-none z-20" style={{ left: `${widthTdee}%` }}>
                                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-indigo-600 mb-0.5"></div>
                                    <span className="text-[9px] font-bold text-indigo-600 leading-none">TDEE</span>
                                    <span className="text-[8px] font-medium text-indigo-500 leading-none mt-0.5">{safeTdee.toLocaleString()}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          
                          {/* Legend */}
                          <div className="grid grid-cols-4 text-[10px] font-bold text-neutral-400 tracking-wide px-1 pt-1.5 border-t border-neutral-100">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div> &lt; BMR</div>
                              <span className="text-neutral-700 font-semibold">{bmr.toLocaleString()} kcal</span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-center">
                              <div className="flex items-center justify-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div> ในเป้าหมาย</div>
                              <span className="text-emerald-700 font-semibold">{safeDailyGoal.toLocaleString()} kcal</span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-center">
                              <div className="flex items-center justify-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></div> เกินเป้า&lt;TDEE</div>
                              <span className="text-orange-700 font-semibold">{tdee.toLocaleString()} kcal</span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-right">
                              <div className="flex items-center justify-end gap-1"><div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div> &gt; TDEE</div>
                              <span className="text-rose-600 font-semibold">เกินเผาผลาญ</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Nutrients Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 flex flex-col relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900">สารอาหาร</h2>
                    {!isNutrientsCardOpen && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        P: {totalProtein}g • C: {totalCarbs}g • F: {totalFat}g
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMacroEditor(true); }}
                      className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors relative z-50 cursor-pointer pointer-events-auto"
                    >
                      ปรับแต่ง
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNutrientsCardOpen(!isNutrientsCardOpen)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                      title={isNutrientsCardOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
                    >
                      <ChevronUp size={18} className={`transition-transform duration-300 ${isNutrientsCardOpen ? '' : 'rotate-180'}`} />
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isNutrientsCardOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {showMacroEditor ? (
                  <div className="bg-neutral-50 rounded-2xl p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-neutral-900 mb-4 text-sm">กำหนดเป้าหมายสารอาหาร (กรัม)</h3>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-neutral-600 flex items-center gap-2"><span className="text-xl">🍞</span> คาร์บ</label>
                        <input 
                          type="number" 
                          value={editingMacros.carbs} 
                          onChange={(e) => setEditingMacros({...editingMacros, carbs: e.target.value})}
                          className="w-20 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-right outline-none focus:border-orange-500 pointer-events-auto"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-neutral-600 flex items-center gap-2"><span className="text-xl">🥩</span> โปรตีน</label>
                        <input 
                          type="number" 
                          value={editingMacros.protein} 
                          onChange={(e) => setEditingMacros({...editingMacros, protein: e.target.value})}
                          className="w-20 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-right outline-none focus:border-orange-500 pointer-events-auto"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-neutral-600 flex items-center gap-2"><span className="text-xl">🥑</span> ไขมัน</label>
                        <input 
                          type="number" 
                          value={editingMacros.fat} 
                          onChange={(e) => setEditingMacros({...editingMacros, fat: e.target.value})}
                          className="w-20 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-right outline-none focus:border-orange-500 pointer-events-auto"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-neutral-600 flex items-center gap-2"><span className="text-xl">🍭</span> น้ำตาล</label>
                        <input 
                          type="number" 
                          value={editingMacros.sugar} 
                          onChange={(e) => setEditingMacros({...editingMacros, sugar: e.target.value})}
                          className="w-20 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-right outline-none focus:border-orange-500 pointer-events-auto"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-neutral-600 flex items-center gap-2"><span className="text-xl">🧂</span> โซเดียม</label>
                        <input 
                          type="number" 
                          value={editingMacros.sodium} 
                          onChange={(e) => setEditingMacros({...editingMacros, sodium: e.target.value})}
                          className="w-20 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-right outline-none focus:border-orange-500 pointer-events-auto"
                        />
                      </div>
                      
                    </div>
                    <div className="flex gap-2">
                      <button type="button" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveMacros(); }}
                        className="flex-1 bg-neutral-900 text-white font-bold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors text-sm"
                      >
                        บันทึก
                      </button>
                      <button type="button" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleResetMacros(); }}
                        className="flex-1 bg-white text-neutral-600 font-bold py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm"
                      >
                        รีเซ็ตค่าเริ่มต้น
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="w-full">
                  <div className="grid grid-cols-3 gap-y-6 w-full">
                      {/* Carbs */}
                      {(() => {
                        const goalVal = Math.max(1, carbsGoal || 1);
                        const currentVal = Math.max(0, totalCarbs || 0);
                        const ratio = Math.min(1, Math.max(0, currentVal / goalVal));
                        const circumference = 2 * Math.PI * 30;
                        const offset = circumference * (1 - ratio);
                        const overRatio = currentVal > goalVal ? Math.min(1, (currentVal - goalVal) / goalVal) : 0;
                        const overOffset = circumference * (1 - overRatio);
                        return (
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative w-[72px] h-[72px] mb-3">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="36" cy="36" r="30" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                                <circle cx="36" cy="36" r="30" stroke="#22c55e" strokeWidth="6" fill="transparent" 
                                  strokeDasharray={circumference}
                                  strokeDashoffset={isNaN(offset) ? circumference : offset}
                                  strokeLinecap="round" />
                                {currentVal > goalVal && (
                                  <circle cx="36" cy="36" r="30" stroke="#ef4444" strokeWidth="10" fill="transparent" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={isNaN(overOffset) ? circumference : overOffset}
                                    strokeLinecap="round" />
                                )}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-3xl">🍞</div>
                            </div>
                            <span className="text-sm text-neutral-500 mb-1">คาร์บ</span>
                            <span className="text-sm font-bold text-neutral-900">{currentVal} / {goalVal} ก.</span>
                          </div>
                        );
                      })()}
                      
                      {/* Protein */}
                      {(() => {
                        const goalVal = Math.max(1, proteinGoal || 1);
                        const currentVal = Math.max(0, totalProtein || 0);
                        const ratio = Math.min(1, Math.max(0, currentVal / goalVal));
                        const circumference = 2 * Math.PI * 30;
                        const offset = circumference * (1 - ratio);
                        const overRatio = currentVal > goalVal ? Math.min(1, (currentVal - goalVal) / goalVal) : 0;
                        const overOffset = circumference * (1 - overRatio);
                        return (
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative w-[72px] h-[72px] mb-3">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="36" cy="36" r="30" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                                <circle cx="36" cy="36" r="30" stroke="#3b82f6" strokeWidth="6" fill="transparent" 
                                  strokeDasharray={circumference}
                                  strokeDashoffset={isNaN(offset) ? circumference : offset}
                                  strokeLinecap="round" />
                                {currentVal > goalVal && (
                                  <circle cx="36" cy="36" r="30" stroke="#ef4444" strokeWidth="10" fill="transparent" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={isNaN(overOffset) ? circumference : overOffset}
                                    strokeLinecap="round" />
                                )}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-3xl">🥩</div>
                            </div>
                            <span className="text-sm text-neutral-500 mb-1">โปรตีน</span>
                            <span className="text-sm font-bold text-neutral-900">{currentVal} / {goalVal} ก.</span>
                          </div>
                        );
                      })()}

                      {/* Fat */}
                      {(() => {
                        const goalVal = Math.max(1, fatGoal || 1);
                        const currentVal = Math.max(0, totalFat || 0);
                        const ratio = Math.min(1, Math.max(0, currentVal / goalVal));
                        const circumference = 2 * Math.PI * 30;
                        const offset = circumference * (1 - ratio);
                        const overRatio = currentVal > goalVal ? Math.min(1, (currentVal - goalVal) / goalVal) : 0;
                        const overOffset = circumference * (1 - overRatio);
                        return (
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative w-[72px] h-[72px] mb-3">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="36" cy="36" r="30" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                                <circle cx="36" cy="36" r="30" stroke="#eab308" strokeWidth="6" fill="transparent" 
                                  strokeDasharray={circumference}
                                  strokeDashoffset={isNaN(offset) ? circumference : offset}
                                  strokeLinecap="round" />
                                {currentVal > goalVal && (
                                  <circle cx="36" cy="36" r="30" stroke="#ef4444" strokeWidth="10" fill="transparent" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={isNaN(overOffset) ? circumference : overOffset}
                                    strokeLinecap="round" />
                                )}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-3xl">🧀</div>
                            </div>
                            <span className="text-sm text-neutral-500 mb-1">ไขมัน</span>
                            <span className="text-sm font-bold text-neutral-900">{currentVal} / {goalVal} ก.</span>
                          </div>
                        );
                      })()}
                    
                      {/* Sugar */}
                      {(() => {
                        const goalVal = Math.max(1, sugarGoal || 1);
                        const currentVal = Math.max(0, totalSugar || 0);
                        const ratio = Math.min(1, Math.max(0, currentVal / goalVal));
                        const circumference = 2 * Math.PI * 30;
                        const offset = circumference * (1 - ratio);
                        const overRatio = currentVal > goalVal ? Math.min(1, (currentVal - goalVal) / goalVal) : 0;
                        const overOffset = circumference * (1 - overRatio);
                        return (
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative w-[72px] h-[72px] mb-3">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="36" cy="36" r="30" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                                <circle cx="36" cy="36" r="30" stroke="#ec4899" strokeWidth="6" fill="transparent" 
                                  strokeDasharray={circumference}
                                  strokeDashoffset={isNaN(offset) ? circumference : offset}
                                  strokeLinecap="round" />
                                {currentVal > goalVal && (
                                  <circle cx="36" cy="36" r="30" stroke="#ef4444" strokeWidth="10" fill="transparent" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={isNaN(overOffset) ? circumference : overOffset}
                                    strokeLinecap="round" />
                                )}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-3xl">🍭</div>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-sm text-neutral-500">น้ำตาล</span>
                            </div>
                            <span className="text-sm font-bold text-neutral-900">{currentVal} / {goalVal} ก.</span>
                          </div>
                        );
                      })()}
                      
                      {/* Sodium */}
                      {(() => {
                        const goalVal = Math.max(1, sodiumGoal || 1);
                        const currentVal = Math.max(0, totalSodium || 0);
                        const ratio = Math.min(1, Math.max(0, currentVal / goalVal));
                        const circumference = 2 * Math.PI * 30;
                        const offset = circumference * (1 - ratio);
                        const overRatio = currentVal > goalVal ? Math.min(1, (currentVal - goalVal) / goalVal) : 0;
                        const overOffset = circumference * (1 - overRatio);
                        return (
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative w-[72px] h-[72px] mb-3">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="36" cy="36" r="30" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                                <circle cx="36" cy="36" r="30" stroke="#14b8a6" strokeWidth="6" fill="transparent" 
                                  strokeDasharray={circumference}
                                  strokeDashoffset={isNaN(offset) ? circumference : offset}
                                  strokeLinecap="round" />
                                {currentVal > goalVal && (
                                  <circle cx="36" cy="36" r="30" stroke="#ef4444" strokeWidth="10" fill="transparent" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={isNaN(overOffset) ? circumference : overOffset}
                                    strokeLinecap="round" />
                                )}
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-3xl">🧂</div>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-sm text-neutral-500">โซเดียม</span>
                            </div>
                            <span className="text-sm font-bold text-neutral-900">{currentVal} / {goalVal} มก.</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Water Hydration Tracker Live Component */}
              <WaterTracker 
                selectedDate={selectedDate} 
                onToast={showToast} 
                isOpen={isWaterTrackerOpen}
                onToggleOpen={() => setIsWaterTrackerOpen(!isWaterTrackerOpen)}
              />

              {/* Intermittent Fasting (IF) Tracker Live Component */}
              <IntermittentFastingTracker 
                onToast={showToast} 
                isOpen={isFastingTrackerOpen}
                onToggleOpen={() => setIsFastingTrackerOpen(!isFastingTrackerOpen)}
                onOpenFastingStagesModal={() => setShowFastingStagesModal(true)}
              />

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 flex flex-col relative z-10">
                <button type="button" 
                  className="w-full flex items-center justify-between group"
                  onClick={() => setIsMealSuggestionsOpen(!isMealSuggestionsOpen)}
                >
                  <h2 className="text-lg font-bold text-neutral-900">ไอเดียเมนูอาหาร</h2>
                  <ChevronUp size={20} className={`text-neutral-400 transition-transform duration-300 ${isMealSuggestionsOpen ? '' : 'rotate-180'}`} />
                </button>
                
                <AnimatePresence>
                  {isMealSuggestionsOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                          ไม่รู้จะทานอะไรดี? ให้ AI แนะนำเมนูอาหารที่เหมาะสมกับสารอาหารที่เหลือในวันนี้ให้คุณ
                        </p>
                        <button
                          onClick={handleSuggestMeals}
                          disabled={isSuggesting}
                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 mb-4"
                        >
                          {isSuggesting ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              กำลังคิดเมนู...
                            </>
                          ) : (
                            <>
                              <Sparkles size={20} />
                              แนะนำเมนูอาหาร
                            </>
                          )}
                        </button>
                        
                        {isSuggesting && (
                          <MealSuggestionSkeleton count={3} />
                        )}

                        {!isSuggesting && Array.isArray(suggestedMeals) && (
                          <div className="flex flex-col gap-4 mt-2 animate-in fade-in slide-in-from-top-4">
                            {(suggestedMeals || []).map((meal, idx) => (
                              <div key={idx} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-neutral-900 text-base">{meal.foodName}</h3>
                                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                    {meal.calories} kcal
                                  </span>
                                </div>
                                <div className="flex gap-3 text-xs font-medium text-neutral-500">
                                  <span>คาร์บ {meal.carbsGrams}g</span>
                                  <span>•</span>
                                  <span>โปรตีน {meal.proteinGrams}g</span>
                                  <span>•</span>
                                  <span>ไขมัน {meal.fatGrams}g</span>
                                </div>
                                <p className="text-sm text-neutral-600 bg-white p-3 rounded-xl border border-neutral-100">
                                  {meal.explanation}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItem: HistoryItem = {
                                      id: `suggested-${Date.now()}-${idx}-${Math.random().toString(36).substring(7)}`,
                                      foodName: meal.foodName,
                                      calories: meal.calories,
                                      proteinGrams: meal.proteinGrams,
                                      carbsGrams: meal.carbsGrams,
                                      fatGrams: meal.fatGrams,
                                      date: selectedDate.getTime(),
                                      image: '',
                                      mealType: selectedMeal,
                                      explanation: meal.explanation || 'เมนูแนะนำจาก AI ตามโภชนาการที่เหลือ'
                                    };
                                    const newHistory = [newItem, ...history];
                                    updateAndPersistHistory(newHistory);
                                    showToast(`🍽️ บันทึก "${meal.foodName}" (${meal.calories} kcal) ลงไดอารี่แล้ว!`);
                                  }}
                                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                                >
                                  <Plus size={14} strokeWidth={2.5} />
                                  <span>บันทึกเมนูนี้ลงไดอารี่ ({mealLabels[selectedMeal]?.label || 'มื้ออาหาร'})</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Personal AI Coach Spotlight Card */}
              <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-orange-950 rounded-3xl p-5 text-white shadow-lg shadow-neutral-900/10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
                      <Bot size={18} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-300">Personal AI Nutrition Coach 24/7</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-white mb-1">โค้ช AI ดูแลสุขภาพส่วนตัว</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                    ปรึกษาโภชนาการ ถามเมนูอาหาร ตรวจการบ้านมื้ออาหารประจำวัน และบันทึกเช็กลิสต์วินัยสุขภาพ
                  </p>
                  <button
                    onClick={() => setActiveTab('coach')}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-white"
                  >
                    <Bot size={16} />
                    <span>ปรึกษาโค้ช AI & ตรวจการบ้านวันนี้</span>
                  </button>
                </div>
              </div>

              {/* Healthy Recipe Search Spotlight Card Connected to Fridge & Pantry */}
              {(() => {
                const fridgeItems = dashboardInventory.filter(i => i.storageLocation === 'fridge' || i.storageLocation === 'freezer');
                const pantryItems = dashboardInventory.filter(i => i.storageLocation === 'pantry');
                const expiringItems = dashboardInventory.filter(i => i.daysLeft <= 2);
                const allIngredientNames: string[] = Array.from(new Set<string>(dashboardInventory.map(i => i.name.trim()))).filter((name): name is string => Boolean(name));
                const fridgeIngredientNames: string[] = Array.from(new Set<string>(fridgeItems.map(i => i.name.trim()))).filter((name): name is string => Boolean(name));
                const pantryIngredientNames: string[] = Array.from(new Set<string>(pantryItems.map(i => i.name.trim()))).filter((name): name is string => Boolean(name));
                const expiringIngredientNames: string[] = Array.from(new Set<string>(expiringItems.map(i => i.name.trim()))).filter((name): name is string => Boolean(name));

                return (
                  <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-5 text-white shadow-lg shadow-emerald-700/20 relative overflow-hidden">
                    <div className="relative z-10 space-y-3">
                      {/* Collapsible Header Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsPantryRecipeSpotlightOpen(prev => {
                            const next = !prev;
                            try {
                              localStorage.setItem('kalguru_pantry_spotlight_open', JSON.stringify(next));
                            } catch (e) {}
                            return next;
                          });
                        }}
                        className="w-full text-left group cursor-pointer select-none"
                      >
                        {/* Top Badge & Action Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-xs">
                              <ChefHat size={18} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                              AI Clean Recipe & Pantry Integration
                            </span>
                          </div>

                          {/* Top Right Badges & Chevron Arrow */}
                          <div className="flex items-center gap-2">
                            <span className="bg-white/20 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-2xs">
                              {dashboardInventory.length} รายการในคลัง
                            </span>
                            <div 
                              title={isPantryRecipeSpotlightOpen ? 'ยุบหัวข้อนี้' : 'ขยายหัวข้อนี้'}
                              className="w-8 h-8 rounded-xl bg-white/25 hover:bg-white/40 active:scale-90 flex items-center justify-center text-white transition-all shadow-sm border border-white/30"
                            >
                              <ChevronUp 
                                size={20} 
                                className={`transition-transform duration-300 ${isPantryRecipeSpotlightOpen ? 'rotate-0' : 'rotate-180'}`} 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="pr-2">
                          <h3 className="text-lg font-black tracking-tight text-white mb-0.5">
                            ค้นหาสูตรอาหารคลีน จากของในตู้เย็น & ตู้กับข้าว
                          </h3>

                          {!isPantryRecipeSpotlightOpen ? (
                            <p className="text-xs text-emerald-100/90 line-clamp-1 mt-1 font-medium bg-black/10 px-2.5 py-1 rounded-xl inline-block">
                              ❄️ ตู้เย็น {fridgeItems.length} อย่าง • 🧂 ตู้กับข้าว {pantryItems.length} อย่าง {expiringItems.length > 0 ? `• ⚠️ ใกล้หมดอายุ ${expiringItems.length} อย่าง` : ''} (แตะเพื่อขยาย)
                            </p>
                          ) : (
                            <p className="text-xs text-emerald-100 leading-relaxed mb-0">
                              เชื่อมต่อข้อมูลวัตถุดิบจริงในบ้าน คิดสูตรอาหารคลีน คำนวณแคลอรีและสารอาหารครบถ้วน
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Collapsible Content Body */}
                      <AnimatePresence>
                        {isPantryRecipeSpotlightOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-3.5 pt-1"
                          >
                            {/* Stock Summary Badge */}
                            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                              <span className="bg-sky-500/30 text-sky-100 border border-sky-300/30 px-2.5 py-1 rounded-xl">
                                ❄️ ตู้เย็น: {fridgeItems.length} อย่าง
                              </span>
                              <span className="bg-amber-500/30 text-amber-100 border border-amber-300/30 px-2.5 py-1 rounded-xl">
                                🧂 ตู้กับข้าว: {pantryItems.length} อย่าง
                              </span>
                              {expiringItems.length > 0 && (
                                <span className="bg-rose-500/40 text-rose-100 border border-rose-300/40 px-2.5 py-1 rounded-xl animate-pulse">
                                  ⚠️ ใกล้หมดอายุ: {expiringItems.length} อย่าง
                                </span>
                              )}
                            </div>

                            {/* Live Items Chips */}
                            {dashboardInventory.length > 0 && (
                              <div className="space-y-1.5 bg-black/15 p-3 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-emerald-200 block">
                                  ของที่มีพร้อมปรุงตอนนี้ (คลิกเพื่อเลือกทันที):
                                </span>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                                  {dashboardInventory.slice(0, 10).map((item) => (
                                    <button
                                      key={item.id}
                                      onClick={() => handleOpenRecipeSearchWithIngredients([item.name])}
                                      className="bg-white/15 hover:bg-white/30 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>{item.storageLocation === 'freezer' ? '🧊' : item.storageLocation === 'pantry' ? '🧂' : '❄️'}</span>
                                      <span>{item.name}</span>
                                    </button>
                                  ))}
                                  {dashboardInventory.length > 10 && (
                                    <span className="text-[10px] text-emerald-200 self-center font-bold">
                                      + อีก {dashboardInventory.length - 10} รายการ
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                onClick={() => handleOpenRecipeSearchWithIngredients(allIngredientNames)}
                                className="w-full py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-[0.98] font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles size={15} className="text-yellow-500" />
                                <span>ดึงของทั้งหมด ({dashboardInventory.length}) & คิดสูตร</span>
                              </button>
                              <button
                                onClick={() => handleOpenRecipeSearchWithIngredients(fridgeIngredientNames)}
                                className="w-full py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white active:scale-[0.98] font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
                              >
                                <span>❄️ ดึงเฉพาะของในตู้เย็น ({fridgeItems.length})</span>
                              </button>
                            </div>

                            {expiringItems.length > 0 && (
                              <button
                                onClick={() => handleOpenRecipeSearchWithIngredients(expiringIngredientNames)}
                                className="w-full mt-2 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-400/30"
                              >
                                <span>⚠️ คิดเมนูกู้วิกฤตของใกล้หมดอายุ ({expiringItems.length} อย่าง)</span>
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })()}

              {/* Health Data */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
                <button type="button" 
                  className="w-full flex items-center justify-between group"
                  onClick={() => setIsHealthDataOpen(!isHealthDataOpen)}
                >
                  <h3 className="font-bold text-neutral-900">ข้อมูลสุขภาพตอนเริ่มต้น</h3>
                  <ChevronUp size={20} className={`text-neutral-400 transition-transform duration-300 ${isHealthDataOpen ? '' : 'rotate-180'}`} />
                </button>
                
                <AnimatePresence>
                  {isHealthDataOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 space-y-6">
                        <div className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab('account')}>
                          <div>
                            <h4 className="font-bold text-neutral-900 text-sm mb-1">ดัชนีมวลกาย</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-neutral-500">BMI: {bmi}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bmiStatus.bg} ${bmiStatus.color}`}>
                                {bmiStatus.text}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-neutral-300 group-hover:text-orange-500 transition-colors" />
                        </div>
                        
                        <div className="h-px bg-neutral-100"></div>

                        <div className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab('account')}>
                          <div>
                            <h4 className="font-bold text-neutral-900 text-sm mb-1">อัตราการเผาผลาญพื้นฐาน</h4>
                            <span className="text-sm text-neutral-500">BMR: {bmr.toLocaleString()} แคลอรี</span>
                          </div>
                          <ChevronRight size={18} className="text-neutral-300 group-hover:text-orange-500 transition-colors" />
                        </div>

                        <div className="h-px bg-neutral-100"></div>

                        <div className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab('account')}>
                          <div>
                            <h4 className="font-bold text-neutral-900 text-sm mb-1">พลังงานที่ใช้ทั้งหมดต่อวัน (TDEE เผาผลาญจริง)</h4>
                            <span className="text-sm text-neutral-500">
                              {tdee.toLocaleString()} แคลอรี {safeDailyGoal < tdee 
                                ? `(TDEE > เป้าหมาย: ${safeDailyGoal.toLocaleString()} + Deficit ${(tdee - safeDailyGoal).toLocaleString()})` 
                                : safeDailyGoal > tdee 
                                  ? `(TDEE < เป้าหมาย: ${safeDailyGoal.toLocaleString()} - Surplus ${(safeDailyGoal - tdee).toLocaleString()})` 
                                  : '(เท่ากับเป้าหมาย)'}
                            </span>
                          </div>
                          <ChevronRight size={18} className="text-neutral-300 group-hover:text-orange-500 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            )
          )}

          {activeTab === 'account' && (
            <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">ข้อมูลบัญชีผู้ใช้</h1>
              </div>

              {/* Google Account Status Card */}
              <div className="bg-gradient-to-br from-white to-neutral-50/80 rounded-3xl p-6 shadow-sm border border-neutral-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {currentGoogleUser ? (
                      <div 
                        className="relative group cursor-pointer" 
                        onClick={() => profilePicInputRef.current?.click()}
                        title="เปลี่ยนรูปโปรไฟล์"
                      >
                        <img 
                          src={currentGoogleUser.picture} 
                          alt={currentGoogleUser.name} 
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-orange-200 shadow-xs group-hover:opacity-60 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={20} className="text-neutral-800 drop-shadow-md" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                        <User size={26} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-neutral-900">
                          {currentGoogleUser ? currentGoogleUser.name : 'ยังไม่ได้เชื่อมต่อ Google'}
                        </h2>
                        {currentGoogleUser && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            เชื่อมต่อแล้ว ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        {currentGoogleUser ? currentGoogleUser.email : 'เข้าสู่ระบบด้วย Google เพื่อสำรองข้อมูลและแยกโปรไฟล์เฉพาะคุณ'}
                      </p>
                      {currentGoogleUser?.loginTimestamp && (
                        <p className="text-[10px] text-neutral-400 mt-1">
                          เข้าสู่ระบบเมื่อ: {formatDateDMY(new Date(currentGoogleUser.loginTimestamp))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {currentGoogleUser ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowGoogleLoginModal(true)}
                          className="px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 transition-all cursor-pointer shadow-2xs"
                        >
                          สลับบัญชี Google
                        </button>
                        <button
                          type="button"
                          onClick={handleGoogleLogout}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 transition-all cursor-pointer shadow-2xs"
                        >
                          ออกจากระบบ
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowGoogleLoginModal(true)}
                        className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shadow-orange-500/20 flex items-center gap-1.5"
                      >
                        <LogIn size={15} />
                        <span>เข้าสู่ระบบด้วย Google</span>
                      </button>
                    )}
                  </div>
                </div>

                {currentGoogleUser && (
                  <div className="mt-4 pt-3.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${cloudSyncStatus === 'syncing' ? 'bg-amber-500 animate-ping' : cloudSyncStatus === 'synced' ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                        <Cloud size={14} className="text-indigo-600" />
                        <span>
                          {cloudSyncStatus === 'syncing' 
                            ? 'กำลังเชื่อมต่อและซิงค์ข้อมูลกับคลาวด์...' 
                            : cloudSyncStatus === 'synced' 
                            ? 'ซิงค์ข้อมูลกับคลาวด์แล้ว (เปิดได้ทุกอุปกรณ์/เบราว์เซอร์)' 
                            : 'ระบบคลาวด์พร้อมซิงค์'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSyncingWithCloud}
                      onClick={() => triggerManualCloudSync()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isSyncingWithCloud ? 'animate-spin' : ''} />
                      <span>{isSyncingWithCloud ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Biological Profile & Physical Metrics */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">ข้อมูลสรีระพื้นฐาน</h2>
                    <p className="text-xs text-neutral-500 font-medium">ใช้เป็นฐานในการคำนวณอัตราเผาผลาญ BMR & TDEE</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-200 text-xs font-semibold text-neutral-600">
                    <span>BMI: {bmi}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${bmiStatus.bg} ${bmiStatus.color}`}>
                      {bmiStatus.text}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">เพศ</label>
                  <div className="flex gap-2">
                    <button type="button" 
                      onClick={() => saveProfile({...userProfile, gender: 'male'}, true)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${userProfile.gender === 'male' ? 'bg-orange-100 text-orange-600 border border-orange-200 shadow-2xs' : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-transparent'}`}
                    >ชาย</button>
                    <button type="button" 
                      onClick={() => saveProfile({...userProfile, gender: 'female'}, true)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${userProfile.gender === 'female' ? 'bg-orange-100 text-orange-600 border border-orange-200 shadow-2xs' : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-transparent'}`}
                    >หญิง</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">อายุ (ปี)</label>
                  <input type="number" value={userProfile.age || 59} 
                    onChange={(e) => {
                      const updated = { ...userProfile, age: Number(e.target.value) };
                      setUserProfile(updated);
                      saveProfile(updated);
                    }} 
                    onBlur={() => saveProfile(userProfile, true)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 mb-1">น้ำหนักปัจจุบัน (กก.)</label>
                    <input type="number" value={userProfile.weight || 59} 
                      onChange={(e) => {
                        const updated = { ...userProfile, weight: Number(e.target.value) };
                        setUserProfile(updated);
                        saveProfile(updated);
                      }} 
                      onBlur={() => saveProfile(userProfile, true)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-orange-600 mb-1">น้ำหนักเป้าหมาย (กก.)</label>
                    <input type="number" value={userProfile.targetWeight || 59} 
                      onChange={(e) => {
                        const updated = { ...userProfile, targetWeight: Number(e.target.value) };
                        setUserProfile(updated);
                        saveProfile(updated);
                      }} 
                      onBlur={() => saveProfile(userProfile, true)}
                      className="w-full bg-orange-50/50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm font-bold text-orange-700 focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">ส่วนสูง (ซม.)</label>
                  <input type="number" value={userProfile.height || 167} 
                    onChange={(e) => {
                      const updated = { ...userProfile, height: Number(e.target.value) };
                      setUserProfile(updated);
                      saveProfile(updated);
                    }} 
                    onBlur={() => saveProfile(userProfile, true)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">ระดับกิจกรรมในชีวิตประจำวัน</label>
                  <select 
                    value={userProfile.activityLevel || 1.375} 
                    onChange={(e) => saveProfile({...userProfile, activityLevel: Number(e.target.value)}, true)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value={1.2}>ไม่ออกกำลังกายเลย / นั่งโต๊ะทำงานเป็นหลัก (1.2)</option>
                    <option value={1.375}>ออกกำลังกายเบาๆ 1-3 วัน/สัปดาห์ (1.375)</option>
                    <option value={1.55}>ออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์ (1.55)</option>
                    <option value={1.725}>ออกกำลังกายหนัก 6-7 วัน/สัปดาห์ (1.725)</option>
                    <option value={1.9}>ออกกำลังกายหนักมาก / นักกีฬาฝึกซ้อมทุกวัน (1.9)</option>
                  </select>
                </div>
              </div>

              {/* AI Macro & Protein Goal Calculator with Custom Overrides */}
              <AIMacroGoalCalculatorCard
                userProfile={userProfile}
                onSaveProfile={saveProfile}
                onToast={(msg) => setToasts(prev => [...prev, { id: Date.now().toString(), message: msg }])}
                onOpenDetailedModal={() => setShowCalorieGoalsModal(true)}
              />

              {/* Scheduled Push Notifications & Meal Reminders Card */}
              <MealReminderCard
                onOpenSettings={() => setShowReminderModal(true)}
                onToast={showToast}
              />

              {/* Accessibility & Display Settings Card (100% Functional) */}
              <AccessibilitySettingsCard
                onToast={showToast}
              />

              {/* Data Export & Backup Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <Download size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-base">ส่งออกข้อมูลโภชนาการ (Export Data)</h3>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        ดาวน์โหลดประวัติและข้อมูลสุขภาพทั้งหมดของคุณเป็นไฟล์ JSON
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-600">
                  <span className="flex items-center gap-1.5">
                    <Utensils size={14} className="text-neutral-400" />
                    ประวัติอาหารที่บันทึก
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-800 font-bold">
                    {history.length} รายการ
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                    exportSuccess 
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                      : 'bg-neutral-900 hover:bg-black text-white active:scale-[0.99] shadow-neutral-900/10'
                  }`}
                >
                  {exportSuccess ? (
                    <>
                      <Check size={18} className="text-white" />
                      ดาวน์โหลดไฟล์ JSON สำเร็จแล้ว
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      ส่งออกข้อมูลทั้งหมด (.JSON)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInsightsExportInitialSection('all');
                    setShowInsightsExportModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 shadow-xs active:scale-[0.99]"
                >
                  <FileSpreadsheet size={16} />
                  ส่งออกข้อมูลเชิงลึก & สถิติ (.CSV / .JSON / รายงาน)
                </button>

                <p className="text-[11px] text-neutral-400 text-center font-medium">
                  ให้คุณเป็นเจ้าของข้อมูล 100% สามารถนำไฟล์ JSON หรือสถิติไปสำรองหรือส่งต่อให้ผู้เชี่ยวชาญได้
                </p>
              </div>

              {/* Data Import & Restore Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-base">นำเข้าข้อมูล (Import Data)</h3>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        นำเข้าไฟล์ประวัติอาหาร (.JSON) หรือไฟล์สำรองข้อมูลกลับสู่ระบบ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hidden File Input for Account Import */}
                <input
                  type="file"
                  ref={accountImportFileRef}
                  accept=".json"
                  onChange={handleAccountImportFile}
                  className="hidden"
                />

                {/* Dropzone / Upload Box */}
                <div 
                  onClick={() => accountImportFileRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-5 text-center cursor-pointer transition-all group active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                    <Upload size={22} />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-800">
                    คลิกเพื่อเลือกไฟล์ข้อมูลสำรอง (.JSON)
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    รองรับทั้งไฟล์ส่งออก (.JSON) จาก GooKal และไฟล์สำรองข้อมูลทั้งระบบ
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => accountImportFileRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer active:scale-[0.99]"
                  >
                    <Upload size={16} />
                    <span>เลือกไฟล์ .JSON เพื่อนำเข้า</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBackupRestoreModal(true)}
                    className="py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 cursor-pointer active:scale-[0.99]"
                  >
                    <HardDrive size={16} className="text-neutral-500" />
                    <span>ศูนย์สำรอง & กู้คืนข้อมูล</span>
                  </button>
                </div>

                <p className="text-[11px] text-neutral-400 text-center font-medium">
                  เมื่อเลือกไฟล์ ระบบจะแสดงตัวอย่างข้อมูลและให้คุณเลือกว่าจะ &ldquo;ผสานรวมกับข้อมูลเดิม&rdquo; หรือ &ldquo;แทนที่ทั้งหมด&rdquo;
                </p>
              </div>

              {/* Offline & Service Worker Cache Status Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-base">ระบบออฟไลน์ & แคช</h3>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        {isOnline ? 'สถานะ: เชื่อมต่อออนไลน์ (Online)' : 'สถานะ: กำลังทำงานแบบออฟไลน์ (Offline)'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {isOnline ? 'เชื่อมต่อปกติ' : 'โหมดออฟไลน์'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100">
                    <span className="text-neutral-400 font-medium block text-[11px]">Service Worker</span>
                    <span className="text-neutral-900 font-bold mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      เปิดใช้งานแล้ว
                    </span>
                  </div>
                  <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100">
                    <span className="text-neutral-400 font-medium block text-[11px]">บันทึกในเครื่อง</span>
                    <span className="text-neutral-900 font-bold mt-0.5 flex items-center gap-1.5">
                      <HardDrive size={13} className="text-orange-500" />
                      {history.length} รายการ
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  ระบบ Service Worker ทำการแคชไฟล์แอปพลิเคชันไว้ในเครื่อง ทำให้คุณสามารถเปิดดูแดชบอร์ด ดูประวัติอาหารย้อนหลัง และส่งออกข้อมูลได้ตลอดเวลาแม้ไม่มีสัญญาณอินเทอร์เน็ต
                </p>
              </div>

              <div className="mt-4 mb-4">
                <button 
                  onClick={handleResetAllData}
                  className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 py-3.5 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Trash2 size={18} />
                  ล้างข้อมูลทั้งหมด (Reset All Data)
                </button>
                <p className="text-center text-xs font-medium text-neutral-400 mt-3">
                  ข้อมูลจะถูกลบออกจากอุปกรณ์นี้เท่านั้น
                </p>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            isLoadingInsights ? (
              <InsightsSkeleton />
            ) : (
            <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-300">
              {/* Header with Export Action */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">ข้อมูลเชิงลึก</h1>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">ภาพรวมสถิติโภชนาการและแนวโน้มสุขภาพ</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="รีเฟรชและคำนวณข้อมูลเชิงลึกใหม่"
                    onClick={() => {
                      setIsLoadingInsights(true);
                      setTimeout(() => {
                        setIsLoadingInsights(false);
                        showToast('📊 คำนวณและอัปเดตสถิติสุขภาพเชิงลึกเรียบร้อย');
                      }, 500);
                    }}
                    className="p-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-all active:scale-95 cursor-pointer"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInsightsExportInitialSection('all');
                      setShowInsightsExportModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download size={15} strokeWidth={2.5} />
                    <span>ส่งออกข้อมูล</span>
                  </button>
                </div>
              </div>

              {/* Energy Balance: Daily Deficit/Surplus & Accumulated Graph (1 Week) */}
              <EnergyBalanceChart
                history={history}
                tdee={tdee}
                dailyGoal={dailyGoal}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setActiveTab('dashboard');
                }}
              />
              
              {/* Card 1: Daily Calories Trend */}
              <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg tracking-tight">แคลอรีที่ได้รับ</h3>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">เปรียบเทียบกับเป้าหมาย {dailyGoal} kcal</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setInsightsExportInitialSection('calories');
                      setShowInsightsExportModal(true);
                    }}
                    title="ส่งออกหรือแชร์ข้อมูลแคลอรี"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 border border-neutral-200 hover:border-orange-200 shadow-xs text-xs font-semibold transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>ส่งออก</span>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-neutral-900 tracking-tight">
                      {(chartTimeframe === 'weekly' 
                        ? (weeklyData.reduce((acc, curr) => acc + curr.calories, 0) / (weeklyData.filter(d => d.calories > 0).length || 1))
                        : (monthlyData.reduce((acc, curr) => acc + curr.calories, 0) / (monthlyData.filter(d => d.calories > 0).length || 1))
                      ).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-sm font-bold text-neutral-500">kcal เฉลี่ยต่อวัน</span>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[3px] bg-[#22C55E]"></div>
                    <span className="text-xs font-bold text-neutral-500">คาร์บ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[3px] bg-[#3B82F6]"></div>
                    <span className="text-xs font-bold text-neutral-500">โปรตีน</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[3px] bg-[#FBBF24]"></div>
                    <span className="text-xs font-bold text-neutral-500">ไขมัน</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-neutral-400 font-medium">แตะที่แท่งกราฟเพื่อดูเมนูของวันนั้น</p>
                </div>
                <div className="flex bg-neutral-100/70 p-1.5 rounded-2xl mb-6">
                  <button type="button" 
                    onClick={() => setChartTimeframe('weekly')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${chartTimeframe === 'weekly' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
                  >
                    7 วันล่าสุด
                  </button>
                  <button type="button" 
                    onClick={() => setChartTimeframe('monthly')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${chartTimeframe === 'monthly' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
                  >
                    4 สัปดาห์
                  </button>
                </div>

                <div className="h-60 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartTimeframe === 'weekly' ? weeklyData : monthlyData} 
                      margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                      onClick={(data: any) => {
                        if (data && data.activePayload && data.activePayload.length > 0 && chartTimeframe === 'weekly') {
                          setSelectedDate(data.activePayload[0].payload.fullDate);
                          setActiveTab('dashboard');
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="name" interval={0} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#737373', fontWeight: 'bold' }} 
                        dy={10} 
                      />
                      <YAxis 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#737373', fontWeight: 'bold' }} 
                        dx={15}
                        tickCount={7}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #f5f5f5', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        formatter={(value, name) => {
                          if (name === 'calories') return null;
                          const labels: any = {
                            'carbsCals': 'คาร์บ',
                            'proteinCals': 'โปรตีน',
                            'fatCals': 'ไขมัน'
                          };
                          return [`${value} kcal`, labels[name] || name];
                        }}
                        labelStyle={{ color: '#171717', fontWeight: 'bold', marginBottom: '4px' }}
                        itemStyle={{ fontSize: '13px' }}
                      />
                      <ReferenceLine y={dailyGoal} stroke="#ea580c" strokeWidth={2} />
                      
                      <Bar dataKey="fatCals" stackId="a" fill="#FBBF24" radius={[0, 0, 6, 6]} maxBarSize={24} />
                      <Bar dataKey="proteinCals" stackId="a" fill="#3B82F6" maxBarSize={24} />
                      <Bar dataKey="carbsCals" stackId="a" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Doughnut Chart - Macro Calorie Distribution */}
              <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg tracking-tight">สัดส่วนพลังงานจากสารอาหาร</h3>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      {chartTimeframe === 'weekly' ? 'ภาพรวม 7 วันที่ผ่านมา' : 'ภาพรวม 4 สัปดาห์ที่ผ่านมา'}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setInsightsExportInitialSection('macros');
                      setShowInsightsExportModal(true);
                    }}
                    title="ส่งออกหรือแชร์สัดส่วนสารอาหาร"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 border border-neutral-200 hover:border-orange-200 shadow-xs text-xs font-semibold transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>ส่งออก</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
                  {/* Doughnut Chart */}
                  <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: '1px solid #f5f5f5', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                          formatter={(value: any, name: any, item: any) => {
                            const entry = item?.payload;
                            return [`${value.toLocaleString()} kcal (${entry?.percent || 0}%)`, name];
                          }}
                          labelStyle={{ color: '#171717', fontWeight: 'bold' }}
                        />
                        <Pie
                          data={totalMacroCals > 0 ? macroDistributionData : [{ name: 'ไม่มีข้อมูล', label: '-', value: 1, color: '#E5E7EB', percent: 0, icon: '' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={totalMacroCals > 0 ? 4 : 0}
                          dataKey="value"
                          stroke="none"
                        >
                          {totalMacroCals > 0 ? (
                            macroDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          ) : (
                            <Cell fill="#F3F4F6" />
                          )}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center text in Doughnut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">แคลอรีรวม</span>
                      <span className="text-xl font-black text-neutral-900">
                        {totalMacroCals.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400">kcal</span>
                    </div>
                  </div>

                  {/* Legend / Percent Breakdown List */}
                  <div className="flex flex-col gap-2.5 w-full sm:w-auto flex-1">
                    {macroDistributionData.map((macro, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3.5 h-3.5 rounded-md shrink-0" style={{ backgroundColor: macro.color }}></div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                              <span>{macro.icon}</span> {macro.label}
                            </span>
                            <span className="text-[11px] font-semibold text-neutral-400">
                              {macro.value.toLocaleString()} kcal
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-neutral-900">{macro.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: Protein intake */}
              <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg tracking-tight">โปรตีนที่ได้รับ</h3>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">เป้าหมาย {proteinGoal} กรัม/วัน</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setInsightsExportInitialSection('protein');
                      setShowInsightsExportModal(true);
                    }}
                    title="ส่งออกหรือแชร์ข้อมูลโปรตีน"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 border border-neutral-200 hover:border-orange-200 shadow-xs text-xs font-semibold transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>ส่งออก</span>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-neutral-900 tracking-tight">
                      {(chartTimeframe === 'weekly' 
                        ? (weeklyData.reduce((acc, curr) => acc + (curr.proteinGrams || 0), 0) / (weeklyData.filter(d => (d.proteinGrams || 0) > 0).length || 1))
                        : (monthlyData.reduce((acc, curr) => acc + (curr.proteinGrams || 0), 0) / (monthlyData.filter(d => (d.proteinGrams || 0) > 0).length || 1))
                      ).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-sm font-bold text-neutral-500">กรัมเฉลี่ยต่อวัน</span>
                  </div>
                </div>

                <div className="h-60 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartTimeframe === 'weekly' ? weeklyData : monthlyData} 
                      margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                      onClick={(data: any) => {
                        if (data && data.activePayload && data.activePayload.length > 0 && chartTimeframe === 'weekly') {
                          setSelectedDate(data.activePayload[0].payload.fullDate);
                          setActiveTab('dashboard');
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="name" interval={0} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#737373', fontWeight: 'bold' }} 
                        dy={10} 
                      />
                      <YAxis 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#737373', fontWeight: 'bold' }} 
                        dx={15}
                        tickCount={7}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #f5f5f5', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        formatter={(value, name) => {
                          return [`${value} g`, 'โปรตีน'];
                        }}
                        labelStyle={{ color: '#171717', fontWeight: 'bold', marginBottom: '4px' }}
                        itemStyle={{ fontSize: '13px' }}
                      />
                      <ReferenceLine y={proteinGoal} stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" />
                      
                      <Bar dataKey="proteinGrams" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Comprehensive Export Hub */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-[2rem] p-6 text-white shadow-xl mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                    <Download size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">ส่งออกข้อมูลเชิงลึกทั้งหมด (Export Insights)</h3>
                    <p className="text-xs text-neutral-400 font-medium">
                      บันทึกสถิติ แคลอรี สัดส่วนสารอาหาร และรายงานสุขภาพ
                    </p>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                  นำข้อมูลออกเป็นไฟล์ <strong>Excel/CSV</strong> สำหรับตารางคำนวณ, <strong>JSON</strong> สำหรับการพัฒนาต่อ, หรือ <strong>สรุปรายงานข้อความ</strong> เพื่อส่งปรึกษาเทรนเนอร์และนักโภชนาการ
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setInsightsExportInitialSection('all');
                    setShowInsightsExportModal(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.99] cursor-pointer"
                >
                  <FileSpreadsheet size={16} />
                  เปิดศูนย์ส่งออกข้อมูลเชิงลึก (Export Insights Center)
                </button>
              </div>
            </div>
            )
          )}

          {activeTab === 'scan' && (
            <div className="p-6 min-h-full flex flex-col animate-in fade-in duration-300">
              <AnimatePresence mode="wait">
                {!image && !result && !loading ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex flex-col items-center justify-center text-center py-6"
                  >
                    <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-6 relative shadow-inner shrink-0">
                      <div className="absolute inset-0 bg-orange-400/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                      <Camera size={48} className="text-orange-500" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-neutral-900 tracking-tight">
                      วิเคราะห์อาหารด้วย AI
                    </h2>
                    <p className="text-neutral-500 mb-8 max-w-[260px] leading-relaxed text-sm">
                      ถ่ายรูปอาหาร หรือพิมพ์ชื่ออาหาร GooKal จะคำนวณแคลอรี่และสารอาหารให้ทันทีอย่างแม่นยำ
                    </p>

                    {!isOnline && (
                      <div className="w-full bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-6 text-amber-900 text-xs flex items-start gap-2.5 text-left">
                        <WifiOff size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-950">อยู่ในโหมดออฟไลน์ (Offline Mode)</p>
                          <p className="text-amber-800 mt-0.5 leading-relaxed">
                            การสแกนอาหารด้วย AI จำเป็นต้องใช้อินเทอร์เน็ต แต่คุณยังสามารถเปิดดูบันทึกย้อนหลัง แดชบอร์ด และข้อมูลเชิงลึกได้ตามปกติ
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={galleryInputRef}
                      onChange={handleFileSelect}
                    />
                    
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={profilePicInputRef}
                      onChange={handleProfilePicSelect}
                    />

                    <div className="w-full space-y-4">
                      {/* Fast Alternate Scan Tools */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleSearchDefaultCategory('all');
                            setShowGoogleSearchModal(true);
                          }}
                          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Globe size={16} className="text-teal-600" />
                          <span>ค้นหา Google</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNutritionLabelModal(true)}
                          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Scan size={16} className="text-emerald-600" />
                          <span>สแกนฉลาก</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuickFoodAddModal(true)}
                          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/80 font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Zap size={16} className="text-orange-600" />
                          <span>30+ เมนูไทย</span>
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={triggerCamera}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white font-semibold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-neutral-900/20 active:scale-[0.98]"
                        >
                          <Camera size={20} />
                          <span>ถ่ายรูปอาหาร</span>
                        </button>
                        
                        <button
                          onClick={triggerGallery}
                          className="flex-1 bg-white border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 text-neutral-900 font-semibold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                        >
                          <ImageIcon size={20} />
                          <span>เลือกจากแกลลอรี่</span>
                        </button>
                      </div>

                      <div className="relative flex items-center gap-2 w-full mt-4">
                        <div className="flex-1 border-t border-neutral-200"></div>
                        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">หรือพิมพ์ชื่อ / สั่งด้วยเสียง</span>
                        <div className="flex-1 border-t border-neutral-200"></div>
                      </div>

                      {/* Main Voice Recording Active Banner */}
                      {isMainVoiceListening && (
                        <div className="w-full p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                            <span className="text-xs font-bold">🎙️ กำลังฟังเสียง... พูดชื่ออาหารได้เลย</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={toggleMainVoiceRecognition}
                              className="text-xs px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-colors"
                            >
                              เสร็จสิ้น
                            </button>
                            {textInput.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleMainVoiceRecognition();
                                  analyzeText();
                                }}
                                className="text-xs px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold cursor-pointer flex items-center gap-1 transition-colors"
                              >
                                <Sparkles size={12} className="text-amber-300" />
                                <span>วิเคราะห์ทันที</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 w-full items-center">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            id="main-food-input-text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && analyzeText()}
                            placeholder={isMainVoiceListening ? '🎙️ กำลังฟังเสียงของคุณ (พูดได้เลย)...' : 'พิมพ์ชื่ออาหาร หรือแตะไมค์เพื่อพูด...'}
                            className={`w-full bg-white border rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm ${
                              isMainVoiceListening 
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20' 
                                : 'border-neutral-200 focus:border-orange-500 focus:ring-orange-500/20'
                            }`}
                          />
                          {/* Inside-Input Microphone Button */}
                          <button
                            type="button"
                            id="main-food-voice-mic-btn"
                            onClick={toggleMainVoiceRecognition}
                            title={isMainVoiceListening ? 'หยุดบันทึกเสียง' : 'แตะไมค์เพื่อพูดชื่ออาหาร'}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all cursor-pointer ${
                              isMainVoiceListening
                                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                                : 'bg-neutral-100 hover:bg-orange-100 text-neutral-600 hover:text-orange-600 border border-neutral-200/80 shadow-2xs'
                            }`}
                          >
                            {isMainVoiceListening ? <MicOff size={16} /> : <Mic size={16} />}
                          </button>
                        </div>
                        
                        <button
                          id="main-food-analyze-btn"
                          onClick={analyzeText}
                          disabled={!textInput.trim() || loading}
                          className="bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Sparkles size={16} />
                          <span>วิเคราะห์</span>
                        </button>
                      </div>

                      {/* Frequent Meals: 10 Most Eaten Meals from History */}
                      <div className="w-full mt-6 pt-4 border-t border-neutral-100 text-left">
                        <div 
                          id="frequent-meals-toggle-header"
                          onClick={() => setIsFrequentMealsOpen(!isFrequentMealsOpen)}
                          className="flex items-center justify-between mb-3 cursor-pointer group select-none"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-orange-100 group-hover:bg-orange-200/80 text-orange-600 flex items-center justify-center shadow-2xs transition-colors">
                              <Repeat size={15} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-neutral-900 group-hover:text-orange-600 transition-colors flex items-center gap-1.5 flex-wrap">
                                <span>อาหารที่ทานเป็นประจำ</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/60">
                                  {frequentMeals.length} เมนูกินบ่อย
                                </span>
                              </h3>
                              <p className="text-[11px] text-neutral-400 font-medium">
                                {isFrequentMealsOpen 
                                  ? 'แตะเพื่อกรอกข้อมูลทันที หรือกดถังขยะเพื่อลบเมนูที่ไม่ต้องการ' 
                                  : 'แตะเพื่อเปิดรายการอาหารที่บันทึกบ่อย'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {hiddenFrequentMealIds.length > 0 && (
                              <button
                                type="button"
                                id="restore-frequent-meals-btn"
                                onClick={handleRestoreFrequentMeals}
                                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200/60 px-2 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer mr-1"
                                title="กู้คืนเมนูที่เคยลบออกไปทั้งหมด"
                              >
                                <RefreshCw size={11} />
                                <span>กู้คืน ({hiddenFrequentMealIds.length})</span>
                              </button>
                            )}
                            <span className="text-xs font-semibold text-neutral-400 group-hover:text-orange-500 transition-colors hidden sm:inline">
                              {isFrequentMealsOpen ? 'ยุบ' : 'ขยาย'}
                            </span>
                            <button
                              type="button"
                              id="frequent-meals-collapse-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsFrequentMealsOpen(!isFrequentMealsOpen);
                              }}
                              className="p-1.5 text-neutral-400 group-hover:text-orange-600 rounded-xl hover:bg-orange-50 transition-all cursor-pointer"
                              title={isFrequentMealsOpen ? "ยุบอาหารที่ทานเป็นประจำ" : "ขยายอาหารที่ทานเป็นประจำ"}
                            >
                              <ChevronUp size={18} className={`transition-transform duration-300 ${isFrequentMealsOpen ? '' : 'rotate-180'}`} />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {isFrequentMealsOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              {frequentMeals.length === 0 ? (
                                <div className="py-6 px-4 text-center rounded-2xl bg-neutral-50/80 border border-neutral-200/60 my-1 flex flex-col items-center justify-center gap-2">
                                  <Utensils size={24} className="text-neutral-400" />
                                  <p className="text-xs font-medium text-neutral-500">ไม่มีเมนูในรายการอาหารที่ทานเป็นประจำ</p>
                                  {hiddenFrequentMealIds.length > 0 && (
                                    <button
                                      type="button"
                                      id="restore-empty-frequent-meals-btn"
                                      onClick={handleRestoreFrequentMeals}
                                      className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer mt-1"
                                    >
                                      <RefreshCw size={13} />
                                      <span>กู้คืนเมนูทั้งหมด</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                  {frequentMeals.map((meal, index) => (
                                    <div
                                      key={meal.id || index}
                                      id={`frequent-meal-card-${index}`}
                                      onClick={() => handleSelectFrequentMeal(meal)}
                                      className="group relative bg-white hover:bg-orange-50/40 active:bg-orange-100/50 border border-neutral-200/80 hover:border-orange-300/80 rounded-2xl p-3 transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer flex items-center justify-between gap-2 text-left"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-7 h-7 rounded-xl bg-neutral-100 group-hover:bg-orange-100 text-neutral-600 group-hover:text-orange-600 flex items-center justify-center font-black text-xs shrink-0 transition-colors">
                                          {index + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <h4 className="text-xs font-bold text-neutral-900 truncate max-w-[130px] sm:max-w-[160px]">
                                              {meal.foodName}
                                            </h4>
                                            {meal.isFromHistory && meal.frequencyCount > 1 && (
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                                                ทาน {meal.frequencyCount}x
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 flex-wrap">
                                            <span className="font-bold text-orange-600">{meal.calories} kcal</span>
                                            <span className="text-neutral-300">•</span>
                                            <span>P: {meal.proteinGrams}g</span>
                                            <span className="text-neutral-300">•</span>
                                            <span>C: {meal.carbsGrams}g</span>
                                            <span className="text-neutral-300">•</span>
                                            <span>F: {meal.fatGrams}g</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          id={`quick-log-freq-${index}`}
                                          onClick={(e) => handleDirectLogFrequentMeal(meal, e)}
                                          title="บันทึกลงมื้ออาหารทันที (1-Tap Quick Save)"
                                          className="py-1.5 px-2 rounded-xl bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white transition-all border border-orange-200/60 hover:border-orange-500 shadow-2xs cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                        >
                                          <Zap size={12} />
                                          <span className="hidden xs:inline">บันทึก</span>
                                        </button>

                                        <button
                                          type="button"
                                          id={`delete-freq-meal-${index}`}
                                          onClick={(e) => handleRemoveFrequentMeal(meal, e)}
                                          title={`ลบ "${meal.foodName}" ออกจากเมนูที่ทานเป็นประจำ`}
                                          className="p-1.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-200/60 cursor-pointer"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result-state"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Image Preview or Text Placeholder */}
                    <div className="relative rounded-3xl overflow-hidden bg-neutral-200 shadow-sm aspect-square group flex items-center justify-center">
                      {image ? (
                        <img
                          src={image}
                          alt="Food preview"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-400">
                          <Utensils size={64} className="mb-4 opacity-50" />
                          <p className="font-medium text-lg">วิเคราะห์จากข้อความ</p>
                          {result && <p className="text-sm font-bold text-neutral-500 mt-2">"{result.foodName}"</p>}
                        </div>
                      )}
                      {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                          <Loader2 size={36} className="text-orange-500 animate-spin mb-2" />
                          <p className="text-neutral-900 font-bold text-sm tracking-tight">AI กำลังวิเคราะห์โภชนาการ...</p>
                        </div>
                      )}
                    </div>

                    {/* Structured Skeletal Loading Component during AI fetching */}
                    {loading && (
                      <div className="animate-in fade-in duration-300">
                        <AnalysisResultSkeleton />
                      </div>
                    )}

                    {/* Error State */}
                    {error && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex gap-3 items-start border border-red-100">
                        <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <p className="font-semibold text-sm">เกิดข้อผิดพลาด</p>
                          <p className="text-sm opacity-90 mt-0.5">{error}</p>
                        </div>
                      </div>
                    )}

                    {/* Result State */}
                    {result && !loading && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">{result.foodName}</h2>
                            <button
                              type="button"
                              id="tts-speak-food-btn"
                              onClick={handleSpeakAnalysisResult}
                              title={isSpeakingResult ? 'หยุดอ่านออกเสียง' : 'อ่านออกเสียงภาษาไทย (AI Voice)'}
                              className={`p-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer border ${
                                isSpeakingResult
                                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/20'
                                  : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 shadow-2xs'
                              }`}
                            >
                              {isSpeakingResult ? <VolumeX size={16} /> : <Volume2 size={16} />}
                              <span>{isSpeakingResult ? 'หยุดเสียง' : 'ฟังเสียง'}</span>
                            </button>
                          </div>
                          <div className="mb-3">
                            <NutritionSafetyBadge
                              calories={Math.round(result.calories * (portionMultiplier || 1.0))}
                              proteinGrams={Math.round(result.proteinGrams * (portionMultiplier || 1.0) * 10) / 10}
                              sugarGrams={result.sugarGrams !== undefined ? Math.round(result.sugarGrams * (portionMultiplier || 1.0) * 10) / 10 : undefined}
                              sodiumMg={result.sodiumMg !== undefined ? Math.round(result.sodiumMg * (portionMultiplier || 1.0)) : undefined}
                              foodName={result.foodName}
                            />
                          </div>
                          <p className="text-neutral-600 text-sm leading-relaxed bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">{result.explanation}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity size={16} className="text-orange-500" />
                              <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">แคลอรี่</span>
                            </div>
                            <p className="text-3xl font-black text-orange-600">
                              {Math.round(result.calories * (portionMultiplier || 1.0))}
                              <span className="text-sm font-bold text-orange-400 ml-1">kcal</span>
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-center gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">โปรตีน</span>
                              <span className="text-sm font-bold text-neutral-800">{Math.round(result.proteinGrams * (portionMultiplier || 1.0) * 10) / 10}g</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">คาร์บ</span>
                              <span className="text-sm font-bold text-neutral-800">{Math.round(result.carbsGrams * (portionMultiplier || 1.0) * 10) / 10}g</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase">ไขมัน</span>
                              <span className="text-sm font-bold text-neutral-800">{Math.round(result.fatGrams * (portionMultiplier || 1.0) * 10) / 10}g</span>
                            </div>
                          </div>
                        </div>

                        {(result.sugarGrams !== undefined || result.sodiumMg !== undefined ) && (
                          <div className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-center gap-3">
                            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">ข้อมูลโภชนาการเพิ่มเติม</h3>
                            <div className="grid grid-cols-3 gap-2">
                              {result.sugarGrams !== undefined && (
                                <div className="flex flex-col items-center">
                                  <span className="text-xl mb-1">🍭</span>
                                  <span className="text-xs font-bold text-neutral-800">{Math.round(result.sugarGrams * (portionMultiplier || 1.0) * 10) / 10}g</span>
                                  <span className="text-[9px] text-neutral-500">น้ำตาล</span>
                                </div>
                              )}
                              {result.sodiumMg !== undefined && (
                                <div className="flex flex-col items-center">
                                  <span className="text-xl mb-1">🧂</span>
                                  <span className="text-xs font-bold text-neutral-800">{Math.round(result.sodiumMg * (portionMultiplier || 1.0))}mg</span>
                                  <span className="text-[9px] text-neutral-500">โซเดียม</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Portion Multiplier Selector */}
                        <MealPortionSelector
                          currentMultiplier={portionMultiplier}
                          onMultiplierChange={setPortionMultiplier}
                          baseCalories={result.calories}
                          baseProtein={result.proteinGrams}
                          baseCarbs={result.carbsGrams}
                          baseFat={result.fatGrams}
                        />

                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-neutral-100">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">บันทึกเป็นมื้ออาหาร</h3>
                              <p className="text-[11px] font-bold text-orange-600 mt-0.5">
                                วันที่: {formatDateDMY(selectedDate)} ({formatDateDMYShort(selectedDate)})
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200/80 rounded-xl px-2.5 py-1.5">
                              <Calendar size={13} className="text-neutral-400" />
                              <input 
                                type="date" 
                                value={getLocalISODate(selectedDate)}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="text-xs font-bold text-neutral-700 bg-transparent outline-none cursor-pointer"
                                max={getLocalISODate(new Date())}
                                title="เลือกวันที่ (วัน/เดือน/ปี)"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(Object.keys(mealLabels) as MealType[]).map((mealKey) => {
                              const MealIcon = mealLabels[mealKey].icon;
                              const isSelected = selectedMeal === mealKey;
                              return (
                                <button
                                  key={mealKey}
                                  onClick={() => setSelectedMeal(mealKey)}
                                  className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                                    isSelected 
                                      ? 'bg-neutral-900 text-white shadow-md' 
                                      : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                                  }`}
                                >
                                  <MealIcon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                                  <span className="text-[10px] font-bold">{mealLabels[mealKey].label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={resetApp}
                            className="flex-1 py-4 rounded-2xl font-bold text-neutral-500 bg-white border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-all"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={saveToHistory}
                            className="flex-[2] py-4 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/30"
                          >
                            บันทึกข้อมูล
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="p-6 animate-in fade-in duration-300">
              {/* Header & Date Navigation */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 tracking-tight">ไดอารี่โภชนาการ</h2>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{formatFullThaiDate(displayDate, true)}</span>
                      <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                        {formatDateDMY(displayDate)}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDiaryMonthCalendar(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        showDiaryMonthCalendar
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <CalendarDays size={14} />
                      <span>{showDiaryMonthCalendar ? 'มุมมอง 7 วัน' : 'ทั้งเดือน'}</span>
                    </button>

                    <div className="relative flex items-center bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 hover:border-orange-400 focus-within:border-orange-500 shadow-2xs">
                      <Calendar size={13} className="text-orange-500 mr-1.5 shrink-0" />
                      <span className="text-xs font-bold text-neutral-800 tracking-tight select-none mr-1">
                        {formatDateDMY(selectedDate)}
                      </span>
                      <input 
                        type="date" 
                        value={getLocalISODate(selectedDate)}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedDate(new Date(e.target.value));
                            setDiaryCalendarMonth(new Date(e.target.value));
                          }
                        }}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        max={getLocalISODate(new Date())}
                        title="เปลี่ยนวันที่ (วัน/เดือน/ปี)"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Diary Action Bar */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomMealsModal(true)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/80 text-[10px] font-bold transition-all shadow-2xs"
                  >
                    <Heart size={13} className="text-pink-500 mb-0.5" />
                    <span>เมนูโปรด</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCopyYesterdayModal(true)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold transition-all shadow-2xs"
                  >
                    <Copy size={13} className="text-emerald-500 mb-0.5" />
                    <span>ลอกเมื่อวาน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQuickFoodAddModal(true)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 text-[10px] font-bold transition-all shadow-2xs"
                  >
                    <Zap size={13} className="text-orange-500 mb-0.5" />
                    <span>เพิ่มด่วน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMealSwapsModal(true)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[10px] font-bold transition-all shadow-2xs"
                  >
                    <ArrowRightLeft size={13} className="text-blue-500 mb-0.5" />
                    <span>สลับเมนู</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDailyMoodModal(true)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 text-[10px] font-bold transition-all shadow-2xs"
                  >
                    <Smile size={13} className="text-amber-500 mb-0.5" />
                    <span>อารมณ์/ย่อย</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Clean Food Quick Log Presets */}
              <div className="mb-4">
                <QuickCleanPresetBar
                  selectedMeal={selectedMeal}
                  onQuickLog={(preset) => {
                    const newItem: HistoryItem = {
                      id: `preset-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                      foodName: preset.name,
                      calories: preset.calories,
                      proteinGrams: preset.protein,
                      carbsGrams: preset.carbs,
                      fatGrams: preset.fat,
                      sugarGrams: preset.sugar,
                      sodiumMg: preset.sodium,
                      date: selectedDate.getTime(),
                      image: '',
                      mealType: selectedMeal,
                      explanation: `บันทึกด่วน 1-Click Clean Preset (${preset.portion})`
                    };
                    const newHistory = [newItem, ...history];
                    updateAndPersistHistory(newHistory);
                    playSuccessChime();
                    triggerHaptic(25);
                    showToast(`⚡ บันทึก "${preset.name}" (${preset.calories} kcal) ลงในมื้อ${mealLabels[selectedMeal].label} เรียบร้อย!`);
                  }}
                />
              </div>

              {/* 7 Days Donut Strip (Matching Dashboard) */}
              {!showDiaryMonthCalendar ? (
                <div className="flex gap-1.5 w-full justify-between mb-6">
                  {past7Days.map((date, i) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    
                    const dayHistory = (history || []).filter(item => isSameDay(new Date(item.date), date));
                    const carbsGrams = dayHistory.reduce((sum, item) => sum + (item?.carbsGrams || 0), 0);
                    const proteinGrams = dayHistory.reduce((sum, item) => sum + (item?.proteinGrams || 0), 0);
                    const fatGrams = dayHistory.reduce((sum, item) => sum + (item?.fatGrams || 0), 0);
                    const totalMacros = carbsGrams + proteinGrams + fatGrams;
                    const carbsPct = totalMacros > 0 ? (carbsGrams / totalMacros) * 100 : 0;
                    const proteinPct = totalMacros > 0 ? (proteinGrams / totalMacros) * 100 : 0;
                    const fatPct = totalMacros > 0 ? (fatGrams / totalMacros) * 100 : 0;

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all shadow-sm ${
                          isSelected 
                            ? 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-1 ring-offset-neutral-50' 
                            : 'bg-white text-neutral-500 border border-neutral-100 hover:bg-neutral-50 active:scale-95'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase mb-1">
                          {date?.toLocaleDateString('th-TH', { weekday: 'short' })}
                        </span>
                        <div className="relative w-8 h-8 flex items-center justify-center mb-1">
                          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                            {totalMacros > 0 ? (
                              <>
                                {/* Carbs */}
                                <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#22c55e" strokeWidth="3.5" strokeDasharray={`${carbsPct} 100`} strokeDashoffset="0" />
                                {/* Protein */}
                                <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray={`${proteinPct} 100`} strokeDashoffset={`-${carbsPct}`} />
                                {/* Fat */}
                                <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray={`${fatPct} 100`} strokeDashoffset={`-${carbsPct + proteinPct}`} />
                              </>
                            ) : (
                              <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke={isSelected ? "rgba(255,255,255,0.3)" : "#f5f5f5"} strokeWidth="3.5" />
                            )}
                          </svg>
                          <span className={`relative text-sm sm:text-base font-black ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                            {date.getDate()}
                          </span>
                        </div>
                        {isToday && (
                          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Full Month Calendar View with Macro Donut Graphs on each day */
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 mb-6 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newM = new Date(diaryCalendarMonth);
                        newM.setMonth(newM.getMonth() - 1);
                        setDiaryCalendarMonth(newM);
                      }}
                      className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-600 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold text-neutral-900">
                      {diaryCalendarMonth?.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newM = new Date(diaryCalendarMonth);
                        newM.setMonth(newM.getMonth() + 1);
                        setDiaryCalendarMonth(newM);
                      }}
                      className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-600 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Day of week headers */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((dayName, idx) => (
                      <span key={idx} className="text-[11px] font-bold text-neutral-400">
                        {dayName}
                      </span>
                    ))}
                  </div>

                  {/* Month Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {(() => {
                      const year = diaryCalendarMonth.getFullYear();
                      const month = diaryCalendarMonth.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const cells: React.ReactNode[] = [];

                      // Empty slots before 1st of month
                      for (let i = 0; i < firstDay.getDay(); i++) {
                        cells.push(<div key={`empty-${i}`} className="h-12 w-full" />);
                      }

                      // Month days
                      for (let d = 1; d <= lastDay.getDate(); d++) {
                        const dayDate = new Date(year, month, d);
                        const isSelected = isSameDay(dayDate, selectedDate);
                        const isToday = isSameDay(dayDate, new Date());
                        const dayHistory = (history || []).filter(item => isSameDay(new Date(item.date), dayDate));
                        const dayCalories = dayHistory.reduce((sum, item) => sum + (item?.calories || 0), 0);
                        const carbsGrams = dayHistory.reduce((sum, item) => sum + (item?.carbsGrams || 0), 0);
                        const proteinGrams = dayHistory.reduce((sum, item) => sum + (item?.proteinGrams || 0), 0);
                        const fatGrams = dayHistory.reduce((sum, item) => sum + (item?.fatGrams || 0), 0);
                        const totalMacros = carbsGrams + proteinGrams + fatGrams;
                        const carbsPct = totalMacros > 0 ? (carbsGrams / totalMacros) * 100 : 0;
                        const proteinPct = totalMacros > 0 ? (proteinGrams / totalMacros) * 100 : 0;
                        const fatPct = totalMacros > 0 ? (fatGrams / totalMacros) * 100 : 0;

                        cells.push(
                          <button
                            key={`day-${d}`}
                            type="button"
                            onClick={() => setSelectedDate(dayDate)}
                            className={`h-13 flex flex-col items-center justify-center p-1 rounded-xl transition-all relative ${
                              isSelected
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                : 'bg-neutral-50/70 hover:bg-neutral-100 text-neutral-700 border border-neutral-100'
                            }`}
                          >
                            <div className="relative w-6 h-6 flex items-center justify-center">
                              <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                {totalMacros > 0 ? (
                                  <>
                                    <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#22c55e" strokeWidth="4" strokeDasharray={`${carbsPct} 100`} strokeDashoffset="0" />
                                    <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${proteinPct} 100`} strokeDashoffset={`-${carbsPct}`} />
                                    <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke="#fbbf24" strokeWidth="4" strokeDasharray={`${fatPct} 100`} strokeDashoffset={`-${carbsPct + proteinPct}`} />
                                  </>
                                ) : (
                                  <circle cx="18" cy="18" r="15.91549431" fill="transparent" stroke={isSelected ? "rgba(255,255,255,0.2)" : "#e5e5e5"} strokeWidth="3" />
                                )}
                              </svg>
                              <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-neutral-800'}`}>
                                {d}
                              </span>
                            </div>
                            {dayCalories > 0 && (
                              <span className={`text-[9px] font-bold mt-0.5 leading-none truncate max-w-full ${isSelected ? 'text-orange-100' : 'text-neutral-500'}`}>
                                {dayCalories}
                              </span>
                            )}
                            {isToday && (
                              <div className={`w-1 h-1 rounded-full absolute top-1 right-1 ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                            )}
                          </button>
                        );
                      }

                      return cells;
                    })()}
                  </div>

                  {/* Donut Legend */}
                  <div className="flex items-center justify-center gap-3 pt-3 mt-3 border-t border-neutral-100 text-[11px] font-semibold text-neutral-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> คาร์บ</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span> โปรตีน</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FBBF24]"></span> ไขมัน</span>
                  </div>
                </div>
              )}

              {/* Day Nutrition Donut Overview Card */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
                      🔥
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">สรุปโภชนาการประจำวัน</h3>
                      <p className="text-[11px] text-neutral-400 font-medium">
                        {(totalCaloriesDisplay || 0).toLocaleString()} / {(dailyGoal || 2000).toLocaleString()} kcal ({Math.round(((totalCaloriesDisplay || 0) / (dailyGoal || 2000)) * 100) || 0}%)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('coach')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition-all active:scale-95"
                  >
                    <Bot size={14} className="text-orange-500" />
                    <span>ตรวจการบ้าน</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-neutral-100">
                  <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 block">🍞 คาร์บ</span>
                    <span className="text-sm font-black text-emerald-900">{totalCarbs}g</span>
                    <span className="text-[10px] text-emerald-600 font-medium block">/ {carbsGoal}g</span>
                  </div>
                  <div className="bg-blue-50/70 p-2.5 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-700 block">🥩 โปรตีน</span>
                    <span className="text-sm font-black text-blue-900">{totalProtein}g</span>
                    <span className="text-[10px] text-blue-600 font-medium block">/ {proteinGoal}g</span>
                  </div>
                  <div className="bg-amber-50/70 p-2.5 rounded-2xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-700 block">🥑 ไขมัน</span>
                    <span className="text-sm font-black text-amber-900">{totalFat}g</span>
                    <span className="text-[10px] text-amber-600 font-medium block">/ {fatGoal}g</span>
                  </div>
                </div>
              </div>

              {/* Nutrient Quality Score Card */}
              <div className="mb-6">
                <NutrientQualityScoreCard
                  dayMeals={displayHistory}
                  historyItems={displayHistory}
                  calorieTarget={dailyGoal}
                  calorieGoal={dailyGoal}
                  proteinGoal={proteinGoal}
                  waterTotalMl={getWaterTotalMlForDate(selectedDate)}
                  waterIntakeMl={getWaterTotalMlForDate(selectedDate)}
                />
              </div>

              {/* Meal Search, Filter, and Sort Toolbar */}
              <div className="bg-white rounded-2xl p-3.5 shadow-2xs border border-neutral-100 mb-6 space-y-2.5">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่ออาหารในบันทึก..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-8 py-2 text-xs text-neutral-800 placeholder-neutral-400 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Meal Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setHistoryMealFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        historyMealFilter === 'all'
                          ? 'bg-orange-500 text-white shadow-2xs'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    {(Object.keys(mealLabels) as MealType[]).map((mKey) => (
                      <button
                        key={mKey}
                        type="button"
                        onClick={() => setHistoryMealFilter(mKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                          historyMealFilter === mKey
                            ? 'bg-orange-500 text-white shadow-2xs'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {mealLabels[mKey].label}
                      </button>
                    ))}
                  </div>

                  {/* Sort Order Select */}
                  <div className="flex items-center gap-1 shrink-0">
                    <ArrowUpDown size={12} className="text-neutral-400" />
                    <select
                      value={historySortBy}
                      onChange={(e) => setHistorySortBy(e.target.value as any)}
                      className="bg-neutral-50 text-[11px] font-bold text-neutral-700 border border-neutral-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="time_desc">ล่าสุด</option>
                      <option value="calories_desc">แคลฯ สูงสุด</option>
                      <option value="calories_asc">แคลฯ น้อยสุด</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {(Object.keys(mealLabels) as MealType[])
                  .filter(mealKey => historyMealFilter === 'all' || historyMealFilter === mealKey)
                  .map((mealKey) => {
                  let mealItems = displayHistory.filter(item => item.mealType === mealKey);
                  
                  if (historySearchQuery.trim()) {
                    const q = historySearchQuery.toLowerCase().trim();
                    mealItems = mealItems.filter(item => 
                      item.foodName.toLowerCase().includes(q) || 
                      (item.explanation && item.explanation.toLowerCase().includes(q))
                    );
                  }

                  if (historySortBy === 'calories_desc') {
                    mealItems.sort((a, b) => b.calories - a.calories);
                  } else if (historySortBy === 'calories_asc') {
                    mealItems.sort((a, b) => a.calories - b.calories);
                  } else {
                    mealItems.sort((a, b) => b.date - a.date);
                  }

                  const MealIcon = mealLabels[mealKey].icon;
                  const mealCalories = (mealItems || []).reduce((sum, item) => sum + (item?.calories || 0), 0);
                  
                  return (
                    <div key={mealKey} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <MealIcon size={18} className="text-neutral-400" />
                          <h3 className="font-bold text-neutral-800 text-sm">{mealLabels[mealKey].label}</h3>
                          <span className="text-xs font-bold text-neutral-400 ml-1">{mealCalories} kcal</span>
                        </div>
                        <button
                          onClick={() => { setSelectedMeal(mealKey); setActiveTab('scan'); resetApp(); }}
                          className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors px-3 py-1.5 rounded-full flex items-center gap-1"
                        >
                          <Plus size={14} /> เพิ่มอาหาร
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <AnimatePresence initial={false} mode="popLayout">
                          {mealItems.length === 0 ? (
                            <motion.div
                              key={`empty-${mealKey}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="bg-neutral-50/50 border border-neutral-100 border-dashed rounded-2xl p-4 text-center"
                            >
                              <p className="text-xs font-medium text-neutral-400">ยังไม่มีรายการอาหาร</p>
                            </motion.div>
                          ) : (
                            mealItems.map((item) => (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.9,
                                  x: -24,
                                  transition: { duration: 0.22, ease: 'easeOut' }
                                }}
                                transition={{
                                  layout: { type: 'spring', stiffness: 350, damping: 30 },
                                  opacity: { duration: 0.2 }
                                }}
                                className="bg-white p-3.5 rounded-2xl shadow-xs border border-neutral-100 flex flex-col gap-2 group relative overflow-hidden"
                              >
                                <div className="flex gap-3 items-center">
                                  {item.image ? (
                                    <img src={item.image} alt={item.foodName} className="w-16 h-16 rounded-xl object-cover shrink-0 bg-neutral-100" />
                                  ) : (
                                    <div className="w-16 h-16 rounded-xl shrink-0 bg-neutral-100 flex items-center justify-center">
                                      <Utensils size={24} className="text-neutral-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 pr-1">
                                    <h4 className="font-bold text-neutral-900 truncate text-sm">{item.foodName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-bold text-orange-600">{item.calories} kcal</span>
                                      <span className="text-[10px] text-neutral-300">•</span>
                                      <span className="text-[11px] font-medium text-neutral-500">P:{item.proteinGrams}g C:{item.carbsGrams}g F:{item.fatGrams}g</span>
                                    </div>
                                    <div className="mt-1.5">
                                      <NutritionSafetyBadge
                                        calories={item.calories}
                                        proteinGrams={item.proteinGrams}
                                        sugarGrams={item.sugarGrams}
                                        sodiumMg={item.sodiumMg}
                                        foodName={item.foodName}
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteHistoryItem(item.id, item.foodName);
                                    }}
                                    className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl transition-all cursor-pointer"
                                    title={`ลบ "${item.foodName}"`}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>

                                {/* AI Coach & Swap Action Bar for this meal */}
                                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                                    <Sparkles size={13} className="text-orange-500" />
                                    <span>มื้อ{mealLabels[item.mealType]?.label || item.mealType}</span>
                                  </span>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setShowMealSwapsModal(true)}
                                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                                    >
                                      <ArrowRightLeft size={12} className="text-blue-500" />
                                      <span>สลับเมนู</span>
                                    </button>

                                    <button
                                      onClick={() => setActiveTab('coach')}
                                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                                    >
                                      <Bot size={13} className="text-orange-500" />
                                      <span>ปรึกษาโค้ช AI</span>
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personal AI Coach Tab */}
          {activeTab === 'coach' && (
            <div className="p-4 sm:p-6 animate-in fade-in duration-300">
              <PersonalAICoach
                userProfile={userProfile}
                bmr={bmr}
                tdee={tdee}
                calorieTarget={dailyGoal}
                proteinTarget={proteinGoal}
                carbsTarget={carbsGoal}
                fatTarget={fatGoal}
                todayCalories={totalCaloriesDisplay}
                todayProtein={totalProtein}
                todayCarbs={totalCarbs}
                todayFat={totalFat}
                recentMeals={(displayHistory || []).map(m => ({
                  id: m.id,
                  foodName: m.foodName,
                  calories: m.calories,
                  proteinGrams: m.proteinGrams,
                  carbsGrams: m.carbsGrams,
                  fatGrams: m.fatGrams,
                  mealType: (mealLabels[m.mealType] && mealLabels[m.mealType].label) || m.mealType || 'อาหาร'
                }))}
                allHistory={(history || []).map(m => ({
                  id: m.id,
                  date: m.date ? new Date(m.date).toISOString() : new Date().toISOString(),
                  foodName: m.foodName,
                  calories: m.calories,
                  proteinGrams: m.proteinGrams,
                  carbsGrams: m.carbsGrams,
                  fatGrams: m.fatGrams,
                  mealType: (mealLabels[m.mealType] && mealLabels[m.mealType].label) || m.mealType || 'อาหาร'
                }))}
                initialAuditDate={getLocalISODate(selectedDate)}
                onToast={showToast}
                onOpenRecipes={() => setActiveTab('recipes')}
                onUpdateProfile={(updatedProfile) => saveProfile(updatedProfile)}
              />
            </div>
          )}

          {/* Healthy Recipe Search Tab */}
          {activeTab === 'recipes' && (
            <div className="p-4 sm:p-6 animate-in fade-in duration-300">
              <HealthyRecipeSearch
                initialIngredients={recipeSearchIngredients}
                onLogMeal={handleLogRecipeMeal}
                onToast={showToast}
                onBack={() => setActiveTab('dashboard')}
                onOpenFridgeManager={() => setShowFridgeManagerModal(true)}
              />
            </div>
          )}

          {/* Health Center (ศูนย์สุขภาพ) Tab */}
          {activeTab === 'health' && (
            <div className="animate-in fade-in duration-300">
              <HealthCenterDashboard
                userProfile={{
                  age: userProfile.age || 28,
                  gender: userProfile.gender || 'male',
                  weight: userProfile.weight || 65,
                  height: userProfile.height || 170,
                  activityLevel: userProfile.activityLevel === 1.2 ? 'sedentary' : userProfile.activityLevel === 1.375 ? 'light' : userProfile.activityLevel === 1.55 ? 'moderate' : userProfile.activityLevel === 1.725 ? 'very_active' : 'extra_active',
                  targetWeight: userProfile.targetWeight
                }}
                todayCalories={totalCaloriesDisplay}
                calorieTarget={dailyGoal}
                todayProtein={totalProtein}
                proteinTarget={proteinGoal}
                todayWaterMl={getWaterTotalMlForDate(selectedDate)}
                waterTargetMl={2000}
                fastingHoursElapsed={14}
                fastingTargetHours={16}
                onToast={showToast}
                onOpenStreak={() => setShowStreakModal(true)}
                onOpenQuickFoodAdd={() => setShowQuickFoodAddModal(true)}
                onOpenNutritionLabel={() => setShowNutritionLabelModal(true)}
                onOpenMealSwaps={() => setShowMealSwapsModal(true)}
                onOpenCustomMeals={() => setShowCustomMealsModal(true)}
                onOpenGrocery={() => setShowGroceryModal(true)}
                onOpenDailyMood={() => setShowDailyMoodModal(true)}
                onOpenBodyTracker={() => setShowBodyTrackerModal(true)}
                onOpenCalorieGoals={() => setShowCalorieGoalsModal(true)}
                onOpenClinicalReport={() => setShowClinicalReportModal(true)}
                onOpenMetabolicAge={() => setShowMetabolicAgeModal(true)}
                onOpenGlucoseCrash={() => setShowGlucoseModal(true)}
                onOpenMicrobiome={() => setShowMicrobiomeModal(true)}
                onOpenCaffeineDecay={() => setShowCaffeineDecayModal(true)}
                onOpenChronoNutrition={() => setShowChronoNutritionModal(true)}
                onOpenHydrationOptimizer={() => setShowHydrationOptimizerModal(true)}
                onOpenPostMealWalk={() => setShowPostMealWalkModal(true)}
                onOpenCravingSOS={() => setShowCravingSOSModal(true)}
                onOpenVisualPhotoFat={() => setShowVisualPhotoModal(true)}
                onOpenBiomarkerSync={() => setShowBiomarkerSyncModal(true)}
                onOpenDiningMenu={() => setShowDiningMenuModal(true)}
                onOpenExerciseBurn={() => setShowExerciseBurnModal(true)}
                onOpenLongevity={() => setShowLongevityModal(true)}
                onOpenFastingStages={() => setShowFastingStagesModal(true)}
                onOpenFridgeManager={() => setShowFridgeManagerModal(true)}
                onOpenSmartPantry={() => setShowSmartPantryModal(true)}
                onOpenCookingAvatar={() => setShowCookingAvatarModal(true)}
                onOpenHealthyPlate={() => setShowHealthyPlateModal(true)}
                onOpenMetabolicHeatmap={() => setShowMetabolicHeatmapModal(true)}
                onOpenAllergySafety={() => setShowAllergySafetyModal(true)}
                onOpenCheatMeal={() => setShowCheatMealModal(true)}
                onOpenHabitStack={() => setShowHabitStackModal(true)}
                onOpenSocialStory={() => setShowSocialStoryModal(true)}
                onOpenStreetFood={() => setShowStreetFoodModal(true)}
                onOpenWeeklyMealPlanner={() => setShowWeeklyMealPlannerModal(true)}
                onOpenSmartBarcode={() => setShowSmartBarcodeModal(true)}
                onOpenMicronutrient={() => setShowMicronutrientModal(true)}
                onOpenBackupRestore={() => setShowBackupRestoreModal(true)}
                onUpdateProfileWeight={(newWeight) => {
                  const updated = { ...userProfile, weight: newWeight };
                  setUserProfile(updated);
                  saveProfile(updated);
                }}
              />
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 pt-1.5 px-2 sm:px-4 flex justify-between items-center z-20 pb-safe pb-3 shadow-lg">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedDate(new Date()); }}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'dashboard' ? 'text-orange-600 font-black' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <Home size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} className="mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">แดชบอร์ด</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('history'); setSelectedDate(new Date()); }}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'history' ? 'text-orange-600 font-black' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <Calendar size={20} strokeWidth={activeTab === 'history' ? 2.5 : 2} className="mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">ไดอารี่</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'health' ? 'text-emerald-600 font-black' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <Heart size={20} strokeWidth={activeTab === 'health' ? 2.5 : 2} className="mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">สุขภาพ</span>
          </button>

          <button
            onClick={() => { setActiveTab('scan'); resetApp(); }}
            className={`relative -top-3 w-11 h-11 bg-neutral-900 rounded-full flex items-center justify-center text-white shadow-xl shadow-neutral-900/30 transition-transform active:scale-95 ${activeTab === 'scan' ? 'bg-orange-500 shadow-orange-500/30' : ''}`}
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'insights' ? 'text-orange-600 font-black' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <BarChart2 size={20} strokeWidth={activeTab === 'insights' ? 2.5 : 2} className="mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">เชิงลึก</span>
          </button>

          <button
            onClick={() => setActiveTab('coach')}
            className={`flex flex-col items-center p-1.5 transition-colors relative ${activeTab === 'coach' ? 'text-orange-600 font-black' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <Bot size={20} strokeWidth={activeTab === 'coach' ? 2.5 : 2} className="mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">โค้ช AI</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center p-1.5 transition-colors ${activeTab === 'account' ? 'text-orange-600 font-black' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <User size={20} strokeWidth={activeTab === 'account' ? 2.5 : 2} className="mb-0.5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">บัญชี</span>
          </button>
        </nav>

        {/* Interactive In-App Meal Reminder Popup Banner */}
        <InAppMealNotificationBanner
          reminder={activeInAppReminder}
          onDismiss={() => setActiveInAppReminder(null)}
          onScanNow={(mealType) => {
            setActiveTab('scan');
            if (mealType) {
              setSelectedMeal(mealType);
            }
          }}
        />

        {/* Scheduled Meal Reminder Settings Modal */}
        <MealReminderModal
          isOpen={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setReminderSettings(loadReminderSettings());
          }}
          onToast={showToast}
          onOpenScanTab={() => {
            setShowReminderModal(false);
            setActiveTab('scan');
          }}
        />

        {/* Quick Food Add Modal */}
        <QuickFoodAddModal
          isOpen={showQuickFoodAddModal}
          onClose={() => setShowQuickFoodAddModal(false)}
          onSelectFood={handleSelectFoodFromDatabase}
          onToast={showToast}
        />

        {/* Google Search Grounding Intelligence Modal */}
        <GoogleGroundingSearchModal
          isOpen={showGoogleSearchModal}
          onClose={() => setShowGoogleSearchModal(false)}
          onLogMeal={handleLogGroundedSearchMeal}
          onToast={showToast}
          defaultCategory={googleSearchDefaultCategory}
        />

        {/* Nutrition Label Scanner Modal */}
        <NutritionLabelScannerModal
          isOpen={showNutritionLabelModal}
          onClose={() => setShowNutritionLabelModal(false)}
          onLogMeal={handleLogScannedNutritionLabel}
          onToast={showToast}
        />

        {/* Custom Meal Library Modal */}
        <CustomMealLibraryModal
          isOpen={showCustomMealsModal}
          onClose={() => setShowCustomMealsModal(false)}
          onLogMeal={handleLogCustomMeal}
          onToast={showToast}
        />

        {/* Calorie & Macro Target Goal Modal */}
        <CalorieTargetGoalModal
          isOpen={showCalorieGoalsModal}
          onClose={() => setShowCalorieGoalsModal(false)}
          userProfile={userProfile}
          currentWeight={userProfile.weight}
          targetWeight={userProfile.targetWeight || 59}
          height={userProfile.height}
          age={userProfile.age}
          gender={userProfile.gender}
          activityLevel={userProfile.activityLevel}
          bmr={bmr}
          tdee={calculatedTdee || tdee}
          currentTdee={tdee}
          onSave={handleSaveCalorieGoals}
          onSaveGoal={handleSaveCalorieGoals}
          onSaveProfile={(p) => saveProfile(p, true)}
          onToast={showToast}
        />

        {/* Grocery Shopping List Modal */}
        <GroceryShoppingListModal
          isOpen={showGroceryModal}
          onClose={() => setShowGroceryModal(false)}
          onToast={showToast}
        />

        {/* Meal Comparison & Swaps Modal */}
        <MealComparisonAndSwapsModal
          isOpen={showMealSwapsModal}
          onClose={() => setShowMealSwapsModal(false)}
          onSelectSwap={handleSelectFoodFromDatabase}
          onToast={showToast}
        />

        {/* Streak Achievements Modal */}
        <StreakAchievementsModal
          isOpen={showStreakModal}
          onClose={() => setShowStreakModal(false)}
          history={history}
          onToast={showToast}
        />

        {/* Daily Mood & Gut Digest Modal */}
        <DailyMoodDigestiveModal
          isOpen={showDailyMoodModal}
          onClose={() => setShowDailyMoodModal(false)}
          selectedDate={selectedDate}
          onToast={showToast}
        />

        {/* Backup & Restore Modal */}
        <BackupRestoreModal
          isOpen={showBackupRestoreModal}
          onClose={() => setShowBackupRestoreModal(false)}
          history={history}
          userProfile={userProfile}
          onRestoreHistory={(restoredHistory) => {
            updateAndPersistHistory(restoredHistory);
          }}
          onRestoreProfile={(restoredProfile) => {
            saveProfile(restoredProfile);
          }}
          onToast={showToast}
        />

        {/* Data Import Confirmation & Preview Modal */}
        {pendingImportData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-indigo-50/50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <Upload size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 tracking-tight">ยืนยันการนำเข้าข้อมูล</h2>
                    <p className="text-xs text-neutral-500 font-medium">ตรวจสอบข้อมูลที่ตรวจพบในไฟล์ก่อนนำเข้า</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setPendingImportData(null)}
                  className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* File info card */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">ชื่อไฟล์:</span>
                    <span className="font-bold text-neutral-800 truncate max-w-[200px]" title={pendingImportData.fileName}>
                      {pendingImportData.fileName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">ขนาดไฟล์:</span>
                    <span className="font-bold text-neutral-800">{pendingImportData.fileSizeKb} KB</span>
                  </div>
                  {pendingImportData.exportDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">วันที่ส่งออก:</span>
                      <span className="font-bold text-neutral-800">
                        {formatDateDMY(new Date(pendingImportData.exportDate))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detected content badges */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    ข้อมูลที่ตรวจพบในไฟล์:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/60">
                      <span className="text-amber-800 font-medium block text-[11px]">มื้ออาหาร</span>
                      <span className="text-amber-950 font-black text-base mt-0.5 block">
                        {pendingImportData.meals.length} รายการ
                      </span>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/60">
                      <span className="text-emerald-800 font-medium block text-[11px]">ข้อมูลโปรไฟล์</span>
                      <span className="text-emerald-950 font-bold text-xs mt-1 block">
                        {pendingImportData.profile 
                          ? `${pendingImportData.profile.weight || '-'} kg / ${pendingImportData.profile.targetCalories || '-'} kcal` 
                          : 'ไม่มีในไฟล์'}
                      </span>
                    </div>
                  </div>
                  {pendingImportData.hasExtraData && (
                    <div className="bg-blue-50 rounded-2xl p-3 border border-blue-200/60 text-xs text-blue-900 font-medium">
                      ✓ ตรวจพบบันทึกเสริม (น้ำดื่ม / IF / เมนูโปรด / สถิติน้ำหนัก)
                    </div>
                  )}
                </div>

                {/* Import Mode Selection Actions */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-bold text-neutral-500 block">
                    เลือกรูปแบบการนำเข้าข้อมูล:
                  </span>

                  {/* Mode 1: Merge */}
                  <button
                    type="button"
                    disabled={isProcessingImport}
                    onClick={() => handleConfirmImport('merge')}
                    className="w-full p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white transition-all text-left flex items-start gap-3 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Plus size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white">ผสานรวมกับข้อมูลปัจจุบัน (Merge - แนะนำ)</h4>
                      <p className="text-[11px] text-indigo-100 mt-0.5 leading-relaxed">
                        นำมื้ออาหารใหม่เพิ่มเข้าไปในประวัติเดิม ข้อมูลเดิมไม่สูญหาย และข้ามรายการที่ซ้ำกัน
                      </p>
                    </div>
                  </button>

                  {/* Mode 2: Replace */}
                  <button
                    type="button"
                    disabled={isProcessingImport}
                    onClick={() => handleConfirmImport('replace')}
                    className="w-full p-4 rounded-2xl bg-neutral-50 hover:bg-rose-50 hover:border-rose-300 border border-neutral-200 text-neutral-700 hover:text-rose-900 transition-all text-left flex items-start gap-3 cursor-pointer group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-xl bg-neutral-200 group-hover:bg-rose-100 text-neutral-600 group-hover:text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-neutral-900 group-hover:text-rose-700">แทนที่ข้อมูลเดิมทั้งหมด (Replace All)</h4>
                      <p className="text-[11px] text-neutral-500 group-hover:text-rose-600/80 mt-0.5 leading-relaxed">
                        ล้างประวัติเดิมทิ้ง แล้วใช้ข้อมูลทั้งหมดจากไฟล์สำรองนี้แทน
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPendingImportData(null)}
                  disabled={isProcessingImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clinical PDF Report Modal */}
        <PrintableClinicalReportModal
          isOpen={showClinicalReportModal}
          onClose={() => setShowClinicalReportModal(false)}
          selectedDate={displayDate}
          history={history}
          userProfile={userProfile}
          bmr={bmr}
          tdee={tdee}
          dailyGoal={dailyGoal}
          carbsGoal={carbsGoal}
          proteinGoal={proteinGoal}
          fatGoal={fatGoal}
          sugarGoal={sugarGoal}
          sodiumGoal={sodiumGoal}
          onToast={showToast}
        />

        {/* Insights Analytics Export Modal (Global) */}
        <ExportInsightsModal
          isOpen={showInsightsExportModal}
          onClose={() => setShowInsightsExportModal(false)}
          exportParams={insightsExportParams}
          params={insightsExportParams}
          initialSection={insightsExportInitialSection}
          onToast={showToast}
        />

        {/* Body Measurement Tracker Modal View */}
        {showBodyTrackerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-4 relative shadow-2xl">
              <button
                onClick={() => setShowBodyTrackerModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer z-10"
              >
                <X size={16} />
              </button>
              <BodyMeasurementTracker
                currentWeight={userProfile.weight}
                targetWeight={userProfile.targetWeight}
                onUpdateWeight={handleUpdateWeight}
                onToast={showToast}
              />
            </div>
          </div>
        )}

        {/* 🌟 20 AI INNOVATION MODALS 🌟 */}

        {/* 1. Glucose Crash Predictor */}
        <GlucoseCrashPredictorModal
          isOpen={showGlucoseModal}
          onClose={() => setShowGlucoseModal(false)}
          recentFood={displayHistory.length > 0 ? displayHistory[0].foodName : undefined}
          onToast={showToast}
        />

        {/* 2. Restaurant Menu Scanner */}
        <DiningOutMenuScannerModal
          isOpen={showDiningMenuModal}
          onClose={() => setShowDiningMenuModal(false)}
          onSelectHealthyDish={(dish) => {
            const newItem: HistoryItem = {
              id: `menu-dish-${Date.now()}`,
              foodName: dish.dishName,
              calories: dish.estimatedCalories,
              proteinGrams: dish.proteinGrams,
              carbsGrams: dish.carbsGrams,
              fatGrams: dish.fatGrams,
              date: selectedDate.getTime(),
              image: '',
              mealType: selectedMeal,
              explanation: `เมนูสุขภาพแนะนำจากร้าน: ${dish.healthReason}`
            };
            const newHistory = [newItem, ...history];
            updateAndPersistHistory(newHistory);
            showToast(`🍽️ บันทึก "${dish.dishName}" (${dish.estimatedCalories} kcal) ลงในไดอารี่แล้ว!`);
          }}
          onToast={showToast}
        />

        {/* 3. Exercise Burn Offset */}
        <ExerciseBurnOffsetModal
          isOpen={showExerciseBurnModal}
          onClose={() => setShowExerciseBurnModal(false)}
          targetCalories={displayHistory.length > 0 ? displayHistory[0].calories : 450}
          mealName={displayHistory.length > 0 ? displayHistory[0].foodName : 'มื้อล่าสุด'}
          userWeight={userProfile.weight}
          onToast={showToast}
        />

        {/* 4. Chrono Nutrition Optimizer */}
        <ChronoNutritionOptimizerModal
          isOpen={showChronoNutritionModal}
          onClose={() => setShowChronoNutritionModal(false)}
          onToast={showToast}
        />

        {/* 5. Longevity & Inflammation Score */}
        <LongevityInflammationScoreModal
          isOpen={showLongevityModal}
          onClose={() => setShowLongevityModal(false)}
          recentMeals={(displayHistory || []).map(m => ({
            foodName: m.foodName,
            calories: m.calories,
            protein: m.proteinGrams,
            carbs: m.carbsGrams,
            fat: m.fatGrams,
            sugar: m.sugarGrams,
            sodium: m.sodiumMg
          }))}
          onToast={showToast}
        />

        {/* 6. Smart Microbiome Tracker */}
        <SmartMicrobiomeTrackerModal
          isOpen={showMicrobiomeModal}
          onClose={() => setShowMicrobiomeModal(false)}
          todayMeals={(displayHistory || []).map(m => m.foodName)}
          onToast={showToast}
        />

        {/* 7. Fasting 5 Stages Visualizer */}
        <FastingStagesVisualizerModal
          isOpen={showFastingStagesModal}
          onClose={() => setShowFastingStagesModal(false)}
          onToast={showToast}
        />

        {/* 8. Fridge Expiry Manager */}
        <FridgeExpiryManagerModal
          isOpen={showFridgeManagerModal}
          onClose={() => setShowFridgeManagerModal(false)}
          onCookWithIngredients={(items) => {
            setPantryCookIngredients(items);
            setShowFridgeManagerModal(false);
            setShowSmartPantryModal(true);
          }}
          onToast={showToast}
        />

        {/* 9. Smart Pantry Wizard */}
        <SmartPantryWizardModal
          isOpen={showSmartPantryModal}
          onClose={() => setShowSmartPantryModal(false)}
          initialIngredients={pantryCookIngredients}
          onStartCooking={(recipe) => {
            setActiveCookingRecipe(recipe);
            setShowSmartPantryModal(false);
            setShowCookingAvatarModal(true);
          }}
          onToast={showToast}
        />

        {/* 10. Interactive Cooking Step-by-Step */}
        <InteractiveCookingAvatarModal
          isOpen={showCookingAvatarModal}
          onClose={() => setShowCookingAvatarModal(false)}
          recipe={activeCookingRecipe}
          onLogFinishedDish={(dish) => {
            const newItem: HistoryItem = {
              id: `cooked-dish-${Date.now()}`,
              foodName: dish.title,
              calories: dish.calories,
              proteinGrams: dish.protein,
              carbsGrams: dish.carbs,
              fatGrams: dish.fat,
              date: selectedDate.getTime(),
              image: '',
              mealType: selectedMeal,
              explanation: 'ปรุงสำเร็จจากเชฟ AI Step-by-Step'
            };
            const newHistory = [newItem, ...history];
            updateAndPersistHistory(newHistory);
            showToast(`👨‍🍳 บันทึกเมนู "${dish.title}" ลงไดอารี่สำเร็จ!`);
          }}
          onToast={showToast}
        />

        {/* 11. Healthy Plate Visualizer */}
        <HealthyPlateVisualizerModal
          isOpen={showHealthyPlateModal}
          onClose={() => setShowHealthyPlateModal(false)}
          carbsGrams={totalCarbs}
          proteinGrams={totalProtein}
          fatGrams={totalFat}
          onToast={showToast}
        />

        {/* 12. Metabolic Heatmap */}
        <MetabolicHeatmapModal
          isOpen={showMetabolicHeatmapModal}
          onClose={() => setShowMetabolicHeatmapModal(false)}
          history={history}
          onToast={showToast}
        />

        {/* 13. Allergy Safety & Medical Filter */}
        <AllergySafetySettingsModal
          isOpen={showAllergySafetyModal}
          onClose={() => setShowAllergySafetyModal(false)}
          onToast={showToast}
        />

        {/* 14. Cheat Meal Recovery */}
        <SocialCheatMealRecoveryModal
          isOpen={showCheatMealModal}
          onClose={() => setShowCheatMealModal(false)}
          cheatMealCalories={displayHistory.length > 0 ? displayHistory[0].calories : 900}
          cheatMealName={displayHistory.length > 0 ? displayHistory[0].foodName : 'บุฟเฟต์ / มื้อหนัก'}
          onToast={showToast}
        />

        {/* 15. Craving Emergency SOS */}
        <CravingEmergencySOSModal
          isOpen={showCravingSOSModal}
          onClose={() => setShowCravingSOSModal(false)}
          onToast={showToast}
        />

        {/* 16. Hydration Electrolyte Optimizer */}
        <HydrationElectrolyteOptimizerModal
          isOpen={showHydrationOptimizerModal}
          onClose={() => setShowHydrationOptimizerModal(false)}
          onToast={showToast}
        />

        {/* 17. Micro-Habit Stacker */}
        <MicroHabitStackerModal
          isOpen={showHabitStackModal}
          onClose={() => setShowHabitStackModal(false)}
          onToast={showToast}
        />

        {/* 19. Social Story Card */}
        <SocialStoryCardModal
          isOpen={showSocialStoryModal}
          onClose={() => setShowSocialStoryModal(false)}
          dailyStats={{
            caloriesEaten: totalCaloriesDisplay,
            calorieGoal: dailyGoal,
            proteinGrams: totalProtein,
            proteinGoal: proteinGoal,
            waterMl: getWaterTotalMlForDate(displayDate),
            streakDays: history.length > 0 ? 5 : 1, // Optional: dynamic streak logic can be kept simple or retrieved from a hook
            dateStr: `${formatFullThaiDate(displayDate)} (${formatDateDMY(displayDate)})`
          }}
          onToast={showToast}
        />

        {/* 20. Biomarker & CGM Sync Simulator */}
        <BiomarkerSyncSimulatorModal
          isOpen={showBiomarkerSyncModal}
          onClose={() => setShowBiomarkerSyncModal(false)}
          onSyncBiomarkers={(bioData) => {
            // Adaptive calorie goal increment
            const extraQuota = Math.round(bioData.activeCalories * 0.5);
            setDailyGoal(prev => prev + extraQuota);
            showToast(`⚡ ปรับเพิ่มโควต้าแคลอรี่วันนี้ +${extraQuota} kcal จากการซิงค์ ${bioData.deviceName || 'Smart Health'} (เบิร์นจริง ${bioData.activeCalories} kcal, ${bioData.steps.toLocaleString()} ก้าว)!`);
          }}
          onToast={showToast}
        />

        {/* 21. Caffeine Sleep Decay */}
        <CaffeineSleepDecayModal
          isOpen={showCaffeineDecayModal}
          onClose={() => setShowCaffeineDecayModal(false)}
          onToast={showToast}
        />

        {/* 22. Street Food Survival Guide */}
        <StreetFoodSurvivalGuideModal
          isOpen={showStreetFoodModal}
          onClose={() => setShowStreetFoodModal(false)}
          onLogMeal={(meal) => {
            const newItem: HistoryItem = {
              id: `street-food-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              foodName: meal.name,
              calories: meal.calories,
              proteinGrams: meal.protein,
              carbsGrams: meal.carbs,
              fatGrams: meal.fat,
              date: selectedDate.getTime(),
              image: '',
              mealType: selectedMeal,
              explanation: 'สูตรสตรีทฟู้ดลีนแคลอรี่พิเศษ'
            };
            const newHistory = [newItem, ...history];
            updateAndPersistHistory(newHistory);
          }}
          onToast={showToast}
        />

        {/* 23. Metabolic Bio-Age */}
        <MetabolicAgeCalculatorModal
          isOpen={showMetabolicAgeModal}
          onClose={() => setShowMetabolicAgeModal(false)}
          userAge={userProfile.age}
          userWeight={userProfile.weight}
          userHeight={userProfile.height}
          onToast={showToast}
        />

        {/* 24. 7-Day Meal Planner */}
        <WeeklyMealPlannerModal
          isOpen={showWeeklyMealPlannerModal}
          onClose={() => setShowWeeklyMealPlannerModal(false)}
          targetCalories={safeDailyGoal}
          targetProtein={proteinGoal}
          onLogMeal={(meal) => {
            const newItem: HistoryItem = {
              id: `mealplan-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              foodName: meal.name,
              calories: meal.calories,
              proteinGrams: meal.protein,
              carbsGrams: meal.carbs,
              fatGrams: meal.fat,
              date: selectedDate.getTime(),
              image: '',
              mealType: meal.mealType === 'snack' ? selectedMeal : (meal.mealType as 'breakfast' | 'lunch' | 'dinner'),
              explanation: meal.explanation || 'บันทึกจากตารางมื้ออาหาร 7 วัน'
            };
            const newHistory = [newItem, ...history];
            updateAndPersistHistory(newHistory);
          }}
          onLogFullDay={(dayMeals) => {
            const newItems: HistoryItem[] = dayMeals.map((m, idx) => ({
              id: `mealplan-${Date.now()}-${idx}-${Math.random().toString(36).substring(7)}`,
              foodName: m.name,
              calories: m.calories,
              proteinGrams: m.protein,
              carbsGrams: m.carbs,
              fatGrams: m.fat,
              date: selectedDate.getTime(),
              image: '',
              mealType: m.mealType === 'snack' ? 'dinner' : (m.mealType as 'breakfast' | 'lunch' | 'dinner'),
              explanation: m.explanation || 'บันทึกจากตารางมื้ออาหาร 7 วัน'
            }));
            const newHistory = [...newItems, ...history];
            updateAndPersistHistory(newHistory);
          }}
          onOpenGroceryModal={() => setShowGroceryModal(true)}
          onExportToGrocery={(items) => {
            showToast(`🛒 นำเข้า ${items.length} รายการสู่วิซาร์ดจ่ายตลาดแล้ว!`);
          }}
          onToast={showToast}
        />

        {/* 25. Smart 7-Eleven Barcode Scanner */}
        <SmartBarcodeScannerModal
          isOpen={showSmartBarcodeModal}
          onClose={() => setShowSmartBarcodeModal(false)}
          onLogMeal={(meal) => {
            const newItem: HistoryItem = {
              id: `barcode-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              foodName: meal.name,
              calories: meal.calories,
              proteinGrams: meal.protein,
              carbsGrams: meal.carbs,
              fatGrams: meal.fat,
              date: selectedDate.getTime(),
              image: '',
              mealType: selectedMeal,
              explanation: 'สแกนจากบาร์โค้ดสินค้า 7-Eleven / ซูเปอร์มาร์เก็ต'
            };
            const newHistory = [newItem, ...history];
            updateAndPersistHistory(newHistory);
          }}
          onToast={showToast}
        />

        {/* 26. Micronutrient RDA Tracker */}
        <MicronutrientTrackerModal
          isOpen={showMicronutrientModal}
          onClose={() => setShowMicronutrientModal(false)}
          onToast={showToast}
        />

        {/* 27. Post-Meal Glucose Walk */}
        <PostMealWalkReminderModal
          isOpen={showPostMealWalkModal}
          onClose={() => setShowPostMealWalkModal(false)}
          onToast={showToast}
        />

        {/* 28. Visual Photo & US Navy Body Fat */}
        <VisualPhotoComparisonModal
          isOpen={showVisualPhotoModal}
          onClose={() => setShowVisualPhotoModal(false)}
          onToast={showToast}
        />

        {/* 29. Accessibility & Theme Scaler */}
        <AccessibilityAndThemeModal
          isOpen={showAccessibilityModal}
          onClose={() => setShowAccessibilityModal(false)}
          onToast={showToast}
        />

        {/* Copy Yesterday's Meals Modal */}
        <CopyYesterdayMealModal
          isOpen={showCopyYesterdayModal}
          onClose={() => setShowCopyYesterdayModal(false)}
          allHistory={history}
          currentDate={selectedDate}
          onCopyMeals={handleCopyMealsFromYesterday}
          onToast={showToast}
        />

        {/* Google Authentication Modal */}
        <GoogleLoginModal
          isOpen={showGoogleLoginModal}
          onClose={() => setShowGoogleLoginModal(false)}
          onLoginSuccess={handleGoogleLoginSuccess}
          onToast={showToast}
        />

      </div>
    </div>
  );
}
