import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Target, 
  Calendar, 
  Sparkles, 
  Activity,
  CheckCircle2,
  Info,
  LineChart as LineChartIcon,
  Download,
  Copy,
  FileSpreadsheet
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { WeightRecord } from '../../types/extendedFeatures';
import { formatDateDMY, formatDateDM, formatFullThaiDate } from '../../utils/dateUtils';

const WEIGHT_STORAGE_KEY = 'kalguru_weight_records_v1';

interface BodyMeasurementTrackerProps {
  currentWeight: number;
  targetWeight?: number;
  heightCm: number;
  onUpdateWeight: (newWeight: number) => void;
  onToast: (msg: string) => void;
}

export const BodyMeasurementTracker: React.FC<BodyMeasurementTrackerProps> = ({
  currentWeight,
  targetWeight = 55,
  heightCm = 165,
  onUpdateWeight,
  onToast
}) => {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [inputWeight, setInputWeight] = useState<string>(currentWeight ? String(currentWeight) : '60');
  const [inputBodyFat, setInputBodyFat] = useState<string>('');
  const [inputWaist, setInputWaist] = useState<string>('');
  const [inputHip, setInputHip] = useState<string>('');
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WEIGHT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecords(parsed);
      } else if (currentWeight) {
        // Initialize with default
        const initial: WeightRecord = {
          id: `w-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now(),
          weightKg: currentWeight
        };
        setRecords([initial]);
        localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify([initial]));
      }
    } catch (e) {
      console.error('Failed to load weight records:', e);
    }
  }, [currentWeight]);

  const saveRecords = (newRecords: WeightRecord[]) => {
    // Sort chronologically
    const sorted = [...newRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setRecords(sorted);
    localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(sorted));
    if (sorted.length > 0) {
      const latest = sorted[sorted.length - 1];
      onUpdateWeight(latest.weightKg);
    }
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(inputWeight);
    if (!w || isNaN(w) || w < 20 || w > 300) {
      onToast('⚠️ โปรดระบุน้ำหนักให้ถูกต้อง (20-300 kg)');
      return;
    }

    const newRecord: WeightRecord = {
      id: `w-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      date: inputDate,
      timestamp: new Date(inputDate).getTime(),
      weightKg: w,
      bodyFatPercent: inputBodyFat ? parseFloat(inputBodyFat) : undefined,
      waistInches: inputWaist ? parseFloat(inputWaist) : undefined,
      hipInches: inputHip ? parseFloat(inputHip) : undefined
    };

    // Filter out existing record with same date or append
    const filtered = records.filter(r => r.date !== inputDate);
    const updated = [...filtered, newRecord];
    saveRecords(updated);
    setShowAddForm(false);
    onToast(`⚖️ บันทึกน้ำหนัก ${w} kg สำหรับวันที่ ${formatDateDMY(inputDate)} (${formatDateDM(inputDate)}) เรียบร้อย!`);
  };

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    saveRecords(updated);
    onToast('🗑️ ลบประวัติน้ำหนักแล้ว');
  };

  // BMI Calculation
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Number((currentWeight / (heightM * heightM)).toFixed(1)) : 22;
  
  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'น้ำหนักน้อย / ผอม', color: 'text-amber-600 bg-amber-50' };
    if (val < 23.0) return { label: 'สมส่วน / ปกติ (เกณฑ์เอเชีย)', color: 'text-emerald-600 bg-emerald-50' };
    if (val < 25.0) return { label: 'ท้วม / น้ำหนักเกินเล็กน้อย', color: 'text-amber-600 bg-amber-50' };
    if (val < 30.0) return { label: 'อ้วนระดับ 1', color: 'text-orange-600 bg-orange-50' };
    return { label: 'อ้วนระดับ 2 / อันตราย', color: 'text-rose-600 bg-rose-50' };
  };

  const bmiCat = getBmiCategory(bmi);
  const minNormalWeight = (18.5 * heightM * heightM).toFixed(1);
  const maxNormalWeight = (22.9 * heightM * heightM).toFixed(1);

  // Delta calculation
  const startWeight = records.length > 0 ? records[0].weightKg : currentWeight;
  const weightDiff = Number((currentWeight - startWeight).toFixed(1));
  const remainingToGoal = targetWeight ? Number((currentWeight - targetWeight).toFixed(1)) : 0;

  // Chart data format with Day/Month (DD/MM)
  const chartData = records.map(r => ({
    date: formatDateDM(r.date),
    weight: r.weightKg,
    target: targetWeight
  }));

  const handleExportWeightCsv = () => {
    try {
      if (records.length === 0) {
        onToast('⚠️ ไม่พบข้อมูลน้ำหนักสำหรับส่งออก');
        return;
      }
      const lines = [
        `=== GOOKAL WEIGHT & BODY METRICS ===`,
        `วันที่ส่งออก,${formatDateDMY(new Date())}`,
        `ส่วนสูง,${heightCm} cm,เป้าหมายน้ำหนัก,${targetWeight || '-'} kg`,
        ``,
        `ลำดับ,วันที่ (วัน/เดือน/ปี),น้ำหนัก (kg),BMI,รอบเอว (นิ้ว),รอบสะโพก (นิ้ว),% ไขมัน (Body Fat)`
      ];

      records.forEach((r, idx) => {
        const rBmi = heightM > 0 ? (r.weightKg / (heightM * heightM)).toFixed(1) : '-';
        lines.push([
          idx + 1,
          `"${formatDateDMY(r.date)}"`,
          r.weightKg,
          rBmi,
          r.waistInches ?? '-',
          r.hipInches ?? '-',
          r.bodyFatPercent ? `${r.bodyFatPercent}%` : '-'
        ].join(','));
      });

      const csvContent = '\uFEFF' + lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gookal_weight_history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onToast('📊 ส่งออกประวัติน้ำหนักเป็นตาราง CSV (Excel) สำเร็จ!');
    } catch (e) {
      console.error(e);
      onToast('⚠️ เกิดข้อผิดพลาดในการส่งออก');
    }
  };

  const handleCopyWeightHistory = async () => {
    try {
      if (records.length === 0) return;
      const text = `⚖️ ประวัติการบันทึกน้ำหนัก GooKal\n` +
        `👤 ส่วนสูง: ${heightCm} ซม. | น้ำหนักเป้าหมาย: ${targetWeight} กก.\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        records.map((r, idx) => `${idx + 1}. วันที่ ${formatDateDMY(r.date)}: ${r.weightKg} kg ${r.bodyFatPercent ? `(ไขมัน ${r.bodyFatPercent}%)` : ''}`).join('\n') +
        `\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📉 การเปลี่ยนแปลงรวม: ${weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg`;

      await navigator.clipboard.writeText(text);
      onToast('📋 คัดลอกประวัติน้ำหนักไปที่คลิปบอร์ดแล้ว!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Scale size={22} />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-lg tracking-tight">บันทึกน้ำหนักและสัดส่วนร่างกาย</h3>
            <p className="text-xs text-neutral-500 font-medium">ติดตามแนวโน้มความเปลี่ยนแปลงและเป้าหมาย BMI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleExportWeightCsv}
              title="ส่งออกประวัติน้ำหนักเป็น Excel/CSV"
              className="p-2 rounded-2xl bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-600 border border-neutral-200 transition-all cursor-pointer shadow-2xs"
            >
              <Download size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus size={15} />
            <span>บันทึกน้ำหนัก</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">น้ำหนักปัจจุบัน</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-neutral-900">{currentWeight}</span>
            <span className="text-xs text-neutral-500 font-bold">kg</span>
          </div>
          <span className="text-[10px] text-neutral-400 block mt-0.5">ส่วนสูง {heightCm} ซม.</span>
        </div>

        <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">เป้าหมาย</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-indigo-600">{targetWeight || '-'}</span>
            <span className="text-xs text-neutral-500 font-bold">kg</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            {remainingToGoal > 0 ? `ลดอีก ${remainingToGoal} kg` : remainingToGoal < 0 ? `เพิ่มอีก ${Math.abs(remainingToGoal)} kg` : 'ถึงเป้าแล้ว! 🎉'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">ดัชนีมวลกาย (BMI)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-neutral-900">{bmi}</span>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${bmiCat.color}`}>
            {bmiCat.label}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">เปลี่ยนแปลงรวม</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-black ${weightDiff < 0 ? 'text-emerald-600' : weightDiff > 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
              {weightDiff > 0 ? `+${weightDiff}` : weightDiff}
            </span>
            <span className="text-xs text-neutral-500 font-bold">kg</span>
          </div>
          <span className="text-[10px] text-neutral-400 block mt-0.5">จากเริ่มแรก {startWeight} kg</span>
        </div>
      </div>

      {/* Add Record Form */}
      {showAddForm && (
        <form onSubmit={handleAddRecord} className="p-5 rounded-3xl bg-indigo-50/60 border border-indigo-100 space-y-4 animate-in fade-in duration-200">
          <h4 className="font-bold text-xs text-indigo-950">บันทึกข้อมูลน้ำหนักและสัดส่วนใหม่</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1 flex items-center justify-between">
                <span>วันที่</span>
                <span className="text-[10px] text-indigo-600 font-bold">{formatDateDMY(inputDate)}</span>
              </label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 outline-none cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">น้ำหนัก (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 outline-none"
                placeholder="เช่น 65.5"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">รอบเอว (นิ้ว)</label>
              <input
                type="number"
                step="0.5"
                value={inputWaist}
                onChange={(e) => setInputWaist(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 outline-none"
                placeholder="เช่น 29.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">% ไขมัน (Body Fat)</label>
              <input
                type="number"
                step="0.1"
                value={inputBodyFat}
                onChange={(e) => setInputBodyFat(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 outline-none"
                placeholder="เช่น 22.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      )}

      {/* Visual Weight Trend Line Chart */}
      {chartData.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <LineChartIcon size={14} className="text-indigo-500" />
              <span>กราฟแนวโน้มน้ำหนัก (Weight Trajectory)</span>
            </h4>
            <span className="text-[11px] text-neutral-400">เป้าหมาย: {targetWeight} kg</span>
          </div>

          <div className="h-56 w-full bg-neutral-50/70 rounded-3xl p-4 border border-neutral-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`${value} kg`, 'น้ำหนัก']}
                />
                {targetWeight && (
                  <ReferenceLine y={targetWeight} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'เป้าหมาย', fill: '#10B981', fontSize: 10 }} />
                )}
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#6366F1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#4F46E5' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ideal Weight Guidelines Banner */}
      <div className="p-4 rounded-3xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3 text-xs text-emerald-950">
        <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">เกณฑ์น้ำหนักสุขภาพดีตามส่วนสูงของคุณ ({heightCm} ซม.)</p>
          <p className="text-[11px] text-emerald-900/80 leading-relaxed">
            ช่วงน้ำหนักสมส่วนตามเกณฑ์เอเชีย (BMI 18.5 - 22.9) คือ <strong>{minNormalWeight} - {maxNormalWeight} kg</strong> การลดน้ำหนักที่ยั่งยืนควรเฉลี่ย 0.5 - 1 kg ต่อสัปดาห์ เพื่อรักษามวลกล้ามเนื้อ
          </p>
        </div>
      </div>
    </div>
  );
};
