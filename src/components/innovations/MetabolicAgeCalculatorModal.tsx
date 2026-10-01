import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Heart, Activity, Sparkles, TrendingDown, TrendingUp, Award, ArrowRight } from 'lucide-react';

interface MetabolicAgeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAge?: number;
  userWeight?: number;
  userHeight?: number;
  onToast: (msg: string) => void;
}

export const MetabolicAgeCalculatorModal: React.FC<MetabolicAgeCalculatorModalProps> = ({
  isOpen,
  onClose,
  userAge = 32,
  userWeight = 68,
  userHeight = 172,
  onToast
}) => {
  const [chronologicalAge, setChronologicalAge] = useState<number>(userAge);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(62);
  const [waistCircumferenceCm, setWaistCircumferenceCm] = useState<number>(78);
  const [weeklyExerciseHours, setWeeklyExerciseHours] = useState<number>(4);
  const [dailyStepAverage, setDailyStepAverage] = useState<number>(8500);
  const [dailyDietQuality, setDailyDietQuality] = useState<'clean' | 'balanced' | 'fastfood'>('clean');
  const [sleepHoursAvg, setSleepHoursAvg] = useState<number>(7.5);

  // Biological Age calculation algorithm
  // Waist-to-height ratio (WHtR)
  const safeHeight = userHeight > 0 ? userHeight : 170;
  const rawWhtr = (waistCircumferenceCm || 75) / safeHeight;
  const whtr = isNaN(rawWhtr) ? 0.45 : rawWhtr;
  let ageOffset = 0;

  // 1. RHR impact
  const rhr = restingHeartRate || 68;
  if (rhr < 58) ageOffset -= 3;
  else if (rhr <= 68) ageOffset -= 1.5;
  else if (rhr > 80) ageOffset += 3.5;

  // 2. WHtR impact (Healthy < 0.5)
  if (whtr < 0.46) ageOffset -= 2.5;
  else if (whtr > 0.55) ageOffset += 4;
  else if (whtr > 0.60) ageOffset += 7;

  // 3. Exercise & Steps
  if (weeklyExerciseHours >= 4 && dailyStepAverage >= 8000) ageOffset -= 3;
  else if (weeklyExerciseHours < 1 || dailyStepAverage < 4000) ageOffset += 3.5;

  // 4. Diet
  if (dailyDietQuality === 'clean') ageOffset -= 2;
  else if (dailyDietQuality === 'fastfood') ageOffset += 3;

  // 5. Sleep
  if (sleepHoursAvg >= 7 && sleepHoursAvg <= 8.5) ageOffset -= 1;
  else if (sleepHoursAvg < 6) ageOffset += 2;

  const chronoAge = chronologicalAge || 30;
  const metabolicAge = Math.max(18, Math.round(chronoAge + ageOffset));
  const ageDifference = metabolicAge - chronoAge;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-teal-50 via-emerald-50 to-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Flame size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">คำนวณอายุเมทาบอลิซึม & เซลล์ชีวภาพ</h2>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                    Metabolic Bio-Age
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">ประเมินอายุร่างกายที่แท้จริงจากอัตราการเต้นหัวใจ สัดส่วน และกิจกรรม</p>
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

          {/* Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Age Outcome Score Banner */}
            <div className="p-5 rounded-3xl bg-linear-to-br from-neutral-900 via-neutral-800 to-teal-950 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-300 font-bold uppercase tracking-wider block">อายุระบบเผาผลาญ (Metabolic Age)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white">{metabolicAge}</span>
                    <span className="text-sm font-semibold text-neutral-300">ปี</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-neutral-400 font-medium block">อายุปฏิทินจริง (Chronological)</span>
                  <span className="text-xl font-bold text-neutral-200">{chronologicalAge} ปี</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                {ageDifference < 0 ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <TrendingDown size={16} />
                    <span>ร่างกายเด็กกว่าอายุจริง {Math.abs(ageDifference)} ปี! ยอดเยี่ยมมาก 🎉</span>
                  </div>
                ) : ageDifference === 0 ? (
                  <div className="flex items-center gap-2 text-teal-300 font-bold">
                    <Award size={16} />
                    <span>อายุเมทาบอลิซึมตรงกับอายุปฏิทินพอดี สมดุลดีเยี่ยม</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <TrendingUp size={16} />
                    <span>แก่กว่าอายุจริง {ageDifference} ปี (สามารถฟื้นฟูได้ด้วยการปรับอาหารและคาร์ดิโอ)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input parameters sliders */}
            <div className="space-y-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <h3 className="font-bold text-xs text-neutral-800 uppercase tracking-wide">พารามิเตอร์สุขภาพของคุณ:</h3>

              {/* Age */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                  <span>อายุปัจจุบัน:</span>
                  <span className="text-neutral-900 font-mono">{chronologicalAge} ปี</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={chronologicalAge}
                  onChange={(e) => setChronologicalAge(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Resting HR */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                  <span>อัตราการเต้นหัวใจขณะพัก (Resting HR):</span>
                  <span className="text-teal-800 font-mono font-bold">{restingHeartRate} bpm</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="95"
                  value={restingHeartRate}
                  onChange={(e) => setRestingHeartRate(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Waist */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                  <span>รอบเอว (Waist Circumference):</span>
                  <span className="text-teal-800 font-mono font-bold">{waistCircumferenceCm} ซม. (WHtR: {whtr.toFixed(2)})</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="120"
                  value={waistCircumferenceCm}
                  onChange={(e) => setWaistCircumferenceCm(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Exercise */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                  <span>การออกกำลังกายต่อสัปดาห์:</span>
                  <span className="text-teal-800 font-mono font-bold">{weeklyExerciseHours} ชั่วโมง/สัปดาห์</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  value={weeklyExerciseHours}
                  onChange={(e) => setWeeklyExerciseHours(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Diet Quality */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">คุณภาพอาหารหลัก:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'clean', label: '🥗 คลีน/โปรตีนสูง' },
                    { id: 'balanced', label: '🍱 สมดุลทั่วไป' },
                    { id: 'fastfood', label: '🍔 บุฟเฟต์/แป้งทอด' },
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDailyDietQuality(d.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        dailyDietQuality === d.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actionable Rejuvenation Protocol */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-teal-950">
                <Sparkles size={14} className="text-teal-600" /> คำแนะนำเพื่อลดอายุเมทาบอลิซึมลงอีก 3-5 ปี:
              </div>
              <ul className="list-disc list-inside space-y-1 text-teal-800 font-medium leading-relaxed">
                <li>ทำ Zone 2 Cardio สัปดาห์ละ 150 นาที เพื่อเพิ่มประสิทธิภาพไมโทคอนเดรีย</li>
                <li>รักษาอัตราส่วนรอบเอวต่อส่วนสูง (WHtR) ให้อยู่ต่ำกว่า 0.50 เพื่อลดไขมันในช่องท้อง (Visceral Fat)</li>
                <li>ทานโปรตีนให้ถึง 1.6 - 2.0g ต่อน้ำหนักตัว (กก.) ป้องกันการสูญเสียมวลกล้ามเนื้อ (Sarcopenia)</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                onToast(`คำนวณอายุเมทาบอลิซึม: ${metabolicAge} ปี เรียบร้อยแล้ว!`);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              บันทึกผลและปิด
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
