import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  FileJson, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  Check, 
  Sparkles,
  HardDrive
} from 'lucide-react';
import { formatDateDMY } from '../../utils/dateUtils';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete?: () => void;
  onRestoreHistory?: (history: any[]) => void;
  onRestoreProfile?: (profile: any) => void;
  history?: any[];
  userProfile?: any;
  onToast: (msg: string) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreComplete,
  onRestoreHistory,
  onRestoreProfile,
  history: propHistory,
  userProfile: propUserProfile,
  onToast
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportAllJson = () => {
    try {
      const backupData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        version: '2.5',
        appName: 'GooKal AI Health & Nutrition',
        kalguru_history_v2: (propHistory && propHistory.length > 0) ? propHistory : JSON.parse(localStorage.getItem('kalguru_history_v2') || localStorage.getItem('gookal_history_v2') || '[]'),
        kalguru_profile: (propUserProfile && Object.keys(propUserProfile).length > 0) ? propUserProfile : JSON.parse(localStorage.getItem('kalguru_profile') || localStorage.getItem('gookal_profile') || '{}'),
        kalguru_fasting_session_v1: JSON.parse(localStorage.getItem('kalguru_fasting_session_v1') || localStorage.getItem('gookal_fasting_session_v1') || 'null'),
        kalguru_fasting_history_v1: JSON.parse(localStorage.getItem('kalguru_fasting_history_v1') || localStorage.getItem('gookal_fasting_history_v1') || '[]'),
        kalguru_water_logs_v1: JSON.parse(localStorage.getItem('kalguru_water_logs_v1') || localStorage.getItem('gookal_water_logs_v1') || '[]'),
        kalguru_water_goal_v1: JSON.parse(localStorage.getItem('kalguru_water_goal_v1') || localStorage.getItem('gookal_water_goal_v1') || '{}'),
        kalguru_weight_records_v1: JSON.parse(localStorage.getItem('kalguru_weight_records_v1') || localStorage.getItem('gookal_weight_records_v1') || '[]'),
        kalguru_body_stats_v2: JSON.parse(localStorage.getItem('kalguru_body_stats_v2') || localStorage.getItem('gookal_body_stats_v2') || '{}'),
        kalguru_custom_meals_v1: JSON.parse(localStorage.getItem('kalguru_custom_meals_v1') || localStorage.getItem('gookal_custom_meals_v1') || '[]'),
        kalguru_shopping_list_v1: JSON.parse(localStorage.getItem('kalguru_shopping_list_v1') || localStorage.getItem('gookal_shopping_list_v1') || '[]'),
        kalguru_daily_mood_logs_v1: JSON.parse(localStorage.getItem('kalguru_daily_mood_logs_v1') || localStorage.getItem('gookal_daily_mood_logs_v1') || '{}'),
        kalguru_reminder_settings_v1: JSON.parse(localStorage.getItem('kalguru_reminder_settings_v1') || localStorage.getItem('gookal_reminder_settings_v1') || '{}'),
        kalguru_personal_habits: JSON.parse(localStorage.getItem('kalguru_personal_habits') || localStorage.getItem('gookal_personal_habits') || '{}'),
        kalguru_ai_coach_messages: JSON.parse(localStorage.getItem('kalguru_ai_coach_messages') || localStorage.getItem('gookal_ai_coach_messages') || '[]'),
        kalguru_ai_coach_audits_by_date: JSON.parse(localStorage.getItem('kalguru_ai_coach_audits_by_date') || localStorage.getItem('gookal_ai_coach_audits_by_date') || '{}'),
        kalguru_custom_macro_goals: JSON.parse(localStorage.getItem('kalguru_custom_macro_goals') || localStorage.getItem('gookal_custom_macro_goals') || '{}'),
        kalguru_allergy_preferences: JSON.parse(localStorage.getItem('kalguru_allergy_preferences') || localStorage.getItem('gookal_allergy_preferences') || '[]'),
        kalguru_food_pantry_v1: JSON.parse(localStorage.getItem('kalguru_food_pantry_v1') || localStorage.getItem('gookal_food_pantry_v1') || '[]')
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `gookal_full_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      onToast('💾 ส่งออกไฟล์สำรองข้อมูล (JSON Backup) ครบถ้วนทุกระบบสำเร็จ!');
    } catch (e) {
      console.error('Backup export failed:', e);
      onToast('⚠️ เกิดข้อผิดพลาดในการส่งออกข้อมูลสำรอง');
    }
  };

  const handleExportCsv = () => {
    try {
      const safeHistory = (propHistory && propHistory.length > 0) ? propHistory : JSON.parse(localStorage.getItem('kalguru_history_v2') || localStorage.getItem('gookal_history_v2') || '[]');
      if (safeHistory.length === 0) {
        onToast('⚠️ ไม่พบข้อมูลมื้ออาหารสำหรับส่งออก CSV');
        return;
      }

      const headers = ['ลำดับ', 'ID', 'วันที่', 'เวลา', 'มื้ออาหาร', 'ชื่ออาหาร', 'พลังงาน (kcal)', 'โปรตีน (g)', 'คาร์บ (g)', 'ไขมัน (g)', 'น้ำตาล (g)', 'โซเดียม (mg)', 'คำอธิบาย'];
      const mealTypeMap: Record<string, string> = {
        breakfast: 'มื้อเช้า',
        lunch: 'มื้อกลางวัน',
        dinner: 'มื้อเย็น',
        snack: 'ของว่าง'
      };

      const rows = safeHistory.map((h: any, idx: number) => {
        const d = h.date ? new Date(h.date) : new Date();
        const dateStr = formatDateDMY(d);
        const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const meal = mealTypeMap[h.mealType] || h.mealType || 'ทั่วไป';

        return [
          idx + 1,
          `"${h.id || ''}"`,
          `"${dateStr}"`,
          `"${timeStr}"`,
          `"${meal}"`,
          `"${(h.foodName || '').replace(/"/g, '""')}"`,
          h.calories || 0,
          h.proteinGrams || 0,
          h.carbsGrams || 0,
          h.fatGrams || 0,
          h.sugarGrams || 0,
          h.sodiumMg || 0,
          `"${(h.explanation || '').replace(/"/g, '""')}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gookal_food_diary_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      onToast('📊 ส่งออกบันทึกอาหารเป็นตาราง CSV สำหรับ Excel สำเร็จ!');
    } catch (e) {
      console.error('CSV export failed:', e);
      onToast('⚠️ เกิดข้อผิดพลาดในการส่งออก CSV');
    }
  };

  const handleImportJson = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!data || typeof data !== 'object') {
          throw new Error('โครงสร้างไฟล์ JSON ไม่ถูกต้อง');
        }

        const importedMeals: any[] = Array.isArray(data.kalguru_history_v2) 
          ? data.kalguru_history_v2 
          : (Array.isArray(data.history) ? data.history : (Array.isArray(data) ? data : []));
        const importedProfile = data.kalguru_profile || data.userProfile || null;

        const mealCount = importedMeals.length;
        const waterCount = Array.isArray(data.kalguru_water_logs_v1) ? data.kalguru_water_logs_v1.length : 0;
        const weightCount = Array.isArray(data.kalguru_weight_records_v1) ? data.kalguru_weight_records_v1.length : 0;
        const customMealCount = Array.isArray(data.kalguru_custom_meals_v1) ? data.kalguru_custom_meals_v1.length : 0;

        const confirmMsg = `ตรวจพบข้อมูลสำรอง:\n• มื้ออาหาร: ${mealCount} รายการ\n• ข้อมูลโปรไฟล์: ${importedProfile ? 'มี' : 'ไม่มี'}\n• บันทึกน้ำ: ${waterCount} รายการ\n• ประวัติน้ำหนัก: ${weightCount} รายการ\n• เมนูโปรด: ${customMealCount} รายการ\n\nคุณต้องการนำเข้าข้อมูลนี้เพื่อทับข้อมูลปัจจุบันใช่หรือไม่?`;

        if (window.confirm(confirmMsg)) {
          if (data.kalguru_fasting_session_v1) localStorage.setItem('kalguru_fasting_session_v1', JSON.stringify(data.kalguru_fasting_session_v1));
          if (data.kalguru_fasting_history_v1) localStorage.setItem('kalguru_fasting_history_v1', JSON.stringify(data.kalguru_fasting_history_v1));
          if (data.kalguru_water_logs_v1) localStorage.setItem('kalguru_water_logs_v1', JSON.stringify(data.kalguru_water_logs_v1));
          if (data.kalguru_water_goal_v1) localStorage.setItem('kalguru_water_goal_v1', JSON.stringify(data.kalguru_water_goal_v1));
          if (data.kalguru_weight_records_v1) localStorage.setItem('kalguru_weight_records_v1', JSON.stringify(data.kalguru_weight_records_v1));
          if (data.kalguru_body_stats_v2) localStorage.setItem('kalguru_body_stats_v2', JSON.stringify(data.kalguru_body_stats_v2));
          if (data.kalguru_custom_meals_v1) localStorage.setItem('kalguru_custom_meals_v1', JSON.stringify(data.kalguru_custom_meals_v1));
          if (data.kalguru_shopping_list_v1) localStorage.setItem('kalguru_shopping_list_v1', JSON.stringify(data.kalguru_shopping_list_v1));
          if (data.kalguru_daily_mood_logs_v1) localStorage.setItem('kalguru_daily_mood_logs_v1', JSON.stringify(data.kalguru_daily_mood_logs_v1));
          if (data.kalguru_reminder_settings_v1) localStorage.setItem('kalguru_reminder_settings_v1', JSON.stringify(data.kalguru_reminder_settings_v1));
          if (data.kalguru_personal_habits) localStorage.setItem('kalguru_personal_habits', JSON.stringify(data.kalguru_personal_habits));
          if (data.kalguru_ai_coach_messages) localStorage.setItem('kalguru_ai_coach_messages', JSON.stringify(data.kalguru_ai_coach_messages));
          if (data.kalguru_ai_coach_audits_by_date) localStorage.setItem('kalguru_ai_coach_audits_by_date', JSON.stringify(data.kalguru_ai_coach_audits_by_date));
          if (data.kalguru_custom_macro_goals) localStorage.setItem('kalguru_custom_macro_goals', JSON.stringify(data.kalguru_custom_macro_goals));
          if (data.kalguru_allergy_preferences) {
            localStorage.setItem('kalguru_allergy_preferences', JSON.stringify(data.kalguru_allergy_preferences));
            window.dispatchEvent(new CustomEvent('kalguru_allergens_updated', { detail: data.kalguru_allergy_preferences }));
          }
          if (data.kalguru_food_pantry_v1) {
            localStorage.setItem('kalguru_food_pantry_v1', JSON.stringify(data.kalguru_food_pantry_v1));
            window.dispatchEvent(new CustomEvent('kalguru_inventory_updated', { detail: data.kalguru_food_pantry_v1 }));
          }

          if (onRestoreHistory && importedMeals.length > 0) {
            onRestoreHistory(importedMeals);
          }
          if (onRestoreProfile && importedProfile) {
            onRestoreProfile(importedProfile);
          }
          if (onRestoreComplete) {
            onRestoreComplete();
          }

          onToast(`🎉 กู้คืนข้อมูลสมบูรณ์: มื้ออาหาร ${mealCount} รายการ และบันทึกสุขภาพทั้งหมด!`);
          onClose();
        }
      } catch (err: any) {
        console.error('Import error:', err);
        setImportError(err.message || 'ไฟล์สำรองข้อมูลชำรุดหรือไม่รองรับ');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-b from-neutral-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-900/20">
              <HardDrive size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">สำรองข้อมูล & กู้คืน (Backup & Sync)</h2>
              <p className="text-xs text-neutral-500 font-medium">บันทึกข้อมูลเก็บไว้ หรือย้ายไปใช้งานในอุปกรณ์อื่น</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Export JSON Option */}
          <div className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson size={20} className="text-indigo-600" />
                <h4 className="font-bold text-xs text-neutral-900">สำรองข้อมูลทั้งระบบ (Full JSON Backup)</h4>
              </div>
              <button
                type="button"
                onClick={handleExportAllJson}
                className="px-4 py-2 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>ดาวน์โหลด JSON</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              รวมประวัติการกินทั้งหมด, ค่าสัดส่วนน้ำหนัก, สถิติน้ำดื่ม, ข้อมูล Fasting IF, เมนูโปรด และการแจ้งเตือน
            </p>
          </div>

          {/* Export CSV Option */}
          <div className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-emerald-600" />
                <h4 className="font-bold text-xs text-neutral-900">ส่งออกตารางไดอารี่อาหาร (CSV / Excel)</h4>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>ดาวน์โหลด CSV</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              สำหรับเปิดดูใน Microsoft Excel หรือส่งสรุปโภชนาการให้อาจารย์หมอ หรือเทรนเนอร์ส่วนตัว
            </p>
          </div>

          {/* Import JSON Option */}
          <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <Upload size={20} className="text-indigo-600" />
              <h4 className="font-bold text-xs text-indigo-950">กู้คืนข้อมูลจากไฟล์สำรอง (Restore Backup)</h4>
            </div>
            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              เลือกไฟล์ <code>.json</code> ที่คุณเคยสำรองไว้เพื่อนำข้อมูลกลับมาใช้งานทั้งหมด
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImportJson(e.target.files[0])}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Upload size={16} />
              <span>เลือกไฟล์สำรองข้อมูล JSON เพื่อกู้คืน</span>
            </button>

            {importError && (
              <p className="text-xs text-rose-600 font-bold">{importError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
