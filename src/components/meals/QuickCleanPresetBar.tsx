import React from 'react';
import { Zap, Plus } from 'lucide-react';

interface CleanPreset {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  sodium?: number;
  portion: string;
  icon: string;
}

const CLEAN_PRESETS: CleanPreset[] = [
  { name: 'ไข่ต้ม 2 ฟอง', calories: 155, protein: 13, carbs: 1.1, fat: 11, sugar: 0.6, sodium: 130, portion: '2 ฟอง (~100g)', icon: '🥚' },
  { name: 'อกไก่ต้ม 150g', calories: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, sodium: 120, portion: '150g', icon: '🍗' },
  { name: 'เวย์โปรตีน 1 สกู๊ป', calories: 120, protein: 24, carbs: 3, fat: 1.5, sugar: 1, sodium: 80, portion: '1 scoop (~30g)', icon: '🥤' },
  { name: 'กล้วยหอม 1 ลูก', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, sugar: 14, sodium: 1, portion: '1 ลูก (~120g)', icon: '🍌' },
  { name: 'ข้าวกล้อง 1 ทัพพี', calories: 80, protein: 2, carbs: 18, fat: 0.6, sugar: 0, sodium: 2, portion: '1 ทัพพี (~60g)', icon: '🍚' },
  { name: 'แอปเปิ้ล 1 ผล', calories: 65, protein: 0.3, carbs: 17, fat: 0.2, sugar: 13, sodium: 1, portion: '1 ผล (~150g)', icon: '🍎' },
  { name: 'กาแฟดำไม่หวาน', calories: 5, protein: 0.3, carbs: 0.5, fat: 0, sugar: 0, sodium: 5, portion: '1 แก้ว', icon: '☕' },
  { name: 'สลัดอกไก่ไข่ต้ม', calories: 280, protein: 28, carbs: 12, fat: 8, sugar: 3, sodium: 350, portion: '1 จาน', icon: '🥗' },
];

interface QuickCleanPresetBarProps {
  selectedMeal: string;
  onQuickLog: (preset: CleanPreset) => void;
}

export const QuickCleanPresetBar: React.FC<QuickCleanPresetBarProps> = ({
  selectedMeal,
  onQuickLog
}) => {
  return (
    <div className="p-3.5 rounded-3xl bg-amber-50/60 border border-amber-200/60 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Zap size={13} />
          </div>
          <h4 className="text-xs font-bold text-neutral-900">บันทึกด่วน 1-Click (อาหารคลีน & ของว่างยอดนิยม)</h4>
        </div>
        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
          กดบันทึกทันที
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CLEAN_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onQuickLog(preset)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100/50 border border-amber-200/80 text-neutral-800 text-xs font-bold whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
          >
            <span>{preset.icon}</span>
            <span>{preset.name}</span>
            <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/50">
              {preset.calories}k
            </span>
            <Plus size={12} className="text-neutral-400 ml-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
};
