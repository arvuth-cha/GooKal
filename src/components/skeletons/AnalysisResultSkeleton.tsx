import React from 'react';

export const AnalysisResultSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="AI กำลังวิเคราะห์โภชนาการ">
      {/* Title & Calorie Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-7 w-48 bg-neutral-300 rounded-xl"></div>
          <div className="h-4 w-32 bg-neutral-200 rounded-md"></div>
        </div>
        <div className="h-10 w-24 bg-orange-200/80 rounded-2xl"></div>
      </div>

      {/* 3 Macro Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'คาร์บ', color: 'bg-emerald-100' },
          { label: 'โปรตีน', color: 'bg-blue-100' },
          { label: 'ไขมัน', color: 'bg-amber-100' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-10 bg-neutral-200 rounded"></div>
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
            </div>
            <div className="h-6 w-16 bg-neutral-300 rounded-lg"></div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Glycemic & Sodium Pills */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-neutral-100 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-100"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-16 bg-neutral-200 rounded"></div>
            <div className="h-4 w-20 bg-neutral-300 rounded"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-neutral-100 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-100"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-14 bg-neutral-200 rounded"></div>
            <div className="h-4 w-18 bg-neutral-300 rounded"></div>
          </div>
        </div>
      </div>

      {/* Explanation Box */}
      <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-2.5">
        <div className="h-4 w-28 bg-neutral-300 rounded"></div>
        <div className="h-3.5 w-full bg-neutral-200 rounded"></div>
        <div className="h-3.5 w-5/6 bg-neutral-200 rounded"></div>
        <div className="h-3.5 w-2/3 bg-neutral-200 rounded"></div>
      </div>

      {/* Action Button Skeleton */}
      <div className="h-14 w-full bg-orange-300/80 rounded-2xl"></div>
    </div>
  );
};
