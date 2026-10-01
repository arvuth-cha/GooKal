import React from 'react';
import { Scale, Sparkles } from 'lucide-react';

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
    { label: '0.5x', desc: 'ครึ่งจาน', val: 0.5 },
    { label: '0.75x', desc: 'จานเล็ก', val: 0.75 },
    { label: '1.0x', desc: '1 จานปกติ', val: 1.0 },
    { label: '1.5x', desc: 'พิเศษ', val: 1.5 },
    { label: '2.0x', desc: '2 จาน / จัมโบ้', val: 2.0 },
  ];

  const calcP = Math.round(baseProtein * currentMultiplier * 10) / 10;
  const calcC = Math.round(baseCarbs * currentMultiplier * 10) / 10;
  const calcF = Math.round(baseFat * currentMultiplier * 10) / 10;
  const calcCal = Math.round((calcP * 4) + (calcC * 4) + (calcF * 9));

  return (
    <div className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <Scale size={14} />
          </div>
          <h3 className="text-xs font-bold text-neutral-800">ปรับขนาดปริมาณที่รับประทานจริง (Portion Multiplier)</h3>
        </div>
        <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
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
              onClick={() => onMultiplierChange(portion.val)}
              className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm ring-2 ring-orange-500/20'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/80 text-neutral-700'
              }`}
            >
              <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-neutral-900'}`}>{portion.label}</span>
              <span className={`text-[9px] font-medium leading-none mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>{portion.desc}</span>
            </button>
          );
        })}
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
