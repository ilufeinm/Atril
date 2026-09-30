// Repertorios de ejemplo que se siembran una sola vez por cuenta nueva.
// Reciben los IDs de las partituras demo y de las bandas demo para asociar
// cada repertorio a su banda (band_id), de modo que aparezcan en la sección
// Repertorio de cada banda de ejemplo.
export function buildDemoSets(songIds, demoBands = []) {
  const ids = (songIds || []).filter(Boolean);
  const upcoming = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  const templates = [
    { name: 'Noche de Standards', venue: 'Jazz Café', date: upcoming(14), time: '21:00', all: true },
    { name: 'Sesión Trío', venue: 'El Subsuelo', date: upcoming(28), time: '20:00', all: false },
    { name: 'Ceremonia & Fiesta', venue: 'Salón Crystal', date: upcoming(21), time: '19:30', all: true }
  ];

  return demoBands.map((band, i) => {
    const idx = band._idx ?? i;
    const t = templates[idx] || { name: `Repertorio ${idx + 1}`, venue: 'Lugar por definir', date: upcoming(14 + idx * 7), time: '20:00', all: true };
    return {
      name: t.name,
      venue: t.venue,
      date: t.date,
      time: t.time,
      song_ids: t.all ? ids.slice() : ids.slice(0, 3),
      is_demo: true,
      band_id: band.id
    };
  });
}