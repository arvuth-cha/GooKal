import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, UtensilsCrossed, Flame, AlertCircle, CheckCircle2, Sparkles, Filter } from 'lucide-react';

interface StreetFoodSurvivalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogMeal?: (meal: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onToast: (msg: string) => void;
}

interface StreetFoodItem {
  id: string;
  name: string;
  category: 'noodles' | 'rice' | 'snacks' | 'beverages' | 'somtum';
  originalCal: number;
  leanCal: number;
  protein: number;
  carbs: number;
  fat: number;
  originalFatG: number;
  leanFatG: number;
  hackTip: string;
  dangerIngredient: string;
  rating: 'lean' | 'moderate' | 'high_cal';
}

const STREET_FOOD_DB: StreetFoodItem[] = [
  {
    id: 'khao-man-gai',
    name: 'ข้าวมันไก่ (Hainanese Chicken Rice)',
    category: 'rice',
    originalCal: 600,
    leanCal: 360,
    protein: 32,
    carbs: 45,
    fat: 6,
    originalFatG: 28,
    leanFatG: 6,
    hackTip: 'สั่ง "เนื้ออกล้วน ไม่เอาหนัง เปลี่ยนเป็นข้าวสวยธรรมดา" ➔ ลดแคลอรี่ได้ทันที 240 kcal!',
    dangerIngredient: 'ข้าวมันที่หุงด้วยน้ำมันไก่และหนังไก่',
    rating: 'lean'
  },
  {
    id: 'khao-kha-moo',
    name: 'ข้าวขาหมู (Stewed Pork Leg Rice)',
    category: 'rice',
    originalCal: 690,
    leanCal: 420,
    protein: 28,
    carbs: 48,
    fat: 12,
    originalFatG: 38,
    leanFatG: 12,
    hackTip: 'สั่ง "เนื้อล้วน ไม่หนัง ไม่เอาคากิ ราดน้ำพะโล้น้อยๆ เพิ่มผักกาดดองและไข่ต้ม"',
    dangerIngredient: 'ชั้นไขมันใต้หนังหมูและน้ำราดหวานมัน',
    rating: 'moderate'
  },
  {
    id: 'pad-krapow-kai-dao',
    name: 'กะเพราหมูกรอบ + ไข่ดาว (Crispy Pork Basil)',
    category: 'rice',
    originalCal: 880,
    leanCal: 450,
    protein: 36,
    carbs: 50,
    fat: 10,
    originalFatG: 48,
    leanFatG: 10,
    hackTip: 'เปลี่ยนเป็น "กะเพราอกไก่ น้ำมันน้อย ไม่ใส่น้ำตาล ไข่ดาวน้ำ (Poached Egg)"',
    dangerIngredient: 'หมูกรอบทอดน้ำมันท่วม และไข่ดาวทอดกรอบขอบไหม้',
    rating: 'lean'
  },
  {
    id: 'kuay-tiew-nam-tok',
    name: 'ก๋วยเตี๋ยวน้ำตกหมู/เนื้อ (Boat Noodles)',
    category: 'noodles',
    originalCal: 550,
    leanCal: 280,
    protein: 22,
    carbs: 35,
    fat: 5,
    originalFatG: 22,
    leanFatG: 5,
    hackTip: 'สั่ง "เส้นหมี่ขาวหรือเกาเหลา ไม่เจียวกระเทียม ไม่ใส่แคบหมู และไม่ซดน้ำซุปจนหมด"',
    dangerIngredient: 'กระเทียมเจียวผสมมันหมู และกากหมูกรอบ',
    rating: 'lean'
  },
  {
    id: 'som-tum-thai',
    name: 'ส้มตำไทย / ตำปูปลาร้า (Papaya Salad)',
    category: 'somtum',
    originalCal: 280,
    leanCal: 120,
    protein: 4,
    carbs: 24,
    fat: 1,
    originalFatG: 6,
    leanFatG: 1,
    hackTip: 'สั่ง "ไม่ใส่น้ำตาลปี๊บ หรือหวานน้อยมาก ชูรสน้อย ไม่ใส่ถั่วลิสงคั่วทอด"',
    dangerIngredient: 'น้ำตาลปี๊บข้นหวานและโซเดียมจากน้ำปลา/ปลาร้า',
    rating: 'lean'
  },
  {
    id: 'pad-thai-goong',
    name: 'ผัดไทยกุ้งสด (Pad Thai)',
    category: 'noodles',
    originalCal: 720,
    leanCal: 420,
    protein: 26,
    carbs: 52,
    fat: 12,
    originalFatG: 34,
    leanFatG: 12,
    hackTip: 'สั่ง "วุ้นเส้นผัดไทย ใช้น้ำมัน 1 ช้อนชา ไม่เอากากหมู แยกถั่วลิสงบด"',
    dangerIngredient: 'น้ำมันผัดเส้นซ้ำๆ และน้ำซอสผัดไทยน้ำตาลมะพร้าว',
    rating: 'moderate'
  },
  {
    id: 'moo-ping-khao-niew',
    name: 'หมูปิ้งนมสด 3 ไม้ + ข้าวเหนียว (Grilled Pork Skewers)',
    category: 'snacks',
    originalCal: 580,
    leanCal: 310,
    protein: 24,
    carbs: 30,
    fat: 8,
    originalFatG: 32,
    leanFatG: 8,
    hackTip: 'เลือก "หมูปิ้งโบราณไม่ติดมัน (ไม่มีก้อนไขมันขาวคั่น) ทานคู่กับไข่ต้มแทนข้าวเหนียว 2 ห่อ"',
    dangerIngredient: 'ก้อนมันหมูร้อยคั่นไม้ และนมข้นหวานหมัก',
    rating: 'moderate'
  },
  {
    id: 'cha-thai-yen',
    name: 'ชาไทยเย็น / ชานมไข่มุก (Iced Thai Tea / Boba)',
    category: 'beverages',
    originalCal: 420,
    leanCal: 90,
    protein: 3,
    carbs: 18,
    fat: 1,
    originalFatG: 18,
    leanFatG: 1,
    hackTip: 'สั่ง "ชาไทยหวาน 0% ใส่นมสดพร่องมันเนย หรือใช้นมโอ๊ต ไม่ใส่ไข่มุก"',
    dangerIngredient: 'นมข้นหวาน + นมข้นจืด + ครีมเทียม และไข่มุกต้มน้ำเชื่อม',
    rating: 'lean'
  }
];

export const StreetFoodSurvivalGuideModal: React.FC<StreetFoodSurvivalGuideModalProps> = ({
  isOpen,
  onClose,
  onLogMeal,
  onToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = STREET_FOOD_DB.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.hackTip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleLogLeanVersion = (item: StreetFoodItem) => {
    if (onLogMeal) {
      onLogMeal({
        name: `${item.name} (สูตรลีนแคล)`,
        calories: item.leanCal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      });
    }
    onToast(`บันทึก ${item.name} (สูตรลีน ${item.leanCal} kcal) ลงไดอารี่แล้ว!`);
  };

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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-orange-50 via-amber-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 leading-tight">คู่มือสั่งสตรีทฟู้ด & ร้านอาหารตามสั่งให้ลีน</h2>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black">
                    Street Food Survival Guide
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">สูตรสั่งอาหารนอกบ้านแบบมือโปร ลดแคลอรี่ 30-50% ได้ทันทีโดยไม่อด</p>
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

          {/* Search & Filters */}
          <div className="p-4 border-b border-neutral-100 space-y-3 bg-neutral-50/70">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="ค้นหาชื่ออาหาร เช่น ข้าวมันไก่, กะเพรา, ก๋วยเตี๋ยว..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-neutral-800"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'rice', label: '🍚 อาหารจานเดียว' },
                { id: 'noodles', label: '🍜 ก๋วยเตี๋ยว/เส้น' },
                { id: 'somtum', label: '🥗 ส้มตำ/ยำ' },
                { id: 'snacks', label: '🍢 ของปิ้ง/ของว่าง' },
                { id: 'beverages', label: '🥤 ชา/เครื่องดื่ม' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Street Foods */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 text-sm">
            {filteredItems.map(item => (
              <div key={item.id} className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-orange-200 transition-all space-y-3 shadow-xs">
                {/* Header item */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-neutral-400 line-through">ปกติ {item.originalCal} kcal</span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ⚡ สั่งแบบลีนเหลือ {item.leanCal} kcal
                      </span>
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                        ประหยัด -{item.originalCal - item.leanCal} kcal
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLogLeanVersion(item)}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <span>+ บันทึกสูตรนี้</span>
                  </button>
                </div>

                {/* Hack tip block */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-700" /> คำพูดสั่งแม่ค้าให้ได้สูตรลีน:
                  </div>
                  <p className="text-amber-950 font-medium leading-relaxed">"{item.hackTip}"</p>
                </div>

                {/* Macro breakdown & Danger ingredient */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-xs text-neutral-500">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-700 font-semibold">โปรตีน: <strong className="text-emerald-700">{item.protein}g</strong></span>
                    <span className="text-neutral-700 font-semibold">คาร์บ: <strong>{item.carbs}g</strong></span>
                    <span className="text-neutral-700 font-semibold">ไขมัน: <strong>{item.fat}g</strong> (ลดจาก {item.originalFatG}g)</span>
                  </div>
                  <div className="text-[11px] text-rose-700 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> ตัวการแคลอรี่: {item.dangerIngredient}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">💡 เคล็ดลับ: การลดน้ำมันและของทอดใน 1 มื้อ สามารถประหยัดพลังงานได้เทียบเท่าการวิ่ง 45 นาที</span>
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
