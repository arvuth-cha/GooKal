export interface NutritionGoalParams {
  gender: 'male' | 'female';
  age: number;
  weight: number; // kg
  height: number; // cm
  targetWeight?: number; // kg
  activityLevel: number;
  goalType: 'balanced' | 'muscle_maintain' | 'muscle_build' | 'fat_loss' | 'fat_loss_fast' | 'keto' | 'custom';
  customNotes?: string;
}

export interface CalculatedNutritionPlan {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  calorieAdjustment: number;
  proteinGrams: number;
  proteinPerKg: number;
  proteinPct: number;
  carbsGrams: number;
  carbsPct: number;
  fatGrams: number;
  fatPct: number;
  sugarGrams: number;
  sodiumMg: number;
  waterMl: number;
  planTitle: string;
  explanation: string;
  keyTips: string[];
}

/**
 * คำนวณความต้องการพลังงานและสารอาหารตามหลักเวชศาสตร์การกีฬาและโภชนาการคลินิก (Client-side Formula)
 */
export function calculateLocalSportsNutrition(params: NutritionGoalParams): CalculatedNutritionPlan {
  const { gender, age, weight, height, activityLevel, goalType } = params;
  
  const safeWeight = Math.max(30, Number(weight) || 60);
  const safeHeight = Math.max(100, Number(height) || 165);
  const safeAge = Math.max(12, Math.min(100, Number(age) || 28));
  const safeAct = Number(activityLevel) || 1.375;

  // Mifflin-St Jeor Formula
  const calculatedBmr = gender === 'male'
    ? Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) + 5)
    : Math.round((10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) - 161);

  const bmr = Math.max(1000, calculatedBmr);
  const tdee = Math.round(bmr * safeAct);

  let calorieAdjustment = 0;
  let proteinPerKg = 1.0;
  let carbRatio = 0.50;
  let fatRatio = 0.25;
  let planTitle = 'สมดุลสุขภาพทั่วไป (Balanced Health)';
  let explanation = '';
  let tips: string[] = [];

  switch (goalType) {
    case 'balanced':
      calorieAdjustment = 0; // Maintenance
      proteinPerKg = safeAge >= 50 ? 1.2 : 1.0;
      carbRatio = 0.50;
      fatRatio = 0.25;
      planTitle = '🥗 สุขภาพสมดุลและรักษาน้ำหนัก (Balanced Maintenance)';
      explanation = `แนะนำพลังงาน ${tdee} kcal/วัน เท่ากับอัตราการเผาผลาญรวม โดยเน้นโปรตีน ${proteinPerKg}g/kg (${Math.round(safeWeight * proteinPerKg)}g) เพื่อบำรุงสุขภาพและระบบภูมิคุ้มกัน`;
      tips = [
        'รับประทานอาหารครบ 5 หมู่ในสัดส่วน 2:1:1 (ผัก:แป้ง:โปรตีน)',
        'เน้นคาร์โบไฮเดรตเชิงซ้อน เช่น ข้าวกล้อง ข้าวโอ๊ต ขนมปังโฮลวีต',
        'ดื่มน้ำเปล่าสม่ำเสมออย่างน้อย 2.0-2.5 ลิตรต่อวัน'
      ];
      break;

    case 'muscle_maintain':
      calorieAdjustment = -200; // Small safe deficit for lean & toned look
      proteinPerKg = 1.5;
      carbRatio = 0.45;
      fatRatio = 0.25;
      planTitle = '🛡️ รักษามวลกล้ามเนื้อ & กระชับสัดส่วน (Muscle Preservation & Recomp)';
      explanation = `แนะนำโปรตีนสูง ${proteinPerKg}g/kg (${Math.round(safeWeight * proteinPerKg)}g) เพื่อป้องกันการสูญเสียกล้ามเนื้อขณะเผาผลาญไขมันสะสม`;
      tips = [
        'กระจายโปรตีนเฉลี่ย 25-35 กรัมต่อมื้อเพื่อกระตุ้น Muscle Protein Synthesis (MPS)',
        'รับประทานโปรตีนร่วมกับคาร์บหลังออกกำลังกายภายใน 1-2 ชั่วโมง',
        'เน้นเนื้อสัตว์ไขมันต่ำ เช่น อกไก่ ปลา ไข่ขาว เต้าหู้'
      ];
      break;

    case 'muscle_build':
      calorieAdjustment = +250; // Lean muscle surplus
      proteinPerKg = 1.8;
      carbRatio = 0.50;
      fatRatio = 0.25;
      planTitle = '💪 สร้างกล้ามเนื้อ & เพิ่มความแข็งแรง (Hypertrophy & Lean Bulk)';
      explanation = `พลังงานส่วนเกินเล็กน้อย (+250 kcal) พร้อมโปรตีน ${proteinPerKg}g/kg (${Math.round(safeWeight * proteinPerKg)}g) จะช่วยเสริมสร้างใยกล้ามเนื้อใหม่โดยไม่สะสมไขมันส่วนเกิน`;
      tips = [
        'ทานคาร์โบไฮเดรตให้เพียงพอก่อนฝึก เพื่อเติมไกลโคเจนให้กล้ามเนื้อมีแรงยก',
        'นอนหลับให้สนิท 7-8 ชั่วโมง เนื่องจากฮอร์โมนสร้างกล้ามเนื้อหลั่งสูงสุดช่วงหลับสนิท',
        'เสริมโปรตีนคุณภาพสูง หรือเวย์โปรตีน/โปรตีนพืชหากทานอาหารหลักไม่ถึง'
      ];
      break;

    case 'fat_loss':
      calorieAdjustment = -400; // Standard deficit
      proteinPerKg = 1.6;
      carbRatio = 0.40;
      fatRatio = 0.30;
      planTitle = '⚡ ลดไขมันมาตรฐานอย่างยั่งยืน (Steady Fat Loss)';
      explanation = `ลดพลังงานลง 400 kcal/วัน ช่วยลดไขมันได้เฉลี่ย ~0.35-0.4 kg/สัปดาห์ พร้อมคงโปรตีนสูง ${proteinPerKg}g/kg ป้องกันกล้ามเนื้อหายและช่วยให้อิ่มนาน`;
      tips = [
        'เน้นอาหารที่มีกากใยสูง (Fiber) เช่น ผักใบเขียว บล็อกโคลี่ เพื่อช่วยให้อิ่มท้อง',
        'หลีกเลี่ยงเครื่องดื่มที่มีน้ำตาลสูงหรือของทอดมันเยิ้ม',
        'หากรู้สึกหิวระหว่างมื้อ แนะนำของว่างโปรตีนสูง เช่น ไข่ต้ม กรีกโยเกิร์ต'
      ];
      break;

    case 'fat_loss_fast':
      calorieAdjustment = -500; // Aggressive safe deficit
      proteinPerKg = 1.8; // High protein to protect muscle in deficit
      carbRatio = 0.35;
      fatRatio = 0.30;
      planTitle = '🔥 ลดไขมันแบบเร่งด่วนแต่ปลอดภัย (Accelerated Fat Loss)';
      explanation = `พลังงาน Deficit 500 kcal/วัน ลดได้ประมาณ ~0.5 kg/สัปดาห์ โดยอัดโปรตีน ${proteinPerKg}g/kg สูงเป็นพิเศษเพื่อเซฟมวลกล้ามเนื้อไม่ให้ลดลงตามน้ำหนัก`;
      tips = [
        'ห้ามทานต่ำกว่าค่า BMR (${bmr} kcal) เพื่อป้องกันการเผาผลาญชะลอตัว',
        'ดื่มน้ำมากๆ 2.5-3 ลิตรต่อวัน ช่วยการเผาผลาญและลดอาการบวมน้ำ',
        'พักผ่อนให้เพียงพอเพื่อคุมระดับฮอร์โมนคอร์ติซอลและฮอร์โมนความหิว (Ghrelin)'
      ];
      break;

    case 'keto':
      calorieAdjustment = -300;
      proteinPerKg = 1.5;
      carbRatio = 0.10; // Low carb
      fatRatio = 0.65; // High fat
      planTitle = '🥑 โลว์คาร์บ / คีโตเจนิค (Low Carb & Healthy Fats)';
      explanation = `จำกัดคาร์โบไฮเดรตให้อยู่ในระดับต่ำ เพื่อให้ร่างกายสลับมาใช้ไขมันเป็นพลังงานหลัก เน้นไขมันดีและโปรตีนพอเหมาะ`;
      tips = [
        'เน้นไขมันไม่อิ่มตัวเชิงเดี่ยว เช่น อะโวคาโด น้ำมันมะกอก ถั่วเปลือกแข็ง แซลมอน',
        'ระวังภาวะขาดเกลือแร่ (Keto flu) ควรทานผักใบเขียวและเติมเกลือชมพูพอเหมาะ',
        'ตรวจเช็กระดับพลังงานและประสิทธิภาพการออกกำลังกายสม่ำเสมอ'
      ];
      break;

    case 'custom':
    default:
      calorieAdjustment = 0;
      proteinPerKg = 1.2;
      carbRatio = 0.50;
      fatRatio = 0.25;
      planTitle = '🎯 แผนโภชนาการเฉพาะบุคคล (Custom Nutrition Plan)';
      explanation = `คำนวณสารอาหารตามสัดส่วนที่สมดุลกับไลฟ์สไตล์และระดับกิจกรรมของคุณ`;
      tips = [
        'สามารถปรับเปลี่ยนจำนวนกรัมของคาร์บ โปรตีน ไขมัน ได้อิสระตามความพึงพอใจ',
        'ติดตามผลทุก 1-2 สัปดาห์และปรับเป้าหมายให้เข้ากับการเปลี่ยนแปลงของร่างกาย'
      ];
      break;
  }

  // Calculate Daily Calories (Guaranteed not to drop below BMR unless extreme)
  const targetCalories = Math.max(Math.round(bmr * 0.95), tdee + calorieAdjustment);
  
  // Calculate Protein in grams based on body weight target
  let proteinGrams = Math.round(safeWeight * proteinPerKg);
  let proteinCalories = proteinGrams * 4;

  // If protein calories exceed 45% of total, adjust to fit total calories nicely
  if (proteinCalories > targetCalories * 0.45) {
    proteinCalories = Math.round(targetCalories * 0.35);
    proteinGrams = Math.round(proteinCalories / 4);
    proteinPerKg = Math.round((proteinGrams / safeWeight) * 10) / 10;
  }

  const remainingCalories = Math.max(200, targetCalories - proteinCalories);
  
  let fatCalories: number;
  let carbCalories: number;

  if (goalType === 'keto') {
    carbCalories = Math.round(targetCalories * 0.10);
    fatCalories = Math.max(100, targetCalories - proteinCalories - carbCalories);
  } else {
    // Distribute remaining proportionally
    const carbFatSum = carbRatio + fatRatio;
    carbCalories = Math.round(remainingCalories * (carbRatio / carbFatSum));
    fatCalories = Math.max(100, remainingCalories - carbCalories);
  }

  const carbsGrams = Math.round(carbCalories / 4);
  const fatGrams = Math.round(fatCalories / 9);

  const proteinPct = Math.round((proteinCalories / targetCalories) * 100);
  const carbsPct = Math.round((carbCalories / targetCalories) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  // Water requirement: 35ml per kg of bodyweight
  const waterMl = Math.round(safeWeight * 35);
  const sugarGrams = Math.min(30, Math.max(15, Math.round(targetCalories * 0.05 / 4))); // 5% max sugar
  const sodiumMg = 2000;

  return {
    bmr,
    tdee,
    dailyCalories: targetCalories,
    calorieAdjustment,
    proteinGrams,
    proteinPerKg: Math.round(proteinPerKg * 10) / 10,
    proteinPct,
    carbsGrams,
    carbsPct,
    fatGrams,
    fatPct,
    sugarGrams,
    sodiumMg,
    waterMl,
    planTitle,
    explanation,
    keyTips: tips
  };
}

/**
 * เรียก API ให้ Gemini AI ช่วยวิเคราะห์อย่างละเอียด (พร้อม Fallback ไปสูตรคำนวณอัตโนมัติ)
 */
export async function calculateAINutritionGoals(params: NutritionGoalParams): Promise<CalculatedNutritionPlan> {
  const localFallback = calculateLocalSportsNutrition(params);

  try {
    const response = await fetch('/api/ai-calculate-macros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.warn('AI Macro API responded with non-200, using sports nutrition fallback');
      return localFallback;
    }

    const data = await response.json();
    const cals = data?.dailyCalories || data?.targetCalories;
    if (data && cals && data.proteinGrams) {
      return {
        ...localFallback,
        ...data,
        dailyCalories: cals,
        keyTips: Array.isArray(data.keyTips) && data.keyTips.length > 0 ? data.keyTips : localFallback.keyTips,
      };
    }
  } catch (err) {
    console.warn('Could not contact /api/ai-calculate-macros, using client-side sports science calculator:', err);
  }

  return localFallback;
}

/**
 * ปัดเศษค่าสารอาหารให้มีทศนิยมไม่เกิน 1 ตำแหน่ง (e.g. 15.467 -> 15.5, 20.0 -> 20)
 */
export function roundNutrient(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.round(num * 10) / 10;
}

/**
 * จัดรูปแบบตัวเลขสารอาหารสำหรับแสดงผล โดยมีทศนิยมไม่เกิน 1 ตำแหน่งเสมอ
 * เช่น 25 -> "25", 25.4 -> "25.4", 25.467 -> "25.5"
 */
export function formatNutrientValue(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  const rounded = Math.round(num * 10) / 10;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}
