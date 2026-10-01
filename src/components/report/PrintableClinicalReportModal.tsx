import React from 'react';
import { 
  Printer, 
  FileText, 
  X, 
  Download, 
  CheckCircle2, 
  Activity, 
  Calendar, 
  User, 
  Sparkles,
  Scale
} from 'lucide-react';
import { formatDateDMY, formatFullThaiDate } from '../../utils/dateUtils';

interface PrintableClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  dailyGoal: number;
  history: any[];
  userProfile: any;
  onToast: (msg: string) => void;
}

export const PrintableClinicalReportModal: React.FC<PrintableClinicalReportModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  dailyGoal,
  history,
  userProfile,
  onToast
}) => {
  if (!isOpen) return null;

  const dateStart = new Date(selectedDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(selectedDate);
  dateEnd.setHours(23, 59, 59, 999);

  const todayMeals = history.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= dateStart && itemDate <= dateEnd;
  });

  const totalCalories = todayMeals.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = todayMeals.reduce((sum, item) => sum + (item.proteinGrams || 0), 0);
  const totalCarbs = todayMeals.reduce((sum, item) => sum + (item.carbsGrams || 0), 0);
  const totalFat = todayMeals.reduce((sum, item) => sum + (item.fatGrams || 0), 0);
  const totalSugar = todayMeals.reduce((sum, item) => sum + (item.sugarGrams || 0), 0);
  const totalSodium = todayMeals.reduce((sum, item) => sum + (item.sodiumMg || 0), 0);

  const userWeight = Number(userProfile.weight) || 65;
  const userHeight = Number(userProfile.height) || 170;
  const userAge = Number(userProfile.age) || 25;
  const calculatedBmr = userProfile.gender === 'male' 
    ? Math.round((10 * userWeight) + (6.25 * userHeight) - (5 * userAge) + 5)
    : Math.round((10 * userWeight) + (6.25 * userHeight) - (5 * userAge) - 161);
  const bmr = userProfile.customBmr ?? (isNaN(calculatedBmr) || calculatedBmr <= 0 ? 1500 : calculatedBmr);
  const actLevel = Number(userProfile.activityLevel) || 1.2;
  const calculatedTdee = Math.round(bmr * actLevel);
  const tdee = userProfile.customTdee ?? (isNaN(calculatedTdee) || calculatedTdee <= 0 ? 2000 : calculatedTdee);

  const diffFromTarget = totalCalories - dailyGoal;
  const dateFormatted = `${formatFullThaiDate(selectedDate, true)} (${formatDateDMY(selectedDate)})`;

  const handlePrint = () => {
    window.print();
    onToast('🖨️ เปิดหน้าต่างพิมพ์เอกสารสรุปเรียบร้อย');
  };

  const generateReportText = () => {
    const lines = [
      `🏥 รายงานบันทึกโภชนาการประจำวัน GooKal Clinical Report`,
      `📅 วันที่: ${dateFormatted}`,
      `👤 ข้อมูลผู้ใช้: น้ำหนัก ${userProfile.weight || 60} กก. | ส่วนสูง ${userProfile.height || 165} ซม. | อายุ ${userProfile.age || 25} ปี`,
      `⚡ BMR: ${bmr} kcal | TDEE: ${tdee} kcal | เป้าหมายพลังงาน: ${dailyGoal} kcal`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📊 สรุปการบริโภควันนี้:`,
      `• แคลอรีรวม: ${totalCalories} / ${dailyGoal} kcal (${diffFromTarget <= 0 ? `คงเหลืออีก ${Math.abs(diffFromTarget)} kcal` : `เกินเป้าหมาย +${diffFromTarget} kcal`})`,
      `• โปรตีน: ${totalProtein}g | คาร์โบไฮเดรต: ${totalCarbs}g | ไขมัน: ${totalFat}g`,
      `• น้ำตาล: ${totalSugar}g | โซเดียม: ${totalSodium}mg`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🍽️ รายการอาหาร (${todayMeals.length} มื้อ):`,
      ...todayMeals.map((m, idx) => `  ${idx + 1}. [${m.mealType}] ${m.foodName} - ${m.calories} kcal (P:${m.proteinGrams || 0}g, C:${m.carbsGrams || 0}g, F:${m.fatGrams || 0}g)`),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💡 การประเมินเบื้องต้น:`,
      `• ${totalProtein >= 70 ? 'ได้รับโปรตีนเพียงพอต่อการรักษามวลกล้ามเนื้อ' : 'โปรตีนยังต่ำกว่าเกณฑ์แนะนำ ควรเสริมโปรตีนเพิ่ม'}`,
      `• ${totalSodium > 2000 ? 'โซเดียมเกิน 2,000mg ต่อวัน ควรเลี่ยงน้ำแกงและซอสปรุงรส' : 'ปริมาณโซเดียมอยู่ในเกณฑ์ปลอดภัย'}`
    ];
    return lines.join('\n');
  };

  const handleCopyText = async () => {
    try {
      const text = generateReportText();
      await navigator.clipboard.writeText(text);
      onToast('📋 คัดลอกรายงานสรุปไปที่คลิปบอร์ดแล้ว (ส่งให้แพทย์หรือเทรนเนอร์ได้ทันที)');
    } catch (e) {
      console.error(e);
      onToast('⚠️ ไม่สามารถคัดลอกได้');
    }
  };

  const handleExportCsv = () => {
    try {
      const dateStr = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : 'today';
      const lines = [
        `=== GOOKAL CLINICAL NUTRITION REPORT ===`,
        `วันที่ (วัน/เดือน/ปี),${formatDateDMY(selectedDate)}`,
        `น้ำหนัก,${userProfile.weight || 60} kg,ส่วนสูง,${userProfile.height || 165} cm,อายุ,${userProfile.age || 25} ปี`,
        `BMR,${bmr} kcal,TDEE,${tdee} kcal,เป้าหมายแคลอรี,${dailyGoal} kcal`,
        `แคลอรีที่บริโภคจริง,${totalCalories} kcal,ผลต่าง,${diffFromTarget > 0 ? '+' : ''}${diffFromTarget} kcal`,
        `โปรตีนรวม,${totalProtein} g,คาร์โบไฮเดรตรวม,${totalCarbs} g,ไขมันรวม,${totalFat} g,น้ำตาลรวม,${totalSugar} g,โซเดียมรวม,${totalSodium} mg`,
        ``,
        `ลำดับ,มื้ออาหาร,เวลา,ชื่ออาหาร,พลังงาน (kcal),โปรตีน (g),คาร์บ (g),ไขมัน (g),น้ำตาล (g),โซเดียม (mg),คำอธิบาย`
      ];

      todayMeals.forEach((m, idx) => {
        const t = new Date(m.date);
        const timeStr = t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        lines.push([
          idx + 1,
          `"${m.mealType || 'ทั่วไป'}"`,
          `"${timeStr}"`,
          `"${(m.foodName || '').replace(/"/g, '""')}"`,
          m.calories || 0,
          m.proteinGrams || 0,
          m.carbsGrams || 0,
          m.fatGrams || 0,
          m.sugarGrams || 0,
          m.sodiumMg || 0,
          `"${(m.explanation || '').replace(/"/g, '""')}"`
        ].join(','));
      });

      const csvContent = '\uFEFF' + lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gookal_clinical_report_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      onToast('📊 ส่งออกรายงานเป็นไฟล์ CSV สำหรับ Excel สำเร็จ!');
    } catch (e) {
      console.error(e);
      onToast('⚠️ เกิดข้อผิดพลาดในการส่งออก CSV');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-neutral-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-900/20">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">รายงานบันทึกโภชนาการประจำวัน (Clinical Report)</h2>
              <p className="text-xs text-neutral-500 font-medium">สำหรับปริ้นท์ พกพา หรือส่งให้แพทย์และเทรนเนอร์</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Document Paper View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/50">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-6 text-neutral-800 print:border-none print:shadow-none">
            {/* Document Header */}
            <div className="border-b pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-neutral-900 tracking-tight">GOOKAL DIETARY & NUTRITION REPORT</h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  วันที่บันทึก: {formatFullThaiDate(selectedDate, true)} ({formatDateDMY(selectedDate)})
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">สถานะแคลอรี่</span>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                  diffFromTarget < 0 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : diffFromTarget === 0 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-rose-100 text-rose-800'
                }`}>
                  {diffFromTarget < 0 
                    ? `คงเหลืออีก ${Math.abs(diffFromTarget)} kcal` 
                    : diffFromTarget === 0 
                      ? 'ทานครบพอดีเป้าหมาย' 
                      : `เกินเป้าหมาย +${diffFromTarget} kcal`}
                </span>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
              <div>
                <span className="text-neutral-400 block text-[10px]">น้ำหนักปัจจุบัน</span>
                <strong className="text-neutral-900 font-bold">{userProfile.weight} kg</strong>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">ส่วนสูง / อายุ</span>
                <strong className="text-neutral-900 font-bold">{userProfile.height} cm / {userProfile.age} ปี</strong>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">TDEE เผาผลาญจริง</span>
                <strong className="text-blue-700 font-bold">{tdee} kcal</strong>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">เป้าหมายพลังงาน</span>
                <strong className="text-amber-600 font-bold">{dailyGoal} kcal</strong>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">บริโภคจริง</span>
                <strong className="text-neutral-900 font-bold">{totalCalories} kcal</strong>
              </div>
            </div>

            {/* Macro Summary Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">สรุปสารอาหารรวมประจำวัน</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block">โปรตีน</span>
                  <strong className="text-neutral-900 font-bold">{totalProtein}g</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block">คาร์บ</span>
                  <strong className="text-neutral-900 font-bold">{totalCarbs}g</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block">ไขมัน</span>
                  <strong className="text-neutral-900 font-bold">{totalFat}g</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block">น้ำตาล</span>
                  <strong className="text-neutral-900 font-bold">{totalSugar}g</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block">โซเดียม</span>
                  <strong className="text-neutral-900 font-bold">{totalSodium}mg</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block">จำนวนมื้อ</span>
                  <strong className="text-neutral-900 font-bold">{todayMeals.length} มื้อ</strong>
                </div>
              </div>
            </div>

            {/* Meals Log Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">รายการอาหารที่รับประทาน</h3>
              {todayMeals.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">ไม่มีบันทึกมื้ออาหารในวันนี้</p>
              ) : (
                <div className="border border-neutral-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-100/70 border-b border-neutral-200 text-[11px] font-bold text-neutral-600">
                      <tr>
                        <th className="p-2.5 pl-3">มื้อ / เวลา</th>
                        <th className="p-2.5">ชื่ออาหาร</th>
                        <th className="p-2.5 text-right">พลังงาน</th>
                        <th className="p-2.5 text-right pr-3">P / C / F</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {(todayMeals || []).map((m, idx) => {
                        const t = new Date(m.date);
                        return (
                          <tr key={idx} className="hover:bg-neutral-50">
                            <td className="p-2.5 pl-3 text-neutral-500 font-medium">
                              <span className="uppercase text-[10px] font-bold block text-neutral-700">{m.mealType}</span>
                              {t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5 font-bold text-neutral-900">
                              {m.foodName}
                              {m.explanation && (
                                <span className="block text-[10px] text-neutral-400 font-normal truncate max-w-xs">{m.explanation}</span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-black text-amber-600">
                              {m.calories} kcal
                            </td>
                            <td className="p-2.5 text-right pr-3 text-neutral-600 text-[11px]">
                              {m.proteinGrams}g / {m.carbsGrams}g / {m.fatGrams}g
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Dietitian Assessment Box */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
              <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>การประเมินเบื้องต้นจากระบบ:</span>
              </h4>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                {totalProtein >= 70 ? '✅ ได้รับโปรตีนเพียงพอต่อการรักษามวลกล้ามเนื้อ' : '⚠️ โปรตีนยังต่ำกว่าเกณฑ์แนะนำ ควรเสริมไข่ต้ม อกไก่ หรือโปรตีนเชค'} • {' '}
                {totalSodium > 2000 ? '⚠️ โซเดียมเกิน 2,000mg ต่อวัน ควรเลี่ยงการซดน้ำแกง' : '✅ ปริมาณโซเดียมอยู่ในเกณฑ์ปลอดภัยต่อไตและความดันโลหิต'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-3 border-t border-neutral-100 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <FileText size={14} className="text-orange-500" />
              <span>คัดลอกรายงานสรุป</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 text-xs font-bold text-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Download size={14} className="text-emerald-600" />
              <span>ส่งออก Excel/CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
