import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, PieChart, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface HealthyPlateVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const HealthyPlateVisualizerModal: React.FC<HealthyPlateVisualizerModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  // Proportions of the plate (default 2:1:1 = 50% Veg, 25% Protein, 25% Carbs)
  const [vegPercent, setVegPercent] = useState(50);
  const [proteinPercent, setProteinPercent] = useState(25);
  const [carbPercent, setCarbPercent] = useState(25);

  const [selectedVeg, setSelectedVeg] = useState(['ผักกาดขาว', 'บรอกโคลี', 'มะเขือเทศ']);
  const [selectedProtein, setSelectedProtein] = useState(['อกไก่ย่าง', 'ไข่ต้ม']);
  const [selectedCarb, setSelectedCarb] = useState(['ข้าวกล้องไรซ์เบอร์รี่']);

  const isPerfectRatio = vegPercent >= 45 && vegPercent <= 55 && proteinPercent >= 20 && carbPercent >= 20;

  const resetTo211 = () => {
    setVegPercent(50);
    setProteinPercent(25);
    setCarbPercent(25);
    onToast('รีเซ็ตสู่สัดส่วนมาตรฐาน 2:1:1 ของกรมอนามัยแล้ว');
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-emerald-50 via-teal-50 to-sky-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md text-xl">
                🥗
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">จำลองสัดส่วนจานสุขภาพ 2:1:1 (Healthy Plate)</h2>
                <p className="text-xs text-neutral-500 font-medium">ผัก 2 ส่วน : โปรตีน 1 ส่วน : ข้าวแป้ง 1 ส่วน</p>
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
            {/* Visual Plate Graphic */}
            <div className="relative w-64 h-64 mx-auto my-2 rounded-full border-8 border-neutral-100 shadow-2xl bg-white flex items-center justify-center overflow-hidden">
              {/* Semi-circle left: Veggies 50% */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-emerald-500/90 text-white flex flex-col items-center justify-center p-3 transition-all duration-300 border-r-2 border-white"
                style={{ width: `${vegPercent}%` }}
              >
                <span className="text-2xl mb-1">🥦</span>
                <span className="font-black text-xs">ผัก & ไฟเบอร์</span>
                <span className="text-[10px] font-bold opacity-90">{vegPercent}% (2 ส่วน)</span>
              </div>

              {/* Right top: Lean Protein 25% */}
              <div
                className="absolute right-0 top-0 bg-blue-500/90 text-white flex flex-col items-center justify-center p-2 transition-all duration-300 border-b border-white"
                style={{ width: `${100 - vegPercent}%`, height: `${(proteinPercent / (proteinPercent + carbPercent)) * 100}%` }}
              >
                <span className="text-xl">🥩</span>
                <span className="font-black text-xs">โปรตีนลีน</span>
                <span className="text-[10px] font-bold opacity-90">{proteinPercent}% (1 ส่วน)</span>
              </div>

              {/* Right bottom: Complex Carbs 25% */}
              <div
                className="absolute right-0 bottom-0 bg-amber-500/90 text-white flex flex-col items-center justify-center p-2 transition-all duration-300"
                style={{ width: `${100 - vegPercent}%`, height: `${(carbPercent / (proteinPercent + carbPercent)) * 100}%` }}
              >
                <span className="text-xl">🍚</span>
                <span className="font-black text-xs">คาร์บไม่ขัดสี</span>
                <span className="text-[10px] font-bold opacity-90">{carbPercent}% (1 ส่วน)</span>
              </div>

              {/* Center badge */}
              <div className="absolute w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-black text-neutral-800 border border-neutral-200">
                2:1:1
              </div>
            </div>

            {/* Status indicator */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isPerfectRatio ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                {isPerfectRatio ? <CheckCircle2 size={18} className="text-emerald-600" /> : <ShieldCheck size={18} className="text-amber-600" />}
                <span className="font-bold text-xs">
                  {isPerfectRatio ? 'ยอดเยี่ยม! สัดส่วนจานตรงตามสูตร 2:1:1 ลดพุงสุขภาพดี' : 'สัดส่วนเบี่ยงเบนจากสูตร 2:1:1 เล็กน้อย'}
                </span>
              </div>
              <button
                type="button"
                onClick={resetTo211}
                className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900 underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>รีเซ็ต</span>
              </button>
            </div>

            {/* Adjustment Sliders */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-xs font-bold text-neutral-800 block">ปรับขนาดสัดส่วนในจานของคุณ:</span>

              <div>
                <div className="flex justify-between text-xs font-bold text-emerald-700 mb-1">
                  <span>🥦 สัดส่วนผักใบเขียว (Veggies):</span>
                  <span>{vegPercent}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="70"
                  value={vegPercent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVegPercent(v);
                    const remainder = 100 - v;
                    setProteinPercent(Math.round(remainder / 2));
                    setCarbPercent(remainder - Math.round(remainder / 2));
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-blue-700 mb-1">
                  <span>🥩 สัดส่วนโปรตีน (Protein):</span>
                  <span>{proteinPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={proteinPercent}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setProteinPercent(p);
                    setCarbPercent(Math.max(10, 100 - vegPercent - p));
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-amber-700 mb-1">
                  <span>🍚 สัดส่วนคาร์บ (Carbs):</span>
                  <span>{carbPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={carbPercent}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    setCarbPercent(c);
                    setProteinPercent(Math.max(10, 100 - vegPercent - c));
                  }}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Science Card */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-1.5 shadow-inner">
              <span className="text-xs font-bold text-emerald-400 block">💡 เคล็ดลับการทานตามสูตร 2:1:1:</span>
              <p className="text-xs text-neutral-300 leading-relaxed">
                การทานผักครึ่งจานช่วยเพิ่มปริมาณกระเพาะอาหารโดยไม่เพิ่มแคลอรี่ส่วนเกิน ทำให้ฮอร์โมนเลปติน (Leptin) ส่งสัญญาณอิ่มถึงสมองอย่างรวดเร็ว และใยอาหารจะชะลอการดูดซึมน้ำตาลเข้าสู่กระแสเลือด
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
