import React from 'react';
import { Link } from 'react-router-dom';
import { Library, ListMusic, Users, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardMotion } from '@/lib/motion';
import { CountUp } from '@/components/motion';

const MotionLink = motion.create(Link);

export default function StatsGrid({ songs, sets, bands, recordings }) {
  const stats = [
    { Icon: Library, n: songs, label: 'Partituras', to: '/biblioteca' },
    { Icon: ListMusic, n: sets, label: 'Repertorios', to: '/repertorios' },
    { Icon: Users, n: bands, label: 'Bandas', to: '/modo-banda' },
    { Icon: Mic, n: recordings, label: 'Grabaciones', to: '/grabaciones' },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map(({ Icon, n, label, to }, i) => (
        <MotionLink key={label} {...cardMotion(i)} to={to} className="group bg-[#242831] p-6 rounded-2xl hover:bg-white/5 transition-colors">
          <Icon className="text-[#c9ef72] mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" size={22} />
          <div className="text-3xl font-bold"><CountUp value={n} /></div>
          <div className="text-sm text-white/45">{label}</div>
        </MotionLink>
      ))}
    </div>
  );
}
