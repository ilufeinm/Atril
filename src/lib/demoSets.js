// Repertorios de ejemplo que se siembran una sola vez por cuenta nueva.
// Reciben los IDs de las partituras demo para que el repertorio tenga canciones reales.
export function buildDemoSets(songIds) {
  const ids = (songIds || []).filter(Boolean);
  const upcoming = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      name: 'Noche de Standards',
      venue: 'Jazz Café',
      date: upcoming(14),
      time: '21:00',
      song_ids: ids.slice(),
      is_demo: true
    },
    {
      name: 'Sesión Trío',
      venue: 'El Subsuelo',
      date: upcoming(28),
      time: '20:00',
      song_ids: ids.slice(0, 3),
      is_demo: true
    }
  ];
}