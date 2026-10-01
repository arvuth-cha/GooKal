import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Droplets, Plus, Sparkles, Sun, Moon, Clock, CheckCircle2, ShieldCheck, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import {
  getWaterTotalMlForDate,
  getWaterGoal,
  addWaterLog,
  clearWaterLogsForDate,
  subscribeWaterUpdates
} from '../../utils/waterService';

interface HydrationElectrolyteOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyGoalMl?: number;
  onToast: (msg: string) => void;
}

export const HydrationElectrolyteOptimizerModal: React.FC<HydrationElectrolyteOptimizerModalProps> = ({
  isOpen,
  onClose,
  dailyGoalMl: propDailyGoalMl,
  onToast
}) => {
  const [waterTotal, setWaterTotal] = useState<number>(0);
  const [goalMl, setGoalMl] = useState<number>(propDailyGoalMl || 2500);
  const [electrolytesTaken, setElectrolytesTaken] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Sync today's water amount on mount or modal open
  const refreshTodayWater = useCallback(() => {
    const todayTotal = getWaterTotalMlForDate(new Date());
    setWaterTotal(todayTotal);
    const currentGoal = getWaterGoal();
    if (propDailyGoalMl) {
      setGoalMl(propDailyGoalMl);
    } else if (currentGoal?.targetMl) {
      setGoalMl(currentGoal.targetMl);
    }
  }, [propDailyGoalMl]);

  useEffect(() => {
    if (isOpen) {
      refreshTodayWater();
    }
  }, [isOpen, refreshTodayWater]);

  useEffect(() => {
    const unsubscribe = subscribeWaterUpdates(() => {
      refreshTodayWater();
    });
    return unsubscribe;
  }, [refreshTodayWater]);

  const addQuickWater = (ml: number) => {
    addWaterLog(ml, new Date());
    refreshTodayWater();
    onToast(`ดื่มน้ำเพิ่ม +${ml} ml (รวมวันนี้ ${waterTotal + ml} ml) 💧`);
  };

  const handleReset = () => {
    clearWaterLogsForDate(new Date());
    setShowConfirmReset(false);
    refreshTodayWater();
    onToast('🔄 รีเซ็ตการดื่มน้ำของวันนี้เป็น 0 ml เรียบร้อยแล้ว');
  };

  const safeGoalMl = goalMl > 0 ? goalMl : 2500;
  const rawPercent = Math.round(((waterTotal || 0) / safeGoalMl) * 100);
  const percent = Math.min(100, Math.max(0, isNaN(rawPercent) ? 0 : rawPercent));

  // Optimal hydration timing windows
  const windows = [
    { name: 'ตื่นนอนตอนเช้า (Morning Reset)', target: '500 ml', tip: 'ปลุกระบบเผาผลาญและชดเชยน้ำที่เสียไปขณะหลับ', icon: '🌅' },
    { name: 'ก่อนมื้ออาหาร 30 นาที (Pre-Meal)', target: '300 ml', tip: 'ช่วยระบบย่อยและเพิ่มความอิ่มอย่างเป็นธรรมชาติ', icon: '🍽️' },
    { name: 'ช่วงบ่าย 14:00 - 16:00 (Focus Flow)', target: '600 ml', tip: 'ป้องกันอาการสมองล้าและลดความอยากของหวาน', icon: '⚡' },
    { name: 'ก่อนนอน 1.5 ชั่วโมง (Evening Wind-Down)', target: '200 ml', tip: 'ดื่มแต่น้อยเพื่อไม่ให้ตื่นมาปัสสาวะกลางดึก', icon: '🌙' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-sky-50 via-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                <Droplets size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">ระบบจัดตารางน้ำ & อิเล็กโทรไลต์ (Hydration Optimizer)</h2>
                <p className="text-xs text-neutral-500 font-medium">Smart Electrolyte Timing & Cellular Hydration (รีเซ็ตทุกวัน)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Water progress card */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white p-5 rounded-3xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-100">เป้าหมายน้ำดื่มวันนี้ (เริ่มต้น 0 ml ทุกวัน)</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                  {percent >= 100 ? '🎉 ถึงเป้าหมายแล้ว!' : `ขาดอีก ${Math.max(0, safeGoalMl - waterTotal).toLocaleString()} ml`}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{waterTotal.toLocaleString()}</span>
                <span className="text-sky-200 text-base font-bold">/ {safeGoalMl.toLocaleString()} ml</span>
                <span className="text-xs font-semibold text-sky-100 ml-auto">{percent}%</span>
              </div>

              <div className="w-full bg-white/25 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Quick Add Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[150, 250, 350, 500].map(ml => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => addQuickWater(ml)}
                    className="py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20"
                  >
                    +{ml} ml
                  </button>
                ))}
              </div>

              {/* Reset Day's Water */}
              {waterTotal > 0 && (
                <div className="pt-1 flex justify-end">
                  {showConfirmReset ? (
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/20">
                      <span className="text-[11px] text-white font-bold">รีเซ็ตเป็น 0 ml?</span>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] cursor-pointer"
                      >
                        ยืนยัน
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmReset(false)}
                        className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-[10px] cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(true)}
                      className="text-[11px] text-sky-100 hover:text-white font-semibold flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>รีเซ็ตเป็น 0 ml</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Electrolyte Check */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🧂</span>
                <div>
                  <span className="font-bold text-xs text-amber-900 block">สมดุลเกลือแร่ (Electrolyte Balance)</span>
                  <span className="text-[11px] text-amber-700">เกลือชมพู / โพแทสเซียม / แมกนีเซียม วันนี้</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !electrolytesTaken;
                  setElectrolytesTaken(next);
                  onToast(next ? 'บันทึกการรับเกลือแร่วันนี้แล้ว ⚡' : 'ยกเลิกการบันทึก');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  electrolytesTaken
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-neutral-700 border border-neutral-300'
                }`}
              >
                {electrolytesTaken ? '✅ ได้รับแล้ว' : '+ บันทึก'}
              </button>
            </div>

            {/* Timing Strategy */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-neutral-800 block px-1">4 ช่วงเวลาทองของการดื่มน้ำ (Hydration Windows):</span>
              <div className="space-y-2">
                {windows.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-neutral-200/90 flex items-start gap-3 shadow-2xs"
                  >
                    <span className="text-xl mt-0.5">{w.icon}</span>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900">{w.name}</span>
                        <span className="text-sky-600 font-bold text-[11px]">{w.target}</span>
                      </div>
                      <p className="text-neutral-500 text-[11px] mt-0.5 leading-relaxed">{w.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
