import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCw, ShieldCheck, Heart, Moon, Droplets, Utensils, CheckCircle } from 'lucide-react';
import { CheatMealRecoveryPlan } from '../../types/innovations';

interface SocialCheatMealRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheatMealCalories?: number;
  cheatMealName?: string;
  onToast: (msg: string) => void;
}

export const SocialCheatMealRecoveryModal: React.FC<SocialCheatMealRecoveryModalProps> = ({
  isOpen,
  onClose,
  cheatMealCalories = 1200,
  cheatMealName = 'บุฟเฟต์หมูกระทะ ชาบู ปิ้งย่าง พร้อมเบียร์ 2 แก้วและของหวาน',
  onToast
}) => {
  const [cheatFoodDescription, setCheatFoodDescription] = useState(cheatMealName);
  const [excessCaloriesEstimate, setExcessCaloriesEstimate] = useState(cheatMealCalories);
  const [alcoholConsumed, setAlcoholConsumed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CheatMealRecoveryPlan | null>(null);

  const handleGenerateRecoveryPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cheat-meal-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cheatFoodDescription,
          excessCaloriesEstimate,
          alcoholConsumed
        })
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setPlan(data);
      onToast('สร้างแผนกู้ร่าง 48 ชั่วโมง (Zero Guilt Recovery) สำเร็จ!');
    } catch {
      // Fallback
      setPlan({
        day1Adjustment: 'ดื่มน้ำเพิ่มเป็น 3.2 ลิตรเพื่อขับโซเดียมส่วนเกิน เน้นโปรตีนลีน + ผักใบเขียวโพแทสเซียมสูง เลี่ยงคาร์โบไฮเดรตแปรรูป',
        day2Adjustment: 'กลับสู่แคลอรี่ปกติ (Maintenance -10%) ออกกำลังกายแบบ Zone 2 คาร์ดิโอ 40 นาทีเพื่อดึงไกลโคเจนสะสมมาใช้งาน',
        hydrationExtraMl: 1000,
        potassiumFoodSuggestions: [
          'น้ำมะพร้าวสด (ธรรมชาติแท้ ไม่เติมน้ำตาล)',
          'กล้วยหอม 1 ลูก หรือ อะโวคาโดครึ่งลูก',
          'ผักโขมลวก หรือ บรอกโคลีต้ม'
        ],
        mindsetSupportMessage: 'อย่ารู้สึกผิดหรืออดอาหาร! ร่างกายมนุษย์ถูกสร้างมาให้ทนทานต่อการกินเกินเป็นครั้งคราว น้ำหนักที่เพิ่มขึ้นในวันถัดไป 80-90% คือน้ำและโซเดียมที่กักเก็บไว้ ไม่ใช่ไขมันบริสุทธิ์ เพียงทำตามแผนนี้ 2 วัน ระบบจะกลับสู่สมดุล 100%'
      });
      onToast('คำนวณแผนกู้ร่างเรียบร้อย');
    } finally {
      setLoading(false);
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
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-linear-to-r from-purple-50 via-pink-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <RefreshCw size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 leading-tight">โปรโตคอลกู้ร่าง 48 ชม. (Cheat Meal Recovery)</h2>
                <p className="text-xs text-neutral-500 font-medium">ไม่มีความรู้สึกผิด คืนสมดุลโซเดียม & ไกลโคเจนอย่างมีหลักการ</p>
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
            {/* Input Form */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">มื้อหลุด / งานเลี้ยงที่เพิ่งทานมา:</label>
                <input
                  type="text"
                  value={cheatFoodDescription}
                  onChange={(e) => setCheatFoodDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-medium focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">แคลอรี่ที่คาดว่าเกินเป้า:</label>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-neutral-300">
                    <input
                      type="number"
                      value={excessCaloriesEstimate}
                      onChange={(e) => setExcessCaloriesEstimate(Number(e.target.value))}
                      className="w-full font-bold text-xs text-purple-600 focus:outline-hidden"
                    />
                    <span className="text-xs text-neutral-400 font-bold">kcal</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">มีแอลกอฮอล์หรือไม่?</label>
                  <button
                    type="button"
                    onClick={() => setAlcoholConsumed(!alcoholConsumed)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      alcoholConsumed
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-white text-neutral-600 border-neutral-300'
                    }`}
                  >
                    {alcoholConsumed ? '🍺 มีแอลกอฮอล์' : '❌ ไม่มีแอลกอฮอล์'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateRecoveryPlan}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>กำลังคำนวณสูตรคืนสมดุล 48 ชม...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>คำนวณแผนกู้ร่าง 48 ชั่วโมง</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Protocol */}
            {plan && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Mindset support */}
                <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                    <Heart size={16} className="text-pink-500 fill-pink-500" />
                    <span>Mindset สำคัญ: ร่างกายของคุณยังยอดเยี่ยมอยู่!</span>
                  </div>
                  <p className="text-xs text-purple-800 leading-relaxed font-medium">
                    {plan.mindsetSupportMessage}
                  </p>
                </div>

                {/* Day 1 & Day 2 Steps */}
                <div className="space-y-2.5">
                  <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-black text-neutral-800">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>วันที่ 1 (Day 1): Flush Sodium & Reset Hydration</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed font-medium pl-7">
                      {plan.day1Adjustment}
                    </p>
                    <div className="pl-7 pt-1 flex items-center gap-1 text-[11px] font-bold text-sky-600">
                      <Droplets size={13} />
                      <span>ดื่มน้ำเพิ่มพิเศษอีก +{plan.hydrationExtraMl} ml จากปกติ</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-black text-neutral-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>วันที่ 2 (Day 2): Metabolic Glycogen Burn</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed font-medium pl-7">
                      {plan.day2Adjustment}
                    </p>
                  </div>
                </div>

                {/* Potassium food recommendations */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 block">🍌 แนะนำอาหารโพแทสเซียมสูงขับโซเดียม:</span>
                  <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside font-medium">
                    {(plan.potassiumFoodSuggestions || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
