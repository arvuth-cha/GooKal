import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Zap, ShieldAlert, Sparkles, Activity, Clock, Award } from 'lucide-react';

interface FastingStagesVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fastingHoursElapsed?: number;
  isFastingActive?: boolean;
  onToast: (msg: string) => void;
}

interface FastingStage {
  id: number;
  name: string;
  hourRange: string;
  startHour: number;
  endHour: number;
  icon: string;
  color: string;
  borderColor: string;
  bgLight: string;
  description: string;
  biologicalHighlights: string[];
}

const FASTING_STAGES: FastingStage[] = [
  {
    id: 1,
    name: 'สเตจที่ 1: น้ำตาลและอินซูลินเริ่มลดลง (Blood Sugar Drop)',
    hourRange: '0 - 4 ชั่วโมง',
    startHour: 0,
    endHour: 4,
    icon: '🩸',
    color: 'text-blue-600',
    borderColor: 'border-blue-300',
    bgLight: 'bg-blue-50',
    description: 'ร่างกายกำลังย่อยอาหารมื้อล่าสุด ระดับน้ำตาลในเลือดและอินซูลินค่อยๆ ลดลงสู่ระดับฐาน (Basal Level)',
    biologicalHighlights: [
      'อาหารย่อยสมบูรณ์ในกระเพาะอาหาร',
      'ตับอ่อนหยุดหลั่งอินซูลินส่วนเกิน',
      'เริ่มเตรียมเปลี่ยนแหล่งพลังงาน'
    ]
  },
  {
    id: 2,
    name: 'สเตจที่ 2: สลายไกลโคเจนในตับ (Glycogen Depletion)',
    hourRange: '4 - 12 ชั่วโมง',
    startHour: 4,
    endHour: 12,
    icon: '⚡',
    color: 'text-amber-600',
    borderColor: 'border-amber-300',
    bgLight: 'bg-amber-50',
    description: 'ไกลโคเจนสะสมในตับถูกดึงออกมาใช้เป็นพลังงานหลัก การอักเสบในระบบทางเดินอาหารเริ่มลดลง',
    biologicalHighlights: [
      'ระดับน้ำตาลในเลือดคงที่อย่างมีเสถียรภาพ',
      'ระบบย่อยอาหารได้พักผ่อนอย่างเต็มที่',
      'ตับเริ่มสลายกรดไขมันเบื้องต้น'
    ]
  },
  {
    id: 3,
    name: 'สเตจที่ 3: เผาผลาญไขมันสะสม & คีโตซิส (Fat Burning & Ketosis)',
    hourRange: '12 - 18 ชั่วโมง',
    startHour: 12,
    endHour: 18,
    icon: '🔥',
    color: 'text-orange-600',
    borderColor: 'border-orange-300',
    bgLight: 'bg-orange-50',
    description: 'ร่างกายเข้าสู่โหมดคีโตซิสเต็มตัว สลายไขมันสะสมใต้ผิวหนังและในช่องท้อง (Visceral Fat) เป็นคีโตนหล่อเลี้ยงสมอง',
    biologicalHighlights: [
      'ระดับ Growth Hormone เพิ่มขึ้นสูงสุด 5 เท่า',
      'สมองปลอดโปร่งขึ้นจาก Ketone bodies (BHB)',
      'การสลายกรดไขมัน (Lipolysis) ทำงานเต็ม 100%'
    ]
  },
  {
    id: 4,
    name: 'สเตจที่ 4: กลืนกินเซลล์เก่า รีไซเคิลระดับเซลล์ (Autophagy)',
    hourRange: '18 - 24+ ชั่วโมง',
    startHour: 18,
    endHour: 24,
    icon: '🧬',
    color: 'text-purple-600',
    borderColor: 'border-purple-300',
    bgLight: 'bg-purple-50',
    description: 'กระบวนการออโตฟาจี (Autophagy) เซลล์เริ่มกำจัดโปรตีนที่เสียหาย ซ่อมแซม DNA และกระตุ้นสเต็มเซลล์ภูมิคุ้มกัน',
    biologicalHighlights: [
      'กำจัดเซลล์แก่ชรา (Senescent Cells)',
      'ลดสารก่อการกลายพันธุ์และการอักเสบเรื้อรัง',
      'รีเซ็ตภูมิคุ้มกันและเพิ่มความยืดหยุ่นของเมตาบอลิซึม'
    ]
  }
];

export const FastingStagesVisualizerModal: React.FC<FastingStagesVisualizerModalProps> = ({
  isOpen,
  onClose,
  fastingHoursElapsed = 14.5,
  isFastingActive = true,
  onToast
}) => {
  const [currentHours, setCurrentHours] = useState(fastingHoursElapsed);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveHours, setLiveHours] = useState<number | null>(null);

  // Sync with live fasting session
  useEffect(() => {
    if (!isOpen) return;

    try {
      const raw = localStorage.getItem('kalguru_fasting_session_v1');
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.isActive && session.startTime) {
          const elapsed = Math.max(0, (Date.now() - session.startTime) / (1000 * 3600));
          setIsLiveActive(true);
          setLiveHours(elapsed);
          setCurrentHours(Number(elapsed.toFixed(1)));
          return;
        }
      }
    } catch {}

    setIsLiveActive(false);
    setLiveHours(null);
    setCurrentHours(fastingHoursElapsed);
  }, [isOpen, fastingHoursElapsed]);

  const currentStage = FASTING_STAGES.find(s => currentHours >= s.startHour && currentHours < s.endHour) || FASTING_STAGES[3];

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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-orange-50 via-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-orange-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                <Flame size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">สเตจชีววิทยาการฟาสติ้ง (Fasting Stages & Autophagy)</h2>
                <p className="text-xs text-neutral-500 font-medium">ดูว่าร่างกายของคุณกำลังอยู่ในระยะเผาผลาญใด</p>
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
            {/* Interactive Hours Slider */}
            <div className="bg-neutral-900 text-white p-5 rounded-3xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-300">ระยะเวลาฟาสติ้ง (Hours):</span>
                  {isLiveActive && liveHours !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ซิงค์เวลาจริง ({liveHours.toFixed(1)} ชม.)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isLiveActive && liveHours !== null && currentHours !== Number(liveHours.toFixed(1)) && (
                    <button
                      type="button"
                      onClick={() => setCurrentHours(Number(liveHours.toFixed(1)))}
                      className="text-[10px] text-orange-300 hover:text-orange-200 underline font-semibold cursor-pointer"
                    >
                      กลับสู่เวลาจริง
                    </button>
                  )}
                  <span className="text-xl font-mono font-black text-orange-400">
                    {currentHours.toFixed(1)} ชม.
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={currentHours}
                onChange={(e) => setCurrentHours(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>0 ชม. (เริ่ม)</span>
                <span>8 ชม. (น้ำตาลลง)</span>
                <span>14 ชม. (เผาไขมัน)</span>
                <span>18+ ชม. (Autophagy)</span>
              </div>
            </div>

            {/* Active Stage Highlight Card */}
            <div className={`p-5 rounded-3xl border ${currentStage.bgLight} ${currentStage.borderColor} space-y-3 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{currentStage.icon}</span>
                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-white border ${currentStage.borderColor} ${currentStage.color}`}>
                  {currentStage.hourRange}
                </span>
              </div>

              <div>
                <h3 className={`text-base font-bold ${currentStage.color}`}>{currentStage.name}</h3>
                <p className="text-xs text-neutral-700 mt-1 leading-relaxed font-medium">
                  {currentStage.description}
                </p>
              </div>

              <div className="space-y-1.5 border-t border-black/5 pt-2.5">
                <span className="text-[11px] font-bold text-neutral-800 block">🔬 ปรากฏการณ์ในร่างกายขณะนี้:</span>
                {currentStage.biologicalHighlights.map((hl, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
                    <Sparkles size={13} className={currentStage.color} />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All 4 Stages Timeline */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-neutral-800 block">ลำดับสเตจทั้ง 4 ขั้นของการฟาสติ้ง:</span>
              <div className="space-y-2">
                {FASTING_STAGES.map((stage) => {
                  const isActive = stage.id === currentStage.id;
                  return (
                    <div
                      key={stage.id}
                      onClick={() => setCurrentHours(stage.startHour + 1)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-[1.01]'
                          : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{stage.icon}</span>
                        <div>
                          <span className={`text-xs font-bold block ${isActive ? 'text-white' : 'text-neutral-800'}`}>
                            {stage.name.split(':')[1]}
                          </span>
                          <span className={`text-[10px] ${isActive ? 'text-neutral-300' : 'text-neutral-400'}`}>
                            {stage.hourRange}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-black">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
