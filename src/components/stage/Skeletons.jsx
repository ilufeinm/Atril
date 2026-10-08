import React from 'react';

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl border border-white/[.07] bg-[#242831]">
      <div className="w-10 h-10 rounded-lg bg-white/5 shimmer shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded bg-white/8 shimmer" />
        <div className="h-2.5 w-1/2 rounded bg-white/5 shimmer" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 6 }) {
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => <SongRowSkeleton key={i} />)}
    </div>
  );
}

export function SetlistSkeleton({ count = 3 }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-[#242831] p-6 border border-white/[.07] min-h-[210px] flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-white/5 shimmer mb-5" />
          <div className="h-4 w-2/3 rounded bg-white/8 shimmer" />
          <div className="h-3 w-1/3 rounded bg-white/5 shimmer mt-2" />
          <div className="mt-auto pt-5 h-3 w-1/2 rounded bg-white/5 shimmer" />
        </div>
      ))}
    </div>
  );
}

export function RecordingSkeleton({ count = 3 }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#242831] rounded-2xl border border-white/[.06] flex">
          <div className="w-24 sm:w-28 shrink-0 bg-[#1e1e22] shimmer" />
          <div className="flex-1 p-4 space-y-2">
            <div className="h-4 w-2/3 rounded bg-white/8 shimmer" />
            <div className="h-3 w-1/2 rounded bg-white/5 shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BandSkeleton({ count = 2 }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#242831] rounded-2xl p-5 border border-white/[.06]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/5 shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-2/3 rounded bg-white/8 shimmer" />
              <div className="h-3 w-1/3 rounded bg-white/5 shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}