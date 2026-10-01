import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Copy, 
  Share2, 
  Sparkles, 
  Utensils, 
  RotateCcw,
  CheckCircle2,
  Refrigerator,
  ArrowRight
} from 'lucide-react';
import { ShoppingItem } from '../../types/extendedFeatures';
import { transferCheckedGroceryToInventory } from '../../utils/foodPantryStore';

const SHOPPING_STORAGE_KEY = 'kalguru_shopping_list_v1';

interface GroceryShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const DEFAULT_SHOPPING_ITEMS: ShoppingItem[] = [
  { id: 'sp-1', name: 'อกไก่สดลอกหนัง', amount: '1 kg', category: 'meat', completed: false, recipeSource: 'Meal Prep' },
  { id: 'sp-2', name: 'ไข่ไก่เบอร์ 1', amount: '1 แผง (30 ฟอง)', category: 'dairy', completed: false, recipeSource: 'Meal Prep' },
  { id: 'sp-3', name: 'ผักกาดขาว & บรอกโคลี', amount: '500g', category: 'produce', completed: false, recipeSource: 'Healthy Soup' },
  { id: 'sp-4', name: 'ข้าวไรซ์เบอร์รี่ / ข้าวกล้อง', amount: '1 ถุง (2 kg)', category: 'pantry', completed: true, recipeSource: 'Carbs Base' },
  { id: 'sp-5', name: 'น้ำมันมะกอกสเปรย์ 0 Cal', amount: '1 กระป๋อง', category: 'pantry', completed: false, recipeSource: 'Clean Cooking' }
];

export const GroceryShoppingListModal: React.FC<GroceryShoppingListModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemAmount, setNewItemAmount] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<'produce' | 'meat' | 'dairy' | 'pantry' | 'other'>('produce');

  const loadList = () => {
    try {
      const saved = localStorage.getItem(SHOPPING_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        setItems(DEFAULT_SHOPPING_ITEMS);
        localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(DEFAULT_SHOPPING_ITEMS));
      }
    } catch (e) {
      console.error('Failed to load shopping items:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveItems = (newItems: ShoppingItem[]) => {
    setItems(newItems);
    localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(newItems));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: newItemName.trim(),
      amount: newItemAmount.trim() || '1 หน่วย',
      category: newItemCategory,
      completed: false
    };

    const updated = [newItem, ...items];
    saveItems(updated);
    setNewItemName('');
    setNewItemAmount('');
    onToast(`🛒 เพิ่ม "${newItem.name}" ลงในรายการซื้อของแล้ว!`);
  };

  const toggleItem = (id: string) => {
    const updated = items.map(it => it.id === id ? { ...it, completed: !it.completed } : it);
    saveItems(updated);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(it => it.id !== id);
    saveItems(updated);
    onToast('🗑️ ลบรายการซื้อของแล้ว');
  };

  const handleTransferToInventory = () => {
    const completedItems = items.filter(it => it.completed);
    if (completedItems.length === 0) {
      onToast('กรุณาติ๊กเลือกรายการที่ซื้อแล้วก่อนโอนเข้าตู้เย็น');
      return;
    }

    transferCheckedGroceryToInventory(completedItems, onToast);

    // Remove transferred items from shopping list
    const remaining = items.filter(it => !it.completed);
    saveItems(remaining);
  };

  const clearCompleted = () => {
    const updated = items.filter(it => !it.completed);
    saveItems(updated);
    onToast('🧹 ล้างรายการที่ซื้อแล้วเรียบร้อย');
  };

  const copyToClipboard = () => {
    const text = `🛒 รายการวัตถุดิบและของจ่ายตลาด (Kalguru Grocery List):\n` +
      items.map(it => `${it.completed ? '✅' : '⬜'} ${it.name} (${it.amount})`).join('\n');
    navigator.clipboard.writeText(text);
    onToast('📋 คัดลอกรายการไปที่คลิปบอร์ดแล้ว (นำไปวางใน LINE ได้เลย)');
  };

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const categoryLabels = {
    produce: '🥦 ผัก & ผลไม้สด (Produce)',
    meat: '🥩 เนื้อสัตว์ & ไข่ (Meat & Poultry)',
    dairy: '🥛 ผลิตภัณฑ์นม & แพลนต์เบส (Dairy)',
    pantry: '🧂 เครื่องปรุง & ธัญพืช (Pantry)',
    other: '📦 อื่นๆ (Other)'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <ShoppingCart size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">รายการซื้อของจ่ายตลาด (Meal Prep List)</h2>
              <p className="text-xs text-neutral-500 font-medium">จัดระเบียบวัตถุดิบอาหารคลีน ซื้อเสร็จโอนเข้าตู้เย็นได้ทันที</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar & Actions */}
        <div className="p-6 pb-3 space-y-3 bg-white border-b border-neutral-100">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
            <span>ความคืบหน้าการซื้อ ({completedCount}/{items.length} รายการ)</span>
            <span className="text-emerald-600 font-black">{progressPercent}%</span>
          </div>

          <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* If there are completed items, show 1-click Transfer to Fridge button */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleTransferToInventory}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Refrigerator size={16} />
              <span>โอนของที่ซื้อแล้ว ({completedCount} รายการ) เข้าตู้เย็น & ตู้กับข้าวทันที</span>
              <ArrowRight size={14} />
            </button>
          )}

          {/* Add Item Form */}
          <form onSubmit={handleAddItem} className="pt-1 flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="ชื่อวัตถุดิบ เช่น อกไก่, บรอกโคลี..."
              className="flex-2 px-3.5 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500"
              required
            />
            <input
              type="text"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              placeholder="จำนวน (เช่น 500g)"
              className="w-28 px-3 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none focus:border-emerald-500"
            />
            <select
              value={newItemCategory}
              onChange={(e: any) => setNewItemCategory(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 outline-none cursor-pointer"
            >
              <option value="produce">ผัก/ผลไม้</option>
              <option value="meat">เนื้อสัตว์/ไข่</option>
              <option value="dairy">นม/แพลนต์เบส</option>
              <option value="pantry">เครื่องปรุง/ข้าว</option>
              <option value="other">อื่นๆ</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>เพิ่ม</span>
            </button>
          </form>
        </div>

        {/* List of Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(['produce', 'meat', 'dairy', 'pantry', 'other'] as const).map((cat) => {
            const catItems = items.filter(it => it.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {categoryLabels[cat]}
                </h4>

                <div className="space-y-1.5">
                  {catItems.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => toggleItem(it.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        it.completed
                          ? 'bg-neutral-100/70 border-neutral-200 text-neutral-400'
                          : 'bg-neutral-50 hover:bg-white border-neutral-200/80 text-neutral-800 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          it.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-300 bg-white'
                        }`}>
                          {it.completed && <Check size={13} strokeWidth={3} />}
                        </div>
                        <div>
                          <span className={`text-xs font-bold ${it.completed ? 'line-through' : ''}`}>
                            {it.name}
                          </span>
                          <span className="text-[11px] text-neutral-400 ml-2">
                            ({it.amount})
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(it.id);
                        }}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy size={14} />
            <span>คัดลอกส่ง LINE</span>
          </button>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={clearCompleted}
              className="text-neutral-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
            >
              ล้างรายการที่ซื้อแล้ว ({completedCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
