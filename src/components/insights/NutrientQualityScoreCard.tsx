import React from 'react';
import { 
  Award, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  Activity, 
  Info, 
  TrendingUp,
  Droplet
} from 'lucide-react';

interface HistoryItem {
  id?: string;
  foodName?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
}

interface NutrientQualityScoreCardProps {
  dayMeals?: HistoryItem[];
  historyItems?: HistoryItem[];
  waterTotalMl?: number;
  waterIntakeMl?: number;
  calorieTarget?: number;
  calorieGoal?: number;
  proteinGoal?: number;
}

export const NutrientQualityScoreCard: React.FC<NutrientQualityScoreCardProps> = ({
  dayMeals,
  historyItems,
  waterTotalMl,
  waterIntakeMl,
  calorieTarget,
  calorieGoal,
  proteinGoal
}) => {
  const mealsList = dayMeals || historyItems || [];
  const totalWater = waterTotalMl ?? waterIntakeMl ?? 0;
  const targetCal = calorieTarget ?? calorieGoal ?? 2000;

  const totalCalories = mealsList.reduce((sum, m) => sum + (m?.calories || 0), 0);
  const totalProtein = mealsList.reduce((sum, m) => sum + (m?.proteinGrams || 0), 0);
  const totalSugar = mealsList.reduce((sum, m) => sum + (m?.sugarGrams || 0), 0);
  const totalSodium = mealsList.reduce((sum, m) => sum + (m?.sodiumMg || 0), 0);

  // Calculate score breakdown (0 - 100)
  let score = 50; // base

  if (mealsList.length > 0) {
    // 1. Protein sufficiency (+20 max)
    const proteinRatio = (totalProtein * 4) / (totalCalories || 1);
    if (proteinRatio >= 0.20 && proteinRatio <= 0.35) score += 20;
    else if (proteinRatio >= 0.15) score += 12;
    else score += 5;

    // 2. Calorie closeness to target (+15 max)
    const calDiffRatio = Math.abs(totalCalories - targetCal) / (targetCal || 1);
    if (calDiffRatio <= 0.1) score += 15;
    else if (calDiffRatio <= 0.2) score += 10;
    else score += 4;

    // 3. Sugar moderation (+15 max)
    if (totalSugar <= 25) score += 15;
    else if (totalSugar <= 45) score += 8;
    else score -= 10;

    // 4. Sodium safety (+15 max)
    if (totalSodium <= 1800) score += 15;
    else if (totalSodium <= 2300) score += 7;
    else score -= 12;

    // 5. Hydration bonus (+15 max)
    if (totalWater >= 2000) score += 15;
    else if (totalWater >= 1200) score += 10;
    else score += 4;
  } else {
    score = 0;
  }

  score = Math.min(100, Math.max(0, score));

  // Determine grade & color
  let grade = 'A';
  let gradeText = 'ดีเยี่ยมมาก (Super Clean)';
  let gradeColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let badgeColor = 'bg-emerald-500';

  if (score < 40) {
    grade = 'D';
    gradeText = 'ควรปรับปรุงโภชนาการ';
    gradeColor = 'text-rose-600 bg-rose-50 border-rose-200';
    badgeColor = 'bg-rose-500';
  } else if (score < 65) {
    grade = 'C';
    gradeText = 'ปานกลาง (Fair Balance)';
    gradeColor = 'text-amber-600 bg-amber-50 border-amber-200';
    badgeColor = 'bg-amber-500';
  } else if (score < 85) {
    grade = 'B';
    gradeText = 'ดีตามเกณฑ์ (Balanced)';
    gradeColor = 'text-blue-600 bg-blue-50 border-blue-200';
    badgeColor = 'bg-blue-500';
  }

  return (
    <div className="p-4 rounded-3xl bg-white border border-neutral-100 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-2xl ${badgeColor} text-white flex items-center justify-center shadow-md shadow-neutral-900/10`}>
            <Award size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900">คะแนนคุณภาพโภชนาการวันนี้ (Nutrient Quality Score)</h4>
            <p className="text-[11px] text-neutral-500 font-medium">ประเมินจากโปรตีน น้ำตาล โซเดียม และปริมาณน้ำ</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-2xl border flex items-center gap-1.5 ${gradeColor}`}>
          <span className="text-base font-black leading-none">{score}</span>
          <span className="text-[10px] font-bold">/100 ({grade})</span>
        </div>
      </div>

      {/* Mini Quality Indicators */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        {/* Sugar Alert */}
        <div className={`p-2.5 rounded-2xl border ${
          totalSugar <= 25 
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900' 
            : totalSugar <= 45 
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' 
              : 'bg-rose-50/70 border-rose-200/80 text-rose-900'
        }`}>
          <span className="text-[10px] font-bold block opacity-75">🍭 น้ำตาลรวม</span>
          <span className="text-xs font-black">{totalSugar}g</span>
          <span className="text-[9px] block font-bold mt-0.5">
            {totalSugar <= 25 ? '✅ ต่ำดีมาก' : totalSugar <= 45 ? '⚠️ ปานกลาง' : '🚨 สูงเกินเกณฑ์'}
          </span>
        </div>

        {/* Sodium Alert */}
        <div className={`p-2.5 rounded-2xl border ${
          totalSodium <= 1800 
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900' 
            : totalSodium <= 2300 
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' 
              : 'bg-rose-50/70 border-rose-200/80 text-rose-900'
        }`}>
          <span className="text-[10px] font-bold block opacity-75">🧂 โซเดียมรวม</span>
          <span className="text-xs font-black">{totalSodium}mg</span>
          <span className="text-[9px] block font-bold mt-0.5">
            {totalSodium <= 1800 ? '✅ ปลอดภัย' : totalSodium <= 2300 ? '⚠️ เฝ้าระวัง' : '🚨 โซเดียมสูง'}
          </span>
        </div>

        {/* Hydration Alert */}
        <div className={`p-2.5 rounded-2xl border ${
          waterTotalMl >= 2000 
            ? 'bg-blue-50/70 border-blue-200/80 text-blue-900' 
            : waterTotalMl >= 1200 
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' 
              : 'bg-neutral-50 border-neutral-200/80 text-neutral-800'
        }`}>
          <span className="text-[10px] font-bold block opacity-75">💧 ดื่มน้ำวันนี้</span>
          <span className="text-xs font-black">{waterTotalMl}ml</span>
          <span className="text-[9px] block font-bold mt-0.5">
            {waterTotalMl >= 2000 ? '✅ ครบตามเป้า' : '⏳ ดื่มเพิ่มอีก'}
          </span>
        </div>
      </div>
    </div>
  );
};
