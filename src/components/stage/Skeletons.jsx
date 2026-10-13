import React from 'react';

export function SongRowSkeleton() {
  return (
    <div className="row-flat flex items-center gap-3 px-3 py-2.5 rounded-2xl border">
      <div className="w-10 h-12 rounded-md bg-white/5 shimmer shrink-0" />
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
        <div key={i} className="glass-flat rounded-3xl p-5 min-h-[150px] flex flex-col">
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
    <div className="grid sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-flat rounded-3xl flex p-2.5">
          <div className="w-[72px] sm:w-20 aspect-[3/4] shrink-0 rounded-2xl bg-white/[.06] shimmer" />
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
// Pantallas de detalle (banda, show, grabación): link de volver, tarjeta principal y filas.
export function DetailSkeleton({ rows = 4, className = 'max-w-4xl' }) {
  return (
    <div className={`${className} space-y-6`} aria-busy="true" aria-label="Cargando">
      <div className="h-3.5 w-20 rounded bg-white/5 shimmer" />
      <div className="bg-[#242831] rounded-3xl p-6 border border-white/[.06]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 shimmer shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-1/2 rounded bg-white/8 shimmer" />
            <div className="h-3 w-1/4 rounded bg-white/5 shimmer" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <div className="h-11 w-36 rounded-xl bg-white/8 shimmer" />
          <div className="h-11 w-32 rounded-xl bg-white/5 shimmer" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => <SongRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
