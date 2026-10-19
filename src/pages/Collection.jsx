import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_OUT, EASE_IN } from '@/lib/motion';
import { PageBackdrop } from '@/components/glass';
import { Segmented } from '@/components/glass/parts';
import LibraryPage from './Library';
import SetlistsPage from './Setlists';
import { tr } from '@/i18n';

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
      <PageBackdrop motif="score" tint={tab === 'repertorios' ? 'coral' : 'paper'} />
      <div className="relative space-y-6">
      <Segmented label={tr('Sección')} value={tab} onChange={switchTab} layoutId="collection-tab-pill" className="w-[232px] [&>button]:px-0" options={[['biblioteca', tr('Partituras')], ['repertorios', tr('Repertorios')]]} />
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