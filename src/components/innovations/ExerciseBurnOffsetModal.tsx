import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Play, Pause, RotateCcw, Check, Sparkles, Footprints, Timer, HeartPulse } from 'lucide-react';

interface ExerciseBurnOffsetModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealName?: string;
  mealCalories?: number;
  userWeightKg?: number;
  onBurnCompleted?: (caloriesBurned: number, activityName: string) => void;
  onToast: (msg: string) => void;
}

export const ExerciseBurnOffsetModal: React.FC<ExerciseBurnOffsetModalProps> = ({
  isOpen,
  onClose,
  mealName = 'มื้ออาหารที่ทาน',
  mealCalories = 500,
  userWeightKg = 65,
  onBurnCompleted,
  onToast
}) => {
  const [targetCalories, setTargetCalories] = useState(mealCalories || 500);
  const [selectedActivity, setSelectedActivity] = useState<'walking' | 'running' | 'cycling' | 'jumprope' | 'swimming' | 'hiit'>('walking');
  
  // Live Timer State for Instant Challenge
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // MET values (Metabolic Equivalent of Task)
  // Calories burned per min = (MET * 3.5 * weightKg) / 200
  const activities = [
    { id: 'walking', name: 'เดินเร็ว (5.5 km/h)', met: 3.8, icon: '🚶‍♂️', stepsPerMin: 120 },
    { id: 'running', name: 'วิ่งจ๊อกกิ้ง (8.5 km/h)', met: 8.5, icon: '🏃‍♂️', stepsPerMin: 160 },
    { id: 'cycling', name: 'ปั่นจักรยานกลางแจ้ง', met: 6.8, icon: '🚴‍♀️', stepsPerMin: 0 },
    { id: 'jumprope', name: 'กระโดดเชือก', met: 11.0, icon: '🪢', stepsPerMin: 0 },
    { id: 'swimming', name: 'ว่ายน้ำฟรีสไตล์', met: 7.0, icon: '🏊‍♂️', stepsPerMin: 0 },
    { id: 'hiit', name: 'บอดี้เวท / บู๊ทแคมป์ HIIT', met: 9.0, icon: '⚡', stepsPerMin: 0 }
  ];

  const currentActivityObj = activities.find(a => a.id === selectedActivity) || activities[0];
  const calPerMin = (currentActivityObj.met * 3.5 * userWeightKg) / 200;
  const totalMinutesNeeded = Math.ceil(targetCalories / Math.max(calPerMin, 1));
  const totalStepsNeeded = currentActivityObj.stepsPerMin ? Math.round(totalMinutesNeeded * currentActivityObj.stepsPerMin) : null;

  // Live timer tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const liveBurnedCalories = Math.round((timerSeconds / 60) * calPerMin);

  const handleFinishWorkout = () => {
    if (liveBurnedCalories <= 0) {
      onToast('ยังไม่มีเวลาออกกำลังกายที่บันทึก');
      return;
    }
    setIsTimerRunning(false);
    if (onBurnCompleted) {
      onBurnCompleted(liveBurnedCalories, currentActivityObj.name);
    }
    onToast(`ยอดเยี่ยม! เบิร์นไปได้ ${liveBurnedCalories} kcal จาก ${currentActivityObj.name}`);
    onClose();
  };

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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-red-50 via-orange-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-red-600 text-white flex items-center justify-center shadow-md">
                <Flame size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">แปลงแคลอรี่อาหารเป็นกิจกรรมเบิร์น (Workout Converter)</h2>
                <p className="text-xs text-neutral-500 font-medium">เทียบพลังงานจาก <span className="text-orange-600 font-bold">{mealName}</span></p>
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
            {/* Calorie target customizer */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-700 block">พลังงานที่ต้องการชดเชย</span>
                <span className="text-[11px] text-neutral-400">คำนวณจากน้ำหนักตัว {userWeightKg} kg</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Math.max(10, Number(e.target.value)))}
                  className="w-24 px-3 py-1.5 bg-white rounded-xl border border-neutral-300 font-black text-base text-right text-orange-600 focus:outline-hidden focus:border-orange-500"
                />
                <span className="text-xs font-bold text-neutral-500">kcal</span>
              </div>
            </div>

            {/* Activities Grid */}
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-2">เลือกประเภทการออกกำลังกายที่ถนัด:</label>
              <div className="grid grid-cols-3 gap-2">
                {activities.map((act) => {
                  const isSelected = selectedActivity === act.id;
                  const minutes = Math.ceil(targetCalories / Math.max((act.met * 3.5 * userWeightKg) / 200, 1));
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setSelectedActivity(act.id as any);
                        setIsTimerRunning(false);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-600 shadow-md scale-[1.02]'
                          : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{act.icon}</div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-800'}`}>
                        {act.name}
                      </div>
                      <div className={`text-[11px] font-black mt-1 ${isSelected ? 'text-orange-100' : 'text-orange-600'}`}>
                        ~{minutes} นาที
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Equivalence Highlights */}
            <div className="bg-linear-to-r from-orange-500 to-red-500 text-white p-5 rounded-3xl shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-orange-100">
                <span>สรุปการเบิร์นอาหารจานนี้</span>
                <span>{currentActivityObj.name}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">{totalMinutesNeeded}</span>
                <span className="text-sm font-bold text-orange-100">นาที</span>
                {totalStepsNeeded && (
                  <span className="text-xs font-medium text-orange-200 ml-auto flex items-center gap-1">
                    <Footprints size={14} /> ~{totalStepsNeeded.toLocaleString()} ก้าว
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-100/90 leading-relaxed border-t border-white/20 pt-2">
                💡 <span className="font-bold">Fact:</span> การออกกำลังกายช่วยเพิ่มอัตราเมตาบอลิซึม (EPOC) ทำให้ร่างกายเผาผลาญไขมันต่อเนื่องหลังออกกำลังกายอีก 2-4 ชั่วโมง!
              </p>
            </div>

            {/* Live Instant Challenge Stopwatch */}
            <div className="bg-neutral-900 text-white p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <Timer size={16} className="text-orange-400" />
                  <span>เริ่มทำเควสต์เผาผลาญเดี๋ยวนี้ (Live Burn Tracker)</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                  Real-time
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-mono font-black tracking-wider text-white">
                    {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:
                    {(timerSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <span className="text-[11px] text-neutral-400">เวลาออกกำลังกายสะสม</span>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-orange-400 flex items-center justify-end gap-1">
                    <Flame size={24} className="text-orange-500" />
                    <span>{liveBurnedCalories}</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">kcal เผาผลาญจริง</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-orange-500 to-red-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (liveBurnedCalories / targetCalories) * 100)}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isTimerRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-500 text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause size={15} /> : <Play size={15} />}
                  <span>{isTimerRunning ? 'พักชั่วคราว' : 'เริ่มจับเวลาเบิร์น'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                  title="รีเซ็ตเวลา"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  disabled={liveBurnedCalories <= 0}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Check size={15} />
                  <span>บันทึกการเบิร์น</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
