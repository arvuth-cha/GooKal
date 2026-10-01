import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Plus, Trash2, CheckCircle2, Award, Info } from 'lucide-react';
import { PlantDiversityItem } from '../../types/innovations';

interface SmartMicrobiomeTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const DEFAULT_PLANTS: PlantDiversityItem[] = [
  { id: '1', name: 'บรอกโคลี', category: 'veg', dateAdded: '2026-08-20' },
  { id: '2', name: 'มะเขือเทศราชินี', category: 'veg', dateAdded: '2026-08-20' },
  { id: '3', name: 'แครอท', category: 'veg', dateAdded: '2026-08-19' },
  { id: '4', name: 'กล้วยหอม', category: 'fruit', dateAdded: '2026-08-19' },
  { id: '5', name: 'บลูเบอร์รี่', category: 'fruit', dateAdded: '2026-08-18' },
  { id: '6', name: 'ข้าวกล้องไรซ์เบอร์รี่', category: 'grain', dateAdded: '2026-08-20' },
  { id: '7', name: 'ข้าวโอ๊ต', category: 'grain', dateAdded: '2026-08-18' },
  { id: '8', name: 'ถั่วแระญี่ปุ่น (Edamame)', category: 'legume', dateAdded: '2026-08-19' },
  { id: '9', name: 'เมล็ดเจีย (Chia Seeds)', category: 'seed_nut', dateAdded: '2026-08-18' },
  { id: '10', name: 'อัลมอนด์อบ', category: 'seed_nut', dateAdded: '2026-08-19' },
  { id: '11', name: 'ขิงสด', category: 'herb_spice', dateAdded: '2026-08-20' },
  { id: '12', name: 'กระเทียม', category: 'herb_spice', dateAdded: '2026-08-20' },
  { id: '13', name: 'พริกไทยดำ', category: 'herb_spice', dateAdded: '2026-08-20' },
  { id: '14', name: 'ใบกะเพรา', category: 'herb_spice', dateAdded: '2026-08-20' }
];

export const SmartMicrobiomeTrackerModal: React.FC<SmartMicrobiomeTrackerModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [plants, setPlants] = useState<PlantDiversityItem[]>(() => {
    const saved = localStorage.getItem('kalguru_microbiome_plants');
    return saved ? JSON.parse(saved) : DEFAULT_PLANTS;
  });

  const [inputName, setInputName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlantDiversityItem['category']>('veg');

  useEffect(() => {
    localStorage.setItem('kalguru_microbiome_plants', JSON.stringify(plants));
  }, [plants]);

  const targetCount = 30; // American Gut Project benchmark
  const uniqueCount = plants.length;
  const progressPercent = Math.min(100, Math.round((uniqueCount / targetCount) * 100));

  const handleAddPlant = () => {
    if (!inputName.trim()) {
      onToast('กรุณากรอกชื่อพืช/ผัก/สมุนไพร');
      return;
    }
    const alreadyExists = plants.some(p => p.name.trim().toLowerCase() === inputName.trim().toLowerCase());
    if (alreadyExists) {
      onToast('พืชชนิดนี้ถูกนับในสัปดาห์นี้แล้ว!');
      return;
    }

    const newItem: PlantDiversityItem = {
      id: `plant-${Date.now()}`,
      name: inputName.trim(),
      category: selectedCategory,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    setPlants([newItem, ...plants]);
    setInputName('');
    onToast(`เพิ่ม "${newItem.name}" สะสมคะแนนจุลินทรีย์ลำไส้แล้ว (+1)`);
  };

  const handleDelete = (id: string) => {
    setPlants(plants.filter(p => p.id !== id));
  };

  const getCategoryBadge = (cat: PlantDiversityItem['category']) => {
    switch (cat) {
      case 'veg': return { label: 'ผักใบ/หัว', color: 'bg-emerald-100 text-emerald-800' };
      case 'fruit': return { label: 'ผลไม้', color: 'bg-pink-100 text-pink-800' };
      case 'grain': return { label: 'ธัญพืชเต็มเมล็ด', color: 'bg-amber-100 text-amber-800' };
      case 'legume': return { label: 'ถั่ว/เต้าหู้', color: 'bg-orange-100 text-orange-800' };
      case 'seed_nut': return { label: 'นัท & เมล็ดพืช', color: 'bg-purple-100 text-purple-800' };
      case 'herb_spice': return { label: 'สมุนไพร/เครื่องเทศ', color: 'bg-lime-100 text-lime-800' };
    }
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-emerald-50 via-teal-50 to-green-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md text-xl">
                🌱
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">ความหลากหลายของจุลินทรีย์ลำไส้ (30 Plants/Week)</h2>
                <p className="text-xs text-neutral-500 font-medium">Gut Microbiome Diversity Challenge</p>
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
            {/* Progress Card */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-3xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-100">เป้าหมายสัปดาห์นี้: 30 ชนิด</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                  {uniqueCount >= 30 ? '🎉 พิชิตเป้าหมายแล้ว!' : `เหลืออีก ${30 - uniqueCount} ชนิด`}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{uniqueCount}</span>
                <span className="text-emerald-200 text-base font-bold">/ 30 ชนิด</span>
                <span className="text-xs font-semibold text-emerald-100 ml-auto">{progressPercent}%</span>
              </div>

              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-emerald-100 leading-relaxed border-t border-white/20 pt-2 flex items-center gap-1.5">
                <Info size={14} className="shrink-0" />
                <span>งานวิจัยชี้ว่าการทานพืชผักสมุนไพรครบ 30 ชนิด/สัปดาห์ ช่วยเพิ่มแบคทีเรียตัวดี ลดความเสี่ยงโรคลำไส้และสร้างภูมิคุ้มกันสูงสุด</span>
              </p>
            </div>

            {/* Quick Add Form */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
              <span className="text-xs font-bold text-neutral-800 block">เพิ่มพืช/ผัก/ผลไม้/สมุนไพรที่ทานในสัปดาห์นี้:</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlant()}
                  placeholder="เช่น มะเขือเปราะ, ขมิ้นชัน, เมล็ดฟักทอง..."
                  className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-2.5 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700"
                >
                  <option value="veg">ผัก</option>
                  <option value="fruit">ผลไม้</option>
                  <option value="grain">ธัญพืช</option>
                  <option value="legume">ถั่ว</option>
                  <option value="seed_nut">นัท/เมล็ด</option>
                  <option value="herb_spice">สมุนไพร</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddPlant}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  <span>เพิ่ม</span>
                </button>
              </div>
            </div>

            {/* List of Plants Logged */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 px-1">
                <span>รายการพืชที่สะสมในสัปดาห์นี้ ({plants.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('ต้องการรีเซ็ตเพื่อเริ่มสัปดาห์ใหม่หรือไม่?')) {
                      setPlants([]);
                      onToast('รีเซ็ตสถิติสัปดาห์ใหม่เรียบร้อย');
                    }
                  }}
                  className="text-[11px] text-neutral-400 hover:text-rose-500 font-medium cursor-pointer"
                >
                  รีเซ็ตสัปดาห์ใหม่
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {plants.map((p) => {
                  const badge = getCategoryBadge(p.category);
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-white border border-neutral-200/90 flex items-center justify-between shadow-2xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="overflow-hidden mr-2">
                        <span className="font-bold text-neutral-800 text-xs truncate block">{p.name}</span>
                        <span className={`inline-block px-1.5 py-0.2 rounded-md text-[9px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-neutral-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
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
