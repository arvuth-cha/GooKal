import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Check, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AllergySafetySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

interface AllergenItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_ALLERGENS: AllergenItem[] = [
  { id: 'lactose', name: 'แลคโตส / นมวัว (Lactose Intolerance)', category: 'dairy', icon: '🥛', enabled: false },
  { id: 'gluten', name: 'กลูเตน / ข้าวสาลี (Gluten / Celiac)', category: 'grain', icon: '🌾', enabled: false },
  { id: 'shellfish', name: 'อาหารทะเล / กุ้ง ปู หอย (Crustaceans)', category: 'seafood', icon: '🦐', enabled: false },
  { id: 'peanuts', name: 'ถั่วลิสง & ถั่วเปลือกแข็ง (Peanuts / Tree Nuts)', category: 'nuts', icon: '🥜', enabled: false },
  { id: 'eggs', name: 'ไข่ไก่ (Egg Allergy)', category: 'egg', icon: '🥚', enabled: false },
  { id: 'high_sodium', name: 'โซเดียมสูง / โรคไต / ความดันสูง (Strict Low Sodium)', category: 'medical', icon: '🧂', enabled: false },
  { id: 'added_sugar', name: 'น้ำตาลเติมแต่ง / เบาหวาน (Zero Added Sugar)', category: 'medical', icon: '🍬', enabled: false },
  { id: 'msg', name: 'ผงชูรส / สารปรุงรสเคมี (No MSG / Additives)', category: 'chemical', icon: '🌿', enabled: false }
];

export const AllergySafetySettingsModal: React.FC<AllergySafetySettingsModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [allergens, setAllergens] = useState<AllergenItem[]>(() => {
    const saved = localStorage.getItem('kalguru_allergen_settings');
    return saved ? JSON.parse(saved) : DEFAULT_ALLERGENS;
  });

  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    localStorage.setItem('kalguru_allergen_settings', JSON.stringify(allergens));
    window.dispatchEvent(new CustomEvent('kalguru_allergens_updated', { detail: allergens }));
  }, [allergens]);

  const toggleAllergen = (id: string) => {
    setAllergens(allergens.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    const newItem: AllergenItem = {
      id: `custom-${Date.now()}`,
      name: customInput.trim(),
      category: 'custom',
      icon: '⚠️',
      enabled: true
    };
    setAllergens([...allergens, newItem]);
    setCustomInput('');
    onToast(`เพิ่มข้อจำกัดอาหาร "${newItem.name}" แล้ว`);
  };

  const enabledCount = allergens.filter(a => a.enabled).length;

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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-rose-50 via-red-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">คัดกรองภูมิแพ้ & อาหารต้องห้าม (Allergy Guard)</h2>
                <p className="text-xs text-neutral-500 font-medium">เปิดใช้งานการแจ้งเตือนอัตโนมัติเมื่อ AI สแกนอาหาร</p>
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
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
            {/* Active alerts count banner */}
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                <div>
                  <span className="font-bold text-xs text-rose-900 block">เปิดระบบตรวจจับความปลอดภัย:</span>
                  <span className="text-[11px] text-rose-700">AI จะแจ้งเตือนตัวแดงทันทีหากพบส่วนผสมเหล่านี้</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs">
                {enabledCount} รายการ
              </span>
            </div>

            {/* Predefined toggles */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-800 block px-1">เลือกสารก่อภูมิแพ้หรือข้อจำกัดสุขภาพของคุณ:</span>
              <div className="grid grid-cols-1 gap-2">
                {allergens.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAllergen(item.id)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      item.enabled
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                        : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-bold text-xs">{item.name}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      item.enabled ? 'bg-rose-600 border-rose-600 text-white' : 'border-neutral-300 bg-white'
                    }`}>
                      {item.enabled && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Allergen addition */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2.5">
              <span className="text-xs font-bold text-neutral-800 block">เพิ่มข้อจำกัดอาหารส่วนตัวอื่นๆ:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                  placeholder="เช่น มังสวิรัติ, ไม่ทานหมู, ไม่ทานกระเทียม..."
                  className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-medium focus:outline-hidden focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus size={15} />
                  <span>เพิ่ม</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onToast('บันทึกการตั้งค่าระบบความปลอดภัยเรียบร้อย');
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              เสร็จสิ้นและบันทึก
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
