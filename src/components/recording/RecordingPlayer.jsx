import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Share2 } from 'lucide-react';
import ScorePreview from '@/components/stage/ScorePreview';
import SongMarkers from './SongMarkers';

const fmt = (s) => { if (!isFinite(s) || s < 0) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${String(sec).padStart(2, '0')}`; };
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

export default function RecordingPlayer({ audioUrl, songs, duration, allSongs, onTime, registerSeek, onShare }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(duration || 0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => { registerSeek?.((t) => { if (ref.current) { ref.current.currentTime = t; setTime(t); onTime?.(t); } }); }, [registerSeek]);

  const onSeekFrac = (f) => { if (ref.current && dur) { ref.current.currentTime = f * dur; setTime(ref.current.currentTime); onTime?.(ref.current.currentTime); } };
  const toggle = () => { if (!ref.current) return; if (playing) ref.current.pause(); else ref.current.play(); };
  const seekTo = (t) => { if (ref.current) { ref.current.currentTime = t; setTime(t); onTime?.(t); } };
  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  const active = songs.find((s) => time >= s.start && (s.end == null || time < s.end));
  const song = active ? allSongs.find((s) => s.id === active.song_id) : null;
  let page = 1;
  if (active) {
    page = active.pages.length ? active.pages[0].page : 1;
    for (const p of active.pages) if (p.t <= time) page = p.page;
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-[#fffdf7] aspect-[3/4] sm:aspect-[16/10] shadow-[0_25px_80px_rgba(0,0,0,.35)]">
        {active ? (
          <ScorePreview song={song} page={page} fill />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#8b8b84] text-sm text-center px-6 bg-[#fffdf7]">
            {songs.length ? 'La partitura aparecerá al llegar a una canción grabada.' : 'Esta grabación no tiene canciones marcadas.'}
          </div>
        )}
        {active && (
          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/55 to-transparent px-4 pt-3 pb-6 flex items-center justify-between pointer-events-none">
            <span className="text-white text-sm font-semibold truncate drop-shadow">{active.title}</span>
            <span className="text-white/80 text-xs">pág. {page}</span>
          </div>
        )}
      </div>

      <div className="bg-[#242831] rounded-2xl px-4 sm:px-5 py-4">
        <audio ref={ref} src={audioUrl} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={(e) => setDur(e.target.duration || duration || 0)} onTimeUpdate={(e) => { setTime(e.target.currentTime); onTime?.(e.target.currentTime); }} onEnded={() => setPlaying(false)} />
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="w-12 h-12 rounded-full bg-[#c9ef72] text-[#172013] flex items-center justify-center shrink-0">{playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}</button>
          <div className="flex-1 min-w-0">
            <div className="relative h-1.5 rounded-full bg-white/12 cursor-pointer" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeekFrac(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-[#c9ef72]" style={{ width: `${dur ? (time / dur) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-white/45 mt-1.5 tabular-nums"><span>{fmt(time)}</span><span>{fmt(dur)}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={cycleSpeed} className="px-2.5 h-7 rounded-lg bg-white/10 text-white/65 text-xs font-semibold tabular-nums hover:bg-white/15">{speed}×</button>
          <div className="ml-auto flex items-center gap-1">
            <a href={audioUrl} download className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10"><Download size={16} /></a>
            {onShare && <button onClick={onShare} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10"><Share2 size={16} /></button>}
          </div>
        </div>
        {songs?.length > 0 && <SongMarkers songs={songs} currentTime={time} onSeek={seekTo} />}
      </div>
    </div>
  );
}