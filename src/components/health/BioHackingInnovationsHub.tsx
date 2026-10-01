import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronUp } from 'lucide-react';

export type InnovationCategory = 'all' | 'metabolic' | 'kitchen' | 'recovery' | 'habits';

interface BioHackingInnovationsHubProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  category: InnovationCategory;
  onSelectCategory: (category: InnovationCategory) => void;
  onOpenGlucoseModal: () => void;
  onOpenDiningMenuModal?: () => void;
  onOpenExerciseBurnModal: () => void;
  onOpenChronoNutritionModal: () => void;
  onOpenLongevityModal: () => void;
  onOpenMicrobiomeModal: () => void;
  onOpenFastingStagesModal: () => void;
  onOpenHealthyPlateModal: () => void;
  onOpenMetabolicHeatmapModal: () => void;
  onOpenAllergySafetyModal: () => void;
  onOpenCheatMealModal: () => void;
  onOpenCravingSOSModal: () => void;
  onOpenHydrationOptimizerModal: () => void;
  onOpenHabitStackModal: () => void;
  onOpenSocialStoryModal: () => void;
  onOpenBiomarkerSyncModal: () => void;
  onOpenCaffeineDecayModal: () => void;
  onOpenStreetFoodModal: () => void;
  onOpenMetabolicAgeModal: () => void;
  onOpenWeeklyMealPlannerModal?: () => void;
  onOpenSmartBarcodeModal: () => void;
  onOpenMicronutrientModal: () => void;
  onOpenPostMealWalkModal: () => void;
  onOpenVisualPhotoModal: () => void;
}

export const BioHackingInnovationsHub: React.FC<BioHackingInnovationsHubProps> = ({
  isOpen,
  onToggleOpen,
  category,
  onSelectCategory,
  onOpenGlucoseModal,
  onOpenDiningMenuModal,
  onOpenExerciseBurnModal,
  onOpenChronoNutritionModal,
  onOpenLongevityModal,
  onOpenMicrobiomeModal,
  onOpenFastingStagesModal,
  onOpenHealthyPlateModal,
  onOpenMetabolicHeatmapModal,
  onOpenAllergySafetyModal,
  onOpenCheatMealModal,
  onOpenCravingSOSModal,
  onOpenHydrationOptimizerModal,
  onOpenHabitStackModal,
  onOpenSocialStoryModal,
  onOpenBiomarkerSyncModal,
  onOpenCaffeineDecayModal,
  onOpenStreetFoodModal,
  onOpenMetabolicAgeModal,
  onOpenWeeklyMealPlannerModal,
  onOpenSmartBarcodeModal,
  onOpenMicronutrientModal,
  onOpenPostMealWalkModal,
  onOpenVisualPhotoModal,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 flex flex-col relative z-10">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-neutral-900">แหล่งความรู้และ Bio Hacking</h2>
              <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[9px] font-black uppercase">
                Knowledge & Bio-Hacking
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">สาระความรู้ วิทยาศาสตร์การชะลอวัย สุขภาพลำไส้ และนวัตกรรมเมตาบอลิก</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleOpen}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          title={isOpen ? "ยุบเนื้อหา" : "ขยายเนื้อหา"}
        >
          <ChevronUp size={18} className={`transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pt-3 space-y-3"
          >
            {/* Filter tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'metabolic', label: '🩸 เมตาบอลิซึม & อายุยืน' },
                { id: 'kitchen', label: '🥗 เมนูร้านอาหาร & ครัว AI' },
                { id: 'recovery', label: '🏃 ชดเชย & ฟื้นฟู' },
                { id: 'habits', label: '🧠 ลำไส้ & นิสัย' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectCategory(tab.id as InnovationCategory)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                    category === tab.id
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Innovation Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              {/* 1. Glucose Crash */}
              {(category === 'all' || category === 'metabolic') && (
                <button
                  type="button"
                  onClick={onOpenGlucoseModal}
                  className="p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">📉</span>
                  <span className="text-xs font-bold text-sky-950 block leading-tight">ทำนาย Glucose Crash</span>
                  <span className="text-[10px] text-sky-700 font-medium">เตือนพลังงานตกหลังกิน</span>
                </button>
              )}

              {/* 3. Exercise Burn Offset */}
              {(category === 'all' || category === 'recovery') && (
                <button
                  type="button"
                  onClick={onOpenExerciseBurnModal}
                  className="p-3 rounded-2xl bg-orange-50/70 hover:bg-orange-100/80 border border-orange-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🏋️</span>
                  <span className="text-xs font-bold text-orange-950 block leading-tight">คำนวณเบิร์นชดเชย</span>
                  <span className="text-[10px] text-orange-700 font-medium">เบิร์นกี่นาทีให้เท่ามื้อนี้</span>
                </button>
              )}

              {/* 4. Chrono Nutrition */}
              {(category === 'all' || category === 'recovery') && (
                <button
                  type="button"
                  onClick={onOpenChronoNutritionModal}
                  className="p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">⏰</span>
                  <span className="text-xs font-bold text-purple-950 block leading-tight">Chrono-Nutrition</span>
                  <span className="text-[10px] text-purple-700 font-medium">ตารางเวลากินตามชีวภาพ</span>
                </button>
              )}

              {/* 5. Longevity Score */}
              {(category === 'all' || category === 'metabolic') && (
                <button
                  type="button"
                  onClick={onOpenLongevityModal}
                  className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🧬</span>
                  <span className="text-xs font-bold text-emerald-950 block leading-tight">คะแนนชะลอวัย & ต้านอักเสบ</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Longevity Index</span>
                </button>
              )}

              {/* 6. Smart Microbiome */}
              {(category === 'all' || category === 'habits') && (
                <button
                  type="button"
                  onClick={onOpenMicrobiomeModal}
                  className="p-3 rounded-2xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🦠</span>
                  <span className="text-xs font-bold text-teal-950 block leading-tight">จุลินทรีย์ลำไส้ Gut Micro</span>
                  <span className="text-[10px] text-teal-700 font-medium">ไฟเบอร์หลากหลาย 30 พืช</span>
                </button>
              )}

              {/* 7. Fasting 5 Stages */}
              {(category === 'all' || category === 'metabolic') && (
                <button
                  type="button"
                  onClick={onOpenFastingStagesModal}
                  className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">⏱️</span>
                  <span className="text-xs font-bold text-amber-950 block leading-tight">5 ระยะชีวภาพฟาสติ้ง</span>
                  <span className="text-[10px] text-amber-700 font-medium">Autophagy & Ketosis</span>
                </button>
              )}

              {/* 8. Healthy Plate Visualizer */}
              {(category === 'all' || category === 'kitchen') && (
                <button
                  type="button"
                  onClick={onOpenHealthyPlateModal}
                  className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🍽️</span>
                  <span className="text-xs font-bold text-emerald-950 block leading-tight">Healthy Plate 50/25/25</span>
                  <span className="text-[10px] text-emerald-700 font-medium">สัดส่วนจานสุขภาพฮาร์วาร์ด</span>
                </button>
              )}

              {/* 9. Metabolic Heatmap */}
              {(category === 'all' || category === 'metabolic') && (
                <button
                  type="button"
                  onClick={onOpenMetabolicHeatmapModal}
                  className="p-3 rounded-2xl bg-violet-50/70 hover:bg-violet-100/80 border border-violet-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🔥</span>
                  <span className="text-xs font-bold text-violet-950 block leading-tight">Metabolic Heatmap</span>
                  <span className="text-[10px] text-violet-700 font-medium">ฮีทแมพเผาผลาญ 24 ชม.</span>
                </button>
              )}

              {/* 13. Allergy Safety & Medical Filter */}
              {(category === 'all' || category === 'kitchen') && (
                <button
                  type="button"
                  onClick={onOpenAllergySafetyModal}
                  className="p-3 rounded-2xl bg-red-50/70 hover:bg-red-100/80 border border-red-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🛡️</span>
                  <span className="text-xs font-bold text-red-950 block leading-tight">คัดกรองภูมิแพ้ & โรคประจำตัว</span>
                  <span className="text-[10px] text-red-700 font-medium">Allergy & Medical Guard</span>
                </button>
              )}

              {/* 14. Cheat Meal Recovery */}
              {(category === 'all' || category === 'recovery') && (
                <button
                  type="button"
                  onClick={onOpenCheatMealModal}
                  className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🍕</span>
                  <span className="text-xs font-bold text-amber-950 block leading-tight">ฟื้นฟูหลังมื้อหลุด Cheat Meal</span>
                  <span className="text-[10px] text-amber-700 font-medium">แผนแก้เกมไม่ให้พัง</span>
                </button>
              )}

              {/* 15. Craving Emergency SOS */}
              {(category === 'all' || category === 'recovery') && (
                <button
                  type="button"
                  onClick={onOpenCravingSOSModal}
                  className="p-3 rounded-2xl bg-pink-50/70 hover:bg-pink-100/80 border border-pink-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🚨</span>
                  <span className="text-xs font-bold text-pink-950 block leading-tight">ปุ่มฉุกเฉินดับความอยากดึก</span>
                  <span className="text-[10px] text-pink-700 font-medium">3-Min Urge Surfing SOS</span>
                </button>
              )}

              {/* 16. Hydration Electrolyte Optimizer */}
              {(category === 'all' || category === 'recovery') && (
                <button
                  type="button"
                  onClick={onOpenHydrationOptimizerModal}
                  className="p-3 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100/80 border border-cyan-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">💧</span>
                  <span className="text-xs font-bold text-cyan-950 block leading-tight">ปรับเกลือแร่ตามเหงื่อ & สภาพอากาศ</span>
                  <span className="text-[10px] text-cyan-700 font-medium">Electrolyte Optimizer</span>
                </button>
              )}

              {/* 17. Micro-Habit Stacker */}
              {(category === 'all' || category === 'habits') && (
                <button
                  type="button"
                  onClick={onOpenHabitStackModal}
                  className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🧱</span>
                  <span className="text-xs font-bold text-emerald-950 block leading-tight">Micro-Habit Stacker</span>
                  <span className="text-[10px] text-emerald-700 font-medium">ผูกนิสัยเล็กๆ สร้างวินัยถาวร</span>
                </button>
              )}

              {/* 19. Social Story Card */}
              {(category === 'all' || category === 'habits') && (
                <button
                  type="button"
                  onClick={onOpenSocialStoryModal}
                  className="p-3 rounded-2xl bg-fuchsia-50/70 hover:bg-fuchsia-100/80 border border-fuchsia-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">📱</span>
                  <span className="text-xs font-bold text-fuchsia-950 block leading-tight">Social Story Card</span>
                  <span className="text-[10px] text-fuchsia-700 font-medium">การ์ดแชร์ IG/TikTok สวยหรู</span>
                </button>
              )}

              {/* 20. Biomarker & CGM Sync Simulator */}
              {(category === 'all' || category === 'metabolic') && (
                <button
                  type="button"
                  onClick={onOpenBiomarkerSyncModal}
                  className="p-3 rounded-2xl bg-red-50/70 hover:bg-red-100/80 border border-red-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">⌚</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[9px]">HUAWEI</span>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 block leading-tight">ซิงค์ Smart Health & CGM</span>
                  <span className="text-[10px] text-red-700 font-medium">Smart Health Sync</span>
                </button>
              )}

              {/* 21. Caffeine Sleep Decay */}
              {(category === 'all' || category === 'recovery') && (
                <button
                  type="button"
                  onClick={onOpenCaffeineDecayModal}
                  className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">☕</span>
                  <span className="text-xs font-bold text-amber-950 block leading-tight">กราฟสลายคาเฟอีน & นอนหลับ</span>
                  <span className="text-[10px] text-amber-700 font-medium">Caffeine Decay Tracker</span>
                </button>
              )}

              {/* 22. Street Food Survival Guide */}
              {(category === 'all' || category === 'kitchen') && (
                <button
                  type="button"
                  onClick={onOpenStreetFoodModal}
                  className="p-3 rounded-2xl bg-orange-50/70 hover:bg-orange-100/80 border border-orange-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🍜</span>
                  <span className="text-xs font-bold text-orange-950 block leading-tight">คู่มือสั่งสตรีทฟู้ดให้ลีน</span>
                  <span className="text-[10px] text-orange-700 font-medium">Street Food Hacks</span>
                </button>
              )}

              {/* 23. Metabolic Bio-Age */}
              {(category === 'all' || category === 'metabolic') && (
                <button
                  type="button"
                  onClick={onOpenMetabolicAgeModal}
                  className="p-3 rounded-2xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🧬</span>
                  <span className="text-xs font-bold text-teal-950 block leading-tight">คำนวณอายุเมทาบอลิซึม</span>
                  <span className="text-[10px] text-teal-700 font-medium">Metabolic Bio-Age</span>
                </button>
              )}

              {/* 25. Smart 7-Eleven Barcode Scanner */}
              {(category === 'all' || category === 'kitchen') && (
                <button
                  type="button"
                  onClick={onOpenSmartBarcodeModal}
                  className="p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">📦</span>
                  <span className="text-xs font-bold text-sky-950 block leading-tight">สแกนบาร์โค้ด 7-Eleven / ห้าง</span>
                  <span className="text-[10px] text-sky-700 font-medium">Live Barcode Scan</span>
                </button>
              )}

              {/* 26. Micronutrient RDA Tracker */}
              {(category === 'all' || category === 'metabolic') && (
                <button
                  type="button"
                  onClick={onOpenMicronutrientModal}
                  className="p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">💊</span>
                  <span className="text-xs font-bold text-indigo-950 block leading-tight">วิเคราะห์วิตามิน & โซเดียม</span>
                  <span className="text-[10px] text-indigo-700 font-medium">Micronutrients RDA</span>
                </button>
              )}

              {/* 27. Post-Meal Glucose Walk */}
              {(category === 'all' || category === 'recovery') && (
                <button
                  type="button"
                  onClick={onOpenPostMealWalkModal}
                  className="p-3 rounded-2xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">🚶</span>
                  <span className="text-xs font-bold text-teal-950 block leading-tight">เดินย่อย 15 นาที ลดพีกน้ำตาล</span>
                  <span className="text-[10px] text-teal-700 font-medium">Glucose Walk Timer</span>
                </button>
              )}

              {/* 28. Visual Photo & US Navy Body Fat */}
              {(category === 'all' || category === 'habits') && (
                <button
                  type="button"
                  onClick={onOpenVisualPhotoModal}
                  className="p-3 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100/80 border border-cyan-100 text-left transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <span className="text-lg block mb-1">📸</span>
                  <span className="text-xs font-bold text-cyan-950 block leading-tight">เปรียบเทียบหุ่น & ไขมัน Navy</span>
                  <span className="text-[10px] text-cyan-700 font-medium">Visual Body Matrix</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
