import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Refrigerator, Plus, Trash2, AlertCircle, ChefHat, ShoppingCart, Package } from 'lucide-react';
import { 
  loadInventory, 
  addInventoryItem, 
  deleteInventoryItem, 
  sendItemToGroceryShoppingList,
  InventoryItem 
} from '../../utils/foodPantryStore';

interface FridgeExpiryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCookWithPantry?: (ingredients: string[]) => void;
  onToast: (msg: string) => void;
}

export const FridgeExpiryManagerModal: React.FC<FridgeExpiryManagerModalProps> = ({
  isOpen,
  onClose,
  onCookWithPantry,
  onToast
}) => {
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'fridge' | 'pantry'>('all');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'produce' | 'meat_protein' | 'dairy_eggs' | 'pantry_grains' | 'seasoning'>('produce');
  const [newDays, setNewDays] = useState(4);
  const [newQuantity, setNewQuantity] = useState('1 ชิ้น');
  const [storageLocation, setStorageLocation] = useState<'fridge' | 'pantry' | 'freezer'>('fridge');

  const refreshItems = () => {
    const list = loadInventory();
    setAllItems(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshItems();
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (!newName.trim()) {
      onToast('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + newDays);
    const dateStr = d.toISOString().split('T')[0];

    addInventoryItem({
      name: newName.trim(),
      category: newCategory,
      storageLocation: storageLocation,
      expiryDate: dateStr,
      daysLeft: newDays,
      quantity: newQuantity || '1 หน่วย'
    });

    setNewName('');
    setNewQuantity('1 ชิ้น');
    refreshItems();
    onToast(`✨ เพิ่ม "${newName.trim()}" เข้า${storageLocation === 'pantry' ? 'ตู้กับข้าว' : 'ตู้เย็น'} เรียบร้อย!`);
  };

  const handleDelete = (id: string) => {
    deleteInventoryItem(id);
    refreshItems();
    onToast('🗑️ นำของออกจากคลังแล้ว');
  };

  const handleSendToShopping = (name: string, quantity: string, category: string) => {
    sendItemToGroceryShoppingList(
      name, 
      quantity, 
      category === 'meat_protein' ? 'meat' : category === 'dairy_eggs' ? 'dairy' : category === 'pantry_grains' ? 'pantry' : 'produce',
      onToast
    );
  };

  const filteredItems = allItems.filter(i => {
    if (activeTab === 'fridge') return i.storageLocation === 'fridge' || i.storageLocation === 'freezer';
    if (activeTab === 'pantry') return i.storageLocation === 'pantry';
    return true;
  });

  const expiringSoon = allItems.filter(i => i.daysLeft <= 2);
  const fridgeCount = allItems.filter(i => i.storageLocation === 'fridge' || i.storageLocation === 'freezer').length;
  const pantryCount = allItems.filter(i => i.storageLocation === 'pantry').length;

  const handleSendToPantryWizard = () => {
    const list = allItems.map(i => i.name);
    if (onCookWithPantry) {
      onCookWithPantry(list.length > 0 ? list : ['อกไก่', 'ไข่ไก่', 'ผักกวางตุ้ง']);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-sky-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-600 text-white flex items-center justify-center shadow-md">
                <Refrigerator size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">คลังตู้เย็น & ตู้กับข้าว (Dual Pantry Storage)</h2>
                <p className="text-xs text-neutral-500 font-medium">จัดการวันหมดอายุ แยกตู้เย็น/ตู้กับข้าวชัดเจน ให้ AI ดึงไปปรุงอาหารได้ทั้ง 2 ตู้</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
            {/* Storage Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Package size={14} />
                <span>ทั้งหมด ({allItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fridge')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'fridge'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Refrigerator size={14} />
                <span>❄️ ตู้เย็น ({fridgeCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pantry')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'pantry'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>🥫</span>
                <span>ตู้กับข้าว ({pantryCount})</span>
              </button>
            </div>

            {/* Eat Me First Alert Banner */}
            {expiringSoon.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle size={15} className="text-amber-600" />
                    <span>แจ้งเตือนควรทานก่อนหมดอายุ (Eat Me First!):</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800">
                    {expiringSoon.length} รายการ
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {expiringSoon.map(i => (
                    <span key={i.id} className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 shadow-2xs">
                      {i.storageLocation === 'pantry' ? '🥫' : '❄️'} {i.name} ({i.daysLeft <= 0 ? 'วันนี้!' : `อีก ${i.daysLeft} วัน`})
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSendToPantryWizard}
                  className="w-full mt-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <ChefHat size={15} />
                  <span>ส่งของในตู้เย็น & ตู้กับข้าวไปให้ AI เสกเมนูคลีนทันที</span>
                </button>
              </div>
            )}

            {/* Quick Add Form */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
              <span className="text-xs font-bold text-neutral-800 block">เพิ่มวัตถุดิบเข้าคลัง:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ชื่อวัตถุดิบ เช่น สันในไก่, ข้าวกล้อง"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-medium"
                />
                <input
                  type="text"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="ปริมาณ เช่น 200g, 1 ถุง"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={storageLocation}
                  onChange={(e) => {
                    const loc = e.target.value as any;
                    setStorageLocation(loc);
                    if (loc === 'pantry') {
                      setNewDays(90);
                      setNewCategory('pantry_grains');
                    } else {
                      setNewDays(4);
                      setNewCategory('produce');
                    }
                  }}
                  aria-label="สถานที่จัดเก็บ"
                  className="px-2.5 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800"
                >
                  <option value="fridge">❄️ ตู้เย็น (ของสด)</option>
                  <option value="pantry">🥫 ตู้กับข้าว (ของแห้ง)</option>
                  <option value="freezer">🧊 ช่องฟรีซ</option>
                </select>

                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  aria-label="หมวดหมู่วัตถุดิบ"
                  className="px-2.5 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700"
                >
                  <option value="produce">🥦 ผัก & ผลไม้สด</option>
                  <option value="meat_protein">🥩 เนื้อสัตว์ / โปรตีน</option>
                  <option value="dairy_eggs">🥛 ไข่ / นม</option>
                  <option value="pantry_grains">🌾 ธัญพืช / ของแห้ง</option>
                  <option value="seasoning">🧂 เครื่องปรุงคลีน</option>
                </select>

                <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-neutral-300">
                  <span className="text-[11px] text-neutral-500 font-bold shrink-0">หมดอายุ:</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newDays}
                    aria-label="จำนวนวันก่อนหมดอายุ"
                    onChange={(e) => setNewDays(Math.max(1, Number(e.target.value)))}
                    className="w-10 text-center font-bold text-xs text-blue-600 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-neutral-500 font-bold">วัน</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus size={16} />
                <span>บันทึกเข้า{storageLocation === 'pantry' ? 'ตู้กับข้าว' : 'ตู้เย็น'}</span>
              </button>
            </div>

            {/* Inventory List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-neutral-700">
                  รายการวัตถุดิบ ({filteredItems.length} รายการ)
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  {activeTab === 'fridge' ? 'แสดงเฉพาะตู้เย็น' : activeTab === 'pantry' ? 'แสดงเฉพาะตู้กับข้าว' : 'แสดงทั้งหมด'}
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredItems.map((i) => {
                  const isUrgent = i.daysLeft <= 2;
                  const isPantry = i.storageLocation === 'pantry';
                  return (
                    <div
                      key={i.id}
                      className="p-3 rounded-2xl bg-white border border-neutral-200/90 flex items-center justify-between shadow-2xs hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">
                          {isPantry 
                            ? (i.category === 'seasoning' ? '🧂' : '🌾') 
                            : (i.category === 'meat_protein' ? '🥩' : i.category === 'dairy_eggs' ? '🥛' : '🥦')}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-neutral-800 text-xs">{i.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isPantry ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {isPantry ? 'ตู้กับข้าว' : 'ตู้เย็น'}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium">{i.quantity}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {i.daysLeft <= 0 ? 'หมดอายุแล้ว' : `เหลือ ${i.daysLeft} วัน`}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSendToShopping(i.name, i.quantity, i.category)}
                          title="ส่งเข้าลิสต์จ่ายตลาด"
                          className="text-neutral-400 hover:text-emerald-600 p-1 cursor-pointer transition-colors"
                        >
                          <ShoppingCart size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(i.id)}
                          title="ลบรายการ"
                          className="text-neutral-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
