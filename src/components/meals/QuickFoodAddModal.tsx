import React, { useState } from 'react';
import { 
  Zap, 
  Search, 
  Plus, 
  X, 
  Sparkles, 
  Utensils, 
  Coffee, 
  Apple, 
  Dumbbell, 
  Soup, 
  Flame,
  Check
} from 'lucide-react';
import { OFFLINE_THAI_FOOD_DATABASE } from '../../utils/offlineFoodDatabase';
import { OfflineFoodDatabaseItem } from '../../types/extendedFeatures';

interface QuickFoodAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: OfflineFoodDatabaseItem) => void;
  onToast: (msg: string) => void;
}

export const QuickFoodAddModal: React.FC<QuickFoodAddModalProps> = ({
  isOpen,
  onClose,
  onSelectFood,
  onToast
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'clean_gym', label: '🥗 คลีน & ฟิตเนส' },
    { id: 'rice_dishes', label: '🍛 ข้าว & จานเดียว' },
    { id: 'noodles', label: '🍜 เส้น & ก๋วยเตี๋ยว' },
    { id: 'curries', label: '🍲 แกง & ต้ม & ยำ' },
    { id: 'drinks', label: '☕ เครื่องดื่ม' },
    { id: 'snacks', label: '🍎 ของว่าง & ผลไม้' }
  ];

  const filteredFoods = OFFLINE_THAI_FOOD_DATABASE.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-amber-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">คลังอาหารไทยด่วน (150+ เมนูยอดนิยม)</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ⚡ 0s ออฟไลน์
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">กดเลือกเมนูแล้วบันทึกลงในมื้ออาหารได้ทันที โดยไม่ต้องรอ AI</p>
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

        {/* Search Bar & Category Filters */}
        <div className="p-6 pb-3 space-y-3 bg-white border-b border-neutral-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาอาหารไทย เช่น กะเพรา, ข้าวมันไก่, ชาไทย, สุกี้, ไข่ต้ม, 7-11..."
              className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-neutral-400 font-bold shrink-0">ค้นหาด่วน:</span>
            {['อกไก่', 'ไข่ต้ม', 'กะเพรา', 'สุกี้', 'อเมริกาโน่', '7-11', 'โปรตีนสูง', 'Low GI'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSearchQuery(chip === searchQuery ? '' : chip)}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                  searchQuery === chip
                    ? 'bg-amber-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Food List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredFoods.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Utensils size={32} className="mx-auto opacity-40" />
              <p className="text-xs font-bold">ไม่พบเมนูที่ค้นหา</p>
              <p className="text-[11px]">ลองค้นหาด้วยคำอื่น เช่น กะเพรา, ไก่, นม, ชา</p>
            </div>
          ) : (
            filteredFoods.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-neutral-50 hover:bg-white border border-neutral-200/80 hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-neutral-900">{item.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-700">
                      {item.portion}
                    </span>
                    {item.giLevel === 'low' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Low GI
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-black text-amber-600">{item.calories} kcal</span>
                    <span className="text-neutral-500 font-medium">P: <strong className="text-neutral-800">{item.protein}g</strong></span>
                    <span className="text-neutral-500 font-medium">C: <strong className="text-neutral-800">{item.carbs}g</strong></span>
                    <span className="text-neutral-500 font-medium">F: <strong className="text-neutral-800">{item.fat}g</strong></span>
                    {item.sodium && (
                      <span className="text-neutral-400 text-[10px]">โซเดียม {item.sodium}mg</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectFood(item);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-2xl bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 self-end sm:self-center cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>บันทึกมื้อ</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
