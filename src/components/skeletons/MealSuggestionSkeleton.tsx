import React from 'react';

interface MealSuggestionSkeletonProps {
  count?: number;
}

export const MealSuggestionSkeleton: React.FC<MealSuggestionSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="flex flex-col gap-4 mt-2 animate-pulse" role="status" aria-label="กำลังคิดเมนูอาหาร">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70 flex flex-col gap-3 relative overflow-hidden"
        >
          {/* Header Row: Title & Calorie Badge */}
          <div className="flex justify-between items-start">
            <div className="h-5 w-44 bg-neutral-300 rounded-lg"></div>
            <div className="h-5 w-18 bg-orange-200/80 rounded-full"></div>
          </div>

          {/* Macros Row: Carbs • Protein • Fat */}
          <div className="flex gap-3 items-center">
            <div className="h-3.5 w-16 bg-neutral-200 rounded"></div>
            <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
            <div className="h-3.5 w-16 bg-neutral-200 rounded"></div>
            <div className="w-1 h-1 rounded-full bg-neutral-300"></div>
            <div className="h-3.5 w-16 bg-neutral-200 rounded"></div>
          </div>

          {/* Explanation Box */}
          <div className="bg-white p-3 rounded-xl border border-neutral-100 space-y-2">
            <div className="h-3.5 w-full bg-neutral-200 rounded"></div>
            <div className="h-3.5 w-4/5 bg-neutral-100 rounded"></div>
          </div>

          {/* Action Button Skeleton */}
          <div className="w-full h-9 rounded-xl bg-orange-200/60 flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-300/80"></div>
            <div className="h-3.5 w-32 bg-orange-300/80 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
