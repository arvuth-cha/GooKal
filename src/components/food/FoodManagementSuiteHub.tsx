import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Refrigerator,
  Sparkles,
  ChefHat,
  Scan,
  Store,
  Calendar,
  Heart,
  ArrowRightLeft,
  ChevronUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Package,
  Layers,
  Flame,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import {
  loadInventory,
  getExpiringSoonItems,
  InventoryItem,
  sendItemToGroceryShoppingList,
  addInventoryItem
} from '../../utils/foodPantryStore';

interface FoodManagementSuiteHubProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenGrocery: () => void;
  onOpenFridgeManager: () => void;
  onOpenSmartPantry: (initialIngredients?: string[]) => void;
  onOpenCookingAvatar: (recipe?: any) => void;
  onOpenDiningMenu: () => void;
  onOpenStreetFood: () => void;
  onOpenWeeklyMealPlanner: () => void;
  onOpenCustomMeals: () => void;
  onOpenMealSwaps: () => void;
  onToast: (msg: string) => void;
}

export const FoodManagementSuiteHub: React.FC<FoodManagementSuiteHubProps> = ({
  isOpen,
  onToggleOpen,
  onOpenGrocery,
  onOpenFridgeManager,
  onOpenSmartPantry,
  onOpenCookingAvatar,
  onOpenDiningMenu,
  onOpenStreetFood,
  onOpenWeeklyMealPlanner,
  onOpenCustomMeals,
  onOpenMealSwaps,
  onToast
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<InventoryItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'fridge' | 'pantry'>('all');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddLocation, setQuickAddLocation] = useState<'fridge' | 'pantry'>('fridge');

  const refreshData = () => {
    const items = loadInventory();
    setInventory(items);
    setExpiringSoon(getExpiringSoonItems(2));
  };

  useEffect(() => {
    refreshData();

    const handleInvUpdate = () => refreshData();
    window.addEventListener('kalguru_inventory_updated', handleInvUpdate);
    return () => window.removeEventListener('kalguru_inventory_updated', handleInvUpdate);
  }, []);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) {
      onToast('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }
    const days = quickAddLocation === 'fridge' ? 4 : 60;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + days);

    addInventoryItem({
      name: quickAddName.trim(),
      category: quickAddLocation === 'fridge' ? 'produce' : 'pantry_grains',
      storageLocation: quickAddLocation,
      quantity: '1 หน่วย',
      expiryDate: expDate.toISOString().split('T')[0],
      daysLeft: days
    });

    setQuickAddName('');
    onToast(`✨ เพิ่ม "${quickAddName.trim()}" เข้า${quickAddLocation === 'fridge' ? 'ตู้เย็น' : 'ตู้กับข้าว'} เรียบร้อย!`);
    refreshData();
  };

  const handleCookExpiring = () => {
    const names = expiringSoon.map(i => i.name);
    onOpenSmartPantry(names.length > 0 ? names : ['อกไก่', 'ไข่ไก่', 'ผักกวางตุ้ง']);
  };

  const fridgeCount = inventory.filter(i => i.storageLocation === 'fridge' || i.storageLocation === 'freezer').length;
  const pantryCount = inventory.filter(i => i.storageLocation === 'pantry').length;

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
      {/* Glow ambient */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">การจัดการอาหาร</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase">
                Food & Pantry Suite
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium mt-0.5">
              คลังตู้เย็น & ตู้กับข้าว, รายการจ่ายตลาด, AI เสกเมนูจากของเหลือ และเชฟสอนปรุงสด
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCookExpiring}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>เสกเมนู AI ด่วน</span>
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 cursor-pointer"
            title={isOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
            aria-label={isOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
          >
            <ChevronUp size={18} className={`text-neutral-300 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="relative z-10 overflow-hidden pt-4 space-y-4"
          >
            {/* Live Eat Me First Banner if items are expiring soon */}
            {expiringSoon.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-200">ของสดใกล้หมดอายุ ({expiringSoon.length} รายการ):</span>
                      <span className="text-[10px] bg-amber-400/30 text-amber-100 px-1.5 py-0.2 rounded font-bold">Eat Me First</span>
                    </div>
                    <p className="text-[11px] text-neutral-200 mt-0.5 truncate max-w-md">
                      {expiringSoon.map(i => `${i.name} (เหลือ ${i.daysLeft <= 0 ? 'วันนี้' : `${i.daysLeft} วัน`})`).join(', ')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCookExpiring}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <ChefHat size={14} />
                  <span>พ่อมด AI เสกเมนูจากของเหลือทันที</span>
                </button>
              </div>
            )}

            {/* Main Connected Food Hub Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* 1. Grocery Shopping List */}
              <button
                type="button"
                onClick={onOpenGrocery}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart size={18} />
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
                    จ่ายตลาด
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">รายการจ่ายตลาด</span>
                  <span className="text-[10px] text-neutral-300 font-medium">Meal Prep & ซื้อของ</span>
                </div>
              </button>

              {/* 2. Smart Fridge */}
              <button
                type="button"
                onClick={onOpenFridgeManager}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Refrigerator size={18} />
                  </div>
                  <span className="text-[10px] text-sky-300 font-bold bg-sky-500/20 px-1.5 py-0.5 rounded-md">
                    {fridgeCount} ของสด
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">จัดการตู้เย็น & วันหมดอายุ</span>
                  <span className="text-[10px] text-neutral-300 font-medium">Smart Fridge Tracker</span>
                </div>
              </button>

              {/* 3. AI เสกเมนูจากของในบ้าน */}
              <button
                type="button"
                onClick={() => onOpenSmartPantry(inventory.map(i => i.name))}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers size={18} />
                  </div>
                  <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded-md">
                    {inventory.length} วัตถุดิบ
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">AI เสกเมนูจากของในบ้าน</span>
                  <span className="text-[10px] text-neutral-300 font-medium">เชื่อมตู้เย็น & ตู้กับข้าว</span>
                </div>
              </button>

              {/* 4. เชฟ AI สอนทำอาหารสด */}
              <button
                type="button"
                onClick={() => onOpenCookingAvatar()}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ChefHat size={18} />
                  </div>
                  <span className="text-[10px] text-rose-300 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded-md">
                    Step-by-Step
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">เชฟ AI สอนทำอาหารสด</span>
                  <span className="text-[10px] text-neutral-300 font-medium">มีเสียงพูด & ตัดสต็อก</span>
                </div>
              </button>

              {/* 5. Dining Out Scanner */}
              <button
                type="button"
                onClick={onOpenDiningMenu}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scan size={18} />
                  </div>
                  <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded-md">
                    ร้านอาหาร
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">สแกนเมนูร้านอาหาร</span>
                  <span className="text-[10px] text-neutral-300 font-medium">AI แนะนำจานคลีน</span>
                </div>
              </button>

              {/* 7. Street Food Guide */}
              <button
                type="button"
                onClick={onOpenStreetFood}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store size={18} />
                  </div>
                  <span className="text-[10px] text-orange-300 font-bold bg-orange-500/20 px-1.5 py-0.5 rounded-md">
                    สตรีทฟู้ด
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">คู่มือรอดสตรีทฟู้ด</span>
                  <span className="text-[10px] text-neutral-300 font-medium">30+ ทริคสั่งร้านริมทาง</span>
                </div>
              </button>

              {/* 8. Weekly Meal Planner */}
              <button
                type="button"
                onClick={onOpenWeeklyMealPlanner}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar size={18} />
                  </div>
                  <span className="text-[10px] text-teal-300 font-bold bg-teal-500/20 px-1.5 py-0.5 rounded-md">
                    7 วัน
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">วางแผนเมนูรายสัปดาห์</span>
                  <span className="text-[10px] text-neutral-300 font-medium">Meal Plan 7 Days</span>
                </div>
              </button>

              {/* 9. Custom Meal Library */}
              <button
                type="button"
                onClick={onOpenCustomMeals}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart size={18} />
                  </div>
                  <span className="text-[10px] text-pink-300 font-bold bg-pink-500/20 px-1.5 py-0.5 rounded-md">
                    เมนูโปรด
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">คลังสูตร & เมนูโปรด</span>
                  <span className="text-[10px] text-neutral-300 font-medium">บันทึกสูตรที่ทำบ่อย</span>
                </div>
              </button>

              {/* 10. Meal Swaps */}
              <button
                type="button"
                onClick={onOpenMealSwaps}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all active:scale-[0.98] group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRightLeft size={18} />
                  </div>
                  <span className="text-[10px] text-blue-300 font-bold bg-blue-500/20 px-1.5 py-0.5 rounded-md">
                    เทียบแคล
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">สลับเมนูเทียบแคล</span>
                  <span className="text-[10px] text-neutral-300 font-medium">หาตัวเลือกแคลต่ำกว่า</span>
                </div>
              </button>
            </div>

            {/* Quick Live Pantry / Fridge Peek Bar */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Package size={15} className="text-emerald-400" />
                  <span>คลังวัตถุดิบปัจจุบัน ({inventory.length} ชนิดในระบบ)</span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      activeSubTab === 'all' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ทั้งหมด ({inventory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('fridge')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      activeSubTab === 'fridge' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ตู้เย็น ({fridgeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('pantry')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      activeSubTab === 'pantry' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ตู้กับข้าว ({pantryCount})
                  </button>
                </div>
              </div>

              {/* Chips of ingredients with 1-click send to grocery shopping list */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {inventory
                  .filter(i => activeSubTab === 'all' || (activeSubTab === 'fridge' ? i.storageLocation !== 'pantry' : i.storageLocation === 'pantry'))
                  .map(item => (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-xs font-medium text-white hover:bg-white/15 transition-colors"
                    >
                      <span>{item.storageLocation === 'pantry' ? '🧂' : '❄️'}</span>
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[10px] text-neutral-300">({item.quantity})</span>
                      <button
                        type="button"
                        onClick={() => sendItemToGroceryShoppingList(item.name, item.quantity, item.category === 'meat_protein' ? 'meat' : item.category === 'pantry_grains' ? 'pantry' : 'produce', onToast)}
                        title="ส่งเข้าลิสต์ซื้อของ"
                        className="text-neutral-400 hover:text-emerald-400 p-0.5 cursor-pointer"
                      >
                        <ShoppingCart size={11} />
                      </button>
                    </div>
                  ))}
              </div>

              {/* Quick Add Line */}
              <form onSubmit={handleQuickAdd} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder="เพิ่มวัตถุดิบด่วน เช่น อกไก่, ฟักทอง, สันในหมู..."
                  className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-400 font-medium"
                />
                <select
                  value={quickAddLocation}
                  onChange={(e) => setQuickAddLocation(e.target.value as any)}
                  aria-label="สถานที่เก็บวัตถุดิบ"
                  className="px-2 py-1.5 bg-slate-800 border border-white/20 rounded-xl text-xs text-white font-bold cursor-pointer"
                >
                  <option value="fridge">❄️ ตู้เย็น</option>
                  <option value="pantry">🧂 ตู้กับข้าว</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>เพิ่ม</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
