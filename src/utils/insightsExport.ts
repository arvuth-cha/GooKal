// Utilities for exporting all Insights data (CSV, JSON, and Text Report)
import { formatDateDMY, formatFullThaiDate } from './dateUtils';

export interface ExportInsightsParams {
  history: any[];
  userProfile: any;
  bmr: number;
  tdee: number;
  dailyGoal: number;
  carbsGoal: number;
  proteinGoal: number;
  fatGoal: number;
  sugarGoal: number;
  sodiumGoal: number;
  weeklyData: any[];
  monthlyData: any[];
  chartTimeframe: 'weekly' | 'monthly';
  macroDistributionData: {
    name: string;
    label: string;
    value: number;
    percent: number;
    color: string;
    icon: string;
  }[];
  totalMacroCals: number;
  filterSection?: 'all' | 'calories' | 'macros' | 'protein';
}

/**
 * Generates formatted CSV string with UTF-8 BOM (\uFEFF) so Excel/Numbers open Thai characters cleanly.
 */
export function generateInsightsCSV(params: ExportInsightsParams): string {
  const {
    history,
    userProfile,
    bmr,
    tdee,
    dailyGoal,
    carbsGoal,
    proteinGoal,
    fatGoal,
    sugarGoal,
    sodiumGoal,
    weeklyData,
    monthlyData,
    macroDistributionData,
    totalMacroCals,
    filterSection = 'all',
  } = params;

  const now = new Date();
  const dateFormatted = `${formatFullThaiDate(now)} (${formatDateDMY(now)}) เวลา ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

  const lines: string[] = [];

  // Helper to escape CSV field
  const esc = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // Byte Order Mark for Excel UTF-8
  lines.push('=== รายงานสรุปข้อมูลเชิงลึก GooKal (Insights Analytics Report) ===');
  lines.push(`วันเวลาที่ส่งออกข้อมูล,${esc(dateFormatted)}`);
  lines.push(`เพศ,${esc(userProfile.gender === 'male' ? 'ชาย' : 'หญิง')},อายุ,${esc(userProfile.age + ' ปี')},น้ำหนัก,${esc(userProfile.weight + ' กก.')},ส่วนสูง,${esc(userProfile.height + ' ซม.')}`);
  lines.push(`BMR (อัตราเผาผลาญพื้นฐาน),${esc(bmr + ' kcal')},TDEE (พลังงานที่ใช้ทั้งหมด),${esc(tdee + ' kcal')},เป้าหมายแคลอรีต่อวัน,${esc(dailyGoal + ' kcal')}`);
  lines.push(`เป้าหมายสารอาหาร: คาร์บ,${esc(carbsGoal + ' g')},โปรตีน,${esc(proteinGoal + ' g')},ไขมัน,${esc(fatGoal + ' g')},น้ำตาล,${esc(sugarGoal + ' g')},โซเดียม,${esc(sodiumGoal + ' mg')}`);
  lines.push('');

  // 1. Weekly Insights (7 days)
  if (filterSection === 'all' || filterSection === 'calories' || filterSection === 'protein') {
    lines.push('--- ข้อมูลเชิงลึกย้อนหลัง 7 วัน (Weekly Trend Breakdown) ---');
    lines.push('วัน,วันที่,แคลอรีที่ได้รับ (kcal),เป้าหมาย (kcal),ผลต่าง (kcal),คาร์โบไฮเดรต (g),คาร์โบไฮเดรต (kcal),โปรตีน (g),โปรตีน (kcal),ไขมัน (g),ไขมัน (kcal),สถานะแคลอรี');
    
    let sumCalories = 0;
    let sumProteinGrams = 0;
    let sumCarbsGrams = 0;
    let sumFatGrams = 0;
    let activeDays = 0;

    weeklyData.forEach((d) => {
      const fullDate = d.fullDate ? formatDateDMY(d.fullDate) : d.name;
      const calDiff = d.calories - dailyGoal;
      const status = d.calories === 0 ? 'ไม่มีบันทึก' : d.calories < bmr ? 'ต่ำกว่า BMR' : d.calories <= tdee ? 'เหมาะสม (BMR-TDEE)' : 'เกิน TDEE';
      
      const carbsG = Math.round(d.carbsCals / 4);
      const proteinG = d.proteinGrams || Math.round(d.proteinCals / 4);
      const fatG = Math.round(d.fatCals / 9);

      if (d.calories > 0) {
        sumCalories += d.calories;
        sumProteinGrams += proteinG;
        sumCarbsGrams += carbsG;
        sumFatGrams += fatG;
        activeDays++;
      }

      lines.push([
        esc(d.name),
        esc(fullDate),
        esc(d.calories),
        esc(dailyGoal),
        esc((calDiff > 0 ? '+' : '') + calDiff),
        esc(carbsG),
        esc(d.carbsCals),
        esc(proteinG),
        esc(d.proteinCals),
        esc(fatG),
        esc(d.fatCals),
        esc(status)
      ].join(','));
    });

    const divisor = activeDays || 1;
    const avgCal = Math.round(sumCalories / divisor);
    const avgProt = Math.round(sumProteinGrams / divisor);
    const avgCarb = Math.round(sumCarbsGrams / divisor);
    const avgFat = Math.round(sumFatGrams / divisor);

    lines.push([
      esc('เฉลี่ยต่อวันที่มีบันทึก'),
      esc(`(${activeDays} วัน)`),
      esc(avgCal),
      esc(dailyGoal),
      esc((avgCal - dailyGoal > 0 ? '+' : '') + (avgCal - dailyGoal)),
      esc(avgCarb),
      esc(avgCarb * 4),
      esc(avgProt),
      esc(avgProt * 4),
      esc(avgFat),
      esc(avgFat * 9),
      esc(avgCal < bmr ? 'เฉลี่ยต่ำกว่า BMR' : avgCal <= tdee ? 'เฉลี่ยเหมาะสม' : 'เฉลี่ยเกินเป้าหมาย')
    ].join(','));
    lines.push('');
  }

  // 2. Monthly Insights (4 weeks)
  if (filterSection === 'all' || filterSection === 'calories' || filterSection === 'protein') {
    lines.push('--- ข้อมูลเชิงลึกย้อนหลัง 4 สัปดาห์ (Monthly Trend Breakdown) ---');
    lines.push('ช่วงเวลา,แคลอรีเฉลี่ยต่อวัน (kcal),คาร์โบไฮเดรตเฉลี่ย (kcal),โปรตีนเฉลี่ย (kcal),ไขมันเฉลี่ย (kcal),โปรตีนเฉลี่ย (g)');
    
    monthlyData.forEach((m) => {
      lines.push([
        esc(m.name),
        esc(m.calories),
        esc(m.carbsCals),
        esc(m.proteinCals),
        esc(m.fatCals),
        esc(m.proteinGrams)
      ].join(','));
    });
    lines.push('');
  }

  // 3. Macro Calorie Distribution
  if (filterSection === 'all' || filterSection === 'macros') {
    lines.push('--- สัดส่วนพลังงานจากสารอาหารหลัก (Macronutrient Distribution) ---');
    lines.push('สารอาหาร,สัญลักษณ์,พลังงานที่ได้รับ (kcal),สัดส่วนพลังงาน (%),คำแนะนำสัดส่วนทั่วไป');
    
    const standardRecs: Record<string, string> = {
      'คาร์โบไฮเดรต': '45-65%',
      'โปรตีน': '20-35%',
      'ไขมัน': '20-35%'
    };

    macroDistributionData.forEach((macro) => {
      lines.push([
        esc(macro.name),
        esc(macro.icon),
        esc(macro.value),
        esc(`${macro.percent}%`),
        esc(standardRecs[macro.name] || '-')
      ].join(','));
    });
    lines.push(`พลังงานรวมจากสารอาหารทั้งหมด,${esc(totalMacroCals + ' kcal')},100%`);
    lines.push('');
  }

  // 4. All Logged Food Entries
  if (filterSection === 'all') {
    lines.push('--- รายการอาหารทั้งหมดที่บันทึก (Detailed Food Records) ---');
    lines.push('ลำดับ,วันที่,เวลา,มื้ออาหาร,ชื่ออาหาร,แคลอรี (kcal),คาร์โบไฮเดรต (g),โปรตีน (g),ไขมัน (g),น้ำตาล (g),โซเดียม (mg),คำอธิบาย');

    const mealNameMap: Record<string, string> = {
      breakfast: 'มื้อเช้า',
      lunch: 'มื้อกลางวัน',
      dinner: 'มื้อเย็น'
    };

    history.forEach((item, index) => {
      const d = item.date ? new Date(item.date) : new Date();
      const dateStr = formatDateDMY(d);
      const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const meal = mealNameMap[item.mealType] || item.mealType || 'ทั่วไป';

      lines.push([
        esc(index + 1),
        esc(dateStr),
        esc(timeStr),
        esc(meal),
        esc(item.foodName),
        esc(item.calories),
        esc(item.carbsGrams),
        esc(item.proteinGrams),
        esc(item.fatGrams),
        esc(item.sugarGrams ?? 0),
        esc(item.sodiumMg ?? 0),
        esc(item.explanation || '')
      ].join(','));
    });
  }

  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Generates comprehensive JSON format containing full insights analysis
 */
export function generateInsightsJSON(params: ExportInsightsParams): string {
  const {
    history,
    userProfile,
    bmr,
    tdee,
    dailyGoal,
    carbsGoal,
    proteinGoal,
    fatGoal,
    sugarGoal,
    sodiumGoal,
    weeklyData,
    monthlyData,
    macroDistributionData,
    totalMacroCals,
  } = params;

  const exportPayload = {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      appName: 'GooKal',
      appVersion: '2.0',
      reportType: 'comprehensive_insights_analytics',
      totalMealsRecorded: history.length,
    },
    userHealthProfile: {
      ...userProfile,
      calculatedBmr: bmr,
      calculatedTdee: tdee,
      dailyCalorieGoal: dailyGoal,
      nutritionalGoals: {
        calories: dailyGoal,
        carbsGrams: carbsGoal,
        proteinGrams: proteinGoal,
        fatGrams: fatGoal,
        sugarGrams: sugarGoal,
        sodiumMg: sodiumGoal,
      },
    },
    insightsAnalytics: {
      macroDistribution: {
        totalCalories: totalMacroCals,
        macros: macroDistributionData.map(m => ({
          name: m.name,
          label: m.label,
          calories: m.value,
          percent: m.percent,
        })),
      },
      weeklyTrends: weeklyData.map(d => ({
        dayName: d.name,
        fullDate: d.fullDate ? new Date(d.fullDate).toISOString() : null,
        calories: d.calories,
        carbsCalories: d.carbsCals,
        carbsGrams: Math.round(d.carbsCals / 4),
        proteinCalories: d.proteinCals,
        proteinGrams: d.proteinGrams || Math.round(d.proteinCals / 4),
        fatCalories: d.fatCals,
        fatGrams: Math.round(d.fatCals / 9),
      })),
      monthlyTrends: monthlyData.map(m => ({
        weekName: m.name,
        averageDailyCalories: m.calories,
        carbsCalories: m.carbsCals,
        proteinCalories: m.proteinCals,
        fatCalories: m.fatCals,
        proteinGrams: m.proteinGrams,
      })),
    },
    detailedFoodHistory: history,
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generates an elegant Thai text summary report for copying or sharing
 */
export function generateInsightsTextReport(params: ExportInsightsParams): string {
  const {
    history,
    bmr,
    tdee,
    dailyGoal,
    proteinGoal,
    weeklyData,
    macroDistributionData,
    totalMacroCals,
    chartTimeframe,
  } = params;

  const now = new Date();
  const dateStr = `${formatFullThaiDate(now)} (${formatDateDMY(now)})`;

  const activeWeeklyDays = weeklyData.filter(d => d.calories > 0);
  const avgCal = activeWeeklyDays.length > 0 
    ? Math.round(activeWeeklyDays.reduce((sum, d) => sum + d.calories, 0) / activeWeeklyDays.length)
    : 0;
  
  const avgProt = activeWeeklyDays.length > 0 
    ? Math.round(activeWeeklyDays.reduce((sum, d) => sum + (d.proteinGrams || 0), 0) / activeWeeklyDays.length)
    : 0;

  const carbsItem = macroDistributionData.find(m => m.name === 'คาร์โบไฮเดรต');
  const proteinItem = macroDistributionData.find(m => m.name === 'โปรตีน');
  const fatItem = macroDistributionData.find(m => m.name === 'ไขมัน');

  return `📊 รายงานสรุปข้อมูลเชิงลึกจาก GooKal
📅 วันที่ออกรายงาน: ${dateStr}
━━━━━━━━━━━━━━━━━━━
🎯 เป้าหมาย & สุขภาพ:
• BMR (เผาผลาญพื้นฐาน): ${bmr.toLocaleString()} kcal
• TDEE (พลังงานที่ใช้ทั้งหมด): ${tdee.toLocaleString()} kcal
• เป้าหมายแคลอรีต่อวัน (Target): ${dailyGoal.toLocaleString()} kcal ${dailyGoal < tdee ? `(Deficit -${(tdee - dailyGoal).toLocaleString()} kcal จาก TDEE)` : dailyGoal > tdee ? `(Surplus +${(dailyGoal - tdee).toLocaleString()} kcal จาก TDEE)` : '(เท่ากับ TDEE)'}
• เป้าหมายโปรตีน: ${proteinGoal} g/วัน

📈 ภาพรวมการรับประทาน 7 วันล่าสุด:
• แคลอรีเฉลี่ย: ${avgCal.toLocaleString()} kcal/วัน (${avgCal > dailyGoal ? 'เกินเป้าหมาย' : 'อยู่ในเกณฑ์'})
• โปรตีนเฉลี่ย: ${avgProt} g/วัน (เป้าหมาย ${proteinGoal} g)
• จำนวนมื้อที่มีการบันทึก: ${history.length} รายการ

🥗 สัดส่วนพลังงานจากสารอาหาร (Macro Distribution):
• 🍞 คาร์โบไฮเดรต: ${carbsItem?.percent || 0}% (${(carbsItem?.value || 0).toLocaleString()} kcal)
• 🥩 โปรตีน: ${proteinItem?.percent || 0}% (${(proteinItem?.value || 0).toLocaleString()} kcal)
• 🥑 ไขมัน: ${fatItem?.percent || 0}% (${(fatItem?.value || 0).toLocaleString()} kcal)
• รวมพลังงานสารอาหาร: ${totalMacroCals.toLocaleString()} kcal

━━━━━━━━━━━━━━━━━━━
✨ ส่งออกข้อมูลจาก GooKal โภชนาการอัจฉริยะ`;
}

/**
 * Triggers file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
