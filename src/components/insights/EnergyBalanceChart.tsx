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
  CheckCircle2, 
  HelpCircle,
  ChevronRight,
  Zap
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

export type BalanceTimeframe = '7d' | '14d' | '30d';

export const EnergyBalanceChart: React.FC<EnergyBalanceChartProps> = ({
  history,
  tdee,
  dailyGoal,
  onSelectDate,
}) => {
  const [chartMode, setChartMode] = useState<'combined' | 'daily' | 'accumulate'>('combined');
  const [timeframe, setTimeframe] = useState<BalanceTimeframe>('7d');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const numDays = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
  const timeframeLabel = timeframe === '7d' ? '7 วันที่ผ่านมา' : timeframe === '14d' ? '14 วันที่ผ่านมา' : '1 เดือนที่ผ่านมา';

  // Generate completed days window (excluding today)
  const chartData = useMemo(() => {
    const pastDays = Array.from({ length: numDays }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (numDays - i));
      return d;
    });

    let runningAccumulated = 0;

    return pastDays.map((date, index) => {
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

      const netBalance = intakeCalories - tdee;
      runningAccumulated += netBalance;

      const isDeficit = netBalance < 0;
      const isSurplus = netBalance > 0;
      const isBalanced = netBalance === 0;

      const dayOfWeek = date.toLocaleDateString('th-TH', { weekday: 'short' }).replace('.', '');
      const dayDateFormatted = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      
      // X-axis label based on timeframe
      let name = dayOfWeek;
      if (numDays === 14) {
        name = `${date.getDate()} ${date.toLocaleDateString('th-TH', { month: 'short' })}`;
      } else if (numDays === 30) {
        name = `${date.getDate()}/${date.getMonth() + 1}`;
      }

      return {
        dayIndex: index + 1,
        name,
        dayOfWeek,
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
        barColor: isDeficit ? '#10B981' : isSurplus ? '#F43F5E' : '#6B7280',
      };
    });
  }, [history, tdee, numDays]);

  // Summary Metrics calculations
  const periodAccumulated = chartData.length > 0 ? chartData[chartData.length - 1].accumulated : 0;
  const loggedDays = chartData.filter(d => d.hasLogged);
  const loggedDaysCount = loggedDays.length;
  const avgDailyNet = Math.round(periodAccumulated / (loggedDaysCount || numDays));
  
  // 7,700 kcal ≈ 1 kg of body fat
  const estimatedFatChangeKg = (periodAccumulated / 7700).toFixed(2);
  const isPeriodDeficit = periodAccumulated < 0;
  
  const deficitDaysCount = chartData.filter(d => d.netBalance < 0 && d.hasLogged).length;

  // Chart responsiveness configurations
  const xInterval = numDays === 7 ? 0 : numDays === 14 ? 1 : 4;
  const barMaxSize = numDays === 7 ? 26 : numDays === 14 ? 16 : 8;

  return (
    <div id="energy-balance-insights-card" className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs border border-neutral-100 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-neutral-900 text-base sm:text-lg tracking-tight whitespace-nowrap">
              สมดุลพลังงาน (Deficit / Surplus)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-orange-100 text-orange-700 whitespace-nowrap">
              {timeframeLabel}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
            เปรียบเทียบแคลอรีที่ทานกับ TDEE ({tdee.toLocaleString()} kcal) ย้อนหลังเต็มวัน
          </p>
        </div>

        {/* Action Controls: Timeframe (7 วัน / 14 วัน / 1 เดือน) & Chart Mode */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Timeframe Selector */}
          <div className="flex bg-neutral-100 p-0.5 rounded-xl text-xs font-bold text-neutral-600">
            <button
              type="button"
              onClick={() => setTimeframe('7d')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === '7d' ? 'bg-white text-orange-600 shadow-2xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              7 วัน
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('14d')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === '14d' ? 'bg-white text-orange-600 shadow-2xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              14 วัน
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === '30d' ? 'bg-white text-orange-600 shadow-2xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              1 เดือน
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex bg-neutral-100 p-0.5 rounded-xl text-xs font-bold text-neutral-600">
            <button
              type="button"
              onClick={() => setChartMode('combined')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'combined' ? 'bg-white text-neutral-900 shadow-2xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              กราฟรวม
            </button>
            <button
              type="button"
              onClick={() => setChartMode('daily')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'daily' ? 'bg-white text-neutral-900 shadow-2xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              แท่ง
            </button>
            <button
              type="button"
              onClick={() => setChartMode('accumulate')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'accumulate' ? 'bg-white text-neutral-900 shadow-2xs font-black' : 'hover:text-neutral-900'
              }`}
            >
              สะสม
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="คำอธิบาย Deficit/Surplus"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards — Horizontal Layout (แนวนอน) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Metric 1: Accumulated Net */}
        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
          isPeriodDeficit 
            ? 'bg-emerald-50/70 border-emerald-200/60' 
            : 'bg-rose-50/70 border-rose-200/60'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isPeriodDeficit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {isPeriodDeficit ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            </div>
            <div className="min-w-0">
              <span className={`text-xs font-bold block truncate ${
                isPeriodDeficit ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                {isPeriodDeficit ? 'ขาดดุลสะสม (Deficit)' : 'เกินดุลสะสม (Surplus)'}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium block truncate">
                {timeframeLabel}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className={`text-base font-black ${
                isPeriodDeficit ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {periodAccumulated > 0 ? `+${periodAccumulated.toLocaleString()}` : periodAccumulated.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">kcal</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
              isPeriodDeficit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {isPeriodDeficit ? 'ลดไขมัน' : 'สะสมพลังงาน'}
            </span>
          </div>
        </div>

        {/* Metric 2: Estimated Fat Change */}
        <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Scale size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-800 block truncate">ประมาณการไขมัน</span>
              <span className="text-[10px] text-neutral-400 font-medium block truncate">
                {isPeriodDeficit ? '🔥 เผาผลาญไขมันออก' : 'สะสมเป็นไขมัน'}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className={`text-base font-black ${
                isPeriodDeficit ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {Number(estimatedFatChangeKg) > 0 ? `+${estimatedFatChangeKg}` : estimatedFatChangeKg}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">กก.</span>
            </div>
            <span className="text-[9px] text-neutral-400 font-medium block">
              เทียบ 7,700 kcal/กก.
            </span>
          </div>
        </div>

        {/* Metric 3: Daily Average Balance */}
        <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Flame size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-800 block truncate">เฉลี่ยพลังงาน/วัน</span>
              <span className="text-[10px] text-neutral-400 font-medium block truncate">
                เทียบ TDEE {tdee.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className={`text-base font-black ${
                avgDailyNet < 0 ? 'text-emerald-600' : 'text-neutral-800'
              }`}>
                {avgDailyNet > 0 ? `+${avgDailyNet.toLocaleString()}` : avgDailyNet.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">kcal/วัน</span>
            </div>
            <span className="text-[9px] text-neutral-400 font-medium block">
              {avgDailyNet < 0 ? 'ต่ำกว่า TDEE' : 'มากกว่า TDEE'}
            </span>
          </div>
        </div>

        {/* Metric 4: Deficit Success Rate */}
        <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-800 block truncate">วันที่คุมสำเร็จ</span>
              <span className="text-[10px] text-neutral-400 font-medium block truncate">
                {deficitDaysCount >= Math.round(numDays * 0.7) ? '🎯 ผลลัพธ์ยอดเยี่ยม' : 'พยายามเพิ่มอีกนิด'}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-base font-black text-neutral-900">
                {deficitDaysCount}
              </span>
              <span className="text-xs font-bold text-neutral-400">/ {numDays}</span>
              <span className="text-[10px] font-bold text-neutral-400">วัน</span>
            </div>
            <span className="text-[9px] font-bold text-blue-600 block">
              {Math.round((deficitDaysCount / numDays) * 100)}% ของช่วงเวลา
            </span>
          </div>
        </div>
      </div>

      {/* Legend & Guide */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-neutral-500 px-0.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
            <span className="text-[11px] text-neutral-700 font-bold">Deficit (ลดไขมัน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-500"></div>
            <span className="text-[11px] text-neutral-700 font-bold">Surplus (เกินดุล)</span>
          </div>
          {(chartMode === 'combined' || chartMode === 'accumulate') && (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-1 rounded-full bg-blue-600"></div>
              <span className="text-[11px] text-neutral-700 font-bold">เส้นสะสม</span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-neutral-400">แตะแท่งกราฟเพื่อดูเมนู</span>
      </div>

      {/* Main Chart Area */}
      <div className="h-56 sm:h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'combined' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 8, left: -20, bottom: 2 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0 && onSelectDate) {
                  onSelectDate(data.activePayload[0].payload.fullDate);
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                interval={xInterval}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#4B5563', fontWeight: 'bold' }} 
                dy={6}
              />
              <YAxis 
                yAxisId="left"
                orientation="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#6B7280' }} 
                dx={-4}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#3B82F6', fontWeight: 'bold' }} 
                dx={4}
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
                radius={[4, 4, 4, 4]} 
                maxBarSize={barMaxSize}
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
                strokeWidth={2.5} 
                dot={{ r: numDays > 14 ? 1.5 : 3, fill: '#2563EB', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                activeDot={{ r: 5, fill: '#1D4ED8' }}
              />
            </ComposedChart>
          ) : chartMode === 'daily' ? (
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 8, left: -20, bottom: 2 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0 && onSelectDate) {
                  onSelectDate(data.activePayload[0].payload.fullDate);
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                interval={xInterval}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#4B5563', fontWeight: 'bold' }} 
                dy={6}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#6B7280' }} 
                dx={-4}
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}`}
              />
              <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="3 3" />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }}
                content={<CustomTooltip tdee={tdee} />}
              />
              <Bar 
                dataKey="netBalance" 
                radius={[4, 4, 4, 4]} 
                maxBarSize={barMaxSize * 1.2}
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
              margin={{ top: 12, right: 8, left: -20, bottom: 2 }}
              onClick={(data: any) => {
                if (data && data.activePayload && data.activePayload.length > 0 && onSelectDate) {
                  onSelectDate(data.activePayload[0].payload.fullDate);
                }
              }}
              className="cursor-pointer"
            >
              <defs>
                <linearGradient id="accumulatedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                interval={xInterval}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#4B5563', fontWeight: 'bold' }} 
                dy={6}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#6B7280' }} 
                dx={-4}
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
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#accumulatedGradient)" 
              />
              <Line 
                type="monotone" 
                dataKey="accumulated" 
                stroke="#2563EB" 
                strokeWidth={2.5} 
                dot={{ r: numDays > 14 ? 2 : 4, fill: '#2563EB', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#1D4ED8' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Explanatory Footer Card */}
      <div className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-100 text-xs text-neutral-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2">
          <Zap size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-neutral-800 text-xs">
              {isPeriodDeficit 
                ? `${timeframeLabel} คุณขาดดุลสะสมรวม ${Math.abs(periodAccumulated).toLocaleString()} kcal!` 
                : `${timeframeLabel} มีพลังงานเกินดุลสะสม +${periodAccumulated.toLocaleString()} kcal`}
            </p>
            <p className="text-neutral-500 text-[10px] mt-0.5">
              สูตรมาตรฐาน: พลังงานติดลบสะสมทุกๆ <strong>7,700 kcal</strong> จะช่วยลดไขมันได้ประมาณ <strong>1 กิโลกรัม</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="shrink-0 text-orange-600 hover:text-orange-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
        >
          <span>ดูหลักการ</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Info Modal / Dialog */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 border border-neutral-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Flame size={18} />
                </div>
                <h4 className="text-base font-black text-neutral-900">หลักการ Deficit & Surplus</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                <p className="font-bold text-emerald-800 text-xs flex items-center gap-1.5 mb-1">
                  <span>📉 Calorie Deficit (พลังงานติดลบ)</span>
                </p>
                <p className="text-[11px]">
                  ทานแคลอรี <strong>น้อยกว่า TDEE</strong> ร่างกายจะดึงไขมันสะสมออกมาเผาผลาญ ทำให้น้ำหนักและไขมันลดลง
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
                <p className="font-bold text-rose-800 text-xs flex items-center gap-1.5 mb-1">
                  <span>📈 Calorie Surplus (พลังงานเกินดุล)</span>
                </p>
                <p className="text-[11px]">
                  ทานแคลอรี <strong>มากกว่า TDEE</strong> พลังงานส่วนเกินจะถูกสะสมเป็นกล้ามเนื้อหรือไขมัน
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <p className="font-bold text-blue-800 text-xs flex items-center gap-1.5 mb-1">
                  <span>📊 กราฟสะสม (Accumulated Trend)</span>
                </p>
                <p className="text-[11px]">
                  คำนวณผลรวมสุทธิของ Deficit/Surplus วันต่อวัน ช่วยให้เห็นภาพรวมว่าตลอดช่วงเวลาคุณเผาผลาญไขมันสะสมไปกี่กิโลกรัม
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
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
    <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-neutral-100 text-xs min-w-[190px] space-y-1.5">
      <div className="border-b border-neutral-100 pb-1.5 flex justify-between items-center">
        <span className="font-black text-neutral-900 text-xs">
          วัน{data?.dayOfWeek} ({data.dateLabel})
        </span>
        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
          isDeficit ? 'bg-emerald-100 text-emerald-700' : isSurplus ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-600'
        }`}>
          {isDeficit ? 'Deficit' : isSurplus ? 'Surplus' : 'Balanced'}
        </span>
      </div>

      <div className="space-y-1 text-neutral-600 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-neutral-400">ทานไป:</span>
          <span className="font-bold text-neutral-900">{data.intakeCalories.toLocaleString()} kcal</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-400">TDEE:</span>
          <span className="font-bold text-neutral-700">{tdee.toLocaleString()} kcal</span>
        </div>

        <div className="border-t border-dashed border-neutral-200 pt-1 flex justify-between items-center">
          <span className="font-bold text-neutral-800">ส่วนต่างวัน:</span>
          <span className={`font-black ${isDeficit ? 'text-emerald-600' : isSurplus ? 'text-rose-600' : 'text-neutral-700'}`}>
            {data.netBalance > 0 ? `+${data.netBalance.toLocaleString()}` : data.netBalance.toLocaleString()} kcal
          </span>
        </div>

        <div className="flex justify-between items-center bg-blue-50/70 p-1.5 rounded-lg text-blue-950 font-semibold mt-0.5">
          <span className="text-blue-700 text-[10px]">ยอดสะสมถึงวัน:</span>
          <span className="font-black text-blue-800 text-[11px]">
            {data.accumulated > 0 ? `+${data.accumulated.toLocaleString()}` : data.accumulated.toLocaleString()} kcal
          </span>
        </div>
      </div>
    </div>
  );
};
