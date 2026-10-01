import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Circle, Plus, Trash2, Zap, Sparkles, Award } from 'lucide-react';
import { addWaterLog } from '../../utils/waterService';

interface MicroHabitStackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

interface HabitStackItem {
  id: string;
  trigger: string;
  action: string;
  category: 'hydration' | 'movement' | 'mindset' | 'nutrition';
  completed: boolean;
}

const DEFAULT_HABITS: HabitStackItem[] = [
  { id: 'h1', trigger: 'ทันทีที่ตื่นนอนก้าวลงจากเตียง', action: 'ดื่มน้ำอุ่น 1 แก้วใหญ่ (300ml) ปลุกระบบขับถ่าย', category: 'hydration', completed: true },
  { id: 'h2', trigger: 'ก่อนตักข้าวคำแรกเข้าปาก', action: 'เคี้ยวผักใบเขียวก่อน 3-5 คำเพื่อปูพรมไฟเบอร์', category: 'nutrition', completed: true },
  { id: 'h3', trigger: 'หลังทานอาหารกลางวันเสร็จ', action: 'เดินย่อยเบาๆ 10 นาที ลดน้ำตาลพุ่งและแก้ง่วง', category: 'movement', completed: false },
  { id: 'h4', trigger: 'เมื่อรู้สึกอยากกินขนมหวานยามบ่าย', action: 'ดื่มน้ำเย็น 1 แก้วแล้วรอ 5 นาที แยกความหิวจริง vs หิวหลอก', category: 'mindset', completed: false },
  { id: 'h5', trigger: 'ก่อนอาบน้ำตอนเย็น', action: 'วิดพื้นหรือสควอช 15 ครั้ง กระตุ้นกล้ามเนื้อ', category: 'movement', completed: false }
];

export const MicroHabitStackerModal: React.FC<MicroHabitStackerModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [habits, setHabits] = useState<HabitStackItem[]>(() => {
    const saved = localStorage.getItem('kalguru_habit_stacks');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('');

  useEffect(() => {
    localStorage.setItem('kalguru_habit_stacks', JSON.stringify(habits));
  }, [habits]);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const next = !h.completed;
        if (next) {
          if (h.category === 'hydration' || h.action.includes('ดื่มน้ำ')) {
            addWaterLog(300, new Date());
            onToast(`สำเร็จนิสัย: "${h.action.slice(0, 20)}..." 🎉 (+บันทึกน้ำ 300 ml สู่ Water Tracker)`);
          } else {
            onToast(`สำเร็จนิสัย: "${h.action.slice(0, 20)}..." 🎉`);
          }
        }
        return { ...h, completed: next };
      }
      return h;
    }));
  };

  const handleAddHabit = () => {
    if (!newTrigger.trim() || !newAction.trim()) {
      onToast('กรุณาระบุทั้งเหตุการณ์กระตุ้น (Trigger) และพฤติกรรมใหม่ (Action)');
      return;
    }
    const item: HabitStackItem = {
      id: `h-${Date.now()}`,
      trigger: newTrigger.trim(),
      action: newAction.trim(),
      category: 'nutrition',
      completed: false
    };
    setHabits([...habits, item]);
    setNewTrigger('');
    setNewAction('');
    onToast('เพิ่มสูตรนิสัยเชื่อมโยง (Habit Stack) เรียบร้อย');
  };

  const handleDelete = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const completedCount = habits.filter(h => h.completed).length;

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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-amber-50 via-orange-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">สร้างนิสัยสุขภาพอัตโนมัติ (Habit Stacking Engine)</h2>
                <p className="text-xs text-neutral-500 font-medium">ผูกพฤติกรรมใหม่เข้ากับกิจวัตรเดิมตามหลัก Atomic Habits</p>
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
            {/* Progress status */}
            <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white p-4 rounded-3xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-xs font-semibold text-amber-100">ความสำเร็จกิจวัตรวันนี้</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black">{completedCount}</span>
                  <span className="text-amber-200 text-sm font-bold">/ {habits.length} นิสัย</span>
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold text-xs">
                  {Math.round((completedCount / Math.max(habits.length, 1)) * 100)}% Complete
                </span>
              </div>
            </div>

            {/* Habit Stacks List */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-neutral-800 block px-1">รายการ Habit Stacks ประจำวัน:</span>
              <div className="space-y-2">
                {habits.map((h) => (
                  <div
                    key={h.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      h.completed
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleHabit(h.id)}
                      className="mt-0.5 text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {h.completed ? (
                        <CheckCircle2 size={20} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle size={20} className="text-neutral-300" />
                      )}
                    </button>

                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-neutral-500 text-[11px]">
                        👉 หลังจาก <span className="font-bold text-neutral-800">"{h.trigger}"</span>
                      </div>
                      <div className={`font-bold text-xs mt-0.5 ${h.completed ? 'line-through opacity-70 text-emerald-800' : 'text-neutral-900'}`}>
                        ✅ ฉันจะ <span className="text-orange-600 font-extrabold">"{h.action}"</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(h.id)}
                      className="text-neutral-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Habit Formula */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-2.5">
              <span className="text-xs font-bold text-neutral-800 block">สร้างสูตรนิสัยใหม่ (Habit Stacking Formula):</span>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-neutral-500 font-bold block mb-1">1. พฤติกรรมเดิมที่เป็นอัตโนมัติอยู่แล้ว (Trigger):</label>
                  <input
                    type="text"
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    placeholder="เช่น หลังชงกาแฟตอนเช้า, หลังแปรงฟันเสร็จ..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-medium focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-500 font-bold block mb-1">2. พฤติกรรมสุขภาพเล็กๆ ที่ต้องการทำทันที (Action):</label>
                  <input
                    type="text"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    placeholder="เช่น ดื่มน้ำเปล่า 1 แก้ว, วิดพื้น 10 ครั้ง..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-medium focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddHabit}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>เพิ่ม Habit Stack นี้</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
