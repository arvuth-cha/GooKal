import React from 'react';
import { 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Leaf, 
  Check, 
  Heart, 
  Flame, 
  Sparkles,
  Info
} from 'lucide-react';

interface NutritionSafetyBadgeProps {
  sugarGrams?: number;
  sodiumMg?: number;
  calories: number;
  proteinGrams: number;
  foodName: string;
}

export const NutritionSafetyBadge: React.FC<NutritionSafetyBadgeProps> = ({
  sugarGrams = 0,
  sodiumMg = 0,
  calories,
  proteinGrams,
  foodName
}) => {
  const isHighSugar = sugarGrams > 20;
  const isHighSodium = sodiumMg > 800;
  const isHighProtein = proteinGrams >= 25;
  const isLowCal = calories <= 250;

  // Keyword-based lifestyle checks
  const nameLower = foodName.toLowerCase();
  const isVegetarianOrVegan = nameLower.includes('เต้าหู้') || nameLower.includes('ผัก') || nameLower.includes('สลัด') || nameLower.includes('โอ๊ต') || nameLower.includes('ถั่ว');
  const isPork = nameLower.includes('หมู') || nameLower.includes('เบคอน') || nameLower.includes('กุนเชียง') || nameLower.includes('แฮม');

  return (
    <div className="space-y-2">
      {/* Alert Indicators */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
        {isHighProtein && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            💪 โปรตีนสูง ({proteinGrams}g)
          </span>
        )}

        {isLowCal && (
          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1">
            🍃 แคลอรีต่ำ ({calories} kcal)
          </span>
        )}

        {isHighSugar && (
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            ⚠️ น้ำตาลสูง ({sugarGrams}g)
          </span>
        )}

        {isHighSodium && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            🧂 โซเดียมสูง ({sodiumMg}mg)
          </span>
        )}

        {isVegetarianOrVegan && !isPork && (
          <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
            🌱 Vegan / Plant-Based Friendly
          </span>
        )}

        {!isPork ? (
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            ☪️ ไม่มีเนื้อหมู
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
            🐷 มีเนื้อหมู
          </span>
        )}
      </div>

      {/* Actionable Health Advice note */}
      {(isHighSugar || isHighSodium) && (
        <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-tight space-y-1">
          {isHighSugar && (
            <p>• <strong>ระวังน้ำตาล:</strong> มื้อนี้มีน้ำตาลสูง แนะนำดื่มน้ำเปล่าตามมากๆ หรือลดของหวานในมื้อถัดไป</p>
          )}
          {isHighSodium && (
            <p>• <strong>ระวังโซเดียม:</strong> หลีกเลี่ยงการซดน้ำแกง/น้ำซุปจนหมด เพื่อป้องกันอาการตัวบวมน้ำและความดัน</p>
          )}
        </div>
      )}
    </div>
  );
};
