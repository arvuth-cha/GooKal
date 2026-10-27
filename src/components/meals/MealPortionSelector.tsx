import React from 'react';
import { Scale, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../../utils/voiceService';

interface MealPortionSelectorProps {
  currentMultiplier: number;
  onMultiplierChange: (multiplier: number) => void;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
}

export const MealPortionSelector: React.FC<MealPortionSelectorProps> = ({
  currentMultiplier,
  onMultiplierChange,
  baseCalories,
  baseProtein,
  baseCarbs,
  baseFat
}) => {
  const portions = [
    { label: '0.5x', desc: 'ครึ่งจาน', icon: '🖐️', detail: 'ขนาดเท่าฝ่ามือ', val: 0.5 },
    { label: '0.75x', desc: 'จานเล็ก', icon: '🥣', detail: 'ถ้วยเล็ก/พอดีคำ', val: 0.75 },
    { label: '1.0x', desc: '1 จานปกติ', icon: '🍽️', detail: 'ขนาดมาตรฐาน', val: 1.0 },
    { label: '1.5x', desc: 'พิเศษ/พูน', icon: '🍲', detail: 'จานใหญ่พิเศษ', val: 1.5 },
    { label: '2.0x', desc: '2 จาน', icon: '🍱', detail: 'สองที่/จัมโบ้', val: 2.0 },
  ];

  const calcP = Math.round(baseProtein * currentMultiplier * 10) / 10;
  const calcC = Math.round(baseCarbs * currentMultiplier * 10) / 10;
  const calcF = Math.round(baseFat * currentMultiplier * 10) / 10;
  const calcCal = Math.round((calcP * 4) + (calcC * 4) + (calcF * 9));

  const handleSelect = (val: number) => {
    triggerHaptic(20);
    onMultiplierChange(val);
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-neutral-100 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <Scale size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-800">ปรับขนาดปริมาณที่รับประทานจริง (Visual Portion)</h3>
            <p className="text-[10px] text-neutral-400 font-medium">เทียบขนาดกับของจริง เพื่อความแม่นยำของแคลอรี่</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60 shrink-0">
          x{currentMultiplier} ({portions.find(p => p.val === currentMultiplier)?.desc || 'กำหนดเอง'})
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {portions.map((portion) => {
          const isSelected = currentMultiplier === portion.val;
          return (
            <button
              key={portion.label}
              type="button"
              id={`portion-btn-${portion.val}`}
              onClick={() => handleSelect(portion.val)}
              className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm ring-2 ring-orange-500/20 scale-[1.02]'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/80 text-neutral-700 active:scale-95'
              }`}
            >
              <span className="text-xs mb-0.5">{portion.icon}</span>
              <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-neutral-900'}`}>{portion.label}</span>
              <span className={`text-[9px] font-medium leading-none mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>{portion.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Visual Fine-Tuning Slider */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 mb-1">
          <span>0.25x (ชิม)</span>
          <span className="text-orange-600 font-bold">{Math.round(currentMultiplier * 100)}% ของจานปกติ</span>
          <span>3.0x (บุฟเฟต์)</span>
        </div>
        <input 
          type="range"
          min="0.25"
          max="3.0"
          step="0.25"
          value={currentMultiplier}
          onChange={(e) => handleSelect(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
      </div>

      {currentMultiplier !== 1.0 && (
        <div className="flex items-center justify-between text-[11px] font-bold px-3 py-1.5 rounded-xl bg-orange-50/80 text-orange-900 border border-orange-100">
          <span>คำนวณใหม่:</span>
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-black">{calcCal} kcal</span>
            <span className="text-neutral-400">•</span>
            <span>P: {calcP}g</span>
            <span>C: {calcC}g</span>
            <span>F: {calcF}g</span>
          </div>
        </div>
      )}
    </div>
  );
};
