import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, NavLink, Outlet, useLocation, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { House, Library, ListMusic, Mic, Users, Music2, Plus, Search, Star, Sun, Moon, User } from 'lucide-react';
import StageProvider from './StageProvider';
import { useStage } from './StageProvider';
import { initThemeListener, applyTheme } from '@/lib/theme';
import { isOnboardingDone } from '@/lib/onboarding';
import { useBandNotifications } from '@/hooks/useBandNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import Collection from '@/pages/Collection';
import Recordings from '@/pages/Recordings';
import Bands from '@/pages/Bands';

// Pestañas principales que se mantienen montadas para conservar estado y scroll.
const KEPT = [
  { match: (p) => p === '/biblioteca' || p === '/repertorios', key: 'collection', render: () => <Collection /> },
  { match: (p) => p === '/grabaciones', key: 'recordings', render: () => <Recordings /> },
  { match: (p) => p === '/modo-banda', key: 'bands', render: () => <Bands /> },
];

function KeepTabs() {
  const loc = useLocation();
  const [mounted, setMounted] = useState({ collection: false, recordings: false, bands: false });
  const scroll = useRef({ collection: 0, recordings: 0, bands: 0 });
  const activeKey = useMemo(() => {
    const t = KEPT.find((t) => t.match(loc.pathname));
    return t ? t.key : null;
  }, [loc.pathname]);

  useEffect(() => {
    if (!activeKey) return;
    const onScroll = () => { scroll.current[activeKey] = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeKey]);

  useEffect(() => {
    if (!activeKey) return;
    setMounted((m) => m[activeKey] ? m : { ...m, [activeKey]: true });
    const y = scroll.current[activeKey] || 0;
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'instant' })));
  }, [activeKey]);

  return (
    <>
      {KEPT.map((t) => mounted[t.key] && (
        <div key={t.key} style={{ display: activeKey === t.key ? 'block' : 'none' }}>
          {t.render()}
        </div>
      ))}
    </>
  );
}

const TITLES = { '/':'Inicio','/biblioteca':'Biblioteca','/repertorios':'Repertorios','/grabaciones':'Grabaciones','/modo-banda':'Bandas','/perfil':'Perfil','/favoritos':'Favoritos' };
const SIDE = [['/','Inicio',House],['/biblioteca','Biblioteca',Library],['/favoritos','Favoritos',Star],['/repertorios','Repertorios',ListMusic],['/grabaciones','Grabaciones',Mic],['/modo-banda','Bandas',Users]];

function Avatar({ size = 36 }) {
  const { user } = useStage();
  const initial = (user?.full_name?.[0] || user?.email?.[0] || 'S').toUpperCase();
  return (
    <span className="relative rounded-full bg-[#202738] flex items-center justify-center font-bold text-white shrink-0 select-none" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initial}
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#f47b6a] border-2 border-[#121212]" style={{ width: Math.round(size * 0.28), height: Math.round(size * 0.28) }} />
    </span>
  );
}

function TopHeader() {
  const loc = useLocation();
  const title = TITLES[loc.pathname] || 'ScoreBook';
  return (
    <header className="hidden md:flex sticky top-0 z-30 min-h-14 pt-[env(safe-area-inset-top)] items-center justify-between px-4 sm:px-6 bg-[#0B0E14]/85 backdrop-blur-xl border-b border-[#2B3448]">
      <span className="font-display font-bold text-base tracking-tight select-none">{title}</span>
      <Link to="/perfil" aria-label="Perfil" className="select-none"><Avatar size={36} /></Link>
    </header>
  );
}

function BottomLink({ to, label, Icon, activeOn }) {
  const loc = useLocation();
  const isActive = activeOn
    ? activeOn.some((p) => loc.pathname === p || loc.pathname.startsWith(p + '/'))
    : (to === '/' ? loc.pathname === '/' : loc.pathname === to || loc.pathname.startsWith(to + '/'));
  return (
    <Link to={to} className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium select-none ${isActive ? 'text-white' : 'text-[#8A94A8]'}`}>
      <Icon size={21} />{label}
    </Link>
  );
}

export default function StageShell() {
  return (
    <StageProvider>
      <ShellContent />
    </StageProvider>
  );
}

function ShellContent() {
  const loc = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, loading } = useStage();
  const sideQuery = params.get('q') || '';
  const onSideSearch = (e) => {
    const v = e.target.value;
    if (loc.pathname === '/biblioteca') {
      const sp = new URLSearchParams(params);
      if (v) sp.set('q', v); else sp.delete('q');
      setParams(sp, { replace: true });
    } else {
      navigate('/biblioteca' + (v ? '?q=' + encodeURIComponent(v) : ''));
    }
  };
  useBandNotifications();
  const [dark, setDark] = React.useState(() => localStorage.getItem('stage-theme') !== 'light');
  React.useEffect(() => {
    const cleanup = initThemeListener();
    setDark(localStorage.getItem('stage-theme') !== 'light');
    return cleanup;
  }, []);

  // Vistas anidadas (detalle): ocultan la barra inferior para maximizar espacio.
  // Cualquier subpath con más de un segmento (/modo-banda/:id, /grabaciones/:id, etc.)
  const segments = loc.pathname.split('/').filter(Boolean);
  const isDeepView = segments.length > 1;
  const pageTransition = isDeepView
    ? { initial: { x: 40, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -24, opacity: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#121212]">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin"></div>
      </div>
    );
  }

  const onboardingDone = user ? !!user.onboarding_done : isOnboardingDone();
  if (!onboardingDone && loc.pathname !== '/bienvenida') {
    return <Navigate to="/bienvenida" replace />;
  }
  const toggleDark = () => { const n = !dark; setDark(n); applyTheme(n ? 'dark' : 'light'); };

  return (
    <div className="stage-app min-h-screen flex bg-[#121212] text-[#F4F5F8]">
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#161B26] border-r border-[#2B3448] p-5 sticky top-0 h-screen">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight select-none">
            <span className="w-8 h-8 rounded-lg stage-grad flex items-center justify-center text-white"><Music2 size={18} /></span>ScoreBook
          </Link>
          <div className="mt-5 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A8]" />
            <input value={sideQuery} onChange={onSideSearch} placeholder="Buscar partituras" className="stage-input pl-9 h-10 text-sm" />
          </div>
          <nav className="mt-6 space-y-1">
            {SIDE.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition-colors select-none ${isActive ? 'bg-[#202738] text-white font-semibold' : 'text-[#8A94A8] hover:text-white hover:bg-[#202738]/60'}`}>
                <Icon size={18} />{label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <Link to="/biblioteca?importar=1" className="flex items-center justify-center gap-2 rounded-full stage-grad text-white font-bold text-sm h-11 select-none"><Plus size={18} /> Importar partitura</Link>
            <button onClick={toggleDark} className="flex items-center gap-3 text-[#8A94A8] text-sm px-3 h-9 hover:text-white select-none">{dark ? <Sun size={17} /> : <Moon size={17} />} Modo {dark ? 'claro' : 'oscuro'}</button>
            <Link to="/perfil" className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#202738] select-none">
              <Avatar size={36} />
              <div className="min-w-0"><div className="text-sm font-semibold truncate">Tu perfil</div><div className="text-xs text-[#8A94A8]">Cuenta y plan</div></div>
            </Link>
          </div>
        </aside>

        <main className={`flex-1 min-w-0 flex flex-col ${isDeepView ? 'pb-0' : 'pb-20'} md:pb-0 overscroll-y-contain`}>
          {loc.pathname !== '/' && <TopHeader />}
          <div className="flex-1 max-w-[1250px] w-full mx-auto px-4 sm:px-8 py-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:pt-6">
            {KEPT.some((t) => t.match(loc.pathname)) ? (
              <KeepTabs />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={loc.pathname}
                  initial={pageTransition.initial}
                  animate={pageTransition.animate}
                  exit={pageTransition.exit}
                  transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>

        {!isDeepView && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[#1e1e22] border-t border-[#2b2b30] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
            <BottomLink to="/" label="Inicio" Icon={House} />
            <BottomLink to="/biblioteca" label="Partituras" Icon={Library} activeOn={['/biblioteca', '/repertorios']} />
            <BottomLink to="/grabaciones" label="Grabaciones" Icon={Mic} />
            <BottomLink to="/modo-banda" label="Banda" Icon={Users} />
            <BottomLink to="/perfil" label="Perfil" Icon={User} />
          </nav>
        )}
      </div>
  );
}