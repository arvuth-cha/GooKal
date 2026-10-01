import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Droplet, 
  Plus, 
  Minus, 
  RotateCcw, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Settings2, 
  Award,
  Clock,
  Trash2,
  Calendar,
  Sun,
  Flame,
  Info,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateDMY, formatFullThaiDate } from '../../utils/dateUtils';
import { WaterLog, WaterDailyGoal } from '../../types/extendedFeatures';
import { playNotificationChime } from '../../utils/notificationService';
import {
  getLocalDateKey,
  getWaterLogsForDate,
  getWaterGoal,
  saveWaterGoal,
  addWaterLog,
  deleteWaterLog,
  clearWaterLogsForDate,
  subscribeWaterUpdates
} from '../../utils/waterService';

interface WaterTrackerProps {
  selectedDate: Date;
  onToast: (msg: string) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  selectedDate,
  onToast,
  isOpen: externalIsOpen,
  onToggleOpen
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(true);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleOpen = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const [goal, setGoal] = useState<WaterDailyGoal>(getWaterGoal);
  const [showGoalEditor, setShowGoalEditor] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('300');
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Standardized local date key for selected date (YYYY-MM-DD)
  const dateStr = useMemo(() => getLocalDateKey(selectedDate), [selectedDate]);
  const isToday = useMemo(() => dateStr === getLocalDateKey(new Date()), [dateStr]);

  // Load logs strictly for this date
  const dayLogs = useMemo(() => {
    // Calling getWaterLogsForDate returns ONLY records matching dateStr
    // If it's a new day, returns [] -> 0 ml
    return getWaterLogsForDate(dateStr);
  }, [dateStr, refreshTrigger]);

  const currentTotalMl = useMemo(() => {
    return dayLogs.reduce((sum, l) => sum + (Number(l.amountMl) || 0), 0);
  }, [dayLogs]);

  // Calculate percentages and metrics
  const safeTargetMl = goal && goal.targetMl > 0 ? goal.targetMl : 2000;
  const rawPercent = Math.round((currentTotalMl / safeTargetMl) * 100);
  const percent = Math.min(100, Math.max(0, isNaN(rawPercent) ? 0 : rawPercent));
  const glassesCount = (currentTotalMl / 250).toFixed(1);

  // Subscribe to updates & auto-detect midnight changes
  useEffect(() => {
    const unsubscribe = subscribeWaterUpdates(() => {
      setRefreshTrigger(prev => prev + 1);
      setGoal(getWaterGoal());
    });
    return unsubscribe;
  }, []);

  // Handler: Add water
  const handleAddWater = (amountMl: number) => {
    const validMl = Math.max(10, Math.min(3000, Number(amountMl) || 250));
    addWaterLog(validMl, selectedDate);
    setRefreshTrigger(prev => prev + 1);
    playNotificationChime();

    const newTotal = currentTotalMl + validMl;
    if (newTotal >= goal.targetMl && currentTotalMl < goal.targetMl) {
      onToast(`🎉 สุดยอดมาก! ดื่มน้ำครบตามเป้าหมาย ${goal.targetMl} ml ประจำวันแล้ว! 💧`);
    } else {
      onToast(`💧 บันทึกดื่มน้ำ +${validMl} ml (รวมวันที่เลือก ${newTotal.toLocaleString()} ml)`);
    }
  };

  // Handler: Undo latest
  const handleUndo = () => {
    if (dayLogs.length === 0) return;
    const latestToday = dayLogs[0];
    deleteWaterLog(latestToday.id);
    setRefreshTrigger(prev => prev + 1);
    onToast(`↩️ ยกเลิกรายการล่าสุด -${latestToday.amountMl} ml`);
  };

  // Handler: Reset day's water to 0
  const handleResetDay = () => {
    clearWaterLogsForDate(dateStr);
    setShowConfirmReset(false);
    setRefreshTrigger(prev => prev + 1);
    onToast(`🔄 รีเซ็ตการดื่มน้ำของวันนี้เป็น 0 ml เรียบร้อยแล้ว`);
  };

  // Format date display (วัน/เดือน/ปี)
  const displayDateThai = `${formatFullThaiDate(selectedDate)} (${formatDateDMY(selectedDate)})`;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Droplet size={22} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-neutral-900 text-lg tracking-tight">บันทึกการดื่มน้ำ (Hydration)</h3>
              {currentTotalMl >= goal.targetMl && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 flex items-center gap-1">
                  <Check size={11} /> ครบเป้า
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-neutral-500 font-medium">
                {isToday ? `📅 วันนี้ (${displayDateThai})` : `📅 ย้อนหลัง (${displayDateThai})`}
              </span>
              {currentTotalMl === 0 && (
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  ✨ เริ่มต้นวันใหม่ 0 ml
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentTotalMl > 0 && (
            showConfirmReset ? (
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-2xl animate-in fade-in">
                <span className="text-[11px] font-bold text-rose-700">ล้างเป็น 0 ml?</span>
                <button
                  type="button"
                  id="water-header-confirm-reset-btn"
                  onClick={handleResetDay}
                  className="px-2 py-0.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  ยืนยัน
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-1.5 py-0.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-[10px] transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="water-header-reset-btn"
                onClick={() => setShowConfirmReset(true)}
                className="px-3 py-2 rounded-2xl bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 border border-neutral-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="รีเซ็ตการดื่มน้ำของวันนี้เป็น 0 ml"
              >
                <RotateCcw size={14} className="text-rose-500" />
                <span>รีเซ็ต 0 ml</span>
              </button>
            )
          )}

          <button
            type="button"
            id="water-tracker-goal-btn"
            onClick={() => setShowGoalEditor(!showGoalEditor)}
            className="p-2.5 rounded-2xl bg-neutral-50 hover:bg-cyan-50 text-neutral-600 hover:text-cyan-700 border border-neutral-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            title="ปรับเป้าหมายการดื่มน้ำ"
          >
            <Settings2 size={15} />
            <span className="hidden sm:inline">เป้าหมาย ({goal.targetMl}ml)</span>
          </button>

          <button
            type="button"
            onClick={toggleOpen}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
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
            className="overflow-hidden space-y-5"
          >

      {/* Goal Editor Dropdown */}
      {showGoalEditor && (
        <div className="p-4 rounded-3xl bg-cyan-50/70 border border-cyan-200/80 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-cyan-950">กำหนดเป้าหมายน้ำดื่มต่อวัน (ml)</h4>
            <span className="text-[11px] text-cyan-700 font-semibold">สูตรมาตรฐาน: น้ำหนักตัว (กก.) × 33-35 ml</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {[1500, 2000, 2200, 2500, 3000, 3500].map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => {
                  const updated = { ...goal, targetMl: ml };
                  setGoal(updated);
                  saveWaterGoal(updated);
                  setShowGoalEditor(false);
                  onToast(`🎯 ตั้งเป้าหมายน้ำดื่มใหม่เป็น ${ml.toLocaleString()} ml เรียบร้อย`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  goal.targetMl === ml
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-white text-cyan-900 border border-cyan-200 hover:bg-cyan-100'
                }`}
              >
                {ml.toLocaleString()} ml ({(ml / 250).toFixed(1)} แก้ว)
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-cyan-200/60">
            <button
              type="button"
              onClick={() => {
                try {
                  const profile = JSON.parse(localStorage.getItem('kalguru_profile') || '{}');
                  const weight = profile.weight || 60;
                  const calculatedMl = Math.round(weight * 35);
                  const updated = { ...goal, targetMl: calculatedMl };
                  setGoal(updated);
                  saveWaterGoal(updated);
                  setShowGoalEditor(false);
                  onToast(`✨ ปรับเป้าหมายตามน้ำหนัก (${weight}kg × 35ml) = ${calculatedMl.toLocaleString()} ml`);
                } catch {
                  onToast('🎯 ตั้งเป้าหมาย 2,000 ml ตามเกณฑ์มาตรฐาน');
                }
              }}
              className="text-xs font-bold text-cyan-800 bg-white hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-cyan-600" />
              <span>คำนวณอัตโนมัติตามน้ำหนักตัว (Weight × 35 ml)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Hydration Progress Card */}
      <div className="bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Numbers */}
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                ปริมาณน้ำดื่ม{isToday ? 'วันนี้' : ` (${dateStr})`}
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                รีเซ็ตเป็นศูนย์ทุกวัน
              </span>
            </div>
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-4xl sm:text-5xl font-black font-mono">{currentTotalMl.toLocaleString()}</span>
              <span className="text-base text-cyan-200 font-bold">/ {goal.targetMl.toLocaleString()} ml</span>
            </div>
            <p className="text-xs text-cyan-100 font-medium">
              เทียบเท่าประมาณ {glassesCount} แก้ว (250ml) • {currentTotalMl >= goal.targetMl ? '🎉 บรรลุเป้าหมายแล้ว!' : `เหลืออีก ${Math.max(0, goal.targetMl - currentTotalMl).toLocaleString()} ml`}
            </p>
          </div>

          {/* Progress Circular Pill */}
          <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center shrink-0 shadow-inner">
            <span className="text-2xl font-black">{percent}%</span>
            <span className="text-[10px] font-bold text-cyan-200">ความคืบหน้า</span>
          </div>
        </div>

        {/* Linear Bar */}
        <div className="mt-5 w-full bg-black/20 rounded-full h-3 p-0.5 overflow-hidden border border-white/20">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-white transition-all duration-500 shadow-sm"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Quick Add Buttons Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            กดบันทึกแบบด่วน (+ml)
          </label>
          <span className="text-[11px] text-neutral-400 font-medium">
            บันทึกตามวันจริง ({dateStr})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            id="water-add-250-btn"
            onClick={() => handleAddWater(250)}
            className="p-3 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100 text-cyan-900 border border-cyan-200/80 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer font-bold text-xs shadow-2xs"
          >
            <span>🥛</span>
            <span>+250 ml (1 แก้ว)</span>
          </button>

          <button
            type="button"
            id="water-add-500-btn"
            onClick={() => handleAddWater(500)}
            className="p-3 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100 text-cyan-900 border border-cyan-200/80 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer font-bold text-xs shadow-2xs"
          >
            <span>🍶</span>
            <span>+500 ml (1 ขวด)</span>
          </button>

          <button
            type="button"
            id="water-add-750-btn"
            onClick={() => handleAddWater(750)}
            className="p-3 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100 text-cyan-900 border border-cyan-200/80 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer font-bold text-xs shadow-2xs"
          >
            <span>🫗</span>
            <span>+750 ml (ขวดใหญ่)</span>
          </button>

          <button
            type="button"
            id="water-add-1000-btn"
            onClick={() => handleAddWater(1000)}
            className="p-3 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100 text-cyan-900 border border-cyan-200/80 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer font-bold text-xs shadow-2xs"
          >
            <span>🧃</span>
            <span>+1,000 ml (1 ลิตร)</span>
          </button>
        </div>
      </div>

      {/* Undo & Custom Amount Row & Reset Day Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <input
            type="number"
            id="water-custom-amount-input"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-20 px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-cyan-500 bg-neutral-50 focus:bg-white"
            placeholder="ml"
            min="10"
            max="3000"
          />
          <button
            type="button"
            id="water-add-custom-btn"
            onClick={() => {
              const val = parseInt(customAmount, 10);
              if (val > 0) handleAddWater(val);
            }}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold transition-all active:scale-95 cursor-pointer"
          >
            + เติมเอง
          </button>
        </div>

        <div className="flex items-center gap-2">
          {dayLogs.length > 0 && (
            <button
              type="button"
              id="water-undo-latest-btn"
              onClick={handleUndo}
              className="text-neutral-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-50"
            >
              <RotateCcw size={13} />
              <span>ยกเลิกล่าสุด (-{dayLogs[0].amountMl}ml)</span>
            </button>
          )}

          {currentTotalMl > 0 && (
            showConfirmReset ? (
              <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                <span className="text-[11px] text-rose-700 font-bold px-1">ยืนยันรีเซ็ตเป็น 0?</span>
                <button
                  type="button"
                  id="water-confirm-reset-btn"
                  onClick={handleResetDay}
                  className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  ใช่, ล้างข้อมูล
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-0.5 rounded-lg bg-neutral-200 text-neutral-700 font-medium text-[11px] hover:bg-neutral-300 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="water-reset-day-btn"
                onClick={() => setShowConfirmReset(true)}
                className="text-neutral-400 hover:text-rose-500 font-medium flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-50 text-[11px]"
                title="รีเซ็ตการดื่มน้ำของวันนี้เป็น 0"
              >
                <Trash2 size={12} />
                <span>รีเซ็ตเป็น 0 ml</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Today's Log Timeline List (if any) */}
      {dayLogs.length > 0 && (
        <div className="pt-2 border-t border-neutral-100">
          <span className="text-[11px] font-bold text-neutral-400 block mb-2">
            บันทึกการดื่มน้ำ {dayLogs.length} ครั้ง ({displayDateThai}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {dayLogs.map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              return (
                <div 
                  key={log.id} 
                  className="inline-flex items-center gap-1.5 bg-cyan-50/80 text-cyan-900 border border-cyan-200/60 px-2.5 py-1 rounded-xl text-xs font-semibold"
                >
                  <Clock size={11} className="text-cyan-600" />
                  <span>{timeStr} น.</span>
                  <span className="font-bold text-cyan-700">+{log.amountMl}ml</span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteWaterLog(log.id);
                      setRefreshTrigger(prev => prev + 1);
                      onToast(`ลบรายการดื่มน้ำ ${log.amountMl} ml`);
                    }}
                    className="text-cyan-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                    title="ลบรายการนี้"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
