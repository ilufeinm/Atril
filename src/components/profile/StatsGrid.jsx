import React from 'react';
import { Link } from 'react-router-dom';
import { Library, ListMusic, Users, Mic } from 'lucide-react';
import { CountUp } from '@/components/motion';

// Resumen compacto: una sola tarjeta con los cuatro números en fila.
// Antes eran cuatro cuadros grandes que ocupaban casi toda la pantalla del celular: ahora, cuatro bloques chicos de vidrio en una fila.
export default function StatsGrid({ songs, sets, bands, recordings }) {
  const stats = [
    { Icon: Library, n: songs, label: 'Partituras', to: '/biblioteca' },
    { Icon: ListMusic, n: sets, label: 'Repertorios', to: '/repertorios' },
    { Icon: Users, n: bands, label: 'Bandas', to: '/modo-banda' },
    { Icon: Mic, n: recordings, label: 'Grabaciones', to: '/grabaciones' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ Icon, n, label, to }) => (
        <Link key={label} to={to} className="glass rounded-3xl px-1 py-3.5 min-h-[92px] flex flex-col items-center justify-center gap-1 transition-colors hover:bg-white/[.12]">
          <Icon size={16} className="text-white/60" aria-hidden="true" />
          <span className="font-display text-[22px] font-extrabold leading-none tabular-nums"><CountUp value={n} /></span>
          <span className="text-[11px] text-white/70">{label}</span>
        </Link>
      ))}
    </div>
  );
}
