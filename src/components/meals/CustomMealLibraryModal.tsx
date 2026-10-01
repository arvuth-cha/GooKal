import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Sparkles, 
  Utensils, 
  Check, 
  Coffee, 
  Dumbbell, 
  Search,
  BookOpen
} from 'lucide-react';
import { CustomMealItem } from '../../types/extendedFeatures';

const CUSTOM_MEALS_KEY = 'kalguru_custom_meals_v1';

interface CustomMealLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMealToLog: (meal: CustomMealItem) => void;
  onToast: (msg: string) => void;
}

const DEFAULT_CUSTOM_MEALS: CustomMealItem[] = [
  { id: 'cm-1', name: 'โปรตีนเชคกล้วยหอม + เนยถั่ว', calories: 340, proteinGrams: 32, carbsGrams: 36, fatGrams: 8, sugarGrams: 14, sodiumMg: 180, servingSize: '1 แก้วเชค (400ml)', category: 'supplement', createdAt: Date.now() },
  { id: 'cm-2', name: 'ข้าวโอ๊ตนมอัลมอนด์ + เบอร์รี่รวม', calories: 280, proteinGrams: 12, carbsGrams: 48, fatGrams: 5, sugarGrams: 10, sodiumMg: 90, servingSize: '1 ถ้วย (300g)', category: 'meal', createdAt: Date.now() },
  { id: 'cm-3', name: 'สลัดอกไก่ฉีก น้ำสลัดงาญี่ปุ่นซีอิ๊ว', calories: 260, proteinGrams: 30, carbsGrams: 14, fatGrams: 9, sugarGrams: 4, sodiumMg: 490, servingSize: '1 จานใหญ่ (350g)', category: 'meal', createdAt: Date.now() },
  { id: 'cm-4', name: 'มัทฉะลาเต้ นมพิสตาชิโอ หวาน 0%', calories: 65, proteinGrams: 2, carbsGrams: 4, fatGrams: 4, sugarGrams: 1, sodiumMg: 80, servingSize: '1 แก้ว (16 oz)', category: 'drink', createdAt: Date.now() }
];

export const CustomMealLibraryModal: React.FC<CustomMealLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectMealToLog,
  onToast
}) => {
  const [customMeals, setCustomMeals] = useState<CustomMealItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [servingSize, setServingSize] = useState('1 จาน');
  const [category, setCategory] = useState<'meal' | 'drink' | 'snack' | 'supplement'>('meal');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_MEALS_KEY);
      if (saved) {
        setCustomMeals(JSON.parse(saved));
      } else {
        setCustomMeals(DEFAULT_CUSTOM_MEALS);
        localStorage.setItem(CUSTOM_MEALS_KEY, JSON.stringify(DEFAULT_CUSTOM_MEALS));
      }
    } catch (e) {
      console.error('Failed to load custom meals:', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveCustomMeals = (items: CustomMealItem[]) => {
    setCustomMeals(items);
    localStorage.setItem(CUSTOM_MEALS_KEY, JSON.stringify(items));
  };

  const handleCreateMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('⚠️ กรุณาระบุชื่อเมนูอาหาร');
      return;
    }
    const cal = parseInt(calories, 10);
    if (isNaN(cal) || cal < 0) {
      onToast('⚠️ กรุณาระบุแคลอรี่ให้ถูกต้อง');
      return;
    }

    const newItem: CustomMealItem = {
      id: `cm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      calories: cal,
      proteinGrams: parseInt(protein, 10) || 0,
      carbsGrams: parseInt(carbs, 10) || 0,
      fatGrams: parseInt(fat, 10) || 0,
      sugarGrams: sugar ? parseInt(sugar, 10) : undefined,
      sodiumMg: sodium ? parseInt(sodium, 10) : undefined,
      servingSize: servingSize.trim() || '1 จาน/เสิร์ฟ',
      category,
      createdAt: Date.now()
    };

    const updated = [newItem, ...customMeals];
    saveCustomMeals(updated);
    setShowAddForm(false);
    // Reset form
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setSugar('');
    setSodium('');
    onToast(`✨ บันทึกเมนูโปรด "${newItem.name}" เข้าสู่คลังเรียบร้อย!`);
  };

  const handleDelete = (id: string) => {
    const updated = customMeals.filter(m => m.id !== id);
    saveCustomMeals(updated);
    onToast('🗑️ ลบเมนูออกจากคลังแล้ว');
  };

  const filteredMeals = customMeals.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-rose-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Heart size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">คลังเมนูโปรด & อาหารประจำตัว</h2>
              <p className="text-xs text-neutral-500 font-medium">บันทึกอาหารที่ทำบ่อย แล้วกดบันทึกมื้อได้ใน 1 คลิก</p>
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

        {/* Action Bar / Search & Category Filters */}
        <div className="p-6 pb-3 space-y-3 bg-white border-b border-neutral-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเมนูโปรด..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <Plus size={16} />
              <span>สร้างเมนูใหม่</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'meal', label: '🍲 มื้อหลัก' },
              { id: 'drink', label: '☕ เครื่องดื่ม' },
              { id: 'snack', label: '🍎 สแน็ค' },
              { id: 'supplement', label: '💪 อาหารเสริม' }
            ].map(cat => (
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleCreateMeal} className="p-5 rounded-3xl bg-rose-50/60 border border-rose-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-rose-950">เพิ่มเมนูโปรดใหม่</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-700"
                >
                  ปิดฟอร์ม
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">ชื่อเมนู *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ข้าวอกไก่ต้มน้ำจิ้มสุกี้"
                    className="w-full px-3 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">หมวดหมู่</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 outline-none"
                  >
                    <option value="meal">มื้อหลัก</option>
                    <option value="drink">เครื่องดื่ม</option>
                    <option value="snack">ของว่าง</option>
                    <option value="supplement">อาหารเสริม / โปรตีน</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">แคลอรี่ (kcal) *</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="kcal"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">โปรตีน (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="กรัม"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">คาร์บ (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="กรัม"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">ไขมัน (g)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="กรัม"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">น้ำตาล (g)</label>
                  <input
                    type="number"
                    value={sugar}
                    onChange={(e) => setSugar(e.target.value)}
                    placeholder="กรัม (ไม่บังคับ)"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">โซเดียม (mg)</label>
                  <input
                    type="number"
                    value={sodium}
                    onChange={(e) => setSodium(e.target.value)}
                    placeholder="มก. (ไม่บังคับ)"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">ขนาดเสิร์ฟ</label>
                  <input
                    type="text"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="เช่น 1 จาน (300g)"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer mt-2"
              >
                + เพิ่มลงคลังเมนูโปรด
              </button>
            </form>
          )}

          {/* List of Custom Meals */}
          {filteredMeals.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Utensils size={32} className="mx-auto opacity-40" />
              <p className="text-xs font-bold">ไม่พบเมนูในหมวดนี้</p>
              <p className="text-[11px]">กดปุ่ม "สร้างเมนูใหม่" ด้านบนเพื่อเพิ่มอาหารของคุณเอง</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="p-4 rounded-3xl bg-neutral-50 hover:bg-white border border-neutral-200/80 hover:border-rose-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-neutral-900">{meal.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/70 text-neutral-700">
                        {meal.servingSize}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-black text-rose-600">{meal.calories} kcal</span>
                      <span className="text-neutral-500 font-medium">P: <strong className="text-neutral-800">{meal.proteinGrams}g</strong></span>
                      <span className="text-neutral-500 font-medium">C: <strong className="text-neutral-800">{meal.carbsGrams}g</strong></span>
                      <span className="text-neutral-500 font-medium">F: <strong className="text-neutral-800">{meal.fatGrams}g</strong></span>
                      {meal.sodiumMg && (
                        <span className="text-neutral-400 text-[10px]">โซเดียม {meal.sodiumMg}mg</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onSelectMealToLog(meal)}
                      className="px-4 py-2 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>บันทึกมื้อนี้</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(meal.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="ลบเมนูนี้"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
