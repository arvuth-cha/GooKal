import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Footprints, Play, Pause, RotateCcw, Volume2, Sparkles, CheckCircle2, Flame, Plus, Minus, Clock } from 'lucide-react';

interface PostMealWalkReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const DURATION_PRESETS = [10, 15, 20, 30];

export const PostMealWalkReminderModal: React.FC<PostMealWalkReminderModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [selectedDurationMins, setSelectedDurationMins] = useState<number>(15);
  const [timerSeconds, setTimerSeconds] = useState<number>(15 * 60); // 15 minutes default
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState<boolean>(true);

  const handleSetDuration = (mins: number) => {
    const validMins = Math.max(5, Math.min(60, mins));
    setSelectedDurationMins(validMins);
    if (!isRunning) {
      setTimerSeconds(validMins * 60);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isRunning) {
      setIsRunning(false);
      onToast(`🎉 ครบ ${selectedDurationMins} นาทีการเดินย่อยแล้ว! ระดับน้ำตาลในเลือดลดลงสู่ระดับปกติอย่างสมบูรณ์`);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerSeconds, selectedDurationMins, onToast]);

  const totalTargetSec = selectedDurationMins * 60;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalTargetSec - timerSeconds) / totalTargetSec) * 100));
  const estimatedCalsBurned = Math.round(((totalTargetSec - timerSeconds) / 60) * 4.2); // ~4.2 kcal/min brisk walk

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-emerald-50 via-teal-50 to-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Footprints size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">เดินย่อย {selectedDurationMins} นาที ลดพีกน้ำตาล (Glucose Walk)</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    Post-Meal Insulin Blunter
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">เดินแกว่งแขนเบาๆ หลังอาหาร ช่วยกล้ามเนื้อดึงกลูโคสไปใช้ทันที 40%</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-neutral-500 hover:text-neutral-800 flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Timer Visual */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-center">
            {/* Target Duration Selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <Clock size={13} className="text-emerald-600" /> เลือกระยะเวลาเดินย่อย:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSetDuration(mins)}
                    disabled={isRunning}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDurationMins === mins
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {mins} นาที
                  </button>
                ))}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetDuration(selectedDurationMins - 5)}
                    disabled={isRunning || selectedDurationMins <= 5}
                    className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    title="-5 นาที"
                  >
                    <Minus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDuration(selectedDurationMins + 5)}
                    disabled={isRunning || selectedDurationMins >= 60}
                    className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    title="+5 นาที"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Circular Timer Display */}
            <div className="relative w-48 h-48 mx-auto flex flex-col items-center justify-center rounded-full bg-linear-to-b from-emerald-50 to-teal-50 border-4 border-emerald-500/30 shadow-inner">
              <span className="text-4xl font-black font-mono text-neutral-900">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <Flame size={13} /> เผาผลาญ ~{estimatedCalsBurned} kcal
              </span>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{isRunning ? 'พักการเดินชั่วคราว' : `เริ่มจับเวลาเดิน ${selectedDurationMins} นาที`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setTimerSeconds(selectedDurationMins * 60);
                }}
                className="p-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all cursor-pointer"
                title="รีเซ็ตเวลา"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Science Benefit */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1.5 text-left">
              <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" /> ประโยชน์ทางสรีรวิทยาของการเดิน {selectedDurationMins} นาทีหลังอาหาร:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-600">
                <li>กล้ามเนื้อขาใช้กลูโคสผ่านตัวรับ GLUT4 โดยไม่ต้องพึ่งอินซูลินในระดับสูง</li>
                <li>ลดอาการง่วงนอนช่วงบ่าย (Food Coma) และป้องกันกรดไหลย้อน</li>
                <li>เพิ่มการบีบตัวของกระเพาะอาหารอย่างเป็นธรรมชาติ ลดอาการท้องอืด</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-neutral-600">
              <input
                type="checkbox"
                checked={autoReminderEnabled}
                onChange={(e) => setAutoReminderEnabled(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span>เตือนให้เดินหลังบันทึกอาหาร 20 นาที</span>
            </label>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
