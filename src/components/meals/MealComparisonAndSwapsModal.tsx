import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Sparkles, 
  Flame, 
  TrendingDown, 
  Check, 
  X, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Zap
} from 'lucide-react';
import { SMART_NUTRITION_SWAPS, OFFLINE_THAI_FOOD_DATABASE } from '../../utils/offlineFoodDatabase';
import { SmartSwapItem, OfflineFoodDatabaseItem } from '../../types/extendedFeatures';

interface MealComparisonAndSwapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFoodToLog: (food: OfflineFoodDatabaseItem) => void;
  onToast: (msg: string) => void;
}

export const MealComparisonAndSwapsModal: React.FC<MealComparisonAndSwapsModalProps> = ({
  isOpen,
  onClose,
  onSelectFoodToLog,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'swaps' | 'compare'>('swaps');
  
  // Comparer state
  const [mealAId, setMealAId] = useState<string>('th-6'); // ข้าวมันไก่ทอด
  const [mealBId, setMealBId] = useState<string>('th-4'); // ข้าวมันไก่ต้ม

  if (!isOpen) return null;

  const mealA = OFFLINE_THAI_FOOD_DATABASE.find(f => f.id === mealAId) || OFFLINE_THAI_FOOD_DATABASE[5];
  const mealB = OFFLINE_THAI_FOOD_DATABASE.find(f => f.id === mealBId) || OFFLINE_THAI_FOOD_DATABASE[3];

  const calDiff = mealA.calories - mealB.calories;
  const proteinDiff = mealB.protein - mealA.protein;
  const fatDiff = mealA.fat - mealB.fat;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">เทคนิคสลับเมนู & เปรียบเทียบโภชนาการ</h2>
              <p className="text-xs text-neutral-500 font-medium">Smart Food Swaps & Side-by-Side Comparison</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex gap-2 border-b border-neutral-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('swaps')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'swaps'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            💡 สูตรสลับเมนูประหยัดแคล (Smart Swaps)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'compare'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            ⚖️ เปรียบเทียบ 2 เมนูคู่ขนาน
          </button>
        </div>

        {/* Tab 1: Smart Swaps List */}
        {activeTab === 'swaps' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-4 rounded-3xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-950 flex items-start gap-2.5">
              <Sparkles size={18} className="text-teal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                การเปลี่ยนส่วนประกอบเพียงเล็กน้อยในอาหารไทย สามารถ<strong>ประหยัดแคลอรีได้ 200 - 400 kcal ต่อมื้อ</strong> โดยที่คุณยังอิ่มอร่อยและไม่รู้สึกทรมาน!
              </p>
            </div>

            <div className="space-y-3">
              {SMART_NUTRITION_SWAPS.map((swap, idx) => (
                <div key={idx} className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                      หมวด: {swap.category}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <TrendingDown size={13} />
                      ประหยัด {swap.caloriesSaved} kcal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-500 uppercase">เดิม</span>
                      <h4 className="font-bold text-xs text-rose-950 mt-0.5">{swap.originalName}</h4>
                      <span className="text-xs font-black text-rose-600 mt-1 block">{swap.originalCalories} kcal</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">สลับเป็น ✨</span>
                      <h4 className="font-bold text-xs text-emerald-950 mt-0.5">{swap.swapName}</h4>
                      <span className="text-xs font-black text-emerald-700 mt-1 block">{swap.swapCalories} kcal</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    🎯 <strong>ทำไมจึงดีกว่า:</strong> {swap.reason}
                  </p>

                  <div className="text-[11px] font-medium text-teal-800 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                    💡 <strong>คำแนะนำการสั่ง:</strong> {swap.proTip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Side by Side Comparison */}
        {activeTab === 'compare' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selector A */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-600">เมนู A (เปรียบเทียบ):</label>
                <select
                  value={mealAId}
                  onChange={(e) => setMealAId(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none"
                >
                  {OFFLINE_THAI_FOOD_DATABASE.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.calories} kcal)</option>
                  ))}
                </select>
              </div>

              {/* Selector B */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-600">เมนู B (ทางเลือก):</label>
                <select
                  value={mealBId}
                  onChange={(e) => setMealBId(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none"
                >
                  {OFFLINE_THAI_FOOD_DATABASE.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.calories} kcal)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card A */}
              <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400">เมนู A</span>
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-900 mt-0.5 line-clamp-2">{mealA.name}</h4>
                  <span className="text-2xl font-black text-neutral-900 mt-1 block">{mealA.calories} <span className="text-xs font-normal">kcal</span></span>
                </div>

                <div className="space-y-1 text-xs text-neutral-600 border-t pt-2">
                  <div className="flex justify-between"><span>โปรตีน:</span><strong>{mealA.protein}g</strong></div>
                  <div className="flex justify-between"><span>คาร์บ:</span><strong>{mealA.carbs}g</strong></div>
                  <div className="flex justify-between"><span>ไขมัน:</span><strong>{mealA.fat}g</strong></div>
                  <div className="flex justify-between"><span>โซเดียม:</span><strong>{mealA.sodium || '-'}mg</strong></div>
                </div>
              </div>

              {/* Card B */}
              <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600">เมนู B</span>
                  <h4 className="font-bold text-xs sm:text-sm text-emerald-950 mt-0.5 line-clamp-2">{mealB.name}</h4>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">{mealB.calories} <span className="text-xs font-normal">kcal</span></span>
                </div>

                <div className="space-y-1 text-xs text-neutral-600 border-t border-emerald-200/80 pt-2">
                  <div className="flex justify-between"><span>โปรตีน:</span><strong>{mealB.protein}g</strong></div>
                  <div className="flex justify-between"><span>คาร์บ:</span><strong>{mealB.carbs}g</strong></div>
                  <div className="flex justify-between"><span>ไขมัน:</span><strong>{mealB.fat}g</strong></div>
                  <div className="flex justify-between"><span>โซเดียม:</span><strong>{mealB.sodium || '-'}mg</strong></div>
                </div>
              </div>
            </div>

            {/* Savings Analysis Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white space-y-2 shadow-lg">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Zap size={16} />
                <span>สรุปผลการเลือกเมนู B แทนเมนู A:</span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-2xl bg-white/10">
                  <span className="text-[10px] text-teal-100 block">แคลอรี</span>
                  <strong className="text-sm font-black">{calDiff > 0 ? `ประหยัด -${calDiff}` : `เพิ่ม +${Math.abs(calDiff)}`} kcal</strong>
                </div>
                <div className="p-2 rounded-2xl bg-white/10">
                  <span className="text-[10px] text-teal-100 block">โปรตีน</span>
                  <strong className="text-sm font-black">{proteinDiff >= 0 ? `+${proteinDiff}` : proteinDiff} g</strong>
                </div>
                <div className="p-2 rounded-2xl bg-white/10">
                  <span className="text-[10px] text-teal-100 block">ไขมัน</span>
                  <strong className="text-sm font-black">{fatDiff > 0 ? `ลดไขมัน -${fatDiff}` : `เพิ่ม +${Math.abs(fatDiff)}`} g</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
