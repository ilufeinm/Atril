// Bandas de ejemplo que se siembran una sola vez por cuenta nueva.
// Son propiedad del usuario (is_demo = true) para que pueda eliminarlas
// individualmente, y no se vuelven a crear mientras la cuenta exista.
export const DEMO_BANDS = [
  {
    name: 'Los Nocturnos',
    description: 'Cuarteto de jazz que mezcla standards del Real Book con composiciones propias. Repertorio listo para clubs y sesiones acústicas.',
    members: JSON.stringify([
      { name: 'Voz', instrument: 'Cantante' },
      { name: 'Saxo', instrument: 'Saxofón' },
      { name: 'Bajo', instrument: 'Contrabajo' },
      { name: 'Batería', instrument: 'Batería' }
    ]),
    is_demo: true
  },
  {
    name: 'Banda de Teatro',
    description: 'Banda estable para musicales y obras de teatro. Repertorios por escena y cambios rápidos entre números.',
    members: JSON.stringify([
      { name: 'Director', instrument: 'Piano' },
      { name: 'Cuerdas', instrument: 'Violín' },
      { name: 'Percusión', instrument: 'Percusión' }
    ]),
    is_demo: true
  },
  {
    name: 'Wedding Band',
    description: 'Banda para bodas y eventos. Sets adaptables: ceremonia, cóctel y fiesta. Repertorios compartidos con el organizador.',
    members: JSON.stringify([
      { name: 'Líder', instrument: 'Guitarra' },
      { name: 'Voz', instrument: 'Cantante' },
      { name: 'Teclados', instrument: 'Teclados' },
      { name: 'Bajo', instrument: 'Bajo' },
      { name: 'Batería', instrument: 'Batería' }
    ]),
    is_demo: true
  }
];