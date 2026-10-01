import React from 'react';

export const InsightsSkeleton: React.FC = () => {
  return (
    <div className="p-6 flex flex-col gap-6 animate-pulse" role="status" aria-label="กำลังโหลดข้อมูลเชิงลึก">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-1.5">
          <div className="h-7 w-32 bg-neutral-200 rounded-xl"></div>
          <div className="h-3.5 w-52 bg-neutral-100 rounded-md"></div>
        </div>
        <div className="h-9 w-24 bg-neutral-200 rounded-2xl"></div>
      </div>

      {/* Energy Balance 7-Day Card Skeleton */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100 space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="h-5 w-44 bg-neutral-200 rounded-lg"></div>
            <div className="h-3.5 w-36 bg-neutral-100 rounded-md"></div>
          </div>
          <div className="h-6 w-20 bg-neutral-100 rounded-full"></div>
        </div>

        {/* 3 Metric Pills Skeleton */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 space-y-1.5">
              <div className="h-3 w-12 bg-neutral-200 rounded"></div>
              <div className="h-5 w-16 bg-neutral-300 rounded"></div>
            </div>
          ))}
        </div>

        {/* 7-Day Bar Chart Skeleton */}
        <div className="h-44 w-full bg-neutral-50/70 rounded-2xl p-4 flex items-end justify-between gap-2 border border-neutral-100">
          {[45, 65, 30, 80, 55, 90, 70].map((heightPct, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full max-w-[28px] rounded-t-lg bg-neutral-200 transition-all"
                style={{ height: `${heightPct}%` }}
              ></div>
              <div className="h-2.5 w-4 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Calorie Trend Card Skeleton */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100 space-y-5">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-neutral-200 rounded-lg"></div>
            <div className="h-3.5 w-28 bg-neutral-100 rounded-md"></div>
          </div>
          <div className="h-7 w-16 bg-neutral-100 rounded-xl"></div>
        </div>

        {/* Big Average Calorie Display */}
        <div className="flex items-baseline gap-2">
          <div className="h-10 w-28 bg-neutral-300 rounded-xl"></div>
          <div className="h-4 w-24 bg-neutral-200 rounded-md"></div>
        </div>

        {/* Macro Legend Dots */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-300"></div>
            <div className="h-3 w-8 bg-neutral-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
            <div className="h-3 w-10 bg-neutral-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-300"></div>
            <div className="h-3 w-8 bg-neutral-200 rounded"></div>
          </div>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div className="h-10 w-full bg-neutral-100 rounded-2xl p-1 flex gap-1">
          <div className="flex-1 bg-white rounded-xl shadow-xs"></div>
          <div className="flex-1"></div>
        </div>

        {/* Bar Chart Area Skeleton */}
        <div className="h-48 w-full bg-neutral-50/70 rounded-2xl p-4 flex items-end justify-between gap-2 border border-neutral-100">
          {[60, 40, 75, 50, 85, 65, 70].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full max-w-[24px] rounded-t-lg bg-neutral-200"
                style={{ height: `${h}%` }}
              ></div>
              <div className="h-2.5 w-5 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrient Quality Score Card Skeleton */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-neutral-200 rounded-lg"></div>
            <div className="h-3.5 w-32 bg-neutral-100 rounded-md"></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-neutral-200"></div>
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <div className="h-3 w-20 bg-neutral-200 rounded"></div>
                <div className="h-3 w-10 bg-neutral-200 rounded"></div>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-200 rounded-full" style={{ width: `${30 * i}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
