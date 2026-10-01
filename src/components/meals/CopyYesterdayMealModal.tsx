import React, { useState } from 'react';
import { Copy, History, X, Check, ArrowRight, Utensils, AlertCircle } from 'lucide-react';
import { playSuccessChime, triggerHaptic } from '../../utils/voiceService';

interface HistoryItem {
  id: string;
  foodName: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sugarGrams?: number;
  sodiumMg?: number;
  explanation: string;
  date: number;
  image: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface CopyYesterdayMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  currentDate: Date;
  onCopyMeals: (mealsToCopy: HistoryItem[]) => void;
  onToast: (msg: string) => void;
}

export const CopyYesterdayMealModal: React.FC<CopyYesterdayMealModalProps> = ({
  isOpen,
  onClose,
  history,
  currentDate,
  onCopyMeals,
  onToast
}) => {
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Calculate Yesterday's Date
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = yesterday.toISOString().split('T')[0];

  // Filter history for yesterday
  const yesterdayMeals = history.filter((item) => {
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    return itemDate === yesterdayDateStr;
  });

  const toggleSelect = (id: string) => {
    const updated = new Set(selectedMealIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedMealIds(updated);
  };

  const selectAll = () => {
    if (selectedMealIds.size === yesterdayMeals.length) {
      setSelectedMealIds(new Set());
    } else {
      setSelectedMealIds(new Set(yesterdayMeals.map(m => m.id)));
    }
  };

  const handleExecuteCopy = () => {
    const toCopy = yesterdayMeals.filter(m => selectedMealIds.has(m.id));
    if (toCopy.length === 0) {
      onToast('⚠️ กรุณาเลือกมื้ออาหารอย่างน้อย 1 รายการ');
      return;
    }

    playSuccessChime();
    triggerHaptic([40, 60]);
    onCopyMeals(toCopy);
    onToast(`✨ คัดลอกมื้ออาหาร ${toCopy.length} รายการจากเมื่อวานเรียบร้อย!`);
    onClose();
  };

  const mealTypeLabels: Record<string, string> = {
    breakfast: '🌅 มื้อเช้า',
    lunch: '☀️ มื้อเที่ยง',
    dinner: '🌙 มื้อเย็น',
    snack: '🍎 ของว่าง'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-blue-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Copy size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 leading-tight">ลอกมื้ออาหารจากเมื่อวาน</h2>
              <p className="text-xs text-neutral-500 font-medium">
                เลือกเมนูที่รับประทานซ้ำ เพื่อบันทึกลงในวันนี้อัตโนมัติ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {yesterdayMeals.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-bold text-neutral-700">ไม่พบบันทึกอาหารของเมื่อวาน</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                คุณยังไม่ได้บันทึกอาหารในวันก่อนหน้า สามารถใช้การถ่ายภาพ พิมพ์ หรือสั่งด้วยเสียงได้ตามปกติ
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-neutral-500">
                  พบ {yesterdayMeals.length} รายการของเมื่อวาน
                </span>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {selectedMealIds.size === yesterdayMeals.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>

              {/* Quick Select by Meal Type */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-neutral-400 font-bold shrink-0">เลือกด่วน:</span>
                {[
                  { id: 'breakfast', label: '🌅 เฉพาะมื้อเช้า' },
                  { id: 'lunch', label: '☀️ เฉพาะมื้อเที่ยง' },
                  { id: 'dinner', label: '🌙 เฉพาะมื้อเย็น' },
                  { id: 'snack', label: '🍎 เฉพาะของว่าง' }
                ].map((type) => {
                  const mealsOfType = yesterdayMeals.filter(m => m.mealType === type.id);
                  if (mealsOfType.length === 0) return null;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        const updated = new Set(selectedMealIds);
                        mealsOfType.forEach(m => updated.add(m.id));
                        setSelectedMealIds(updated);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold shrink-0 transition-colors border border-blue-200/60 cursor-pointer"
                    >
                      {type.label} ({mealsOfType.length})
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {yesterdayMeals.map((meal) => {
                  const isSelected = selectedMealIds.has(meal.id);
                  return (
                    <div
                      key={meal.id}
                      onClick={() => toggleSelect(meal.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/10'
                          : 'bg-white border-neutral-200/80 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-neutral-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900">{meal.foodName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                              {mealTypeLabels[meal.mealType] || meal.mealType}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 font-medium">
                            {meal.calories} kcal • P: {meal.proteinGrams}g C: {meal.carbsGrams}g F: {meal.fatGrams}g
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-600">{meal.calories} kcal</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {yesterdayMeals.length > 0 && (
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50">
            <span className="text-xs font-bold text-neutral-600">
              เลือกแล้ว {selectedMealIds.size} รายการ
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteCopy}
                disabled={selectedMealIds.size === 0}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={14} />
                <span>คัดลอกลงวันนี้</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
