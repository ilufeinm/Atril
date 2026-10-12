import React from 'react';
import { Link } from 'react-router-dom';
import { Library, ListMusic, Users, Mic } from 'lucide-react';
import { CountUp } from '@/components/motion';

// Resumen compacto: una sola tarjeta con los cuatro números en fila.
// Antes eran cuatro cuadros grandes que ocupaban casi toda la pantalla del celular.
export default function StatsGrid({ songs, sets, bands, recordings }) {
  const stats = [
    { Icon: Library, n: songs, label: 'Partituras', to: '/biblioteca' },
    { Icon: ListMusic, n: sets, label: 'Repertorios', to: '/repertorios' },
    { Icon: Users, n: bands, label: 'Bandas', to: '/modo-banda' },
    { Icon: Mic, n: recordings, label: 'Grabaciones', to: '/grabaciones' },
  ];
  return (
    <div className="grid grid-cols-4 bg-[#242831] rounded-2xl divide-x divide-white/10">
      {stats.map(({ Icon, n, label, to }) => (
        <Link key={label} to={to} className="group flex flex-col items-center justify-center gap-1 py-4 min-h-[84px] transition-colors hover:bg-white/5 first:rounded-l-2xl last:rounded-r-2xl">
          <Icon size={16} className="text-[#c9ef72]" aria-hidden="true" />
          <span className="text-xl font-bold leading-none tabular-nums"><CountUp value={n} /></span>
          <span className="text-[11px] text-white/45">{label}</span>
        </Link>
      ))}
    </div>
  );
}
