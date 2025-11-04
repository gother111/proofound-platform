'use client';

/**
 * Reusable skeleton loader components for Expertise Atlas
 * with shimmer animation for polished loading states
 */

export function SkillCardSkeleton() {
  return (
    <div className="border border-[#D8D2C8] rounded-lg bg-white p-6 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-[#E8E6DD] rounded w-3/4"></div>
          <div className="h-3 bg-[#E8E6DD] rounded w-1/4"></div>
        </div>
        <div className="h-8 w-8 bg-[#E8E6DD] rounded"></div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 bg-[#E8E6DD] rounded w-1/2"></div>
          <div className="h-4 bg-[#E8E6DD] rounded w-3/4"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-[#E8E6DD] rounded w-1/2"></div>
          <div className="h-4 bg-[#E8E6DD] rounded w-3/4"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-[#E8E6DD] rounded w-1/2"></div>
          <div className="h-4 bg-[#E8E6DD] rounded w-2/3"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-[#E8E6DD] rounded w-1/2"></div>
          <div className="h-6 bg-[#E8E6DD] rounded w-1/3"></div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 pt-3 border-t border-[#D8D2C8]">
        <div>
          <div className="flex justify-between mb-1">
            <div className="h-3 bg-[#E8E6DD] rounded w-1/3"></div>
            <div className="h-3 bg-[#E8E6DD] rounded w-12"></div>
          </div>
          <div className="h-2 bg-[#E8E6DD] rounded-full"></div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <div className="h-3 bg-[#E8E6DD] rounded w-1/4"></div>
            <div className="h-3 bg-[#E8E6DD] rounded w-12"></div>
          </div>
          <div className="h-2 bg-[#E8E6DD] rounded-full"></div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-3 border-t border-[#D8D2C8]">
        <div className="h-9 bg-[#E8E6DD] rounded flex-1"></div>
        <div className="h-9 bg-[#E8E6DD] rounded flex-1"></div>
      </div>
    </div>
  );
}

export function CategoryRowSkeleton() {
  return (
    <div className="border border-[#E5E3DA] rounded-lg bg-white p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-5 w-5 bg-[#E8E6DD] rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#E8E6DD] rounded w-2/3"></div>
            <div className="h-3 bg-[#E8E6DD] rounded w-1/3"></div>
          </div>
        </div>
        <div className="h-6 w-16 bg-[#E8E6DD] rounded"></div>
      </div>
    </div>
  );
}

export function DomainCardSkeleton() {
  return (
    <div className="border border-[#D8D2C8] bg-white/90 p-6 rounded-lg animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 bg-[#E8E6DD] rounded-lg"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[#E8E6DD] rounded w-1/2"></div>
            <div className="h-3 bg-[#E8E6DD] rounded w-1/4"></div>
          </div>
        </div>
        <div className="h-5 w-5 bg-[#E8E6DD] rounded"></div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-[#E8E6DD] rounded w-1/4"></div>
          <div className="h-5 w-16 bg-[#E8E6DD] rounded"></div>
        </div>
        <div>
          <div className="h-3 bg-[#E8E6DD] rounded w-1/5 mb-2"></div>
          <div className="h-2 bg-[#E8E6DD] rounded-full"></div>
          <div className="flex gap-3 mt-2">
            <div className="h-3 w-20 bg-[#E8E6DD] rounded"></div>
            <div className="h-3 w-20 bg-[#E8E6DD] rounded"></div>
            <div className="h-3 w-20 bg-[#E8E6DD] rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-[#E8E6DD] rounded w-1/3"></div>
        <div className="h-4 bg-[#E8E6DD] rounded w-1/6"></div>
      </div>
      <div className="flex items-center justify-center h-[300px]">
        <div className="h-48 w-48 bg-[#E8E6DD] rounded-full"></div>
      </div>
    </div>
  );
}

export function L4SkillRowSkeleton() {
  return (
    <div className="border border-[#E5E3DA] rounded-lg bg-white p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-4 w-4 bg-[#E8E6DD] rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#E8E6DD] rounded w-3/4"></div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 bg-[#E8E6DD] rounded"></div>
              <div className="h-5 w-16 bg-[#E8E6DD] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

