import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Award,
  ChevronUp,
  Zap,
  Scan,
  Smile,
  Scale,
  Target,
  Printer
} from 'lucide-react';

interface QuickHealthNutritionSuiteHubProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenStreak: () => void;
  onOpenQuickFoodAdd: () => void;
  onOpenNutritionLabel: () => void;
  onOpenMealSwaps?: () => void;
  onOpenCustomMeals?: () => void;
  onOpenGrocery?: () => void;
  onOpenDailyMood: () => void;
  onOpenBodyTracker: () => void;
  onOpenCalorieGoals: () => void;
  onOpenClinicalReport: () => void;
  onOpenBackupRestore: () => void;
}

export const QuickHealthNutritionSuiteHub: React.FC<QuickHealthNutritionSuiteHubProps> = ({
  isOpen,
  onToggleOpen,
  onOpenStreak,
  onOpenQuickFoodAdd,
  onOpenNutritionLabel,
  onOpenMealSwaps,
  onOpenCustomMeals,
  onOpenGrocery,
  onOpenDailyMood,
  onOpenBodyTracker,
  onOpenCalorieGoals,
  onOpenClinicalReport,
  onOpenBackupRestore,
}) => {
  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">ศูนย์เครื่องมือสุขภาพ & โภชนาการ</h2>
            <p className="text-[11px] text-neutral-400">ครบเครื่องเรื่องคุมอาหาร & ฟิตเนส</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenStreak}
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            <Award size={14} className="text-amber-400" />
            <span>เหรียญ & สตรีค</span>
          </button>
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title={isOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
          >
            <ChevronUp size={18} className={`transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
              <button
                type="button"
                onClick={onOpenQuickFoodAdd}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Zap size={18} />
                </div>
                <span className="text-[11px] font-bold text-neutral-200">เพิ่มด่วน</span>
                <span className="text-[9px] text-neutral-400">30+ เมนู</span>
              </button>

              <button
                type="button"
                onClick={onOpenNutritionLabel}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Scan size={18} />
                </div>
                <span className="text-[11px] font-bold text-neutral-200">สแกนฉลาก</span>
                <span className="text-[9px] text-neutral-400">FDA AI</span>
              </button>

              <button
                type="button"
                onClick={onOpenDailyMood}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Smile size={18} />
                </div>
                <span className="text-[11px] font-bold text-neutral-200">อารมณ์/ย่อย</span>
                <span className="text-[9px] text-neutral-400">Mood/Gut</span>
              </button>

              <button
                type="button"
                onClick={onOpenBodyTracker}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Scale size={18} />
                </div>
                <span className="text-[11px] font-bold text-neutral-200">สัดส่วน</span>
                <span className="text-[9px] text-neutral-400">Body Stats</span>
              </button>

              <button
                type="button"
                onClick={onOpenCalorieGoals}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Target size={18} />
                </div>
                <span className="text-[11px] font-bold text-neutral-200">เป้าไดเอท</span>
                <span className="text-[9px] text-neutral-400">Goal Macro</span>
              </button>

              <button
                type="button"
                onClick={onOpenClinicalReport}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Printer size={18} />
                </div>
                <span className="text-[11px] font-bold text-neutral-200">รายงาน PDF</span>
                <span className="text-[9px] text-neutral-400">Clinical</span>
              </button>
              <button
                type="button"
                onClick={onOpenBackupRestore}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <span className="text-[18px]">💾</span>
                </div>
                <span className="text-[11px] font-bold text-neutral-200">สำรองข้อมูล</span>
                <span className="text-[9px] text-neutral-400">Backup</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
