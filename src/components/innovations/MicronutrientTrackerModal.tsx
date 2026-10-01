import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, AlertTriangle, Sparkles, Activity, CheckCircle2, Pill } from 'lucide-react';

interface MicronutrientTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

interface NutrientItem {
  id: string;
  name: string;
  thaiName: string;
  currentAmount: number;
  rdaTarget: number;
  unit: string;
  category: 'mineral' | 'vitamin' | 'fiber_sugar';
  status: 'optimal' | 'warning_high' | 'warning_low';
  benefit: string;
}

export const MicronutrientTrackerModal: React.FC<MicronutrientTrackerModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mineral' | 'vitamin' | 'fiber_sugar'>('all');

  const [nutrients, setNutrients] = useState<NutrientItem[]>([
    {
      id: 'sodium',
      name: 'Sodium (โซเดียม)',
      thaiName: 'เกลือโซเดียมในอาหาร',
      currentAmount: 1650,
      rdaTarget: 2000,
      unit: 'mg',
      category: 'mineral',
      status: 'optimal',
      benefit: 'ควบคุมสมดุลน้ำและความดันโลหิต ควรคุมไม่เกิน 2,000 mg/วัน'
    },
    {
      id: 'added_sugar',
      name: 'Added Sugar (น้ำตาลเติม)',
      thaiName: 'น้ำตาลทรายและสารให้ความหวาน',
      currentAmount: 18,
      rdaTarget: 24,
      unit: 'g',
      category: 'fiber_sugar',
      status: 'optimal',
      benefit: 'WHO แนะนำไม่เกิน 24 กรัม (6 ช้อนชา) ต่อวัน เพื่อลดความเสี่ยงไขมันพอกตับ'
    },
    {
      id: 'dietary_fiber',
      name: 'Dietary Fiber (ใยอาหาร)',
      thaiName: 'ไฟเบอร์จากพืชและผัก',
      currentAmount: 28,
      rdaTarget: 25,
      unit: 'g',
      category: 'fiber_sugar',
      status: 'optimal',
      benefit: 'ช่วยระบบขับถ่าย หล่อเลี้ยงโพรไบโอติกส์ และชะลอการดูดซึมน้ำตาล'
    },
    {
      id: 'potassium',
      name: 'Potassium (โพแทสเซียม)',
      thaiName: 'เกลือแร่ลดบวมโซเดียม',
      currentAmount: 3200,
      rdaTarget: 3500,
      unit: 'mg',
      category: 'mineral',
      status: 'optimal',
      benefit: 'ช่วยขับโซเดียมส่วนเกิน ลดอาการบวมน้ำ และบำรุงกล้ามเนื้อหัวใจ'
    },
    {
      id: 'calcium',
      name: 'Calcium (แคลเซียม)',
      thaiName: 'แร่ธาตุเสริมสร้างกระดูก',
      currentAmount: 850,
      rdaTarget: 1000,
      unit: 'mg',
      category: 'mineral',
      status: 'optimal',
      benefit: 'เสริมความหนาแน่นมวลกระดูกและการส่งสัญญาณประสาท'
    },
    {
      id: 'iron',
      name: 'Iron (ธาตุเหล็ก)',
      thaiName: 'ธาตุเหล็กสร้างเม็ดเลือดแดง',
      currentAmount: 14,
      rdaTarget: 15,
      unit: 'mg',
      category: 'mineral',
      status: 'optimal',
      benefit: 'ลำเลียงออกซิเจนสู่เซลล์กล้ามเนื้อ ป้องกันอาการเหนื่อยง่าย'
    },
    {
      id: 'vitamin_c',
      name: 'Vitamin C (วิตามินซี)',
      thaiName: 'สารต้านอนุมูลอิสระ',
      currentAmount: 120,
      rdaTarget: 90,
      unit: 'mg',
      category: 'vitamin',
      status: 'optimal',
      benefit: 'กระตุ้นการสังเคราะห์คอลลาเจน เสริมภูมิคุ้มกันร่างกาย'
    },
    {
      id: 'vitamin_d',
      name: 'Vitamin D (วิตามินดี)',
      thaiName: 'ฮอร์โมนวิตามินแดด',
      currentAmount: 650,
      rdaTarget: 800,
      unit: 'IU',
      category: 'vitamin',
      status: 'warning_low',
      benefit: 'ช่วยดูดซึมแคลเซียม เสริมภูมิคุ้มกัน แนะนำตากแดดเช้า 15 นาที'
    }
  ]);

  const filtered = nutrients.filter(n => selectedCategory === 'all' || n.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-teal-50 via-emerald-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Pill size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">วิเคราะห์วิตามิน & เกลือแร่ (Micronutrients & RDA)</h2>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                    Thai RDA Engine
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">ติดตาม โซเดียม, น้ำตาล, ไฟเบอร์, โพแทสเซียม, แคลเซียม และวิตามินที่จำเป็น</p>
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

          {/* Categories Tab */}
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/70 flex gap-2 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'ทั้งหมด (All)' },
              { id: 'fiber_sugar', label: '🌾 ไฟเบอร์ & น้ำตาล' },
              { id: 'mineral', label: '🧂 เกลือแร่ & โซเดียม' },
              { id: 'vitamin', label: '🍊 วิตามิน (Vitamins)' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* List of Nutrients */}
          <div className="p-5 overflow-y-auto space-y-3.5 flex-1 text-sm">
            {filtered.map(nutrient => {
              const percentage = Math.min(150, Math.round((nutrient.currentAmount / nutrient.rdaTarget) * 100));
              const isOverLimit = (nutrient.id === 'sodium' || nutrient.id === 'added_sugar') && percentage > 100;
              const isDeficient = (nutrient.id !== 'sodium' && nutrient.id !== 'added_sugar') && percentage < 70;

              return (
                <div key={nutrient.id} className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">{nutrient.name}</h3>
                      <p className="text-xs text-neutral-500">{nutrient.benefit}</p>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className="text-sm font-black text-neutral-900">
                        {nutrient.currentAmount} <span className="text-xs font-normal text-neutral-400">/ {nutrient.rdaTarget} {nutrient.unit}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOverLimit
                          ? 'bg-rose-100 text-rose-700'
                          : isDeficient
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {percentage}% ของเกณฑ์แนะนำ
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverLimit
                          ? 'bg-rose-500'
                          : isDeficient
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500">💡 ค่าอ้างอิงตามมาตรฐานสารอาหารแนะนำประจำวันสำหรับคนไทย (Thai Dietary Reference Intakes)</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
