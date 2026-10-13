import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Library as LibraryIcon, ListMusic } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_OUT, EASE_IN, SPRING } from '@/lib/motion';
import { PageBackdrop } from '@/components/glass';
import LibraryPage from './Library';
import SetlistsPage from './Setlists';

export default function Collection() {
  const loc = useLocation();
  const nav = useNavigate();
  const tab = loc.pathname.startsWith('/repertorios') ? 'repertorios' : 'biblioteca';

  const switchTab = (t) => {
    if (t === tab) return;
    nav(t === 'repertorios' ? '/repertorios' : '/biblioteca');
  };

  return (
    <div className="relative">
      <PageBackdrop motif="score" />
      <div className="relative space-y-6">
      <div className="glass flex gap-1 p-1 rounded-full max-w-[280px]">
        {[['biblioteca', LibraryIcon, 'Partituras'], ['repertorios', ListMusic, 'Repertorios']].map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`relative flex-1 h-10 rounded-full text-sm font-semibold flex items-center justify-center gap-2 select-none ${tab === key ? 'seg-on' : 'text-white/70 hover:text-white'}`}
          >
            {tab === key && <motion.span layoutId="collection-tab-pill" className="home-cta absolute inset-0 rounded-full" transition={SPRING} />}
            <Icon size={16} className="relative" /><span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === 'biblioteca' ? -16 : 16 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.1, ease: EASE_IN } }}
        >
          {tab === 'biblioteca' ? <LibraryPage /> : <SetlistsPage />}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}