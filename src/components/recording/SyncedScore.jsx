import React from 'react';
import ScorePreview from '@/components/stage/ScorePreview';

export default function SyncedScore({ songs, currentTime, allSongs }) {
  const active = songs.find((s) => currentTime >= s.start && (s.end == null || currentTime < s.end));
  if (!active) return (
    <div className="bg-[#242831] rounded-2xl p-8 text-center text-white/40 text-sm">La partitura sincronizada aparecerá al llegar a una canción grabada.</div>
  );
  const song = allSongs.find((s) => s.id === active.song_id);
  let page = active.pages.length ? active.pages[0].page : 1;
  for (const p of active.pages) if (p.t <= currentTime) page = p.page;
  return (
    <div className="bg-[#242831] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Partitura sincronizada</div>
        <div className="text-sm font-semibold truncate">{active.title} <span className="text-white/40">· pág. {page}</span></div>
      </div>
      <div className="rounded-xl overflow-hidden bg-[#e9e9dd]"><ScorePreview song={song} page={page} /></div>
    </div>
  );
}