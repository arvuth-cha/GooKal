import React, { useState, useEffect } from 'react';
import { 
  Timer, 
  Play, 
  Square, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Info, 
  History, 
  ChevronUp, 
  Calendar, 
  Edit3, 
  Check, 
  Sliders, 
  Plus, 
  Minus, 
  ArrowRight,
  Download,
  Copy,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FastingPlan, FastingSession } from '../../types/extendedFeatures';
import { playNotificationChime, showMealNotification } from '../../utils/notificationService';
import { formatDateDMY, formatDateDMYShort, formatFullThaiDate, formatTimeHM } from '../../utils/dateUtils';

const FASTING_PLANS: FastingPlan[] = [
  { id: '16_8', name: '16:8 (ยอดนิยม)', fastHours: 16, eatHours: 8, description: 'อด 16 ชม. ทาน 8 ชม. เหมาะกับผู้เริ่มต้นและสายปั้นหุ่นยั่งยืน', difficulty: 'beginner' },
  { id: '18_6', name: '18:6 (เร่งการเบิร์น)', fastHours: 18, eatHours: 6, description: 'อด 18 ชม. ทาน 6 ชม. กระตุ้น Autophagy และการเผาผลาญไขมันลึก', difficulty: 'intermediate' },
  { id: '20_4', name: '20:4 (Warrior Diet)', fastHours: 20, eatHours: 4, description: 'อด 20 ชม. ทาน 4 ชม. สไตล์นักรบ ร่างกายดึงไขมันมาใช้สูงสุด', difficulty: 'advanced' },
  { id: '14_10', name: '14:10 (ปรับตัวง่าย)', fastHours: 14, eatHours: 10, description: 'อด 14 ชม. ทาน 10 ชม. เหมาะสำหรับผู้เริ่มทำ IF สบายๆ ไม่เครียด', difficulty: 'beginner' },
  { id: '24_omad', name: '24h (OMAD ทานมื้อเดียว)', fastHours: 24, eatHours: 1, description: 'อด 24 ชม. ทาน 1 มื้อ รีเซ็ตระบบย่อยและกระตุ้นการซ่อมแซมเซลล์', difficulty: 'advanced' }
];

const FASTING_STORAGE_KEY = 'kalguru_fasting_session_v1';
const FASTING_HISTORY_KEY = 'kalguru_fasting_history_v1';

export const IntermittentFastingTracker: React.FC<{
  onToast: (msg: string) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onOpenFastingStagesModal?: () => void;
}> = ({ onToast, isOpen: externalIsOpen, onToggleOpen, onOpenFastingStagesModal }) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(true);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleOpen = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const [selectedPlanId, setSelectedPlanId] = useState<string>('16_8');
  const [customTargetHours, setCustomTargetHours] = useState<number>(16);
  const [isCustomPlanActive, setIsCustomPlanActive] = useState<boolean>(false);
  
  const [activeSession, setActiveSession] = useState<FastingSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [fastingHistory, setFastingHistory] = useState<FastingSession[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  
  // Custom Time Setup State (Direct Manual Key-in with Set button)
  const [showCustomStart, setShowCustomStart] = useState<boolean>(false);
  const [isEditingActiveSession, setIsEditingActiveSession] = useState<boolean>(false);

  // Time Picker Pop-up Dialog State
  const [showTimePickerModal, setShowTimePickerModal] = useState<boolean>(false);
  const [tempPickerHour, setTempPickerHour] = useState<number>(12);
  const [tempPickerMinute, setTempPickerMinute] = useState<number>(0);

  // Format local date YYYY-MM-DD
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Custom start date & time state
  const getInitialCustomDateTime = () => {
    const d = new Date();
    const dateStr = formatLocalDate(d);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { dateStr, timeStr };
  };

  const [customStartDate, setCustomStartDate] = useState<string>(() => getInitialCustomDateTime().dateStr);
  const [customStartTime, setCustomStartTime] = useState<string>(() => getInitialCustomDateTime().timeStr);

  // Open Time Picker Pop-up modal with current values
  const handleOpenTimePickerModal = () => {
    triggerHaptic(20);
    const [h, m] = customStartTime.split(':').map(Number);
    setTempPickerHour(isNaN(h) ? 12 : Math.min(23, Math.max(0, h)));
    setTempPickerMinute(isNaN(m) ? 0 : Math.min(59, Math.max(0, m)));
    setShowTimePickerModal(true);
  };

  // Confirm Time Picker with Set (ตั้งค่า) button
  const handleConfirmTimePicker = () => {
    triggerHaptic(30);
    const formattedH = String(tempPickerHour).padStart(2, '0');
    const formattedM = String(tempPickerMinute).padStart(2, '0');
    const newTime = `${formattedH}:${formattedM}`;
    setCustomStartTime(newTime);
    setShowTimePickerModal(false);
    onToast(`⏱️ ตั้งค่าเวลาเป็น ${newTime} น. เรียบร้อยแล้ว`);
  };

  // Cancel Time Picker with Cancel (ยกเลิก) button
  const handleCancelTimePicker = () => {
    triggerHaptic(15);
    setShowTimePickerModal(false);
  };

  // Haptic trigger helper
  const triggerHaptic = (pattern: number | number[] = 15) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // Sync Date & Time strings from a given Timestamp
  const syncInputsFromTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    setCustomStartDate(formatLocalDate(d));
    setCustomStartTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(FASTING_STORAGE_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.isActive) {
          setActiveSession(parsed);
          setSelectedPlanId(parsed.planId);
          if (parsed.targetHours) setCustomTargetHours(parsed.targetHours);
        }
      }
      const savedHistory = localStorage.getItem(FASTING_HISTORY_KEY);
      if (savedHistory) {
        setFastingHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Failed to load fasting session:', e);
    }
  }, []);

  // Timer ticker
  useEffect(() => {
    if (!activeSession || !activeSession.isActive) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - activeSession.startTime) / 1000));
      setElapsedSeconds(diff);

      // Check if target just reached
      const targetSec = activeSession.targetHours * 3600;
      if (diff >= targetSec && diff < targetSec + 5) {
        playNotificationChime();
        showMealNotification('🎉 ยินดีด้วย! คุณทำ Fasting ครบตามเป้าหมายแล้ว', {
          body: `สำเร็จเป้าหมาย ${activeSession.planName} (${activeSession.targetHours} ชม.) เริ่มมื้อแรกอย่างมีสติด้วยโปรตีนและไขมันดีนะครับ 🥗`
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const currentPlan = isCustomPlanActive 
    ? { id: 'custom', name: `กำหนดเอง (${customTargetHours} ชม.)`, fastHours: customTargetHours, eatHours: Math.max(1, 24 - customTargetHours), description: `สูตรที่กำหนดเอง อด ${customTargetHours} ชม. ทาน ${Math.max(1, 24 - customTargetHours)} ชม.`, difficulty: 'custom' as const }
    : (FASTING_PLANS.find(p => p.id === selectedPlanId) || FASTING_PLANS[0]);

  // Start Fasting immediately (Now)
  const handleStartNow = () => {
    triggerHaptic(30);
    const targetHours = isCustomPlanActive ? customTargetHours : currentPlan.fastHours;
    const startTime = Date.now();
    const newSession: FastingSession = {
      id: `fast-${Date.now()}`,
      planId: currentPlan.id,
      planName: currentPlan.name,
      startTime,
      targetHours,
      isActive: true
    };

    setActiveSession(newSession);
    localStorage.setItem(FASTING_STORAGE_KEY, JSON.stringify(newSession));
    setShowCustomStart(false);
    setIsEditingActiveSession(false);
    
    onToast(`⏱️ เริ่มต้นบันทึก Fasting (${currentPlan.name}) ขอให้ดื่มน้ำเปล่าให้เพียงพอนะครับ!`);
    playNotificationChime();
  };

  // Start / Save with manual keyed-in date and time via the Set (ตั้งค่า) button
  const handleSetCustomTime = () => {
    triggerHaptic(30);
    const [h, m] = customStartTime.split(':').map(Number);
    const [year, month, day] = (customStartDate || formatLocalDate(new Date())).split('-').map(Number);
    
    const startDate = new Date(year, month - 1, day, h || 0, m || 0, 0, 0);
    const startTime = startDate.getTime();

    if (startTime > Date.now()) {
      onToast('⚠️ เวลาเริ่ม Fasting ต้องไม่เกินเวลาปัจจุบัน');
      return;
    }

    const targetHours = isCustomPlanActive ? customTargetHours : currentPlan.fastHours;

    if (activeSession && isEditingActiveSession) {
      // Editing existing active session
      const updatedSession: FastingSession = {
        ...activeSession,
        startTime,
        targetHours
      };
      setActiveSession(updatedSession);
      localStorage.setItem(FASTING_STORAGE_KEY, JSON.stringify(updatedSession));
      setIsEditingActiveSession(false);
      setShowCustomStart(false);
      onToast(`✏️ ตั้งค่าเวลาเริ่มใหม่: ${customStartDate} เวลา ${customStartTime} น. เรียบร้อยแล้ว`);
      playNotificationChime();
      return;
    }

    const newSession: FastingSession = {
      id: `fast-${Date.now()}`,
      planId: currentPlan.id,
      planName: currentPlan.name,
      startTime,
      targetHours,
      isActive: true
    };

    setActiveSession(newSession);
    localStorage.setItem(FASTING_STORAGE_KEY, JSON.stringify(newSession));
    setShowCustomStart(false);
    setIsEditingActiveSession(false);
    onToast(`⏱️ ตั้งค่าเวลาเริ่ม Fasting: ${customStartDate} เวลา ${customStartTime} น. (${currentPlan.name})`);
    playNotificationChime();
  };

  // Open custom time panel with active session's start time for editing
  const handleOpenEditActiveSession = () => {
    triggerHaptic(20);
    if (!activeSession) return;
    syncInputsFromTimestamp(activeSession.startTime);
    setIsEditingActiveSession(true);
    setShowCustomStart(true);
  };

  // Open custom time panel to create new session
  const handleOpenNewCustomStart = () => {
    triggerHaptic(20);
    setIsEditingActiveSession(false);
    const now = new Date();
    syncInputsFromTimestamp(now.getTime());
    setShowCustomStart(true);
  };

  const handleStopFasting = () => {
    if (!activeSession) return;
    triggerHaptic([30, 50]);
    const completedHours = Number((elapsedSeconds / 3600).toFixed(1));
    const isCompleted = completedHours >= activeSession.targetHours;

    const finishedSession: FastingSession = {
      ...activeSession,
      isActive: false,
      endTime: Date.now()
    };

    const updatedHistory = [finishedSession, ...fastingHistory];
    setFastingHistory(updatedHistory);
    localStorage.setItem(FASTING_HISTORY_KEY, JSON.stringify(updatedHistory));
    localStorage.removeItem(FASTING_STORAGE_KEY);
    setActiveSession(null);
    setShowCustomStart(false);
    setIsEditingActiveSession(false);

    if (isCompleted) {
      onToast(`🏆 ยอดเยี่ยมมาก! สำเร็จ Fasting ${completedHours} ชม. (เกินเป้า ${activeSession.targetHours} ชม.)`);
      playNotificationChime();
    } else {
      onToast(`🏁 สิ้นสุด Fasting ที่ ${completedHours} ชม. สะสมวินัยต่อไปเรื่อยๆ ครับ!`);
    }
  };

  // Calculations
  const targetHours = (activeSession ? activeSession.targetHours : currentPlan?.fastHours) || 16;
  const targetSeconds = Math.max(1, targetHours * 3600);
  const rawProgress = Math.round(((elapsedSeconds || 0) / targetSeconds) * 100);
  const progressPercent = Math.min(100, Math.max(0, isNaN(rawProgress) ? 0 : rawProgress));
  
  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMins = Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedSecs = elapsedSeconds % 60;

  // Remaining time calculation
  const remainingSecsTotal = Math.max(0, targetSeconds - elapsedSeconds);
  const remainingHours = Math.floor(remainingSecsTotal / 3600);
  const remainingMins = Math.floor((remainingSecsTotal % 3600) / 60);

  // Format session start & projected finish time
  const sessionStartDate = activeSession ? new Date(activeSession.startTime) : null;
  const formattedStartTimeStr = sessionStartDate 
    ? `${formatDateDMYShort(sessionStartDate)} เวลา ${sessionStartDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. (${formatDateDMY(sessionStartDate)})`
    : '';

  const projectedFinishDate = sessionStartDate ? new Date(sessionStartDate.getTime() + (targetHours * 3600 * 1000)) : null;
  const formattedFinishTimeStr = projectedFinishDate
    ? `${formatDateDMYShort(projectedFinishDate)} เวลา ${projectedFinishDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. (${formatDateDMY(projectedFinishDate)})`
    : '';

  // Biological Stage Detection
  const getFastingStage = (hours: number) => {
    if (hours < 4) {
      return {
        stage: 'ช่วงย่อยและดูดซึม (Anabolic Phase)',
        desc: 'ร่างกายกำลังย่อยอาหารมื้อล่าสุด ระดับน้ำตาลและอินซูลินค่อยๆ ลดลงสู่ระดับฐาน',
        icon: '🌾',
        color: 'text-blue-600 bg-blue-50/80 border-blue-200',
        barColor: 'from-blue-400 to-indigo-500'
      };
    } else if (hours < 8) {
      return {
        stage: 'เริ่มดึงไกลโคเจนในตับมาใช้ (Glycogen Depletion)',
        desc: 'อินซูลินลดต่ำลง ร่างกายเริ่มสลายน้ำตาลไกลโคเจนที่สะสมในตับมาเป็นพลังงานหลัก',
        icon: '⚡',
        color: 'text-amber-600 bg-amber-50/80 border-amber-200',
        barColor: 'from-amber-400 to-orange-500'
      };
    } else if (hours < 12) {
      return {
        stage: 'เริ่มกระตุ้นการเผาผลาญไขมันสะสม (Fat Burning Onset)',
        desc: 'ไกลโคเจนเริ่มหมดลง ร่างกายเริ่มสลับมาดึงกรดไขมันสะสม (Fatty Acids) มาเผาผลาญ',
        icon: '🔥',
        color: 'text-rose-600 bg-rose-50/80 border-rose-200',
        barColor: 'from-orange-500 to-rose-500'
      };
    } else if (hours < 16) {
      return {
        stage: 'เข้าสู่ภาวะคีโตซิส & ไคโตนเพิ่มขึ้น (Ketosis & BHB)',
        desc: 'ตับผลิตคีโตน (Ketones) หล่อเลี้ยงสมอง สมองปลอดโปร่ง สมาธิดี ไขมันเบิร์นต่อเนื่อง',
        icon: '🧠',
        color: 'text-indigo-600 bg-indigo-50/80 border-indigo-200',
        barColor: 'from-rose-500 to-indigo-600'
      };
    } else {
      return {
        stage: 'การกลืนกินตัวเองของเซลล์ (Autophagy & Cell Repair)',
        desc: 'เซลล์เก่าถูกกำจัดและรีไซเคิล ลดการอักเสบในร่างกาย ชะลอวัย และเสริมภูมิคุ้มกันระดับ DNA',
        icon: '✨',
        color: 'text-emerald-600 bg-emerald-50/80 border-emerald-200',
        barColor: 'from-indigo-600 to-emerald-500'
      };
    }
  };

  const currentStage = getFastingStage(elapsedHours);

  // Compute live preview for custom setting
  const getSettingTimePreview = () => {
    const [h, m] = customStartTime.split(':').map(Number);
    const [year, month, day] = (customStartDate || formatLocalDate(new Date())).split('-').map(Number);
    const previewStartDate = new Date(year, month - 1, day, h || 0, m || 0, 0, 0);
    const isFuture = previewStartDate.getTime() > Date.now();
    const elapsedMs = Math.max(0, Date.now() - previewStartDate.getTime());
    const prevElapsedHours = Math.floor(elapsedMs / (1000 * 3600));
    const prevElapsedMinutes = Math.floor((elapsedMs % (1000 * 3600)) / (1000 * 60));
    
    const targetH = isCustomPlanActive ? customTargetHours : currentPlan.fastHours;
    const previewEndDate = new Date(previewStartDate.getTime() + (targetH * 3600 * 1000));
    const remainingMs = Math.max(0, previewEndDate.getTime() - Date.now());
    const prevRemHours = Math.floor(remainingMs / (1000 * 3600));
    const prevRemMinutes = Math.floor((remainingMs % (1000 * 3600)) / (1000 * 60));

    return {
      previewStartDate,
      previewEndDate,
      isFuture,
      prevElapsedHours,
      prevElapsedMinutes,
      prevRemHours,
      prevRemMinutes,
      targetH
    };
  };

  const previewInfo = getSettingTimePreview();

  return (
    <div id="intermittent-fasting-card" className="bg-white rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80 space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Timer size={20} className={activeSession?.isActive ? 'animate-pulse' : ''} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-bold text-neutral-900 text-base sm:text-lg tracking-tight">นาฬิกา IF Fasting</h3>
              {activeSession?.isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  กำลังนับ
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">บันทึกและจับเวลาช่วงอดอาหาร (IF) ระบุเวลาเริ่มได้</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {fastingHistory.length > 0 && (
            <button
              type="button"
              id="fasting-history-modal-btn"
              onClick={() => setShowHistoryModal(true)}
              className="p-2 sm:p-2.5 rounded-2xl bg-neutral-50 hover:bg-orange-50 text-neutral-600 hover:text-orange-600 border border-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <History size={15} />
              <span className="hidden sm:inline">ประวัติ ({fastingHistory.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleOpen}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            title={isOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
          >
            <ChevronUp size={20} className={`transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-6"
          >

            {/* Plan Selector & Custom Hours (Only when session not active) */}
            {!activeSession?.isActive && (
              <div className="space-y-3 bg-neutral-50/80 p-4 rounded-3xl border border-neutral-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <Sliders size={14} className="text-orange-500" />
                    <span>เลือกสูตร IF หรือกำหนดเป้าหมาย:</span>
                  </label>
                  
                  {/* Custom Target Stepper Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsCustomPlanActive(!isCustomPlanActive)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                      isCustomPlanActive 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {isCustomPlanActive ? '✓ กำหนดชั่วโมงเอง' : '+ กำหนดชั่วโมงเอง'}
                  </button>
                </div>

                {/* Custom Hours Stepper */}
                {isCustomPlanActive ? (
                  <div className="bg-white p-3.5 rounded-2xl border border-orange-200 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-xs font-bold text-neutral-800">เป้าหมายอดอาหารที่ต้องการ:</span>
                      <p className="text-[11px] text-neutral-500">อด {customTargetHours} ชม. / ทาน {Math.max(1, 24 - customTargetHours)} ชม.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          setCustomTargetHours(Math.max(8, customTargetHours - 1));
                        }}
                        className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-black flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-base font-black text-orange-600 font-mono w-12 text-center">
                        {customTargetHours}h
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          setCustomTargetHours(Math.min(36, customTargetHours + 1));
                        }}
                        className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-black flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {FASTING_PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          setSelectedPlanId(plan.id);
                          setIsCustomPlanActive(false);
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedPlanId === plan.id && !isCustomPlanActive
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-[1.02]'
                            : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200/80 hover:border-orange-200'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{plan.id === '16_8' ? '16:8' : plan.id === '18_6' ? '18:6' : plan.id === '20_4' ? '20:4' : plan.id === '14_10' ? '14:10' : '24h OMAD'}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            selectedPlanId === plan.id && !isCustomPlanActive ? 'bg-neutral-800 text-orange-300' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {plan.fastHours}h
                          </span>
                        </div>
                        <p className={`text-[10px] mt-1 line-clamp-1 ${selectedPlanId === plan.id && !isCustomPlanActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {plan.name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timer & Radial Progress Showcase Card */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-4 sm:p-6 text-white text-center shadow-xl relative overflow-hidden w-full max-w-full">
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4 sm:space-y-5">
                {/* Status Badges & Edit Button */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-bold backdrop-blur-md">
                    <Flame size={14} className="text-orange-400 animate-bounce" />
                    <span>{activeSession?.isActive ? `กำลัง Fasting: ${activeSession.planName}` : `สูตรที่เลือก: ${currentPlan.name}`}</span>
                  </div>
                  
                  {activeSession?.isActive && (
                    <button
                      type="button"
                      id="fasting-header-edit-btn"
                      onClick={handleOpenEditActiveSession}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 hover:text-white border border-orange-500/30 text-xs font-bold transition-all cursor-pointer"
                      title="แตะเพื่อคีย์เวลาเริ่มใหม่"
                    >
                      <Edit3 size={12} className="text-orange-400" />
                      <span>เริ่ม {formattedStartTimeStr.replace(/.*\s/g, '')} (คีย์เวลาใหม่)</span>
                    </button>
                  )}
                </div>

                {/* Big Digital Clock Display */}
                <div className="space-y-1">
                  <div className="text-4xl sm:text-6xl font-black tracking-tight font-mono text-white drop-shadow-md">
                    {String(elapsedHours).padStart(2, '0')}:{String(elapsedMins).padStart(2, '0')}:{String(elapsedSecs).padStart(2, '0')}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-xs text-neutral-300 font-medium">
                    <span>เป้าหมาย: <strong className="text-white font-bold">{targetHours} ชม.</strong> ({progressPercent}%)</span>
                    {activeSession?.isActive && (
                      <span className="text-orange-300 font-bold">
                        {remainingSecsTotal > 0 ? `• เหลืออีก ${remainingHours} ชม. ${remainingMins} นาที` : '• 🎉 อดครบตามเป้าแล้ว!'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Linear Progress Bar */}
                <div className="w-full max-w-md mx-auto space-y-1.5">
                  <div className="w-full bg-neutral-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-neutral-700">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 transition-all duration-500 shadow-sm"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400 font-medium px-1">
                    <span>0 ชม.</span>
                    <span className="text-orange-300 font-bold">{targetHours / 2} ชม.</span>
                    <span>{targetHours} ชม.</span>
                  </div>
                </div>

                {/* Projected Schedule Box (When session active) */}
                {activeSession?.isActive && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-300 flex items-center justify-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400 font-bold">เวลาที่เริ่มอด (Start)</div>
                        <div className="text-xs font-bold text-white">{formattedStartTimeStr}</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400 font-bold">จะครบเป้าหมาย (Goal)</div>
                        <div className="text-xs font-bold text-white">{formattedFinishTimeStr}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="pt-2">
                  {activeSession?.isActive ? (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        id="fasting-stop-btn"
                        onClick={handleStopFasting}
                        className="px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
                      >
                        <Square size={16} />
                        <span>สิ้นสุด Fasting / เริ่มกิน</span>
                      </button>

                      <button
                        type="button"
                        id="fasting-edit-time-btn"
                        onClick={handleOpenEditActiveSession}
                        className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-bold text-xs transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit3 size={15} className="text-orange-400" />
                        <span>คีย์แก้ไขเวลาเริ่ม (Set)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        id="fasting-start-now-btn"
                        onClick={handleStartNow}
                        className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 cursor-pointer"
                      >
                        <Play size={16} />
                        <span>เริ่มนับเดี๋ยวนี้ (เวลาปัจจุบัน)</span>
                      </button>

                      <button
                        type="button"
                        id="fasting-custom-start-toggle-btn"
                        onClick={handleOpenNewCustomStart}
                        className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-orange-200 font-bold text-xs sm:text-sm transition-all border border-orange-400/30 flex items-center gap-2 cursor-pointer"
                      >
                        <Clock size={16} className="text-orange-400" />
                        <span>คีย์เวลาเริ่มต้นเอง (Set Time)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Manual Time Entry & Set Form */}
                {showCustomStart && (
                  <div className="bg-neutral-950/95 rounded-3xl p-5 sm:p-6 border border-orange-500/30 max-w-lg mx-auto text-left space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                          <Clock size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm">
                            {isEditingActiveSession ? '✏️ คีย์แก้ไขเวลาเริ่ม Fasting' : '⏱️ คีย์เวลาเริ่ม Fasting'}
                          </span>
                          <p className="text-[11px] text-neutral-400">กรอกวันที่และเวลาที่กินมื้อสุดท้ายเสร็จ แล้วกดปุ่มตั้งค่า (Set)</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomStart(false);
                          setIsEditingActiveSession(false);
                        }}
                        className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        ✕ ปิด
                      </button>
                    </div>

                    {/* Direct Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Date Input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                          <Calendar size={13} className="text-orange-400" />
                          <span>วันที่เริ่มอด:</span>
                        </label>
                        <input 
                          type="date" 
                          id="fasting-custom-start-date"
                          value={customStartDate}
                          max={formatLocalDate(new Date())}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full text-xs sm:text-sm font-bold bg-neutral-900 text-white px-3.5 py-2.5 rounded-2xl border border-neutral-700 outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      {/* Time Input with custom Pop-up trigger */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                            <Clock size={13} className="text-orange-400" />
                            <span>เวลาที่เริ่ม (ชม.:นาที):</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              setCustomStartDate(formatLocalDate(now));
                              setCustomStartTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                              triggerHaptic(15);
                            }}
                            className="text-[10px] text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer"
                          >
                            ใช้เวลาตอนนี้
                          </button>
                        </div>
                        <div 
                          onClick={handleOpenTimePickerModal}
                          id="fasting-time-picker-trigger-box"
                          className="flex items-center justify-between bg-neutral-900 hover:bg-neutral-850 text-white px-3.5 py-2.5 rounded-2xl border border-neutral-700 hover:border-orange-500 transition-all cursor-pointer group shadow-inner"
                          title="แตะเพื่อเปิดหน้าต่างตั้งค่าเวลา (Pop up)"
                        >
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm sm:text-base font-black font-mono tracking-wider text-orange-200">
                              {customStartTime} น.
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-neutral-400 group-hover:text-orange-300 bg-white/5 group-hover:bg-orange-500/20 px-2.5 py-1 rounded-xl border border-white/10 transition-colors">
                            ตั้งค่าเวลา (Set Time) ✎
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Live Summary Card */}
                    <div className="bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium">🕒 เวลาที่เริ่มอด:</span>
                        <span className="text-white font-bold">
                          {formatDateDMYShort(previewInfo.previewStartDate)} เวลา {previewInfo.previewStartDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. ({formatDateDMY(previewInfo.previewStartDate)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium">🎯 จะครบเป้า ({previewInfo.targetH} ชม.):</span>
                        <span className="text-emerald-400 font-bold">
                          {formatDateDMYShort(previewInfo.previewEndDate)} เวลา {previewInfo.previewEndDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. ({formatDateDMY(previewInfo.previewEndDate)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5">
                        <span className="text-neutral-400 font-medium">
                          {previewInfo.isFuture ? '⚠️ สถานะ:' : '📊 อดมาแล้วถึงตอนนี้:'}
                        </span>
                        <span className={`font-black font-mono ${previewInfo.isFuture ? 'text-rose-400' : 'text-orange-300'}`}>
                          {previewInfo.isFuture 
                            ? 'เวลาที่เลือกอยู่ในอนาคต' 
                            : `${previewInfo.prevElapsedHours} ชม. ${previewInfo.prevElapsedMinutes} นาที (${previewInfo.prevRemHours > 0 || previewInfo.prevRemMinutes > 0 ? `เหลืออีก ${previewInfo.prevRemHours} ชม. ${previewInfo.prevRemMinutes} น.` : '🎉 ถึงเป้าหมายแล้ว!'})`}
                        </span>
                      </div>
                    </div>

                    {/* Dedicated Action Buttons: Cancel and Set */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        id="fasting-custom-start-cancel-btn"
                        onClick={() => {
                          triggerHaptic(15);
                          setShowCustomStart(false);
                          setIsEditingActiveSession(false);
                        }}
                        className="px-4 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-all cursor-pointer"
                      >
                        ยกเลิก (Cancel)
                      </button>

                      <button
                        type="button"
                        id="fasting-custom-start-confirm-btn"
                        onClick={handleSetCustomTime}
                        disabled={previewInfo.isFuture}
                        className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 ${
                          previewInfo.isFuture
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25'
                        }`}
                      >
                        <Check size={18} strokeWidth={2.5} />
                        <span>
                          {isEditingActiveSession 
                            ? `ตั้งค่า (Set) - บันทึกเวลาเริ่มใหม่ (${customStartDate} ${customStartTime} น.)` 
                            : `ตั้งค่า (Set) - เริ่มนับ Fasting (${customStartDate} ${customStartTime} น.)`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Biological Stage Indicator Card */}
            {activeSession?.isActive && (
              <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${currentStage.color}`}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{currentStage.icon}</span>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm">{currentStage.stage}</h4>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white border border-current shadow-2xs">
                        ชั่วโมงที่ {elapsedHours + 1}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed font-normal">
                      {currentStage.desc}
                    </p>
                    {onOpenFastingStagesModal && (
                      <button
                        type="button"
                        onClick={onOpenFastingStagesModal}
                        className="text-[11px] font-bold underline flex items-center gap-1 hover:opacity-80 pt-1 cursor-pointer"
                      >
                        <span>ดูแผนผังชีววิทยา 5 สเตจเชิงลึก (Autophagy, Ketosis)</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fasting Tips Checklist */}
            <div className="bg-neutral-50 rounded-3xl p-4 border border-neutral-100 space-y-2.5">
              <h4 className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
                <Info size={14} className="text-orange-500" />
                <span>สิ่งที่ดื่มได้ระหว่างช่วง Fasting (ไม่กระตุ้นอินซูลิน / ไม่หลุด IF):</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-neutral-700">
                <div className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span>💧</span> <span>น้ำเปล่าบริสุทธิ์</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span>☕</span> <span>อเมริกาโน่ไม่หวาน</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span>🍵</span> <span>ชาเขียว/ชาใสไม่หวาน</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span>🧂</span> <span>น้ำผสมเกลือชมพู</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dedicated Time Picker Pop-up Modal with Cancel and Set buttons */}
      {showTimePickerModal && (
        <div 
          id="fasting-time-picker-popup-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md animate-in fade-in"
        >
          <div 
            id="fasting-time-picker-popup"
            className="bg-neutral-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-orange-500/30 text-white space-y-5 animate-in zoom-in-95"
          >
            {/* Pop up Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">ตั้งค่าเวลา (Set Time)</h3>
                  <p className="text-[11px] text-neutral-400">เลือกชั่วโมงและนาทีที่เริ่มอดอาหาร</p>
                </div>
              </div>
              <button
                type="button"
                id="time-picker-close-x-btn"
                onClick={handleCancelTimePicker}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Big Interactive Time Display */}
            <div className="bg-neutral-950/80 rounded-2xl p-4 border border-neutral-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-4xl sm:text-5xl font-black font-mono tracking-wider text-white">
                <span className="text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20">
                  {String(tempPickerHour).padStart(2, '0')}
                </span>
                <span className="text-neutral-500 animate-pulse">:</span>
                <span className="text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  {String(tempPickerMinute).padStart(2, '0')}
                </span>
                <span className="text-xs text-neutral-400 font-sans font-bold self-end mb-1">น.</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium">
                {String(tempPickerHour).padStart(2, '0')}:{String(tempPickerMinute).padStart(2, '0')} น.
              </p>
            </div>

            {/* Steppers for Hour & Minute */}
            <div className="grid grid-cols-2 gap-3">
              {/* Hour Control */}
              <div className="bg-neutral-800/80 rounded-2xl p-3 border border-neutral-700 space-y-2 text-center">
                <span className="text-[11px] font-bold text-neutral-300">ชั่วโมง (0-23)</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setTempPickerHour((prev) => (prev <= 0 ? 23 : prev - 1));
                    }}
                    className="w-9 h-9 rounded-xl bg-neutral-700 hover:bg-neutral-600 active:bg-orange-600 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <span className="text-base font-black font-mono text-white w-8">
                    {String(tempPickerHour).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setTempPickerHour((prev) => (prev >= 23 ? 0 : prev + 1));
                    }}
                    className="w-9 h-9 rounded-xl bg-neutral-700 hover:bg-neutral-600 active:bg-orange-600 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Minute Control */}
              <div className="bg-neutral-800/80 rounded-2xl p-3 border border-neutral-700 space-y-2 text-center">
                <span className="text-[11px] font-bold text-neutral-300">นาที (0-59)</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setTempPickerMinute((prev) => (prev <= 0 ? 55 : (Math.floor(prev / 5) * 5) - 5 < 0 ? 55 : (Math.floor(prev / 5) * 5) - 5));
                    }}
                    className="w-9 h-9 rounded-xl bg-neutral-700 hover:bg-neutral-600 active:bg-orange-600 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    -5
                  </button>
                  <span className="text-base font-black font-mono text-white w-8">
                    {String(tempPickerMinute).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setTempPickerMinute((prev) => (prev >= 55 ? 0 : (Math.floor(prev / 5) * 5) + 5));
                    }}
                    className="w-9 h-9 rounded-xl bg-neutral-700 hover:bg-neutral-600 active:bg-orange-600 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Time Shortcuts */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-neutral-400">ทางลัดเวลาด่วน:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    const now = new Date();
                    setTempPickerHour(now.getHours());
                    setTempPickerMinute(now.getMinutes());
                  }}
                  className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-orange-600/30 text-orange-300 border border-neutral-700 text-[11px] font-bold transition-all cursor-pointer"
                >
                  ⚡ ตอนนี้
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    const d = new Date(Date.now() - 3600 * 1000);
                    setTempPickerHour(d.getHours());
                    setTempPickerMinute(d.getMinutes());
                  }}
                  className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold transition-all cursor-pointer"
                >
                  -1 ชม.ที่แล้ว
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    const d = new Date(Date.now() - 2 * 3600 * 1000);
                    setTempPickerHour(d.getHours());
                    setTempPickerMinute(d.getMinutes());
                  }}
                  className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold transition-all cursor-pointer"
                >
                  -2 ชม.ที่แล้ว
                </button>
              </div>
            </div>

            {/* Action Buttons: Cancel and Set (Replaced Clear with Set!) */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                id="time-picker-popup-cancel-btn"
                onClick={handleCancelTimePicker}
                className="flex-1 py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs sm:text-sm transition-all border border-neutral-700 active:scale-95 cursor-pointer text-center"
              >
                ยกเลิก (Cancel)
              </button>

              <button
                type="button"
                id="time-picker-popup-set-btn"
                onClick={handleConfirmTimePicker}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>ตั้งค่า (Set)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-neutral-100 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-neutral-900">ประวัติการทำ Fasting</h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {fastingHistory.map((item, idx) => {
                const totalH = item.endTime ? Number(((item.endTime - item.startTime) / (3600 * 1000)).toFixed(1)) : 0;
                const d = new Date(item.startTime);
                return (
                  <div key={item.id || idx} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-neutral-900">{item.planName}</div>
                      <div className="text-[11px] text-neutral-500">
                        {formatDateDMY(d)} ({formatDateDMYShort(d)}) • เริ่ม {d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-black px-2 py-0.5 rounded-lg ${totalH >= item.targetHours ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {totalH} ชม.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (fastingHistory.length === 0) {
                      onToast('⚠️ ยังไม่มีประวัติ Fasting สำหรับส่งออก');
                      return;
                    }
                    const lines = [
                      `=== GOOKAL FASTING HISTORY ===`,
                      `วันที่ส่งออก,${formatDateDMY(new Date())}`,
                      ``,
                      `ลำดับ,แผน IF,เป้าหมาย (ชม.),เวลาเริ่ม (วัน/เดือน/ปี),เวลาสิ้นสุด (วัน/เดือน/ปี),ระยะเวลาจริง (ชม.),สถานะ`
                    ];

                    fastingHistory.forEach((item, idx) => {
                      const totalH = item.endTime ? Number(((item.endTime - item.startTime) / (3600 * 1000)).toFixed(1)) : 0;
                      const dStart = new Date(item.startTime);
                      const dEnd = item.endTime ? new Date(item.endTime) : null;
                      const status = totalH >= item.targetHours ? 'สำเร็จตามเป้า' : 'สิ้นสุดก่อนเวลา';

                      lines.push([
                        idx + 1,
                        `"${item.planName}"`,
                        item.targetHours,
                        `"${formatDateDMY(dStart)} ${dStart.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}"`,
                        dEnd ? `"${formatDateDMY(dEnd)} ${dEnd.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}"` : '-',
                        totalH,
                        `"${status}"`
                      ].join(','));
                    });

                    const csvContent = '\uFEFF' + lines.join('\r\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `gookal_fasting_history_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);
                    onToast('📊 ส่งออกประวัติ Fasting เป็นตาราง CSV (Excel) สำเร็จ!');
                  }}
                  className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download size={13} />
                  <span>ส่งออก CSV</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (fastingHistory.length === 0) return;
                    const text = `⏳ ประวัติการทำ Intermittent Fasting (GooKal)\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      fastingHistory.map((item, idx) => {
                        const totalH = item.endTime ? Number(((item.endTime - item.startTime) / (3600 * 1000)).toFixed(1)) : 0;
                        const d = new Date(item.startTime);
                        return `${idx + 1}. ${item.planName} (วันที่ ${formatDateDMY(d)}): ${totalH} ชม. ${totalH >= item.targetHours ? '✅' : '⏳'}`;
                      }).join('\n') +
                      `\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `รวมทำ IF ทั้งหมด: ${fastingHistory.length} ครั้ง`;

                    await navigator.clipboard.writeText(text);
                    onToast('📋 คัดลอกประวัติ Fasting ไปที่คลิปบอร์ดแล้ว!');
                  }}
                  className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Copy size={13} />
                  <span>คัดลอก</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('ต้องการล้างประวัติ Fasting ทั้งหมดหรือไม่?')) {
                    setFastingHistory([]);
                    localStorage.removeItem(FASTING_HISTORY_KEY);
                    setShowHistoryModal(false);
                    onToast('🗑️ ล้างประวัติ Fasting เรียบร้อย');
                  }
                }}
                className="py-2 px-3 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer"
              >
                ล้างประวัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
