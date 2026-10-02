import React, { forwardRef } from 'react';
import { resolvePage } from '@/lib/songPages';
import useSignedUrl from '@/hooks/useSignedUrl';

// Tarjeta visual para compartir (1080×1350, formato social 4:5).
// Se renderiza fuera de pantalla y html2canvas la captura como PNG.
const ShareCard = forwardRef(({ item, kind, songs }, ref) => {
  const isSong = kind === 'song';
  const song = isSong ? item : null;
  const setlist = isSong ? null : item;

  const firstPage = song ? resolvePage(song, 1) : null;
  const thumbUri = firstPage?.kind === 'image' ? firstPage.src : null;
  const thumbUrl = useSignedUrl(thumbUri);

  const setSongs = !isSong && setlist?.song_ids
    ? setlist.song_ids.map((sid) => songs?.find((s) => s.id === sid)).filter(Boolean)
    : [];
  const minutes = Math.round(setSongs.reduce((t, s) => t + (s.duration || 180), 0) / 60);

  return (
    <div ref={ref} style={{
      position: 'fixed', left: '-99999px', top: 0,
      width: 1080, height: 1350,
      background: 'linear-gradient(165deg, #1e1e22 0%, #121212 55%, #0a0a0c 100%)',
      color: '#ffffff', fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column',
      padding: '80px 80px 64px', boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* halos de acento */}
      <div style={{ position: 'absolute', top: -180, right: -120, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(142,154,175,0.18), transparent 65%)' }} />
      <div style={{ position: 'absolute', bottom: -200, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(142,154,175,0.08), transparent 65%)' }} />

      {isSong ? (
        <>
          {/* portada de la partitura */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
            <div style={{ width: 500, height: 660, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', position: 'relative', background: '#fffdf7' }}>
              {thumbUrl ? (
                <img src={thumbUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#222329', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, letterSpacing: 5, color: '#8b8b84', fontWeight: 600 }}>SCOREBOOK · PARTITURA</div>
                  <div style={{ fontSize: 34, fontWeight: 800, marginTop: 16, lineHeight: 1.1 }}>{song?.title || 'Sin título'}</div>
                  <div style={{ fontSize: 17, color: '#777970', marginTop: 8 }}>{song?.artist || 'Artista'} · {song?.key || 'Do'}</div>
                  <div style={{ width: '80%', borderTop: '1px solid #ddddd5', borderBottom: '1px solid #ddddd5', padding: '12px 0', margin: '28px 0', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#787a70' }}>
                    <span>♩ = {song?.bpm || 100}</span><span>{song?.meter || '4/4'}</span><span>{song?.key || 'Do'}</span>
                  </div>
                  {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ width: '70%', height: 1, background: '#cccac0', margin: '8px 0' }} />)}
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>{song?.title || 'Sin título'}</div>
            <div style={{ fontSize: 27, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>{song?.artist || 'Artista desconocido'}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 32, fontSize: 21, color: 'rgba(255,255,255,0.45)' }}>
            {song?.key && <span>{song.key}</span>}
            {song?.bpm && <span>{song.bpm} BPM</span>}
            {song?.meter && <span>{song.meter}</span>}
            {song?.duration && <span>{Math.round(song.duration / 60)} min</span>}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, letterSpacing: 5, color: '#8e9aaf', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Repertorio</div>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05, fontFamily: "'Outfit', sans-serif" }}>{setlist?.name || 'Repertorio'}</div>
          <div style={{ fontSize: 25, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
            {setlist?.venue || 'Lugar por definir'}
            {setlist?.date && ` · ${new Date(setlist.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '40px 0 32px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {setSongs.slice(0, 7).map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 25 }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, width: 36 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{s.title}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 19 }}>{s.key || '—'}</span>
              </div>
            ))}
            {setSongs.length > 7 && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 21, paddingLeft: 56 }}>+{setSongs.length - 7} más</div>}
            {!setSongs.length && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 22 }}>Sin canciones aún</div>}
          </div>
          <div style={{ display: 'flex', gap: 28, fontSize: 23, color: 'rgba(255,255,255,0.5)', marginTop: 24 }}>
            <span>{setSongs.length} temas</span><span>·</span><span>{minutes} min</span>
          </div>
        </>
      )}

      {/* branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 36, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#8e9aaf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#121212', fontSize: 22, fontFamily: "'Outfit', sans-serif" }}>S</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: 3, fontFamily: "'Outfit', sans-serif" }}>STAGEBOOK</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>Tu centro de mando musical</div>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;