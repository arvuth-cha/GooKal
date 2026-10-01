import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SlidersHorizontal, Camera, Sparkles, TrendingDown, CheckCircle2, Ruler, Scale } from 'lucide-react';

interface VisualPhotoComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const VisualPhotoComparisonModal: React.FC<VisualPhotoComparisonModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [neckCm, setNeckCm] = useState<number>(38);
  const [waistCm, setWaistCm] = useState<number>(82);
  const [hipCm, setHipCm] = useState<number>(96);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);

  // US Navy Body Fat % Formula
  // Male: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
  // Female: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
  let bodyFatPercent = 18.5;
  try {
    if (gender === 'male') {
      const val = 495 / (1.0324 - 0.19077 * Math.log10(Math.max(1, (waistCm || 80) - (neckCm || 38))) + 0.15456 * Math.log10(heightCm || 175)) - 450;
      const parsedVal = Number(val.toFixed(1));
      bodyFatPercent = isNaN(parsedVal) ? 18.5 : Math.min(45, Math.max(6, parsedVal));
    } else {
      const val = 495 / (1.29579 - 0.35004 * Math.log10(Math.max(1, (waistCm || 70) + (hipCm || 96) - (neckCm || 32))) + 0.22100 * Math.log10(heightCm || 160)) - 450;
      const parsedVal = Number(val.toFixed(1));
      bodyFatPercent = isNaN(parsedVal) ? 23.5 : Math.min(50, Math.max(12, parsedVal));
    }
  } catch (e) {
    bodyFatPercent = 18.5;
  }

  // Waist-to-Hip Ratio (WHR)
  const safeHip = hipCm > 0 ? hipCm : 96;
  const rawWhr = Number(((waistCm || 75) / safeHip).toFixed(2));
  const whr = isNaN(rawWhr) ? 0.8 : rawWhr;
  const isHealthyWhr = gender === 'male' ? whr < 0.90 : whr < 0.85;

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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-teal-50 via-sky-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">เปรียบเทียบหุ่น & เปอร์เซ็นต์ไขมัน (US Navy Fat %)</h2>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                    Body Matrix
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">คำนวณไขมันร่างกายแม่นยำด้วยสูตรนาวิกโยธินสหรัฐ และสไลเดอร์ Before/After</p>
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
            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-1">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">เปอร์เซ็นต์ไขมัน (Body Fat %)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-teal-950">{bodyFatPercent}%</span>
                </div>
                <span className="text-[10px] text-teal-700 block font-medium">เกณฑ์: {bodyFatPercent < 20 ? 'หุ่นลีนกล้ามชัด 🟢' : 'เกณฑ์สุขภาพดี 🟡'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-1">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">อัตราส่วนเอวต่อสะโพก (WHR)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-indigo-950">{whr}</span>
                </div>
                <span className="text-[10px] text-indigo-700 block font-medium">
                  {isHealthyWhr ? 'ความเสี่ยงโรคหัวใจต่ำ 🟢' : 'ควรลดรอบเอว 🔴'}
                </span>
              </div>
            </div>

            {/* US Navy Calculator Sliders */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700">เพศสรีรวิทยา:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      gender === 'male' ? 'bg-teal-600 text-white' : 'bg-white text-neutral-600 border'
                    }`}
                  >
                    👨 ชาย
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      gender === 'female' ? 'bg-teal-600 text-white' : 'bg-white text-neutral-600 border'
                    }`}
                  >
                    👩 หญิง
                  </button>
                </div>
              </div>

              {/* Waist */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                  <span>รอบเอว (ระดับสะดือ):</span>
                  <span className="text-teal-800 font-mono">{waistCm} ซม.</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="130"
                  value={waistCm}
                  onChange={(e) => setWaistCm(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Neck */}
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                  <span>รอบคอ (ใต้ลูกกระเดือก):</span>
                  <span className="text-teal-800 font-mono">{neckCm} ซม.</span>
                </div>
                <input
                  type="range"
                  min="28"
                  max="55"
                  value={neckCm}
                  onChange={(e) => setNeckCm(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Hip */}
              {gender === 'female' && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                    <span>รอบสะโพก (ส่วนที่กว้างที่สุด):</span>
                    <span className="text-teal-800 font-mono">{hipCm} ซม.</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="140"
                    value={hipCm}
                    onChange={(e) => setHipCm(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>
              )}
            </div>

            {/* Before / After visual slider simulation */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1 text-teal-300">
                  <Camera size={14} /> ไทม์ไลน์ภาพถ่ายพัฒนาการรูปร่าง (Before vs Now)
                </span>
                <span className="text-neutral-400 text-[11px] font-mono">Day 1 vs Day 60</span>
              </div>

              <div className="relative w-full h-36 rounded-2xl bg-neutral-800 overflow-hidden flex items-center justify-center border border-white/10">
                <div className="absolute inset-y-0 left-0 bg-neutral-700/80 flex flex-col justify-center items-center text-center p-3" style={{ width: `${sliderPosition}%` }}>
                  <span className="text-xs font-bold text-neutral-300">🔴 วันแรก (Day 1)</span>
                  <span className="text-[11px] text-neutral-400 mt-1">น้ำหนัก 76.5 kg • ไขมัน 24%</span>
                </div>
                <div className="absolute inset-y-0 right-0 bg-teal-900/60 flex flex-col justify-center items-center text-center p-3" style={{ width: `${100 - sliderPosition}%` }}>
                  <span className="text-xs font-bold text-teal-300">🟢 ปัจจุบัน (Current)</span>
                  <span className="text-[11px] text-teal-200 mt-1">น้ำหนัก 70.0 kg • ไขมัน {bodyFatPercent}%</span>
                </div>
                {/* Vertical Divider line */}
                <div
                  className="absolute inset-y-0 w-1 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white text-neutral-900 text-[10px] font-black flex items-center justify-center shadow-md">
                    ↔
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                onToast(`บันทึกผลการคำนวณไขมัน: ${bodyFatPercent}% เรียบร้อยแล้ว!`);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              บันทึกและปิด
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
