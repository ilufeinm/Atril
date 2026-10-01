import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Download, Share2 } from 'lucide-react';
import ScorePreview from '@/components/stage/ScorePreview';
import Waveform from './Waveform';
import SongMarkers from './SongMarkers';

const fmt = (s) => { if (!isFinite(s) || s < 0) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${String(sec).padStart(2, '0')}`; };

export default function RecordingPlayer({ audioUrl, songs, duration, allSongs, onTime, registerSeek, onShare }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(duration || 0);
  const [speed, setSpeed] = useState(1);
  const [vol, setVol] = useState(1);
  const [peaks, setPeaks] = useState([]);

  useEffect(() => {
    let active = true;
    fetch(audioUrl).then((r) => r.arrayBuffer()).then((ab) => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.decodeAudioData(ab, (buf) => {
        if (!active) return;
        const ch = buf.getChannelData(0);
        const N = 80;
        const block = Math.floor(ch.length / N) || 1;
        const p = [];
        for (let i = 0; i < N; i++) { let s = 0; for (let j = 0; j < block; j++) s += Math.abs(ch[i * block + j] || 0); p.push(s / block); }
        const mx = Math.max(...p) || 1;
        setPeaks(p.map((v) => v / mx));
      }).catch(() => {});
    }).catch(() => {});
    return () => { active = false; };
  }, [audioUrl]);

  useEffect(() => { registerSeek?.((t) => { if (ref.current) { ref.current.currentTime = t; setTime(t); onTime?.(t); } }); }, [registerSeek]);

  const onSeekFrac = (f) => { if (ref.current && dur) { ref.current.currentTime = f * dur; setTime(ref.current.currentTime); onTime?.(ref.current.currentTime); } };
  const toggle = () => { if (!ref.current) return; if (playing) ref.current.pause(); else ref.current.play(); };
  const seekTo = (t) => { if (ref.current) { ref.current.currentTime = t; setTime(t); onTime?.(t); } };

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

      <div className="bg-[#242831] rounded-2xl p-4 sm:p-5">
        <audio ref={ref} src={audioUrl} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={(e) => setDur(e.target.duration || duration || 0)} onTimeUpdate={(e) => { setTime(e.target.currentTime); onTime?.(e.target.currentTime); }} onEnded={() => setPlaying(false)} />
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="w-12 h-12 rounded-full bg-[#c9ef72] text-[#172013] flex items-center justify-center shrink-0">{playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}</button>
          <div className="flex-1 min-w-0">
            <Waveform peaks={peaks} progress={dur ? time / dur : 0} onSeek={onSeekFrac} />
            <div className="flex justify-between text-[11px] text-white/45 mt-1.5"><span>{fmt(time)}</span><span>{fmt(dur)}</span></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-white/40 mr-1">Vel.</span>
            {[0.5, 0.75, 1, 1.25, 1.5].map((s) => <button key={s} onClick={() => { setSpeed(s); if (ref.current) ref.current.playbackRate = s; }} className={`px-2 h-7 rounded-lg text-[11px] font-semibold ${speed === s ? 'bg-[#c9ef72] text-[#172013]' : 'bg-white/10 text-white/60'}`}>{s}x</button>)}
          </div>
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-white/45" />
            <input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => { setVol(+e.target.value); if (ref.current) ref.current.volume = +e.target.value; }} className="w-20 accent-[#c9ef72]" />
          </div>
          <a href={audioUrl} download className="ml-auto flex items-center gap-1.5 text-xs text-white/55 hover:text-white"><Download size={15} /> Descargar</a>
          {onShare && <button onClick={onShare} className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white"><Share2 size={15} /> Compartir</button>}
        </div>
        {songs?.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-2">Marcadores por canción</div>
            <SongMarkers songs={songs} currentTime={time} onSeek={seekTo} />
          </div>
        )}
      </div>
    </div>
  );
}