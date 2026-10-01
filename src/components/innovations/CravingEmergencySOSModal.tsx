import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, HeartPulse, Sparkles, Play, Pause, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CravingEmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const CravingEmergencySOSModal: React.FC<CravingEmergencySOSModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [cravingType, setCravingType] = useState<'sugar' | 'salty_crunchy' | 'late_night_boredom' | 'stress_binge'>('sugar');
  
  // 3-Minute Urge Surfing Timer (180 seconds)
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);

  // Breathing Visual Step
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(s => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
      onToast('🎉 คุณผ่านช่วงพีคของความอยาก (Craving Peak) 3 นาทีมาได้สำเร็จ!');
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft, onToast]);

  // Breathing loop (4-7-8)
  useEffect(() => {
    if (!timerRunning) return;
    const loop = setInterval(() => {
      setBreathPhase(p => p === 'inhale' ? 'hold' : p === 'hold' ? 'exhale' : 'inhale');
    }, 4000);
    return () => clearInterval(loop);
  }, [timerRunning]);

  const cravingHacks = {
    sugar: {
      title: 'อยากกินน้ำตาล / ชานมไข่มุก / ขนมหวาน',
      quickBioHack: 'ดื่มน้ำเย็นจัด 1 แก้วใหญ่ทันที + บ้วนปากด้วยน้ำยาบ้วนปากรสเปปเปอร์มินต์ (ความเย็นและเมนทอลจะรีเซ็ตต่อมรับรสหวานในสมองทันที)',
      safeSubstitute: 'ชาคาโมมายล์อุ่น, ดาร์กช็อกโกแลต 85% 1 ชิ้นเล็ก, หรือกรีกโยเกิร์ตโรยชินนามอน'
    },
    salty_crunchy: {
      title: 'อยากของกรอบเค็ม / มันฝรั่งทอด',
      quickBioHack: 'ร่างกายอาจขาดเกลือแร่หรือน้ำ ให้โรยเกลือชมพูใต้ลิ้นเล็กน้อยแล้วดื่มน้ำตาม',
      safeSubstitute: 'แตงกวาญี่ปุ่นจิ้มพริกไทยเกลือ, สาหร่ายอบไม่ทอด, หรือถั่วแระญี่ปุ่นอบกรอบ'
    },
    late_night_boredom: {
      title: 'หิวรอบดึกจากความเบื่อ / ไถมือถือ',
      quickBioHack: 'ลุกขึ้นไปแปรงฟันทันที และปิดไฟห้องให้สลัวเพื่อกระตุ้นฮอร์โมนเมลาโทนิน',
      safeSubstitute: 'นมอัลมอนด์อุ่น 1 แก้วเล็ก หรือน้ำเปล่าผสมมะนาวฝาน'
    },
    stress_binge: {
      title: 'อยากกินเพื่อคลายเครียด (Cortisol Spike)',
      quickBioHack: 'ทำ Box Breathing (หายใจเข้า 4 วิ - กลั้น 4 วิ - ออก 4 วิ) เพื่อกระตุ้นระบบประสาท Parasympathetic ลดคอร์ติซอล',
      safeSubstitute: 'ชาเขียวร้อน (L-Theanine ช่วยให้คลื่นสมองสงบ)'
    }
  };

  const currentHack = cravingHacks[cravingType];

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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-rose-50 via-pink-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md animate-pulse">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">ปุ่มฉุกเฉินดับความอยากดึก (3-Min Craving SOS)</h2>
                <p className="text-xs text-neutral-500 font-medium">Urge Surfing Protocol ดับคลื่นความอยากในสมอง</p>
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
            {/* Craving Type Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">คุณกำลังรู้สึกอยากทานอะไรตอนนี้?</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sugar', label: '🍰 ของหวาน / น้ำตาล', color: 'hover:border-pink-300' },
                  { id: 'salty_crunchy', label: '🍟 ของทอด / กรุบกรอบเค็ม', color: 'hover:border-amber-300' },
                  { id: 'late_night_boredom', label: '🌙 หิวดึก / เบื่อๆ หาไรเคี้ยว', color: 'hover:border-indigo-300' },
                  { id: 'stress_binge', label: '😫 เครียดสะสมอยากกินเยอะ', color: 'hover:border-purple-300' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setCravingType(type.id as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      cravingType === type.id
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : `bg-white text-neutral-700 border-neutral-200 ${type.color}`
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Minute Urge Surfing Timer Card */}
            <div className="bg-linear-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl text-center space-y-4 shadow-xl">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block">
                3-Minute Urge Surfing (คลื่นความอยากจะพีค 3 นาทีแล้วหายไป)
              </span>

              {/* Big Timer */}
              <div className="text-5xl font-mono font-black tracking-wider text-white">
                {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
              </div>

              {/* Breathing Avatar indicator */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-xs font-bold transition-all duration-1000 ${
                  breathPhase === 'inhale' ? 'scale-125 bg-rose-500/40' : breathPhase === 'hold' ? 'scale-125' : 'scale-90 bg-rose-500/10'
                }`}>
                  {breathPhase === 'inhale' ? 'หายใจเข้า' : breathPhase === 'hold' ? 'กลั้นไว้' : 'หายใจออก'}
                </div>
                <span className="text-[11px] text-neutral-400">หายใจตามจังหวะเพื่อลดฮอร์โมนอยากอาหาร</span>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="py-2 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span>{timerRunning ? 'หยุดชั่วคราว' : 'เริ่มนับถอยหลัง 3 นาที'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsLeft(180);
                  }}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Instant Bio-hack & Safe Substitute */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Bio-Hack ดับความอยากแบบเร่งด่วน:</span>
                </span>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {currentHack.quickBioHack}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>ตัวเลือกทดแทนที่แคลอรี่ต่ำและปลอดภัย:</span>
                </span>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  {currentHack.safeSubstitute}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
