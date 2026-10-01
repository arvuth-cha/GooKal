import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 flex flex-col gap-6 animate-pulse" role="status" aria-label="กำลังโหลดข้อมูลแดชบอร์ด">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-neutral-200 rounded-xl"></div>
          <div className="h-4 w-48 bg-neutral-100 rounded-lg"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-neutral-200 rounded-2xl"></div>
          <div className="w-10 h-10 bg-neutral-200 rounded-2xl"></div>
        </div>
      </div>

      {/* Date Switcher Bar Skeleton */}
      <div className="bg-neutral-100/80 rounded-2xl p-2 flex items-center justify-between gap-1 border border-neutral-200/50">
        <div className="w-8 h-8 bg-neutral-200 rounded-xl"></div>
        <div className="flex gap-1.5 flex-1 justify-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-12 rounded-xl bg-neutral-200/70 ${i === 3 ? 'w-16 bg-neutral-300' : 'w-11 hidden sm:block'}`}
            ></div>
          ))}
        </div>
        <div className="w-8 h-8 bg-neutral-200 rounded-xl"></div>
      </div>

      {/* Main Calorie Progress Card Skeleton */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-neutral-200 rounded-lg"></div>
            <div className="h-3.5 w-24 bg-neutral-100 rounded-md"></div>
          </div>
          <div className="h-7 w-20 bg-neutral-100 rounded-full"></div>
        </div>

        {/* Circular Progress Ring & Numbers Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
          <div className="relative w-36 h-36 rounded-full border-8 border-neutral-100 flex flex-col items-center justify-center bg-neutral-50/50">
            <div className="h-8 w-20 bg-neutral-200 rounded-lg mb-1"></div>
            <div className="h-3 w-14 bg-neutral-100 rounded-md"></div>
          </div>
          
          <div className="flex-1 w-full space-y-3">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="h-4 w-16 bg-neutral-200 rounded"></div>
              <div className="h-4 w-12 bg-neutral-200 rounded"></div>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="h-4 w-20 bg-neutral-200 rounded"></div>
              <div className="h-4 w-12 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* 3 Macro Progress Bars Skeleton */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-100">
          {[
            { color: 'bg-emerald-100', bar: 'bg-emerald-300' },
            { color: 'bg-blue-100', bar: 'bg-blue-300' },
            { color: 'bg-amber-100', bar: 'bg-amber-300' }
          ].map((item, idx) => (
            <div key={idx} className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100/80 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-3 w-8 bg-neutral-200 rounded"></div>
                <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
              </div>
              <div className="h-4 w-14 bg-neutral-300 rounded"></div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div className={`h-full w-2/3 ${item.bar} rounded-full`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Breakdown Cards Skeleton (4 Meals) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div className="h-5 w-28 bg-neutral-200 rounded-lg"></div>
          <div className="h-4 w-16 bg-neutral-100 rounded-md"></div>
        </div>

        {[
          { label: 'มื้อเช้า', iconBg: 'bg-amber-100' },
          { label: 'มื้อกลางวัน', iconBg: 'bg-orange-100' },
          { label: 'มื้อเย็น', iconBg: 'bg-indigo-100' },
          { label: 'ของว่าง', iconBg: 'bg-teal-100' }
        ].map((meal, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${meal.iconBg} flex items-center justify-center`}>
                <div className="w-5 h-5 bg-neutral-300/60 rounded"></div>
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-20 bg-neutral-300 rounded"></div>
                <div className="h-3 w-28 bg-neutral-100 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-neutral-100 rounded-lg"></div>
              <div className="w-8 h-8 rounded-xl bg-neutral-100"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Fasting & Hydration Widgets Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 bg-neutral-200 rounded"></div>
            <div className="w-6 h-6 rounded-lg bg-blue-100"></div>
          </div>
          <div className="h-6 w-20 bg-neutral-300 rounded"></div>
          <div className="w-full h-2 bg-neutral-100 rounded-full"></div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 bg-neutral-200 rounded"></div>
            <div className="w-6 h-6 rounded-lg bg-purple-100"></div>
          </div>
          <div className="h-6 w-20 bg-neutral-300 rounded"></div>
          <div className="w-full h-2 bg-neutral-100 rounded-full"></div>
        </div>
      </div>

      {/* Innovation Hub Grid Skeleton */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-100 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-36 bg-neutral-200 rounded-lg"></div>
          <div className="h-4 w-14 bg-neutral-100 rounded"></div>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-neutral-50 border border-neutral-100/60">
              <div className="w-10 h-10 rounded-xl bg-neutral-200/80"></div>
              <div className="h-2.5 w-12 bg-neutral-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
