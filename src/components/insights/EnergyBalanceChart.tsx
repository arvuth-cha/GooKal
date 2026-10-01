import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  Line, 
  ComposedChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ResponsiveContainer, 
  Cell,
  Area
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  Flame, 
  Scale, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export interface HistoryItemForBalance {
  id?: string;
  calories: number;
  date: number;
  foodName?: string;
}

interface EnergyBalanceChartProps {
  history: HistoryItemForBalance[];
  tdee: number;
  dailyGoal?: number;
  onSelectDate?: (date: Date) => void;
}

export const EnergyBalanceChart: React.FC<EnergyBalanceChartProps> = ({
  history,
  tdee,
  dailyGoal,
  onSelectDate,
}) => {
  const [chartMode, setChartMode] = useState<'combined' | 'daily' | 'accumulate'>('combined');
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Generate the past 7 completed days window (excluding today)
  const chartData = useMemo(() => {
    // 7 days prior to today: from 7 days ago to yesterday
    const past7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      // i=0 -> 7 days ago, i=6 -> 1 day ago (yesterday)
      d.setDate(d.getDate() - (7 - i));
      return d;
    });

    let runningAccumulated = 0;

    return past7Days.map((date, index) => {
      // Find food logs for this specific day
      const dayHistory = history.filter(item => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === date.getFullYear() &&
          itemDate.getMonth() === date.getMonth() &&
          itemDate.getDate() === date.getDate()
        );
      });

      const intakeCalories = dayHistory.reduce((sum, item) => sum + (item.calories || 0), 0);
      const hasLogged = dayHistory.length > 0;

      // Difference from TDEE:
      // If user logged food: diff = intake - tdee
      // If user did not log food on this day, we still compute intake - tdee, but track hasLogged
      const netBalance = intakeCalories - tdee;
      runningAccumulated += netBalance;

      // Status
      const isDeficit = netBalance < 0;
      const isSurplus = netBalance > 0;
      const isBalanced = netBalance === 0;

      const dayNameShort = date.toLocaleDateString('th-TH', { weekday: 'short' }).replace('.', '');
      const dayDateFormatted = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

      return {
        dayIndex: index + 1,
        name: dayNameShort,
        dateLabel: dayDateFormatted,
        fullDate: date,
        intakeCalories,
        tdee,
        netBalance,
        absNetBalance: Math.abs(netBalance),
        accumulated: runningAccumulated,
        absAccumulated: Math.abs(runningAccumulated),
        isDeficit,
        isSurplus,
        isBalanced,
        hasLogged,
        barColor: isDeficit ? '#10B981' : isSurplus ? '#F43F5E' : '#6B7280', // Green for Deficit (fat burn), Red for Surplus
      };
    });
  }, [history, tdee]);

  // Summary Metrics calculations
  const weeklyAccumulated = chartData.length > 0 ? chartData[chartData.length - 1].accumulated : 0;
  const avgDailyIntake = Math.round(
    chartData.reduce((acc, curr) => acc + curr.intakeCalories, 0) / (chartData.filter(d => d.hasLogged).length || 1)
  );
  const avgDailyNet = Math.round(weeklyAccumulated / 7);
  
  // 7,700 kcal ≈ 1 kg of body fat
  const estimatedFatChangeKg = (weeklyAccumulated / 7700).toFixed(2);
  const isWeeklyDeficit = weeklyAccumulated < 0;
  
  const deficitDaysCount = chartData.filter(d => d.netBalance < 0 && d.hasLogged).length;
  const surplusDaysCount = chartData.filter(d => d.netBalance > 0).length;

  return (
    <div id="energy-balance-insights-card" className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-neutral-900 text-lg tracking-tight flex items-center gap-2">
              <span>สมดุลพลังงาน (Deficit / Surplus)</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700">
              7 วันที่ผ่านมา (ไม่รวมวันนี้)
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            เปรียบเทียบแคลอรีที่ทานกับ TDEE ({tdee.toLocaleString()} kcal) ย้อนหลัง 7 วันเต็ม
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="flex bg-neutral-100 p-1 rounded-2xl text-xs font-bold text-neutral-600">
            <button
              type="button"
              onClick={() => setChartMode('combined')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartMode === 'combined' ? 'bg-white text-neutral-900 shadow-xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              กราฟรวม
            </button>
            <button
              type="button"
              onClick={() => setChartMode('daily')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartMode === 'daily' ? 'bg-white text-neutral-900 shadow-xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              รายวัน (แท่ง)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('accumulate')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartMode === 'accumulate' ? 'bg-white text-neutral-900 shadow-xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              สะสม (เส้น)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="คำอธิบาย Deficit/Surplus"
          >
            <HelpCircle size={17} />
          </button>
        </div>
      </div>

      {/* KPI Cards / Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Metric 1: Accumulated Net */}
        <div className={`p-4 rounded-2xl border ${isWeeklyDeficit ? 'bg-emerald-50/70 border-emerald-100' : 'bg-rose-50/70 border-rose-100'}`}>
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className={isWeeklyDeficit ? 'text-emerald-700' : 'text-rose-700'}>
              {isWeeklyDeficit ? 'ขาดดุลสะสม (Deficit)' : 'เกินดุลสะสม (Surplus)'}
            </span>
            {isWeeklyDeficit ? (
              <TrendingDown size={16} className="text-emerald-600" />
            ) : (
              <TrendingUp size={16} className="text-rose-600" />
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black ${isWeeklyDeficit ? 'text-emerald-700' : 'text-rose-700'}`}>
              {weeklyAccumulated > 0 ? `+${weeklyAccumulated.toLocaleString()}` : weeklyAccumulated.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-neutral-500">kcal</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">7 วันที่ผ่านมา (ไม่รวมวันนี้)</span>
        </div>

        {/* Metric 2: Estimated Fat Change */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 mb-1">
            <span>ประมาณการไขมัน</span>
            <Scale size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black ${isWeeklyDeficit ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(estimatedFatChangeKg) > 0 ? `+${estimatedFatChangeKg}` : estimatedFatChangeKg}
            </span>
            <span className="text-[11px] font-bold text-neutral-500">กก.</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">
            {isWeeklyDeficit ? '🔥 เผาผลาญไขมันออก' : 'สะสมพลังงาน'}
          </span>
        </div>

        {/* Metric 3: Daily Average Balance */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 mb-1">
            <span>เฉลี่ยต่อวัน</span>
            <Flame size={16} className="text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black ${avgDailyNet < 0 ? 'text-emerald-600' : 'text-neutral-800'}`}>
              {avgDailyNet > 0 ? `+${avgDailyNet}` : avgDailyNet}
            </span>
            <span className="text-[11px] font-bold text-neutral-500">kcal/วัน</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">จาก TDEE {tdee} kcal</span>
        </div>

        {/* Metric 4: Deficit Success Rate */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 mb-1">
            <span>วันที่คุมสำเร็จ</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-neutral-900">
              {deficitDaysCount} <span className="text-sm font-bold text-neutral-400">/ 7</span>
            </span>
            <span className="text-[11px] font-bold text-neutral-500">วัน</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">
            {deficitDaysCount >= 5 ? '🎯 ยอดเยี่ยมมาก!' : 'พยายามเพิ่มอีกนิด'}
          </span>
        </div>
      </div>

      {/* Legend & Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-neutral-500 mb-4 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-emerald-500"></div>
            <span className="text-neutral-700 font-bold">Deficit (แคลอรีติดลบ / ลดไขมัน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-rose-500"></div>
            <span className="text-neutral-700 font-bold">Surplus (แคลอรีเกิน TDEE)</span>
          </div>
          {(chartMode === 'combined' || chartMode === 'accumulate') && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-1 rounded-full bg-blue-600"></div>
              <span className="text-neutral-700 font-bold">เส้นสะสม (Accumulated)</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-neutral-400">แตะที่แท่งกราฟเพื่อดูเมนูวันนั้น</span>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'combined' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0 && onSelectDate) {
                  onSelectDate(data.activePayload[0].payload.fullDate);
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 'bold' }} 
                dy={8}
              />
              <YAxis 
                yAxisId="left"
                orientation="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#6B7280' }} 
                dx={-5}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#3B82F6', fontWeight: 'bold' }} 
                dx={5}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <ReferenceLine yAxisId="left" y={0} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="3 3" />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }}
                content={<CustomTooltip tdee={tdee} />}
              />
              {/* Daily Bar */}
              <Bar 
                yAxisId="left"
                dataKey="netBalance" 
                radius={[6, 6, 6, 6]} 
                maxBarSize={28}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.netBalance < 0 ? '#10B981' : entry.netBalance > 0 ? '#F43F5E' : '#9CA3AF'} 
                  />
                ))}
              </Bar>
              {/* Accumulated Trend Line */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="accumulated" 
                stroke="#2563EB" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#1D4ED8' }}
              />
            </ComposedChart>
          ) : chartMode === 'daily' ? (
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0 && onSelectDate) {
                  onSelectDate(data.activePayload[0].payload.fullDate);
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 'bold' }} 
                dy={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#6B7280' }} 
                dx={-5}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="3 3" />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }}
                content={<CustomTooltip tdee={tdee} />}
              />
              <Bar 
                dataKey="netBalance" 
                radius={[6, 6, 6, 6]} 
                maxBarSize={32}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.netBalance < 0 ? '#10B981' : entry.netBalance > 0 ? '#F43F5E' : '#9CA3AF'} 
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0 && onSelectDate) {
                  onSelectDate(data.activePayload[0].payload.fullDate);
                }
              }}
              className="cursor-pointer"
            >
              <defs>
                <linearGradient id="accumulatedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 'bold' }} 
                dy={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#6B7280' }} 
                dx={-5}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="3 3" />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }}
                content={<CustomTooltip tdee={tdee} />}
              />
              <Area 
                type="monotone" 
                dataKey="accumulated" 
                stroke="#2563EB" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#accumulatedGradient)" 
              />
              <Line 
                type="monotone" 
                dataKey="accumulated" 
                stroke="#2563EB" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: '#1D4ED8' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Explanatory Footer Card */}
      <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-neutral-800">
              {isWeeklyDeficit 
                ? `7 วันที่ผ่านมาคุณขาดดุลสะสมรวม ${Math.abs(weeklyAccumulated).toLocaleString()} kcal!` 
                : `7 วันที่ผ่านมามีพลังงานเกินดุลสะสม +${weeklyAccumulated.toLocaleString()} kcal`}
            </p>
            <p className="text-neutral-500 text-[11px] mt-0.5">
              สูตรคำนวณมาตรฐาน: พลังงานติดลบสะสมทุกๆ <strong>7,700 kcal</strong> จะช่วยลดไขมันได้ประมาณ <strong>1 กิโลกรัม</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="shrink-0 text-orange-600 hover:text-orange-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
        >
          <span>ดูคำอธิบายหลักการ</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Info Modal / Dialog */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-neutral-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Flame size={20} />
                </div>
                <h4 className="text-lg font-black text-neutral-900">หลักการ Deficit & Surplus</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                <p className="font-bold text-emerald-800 text-sm flex items-center gap-1.5 mb-1">
                  <span>📉 Calorie Deficit (พลังงานติดลบ)</span>
                </p>
                <p>
                  เกิดขึ้นเมื่อทานแคลอรี <strong>น้อยกว่าค่า TDEE</strong> ร่างกายจำเป็นต้องดึงไขมันและพลังงานสะสมในร่างกายออกมาเผาผลาญ ทำให้น้ำหนักและไขมันลดลง
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-900">
                <p className="font-bold text-rose-800 text-sm flex items-center gap-1.5 mb-1">
                  <span>📈 Calorie Surplus (พลังงานเกินดุล)</span>
                </p>
                <p>
                  เกิดขึ้นเมื่อทานแคลอรี <strong>มากกว่าค่า TDEE</strong> พลังงานส่วนเกินจะถูกนำไปสะสมเป็นกล้ามเนื้อ (หากเวทเทรนนิ่ง) หรือไขมันในร่างกาย
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900">
                <p className="font-bold text-blue-800 text-sm flex items-center gap-1.5 mb-1">
                  <span>📊 กราฟสะสม (Accumulated Trend)</span>
                </p>
                <p>
                  คำนวณผลรวมสุทธิของ Deficit/Surplus วันต่อวันตลอด 7 วัน ช่วยให้เห็นภาพรวมว่าทั้งสัปดาห์คุณกำลังเผาผลาญไขมันสะสมสุทธิไปกี่กิโลกรัม
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Rich Tooltip for Recharts
 */
const CustomTooltip = ({ active, payload, label, tdee }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isDeficit = data.netBalance < 0;
  const isSurplus = data.netBalance > 0;

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-neutral-100 text-xs min-w-[210px] space-y-2">
      <div className="border-b border-neutral-100 pb-2 flex justify-between items-center">
        <span className="font-black text-neutral-900 text-sm">
          วัน{data?.name} ({data.dateLabel})
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          isDeficit ? 'bg-emerald-100 text-emerald-700' : isSurplus ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-600'
        }`}>
          {isDeficit ? 'Deficit' : isSurplus ? 'Surplus' : 'Balanced'}
        </span>
      </div>

      <div className="space-y-1.5 text-neutral-600">
        <div className="flex justify-between items-center">
          <span className="text-neutral-400">ทานไป:</span>
          <span className="font-bold text-neutral-900">{data.intakeCalories.toLocaleString()} kcal</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-400">TDEE ของคุณ:</span>
          <span className="font-bold text-neutral-700">{tdee.toLocaleString()} kcal</span>
        </div>

        <div className="border-t border-dashed border-neutral-200 pt-1.5 flex justify-between items-center">
          <span className="font-bold text-neutral-800">ส่วนต่างรายวัน:</span>
          <span className={`font-black ${isDeficit ? 'text-emerald-600' : isSurplus ? 'text-rose-600' : 'text-neutral-700'}`}>
            {data.netBalance > 0 ? `+${data.netBalance.toLocaleString()}` : data.netBalance.toLocaleString()} kcal
          </span>
        </div>

        <div className="flex justify-between items-center bg-blue-50/70 p-2 rounded-xl text-blue-950 font-semibold mt-1">
          <span className="text-blue-700 text-[11px]">ยอดสะสมถึงวันนี้:</span>
          <span className="font-black text-blue-800">
            {data.accumulated > 0 ? `+${data.accumulated.toLocaleString()}` : data.accumulated.toLocaleString()} kcal
          </span>
        </div>
      </div>

      <p className="text-[10px] text-neutral-400 text-center pt-1 border-t border-neutral-100">
        แตะเพื่อเปิดดูมื้ออาหารของวัน
      </p>
    </div>
  );
};
