import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { Link, NavLink, Outlet, useLocation, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { House, Library, ListMusic, Mic, Users, Music2, Plus, Search, Star, Sun, Moon, User } from 'lucide-react';
import StageProvider from './StageProvider';
import { useStage } from './StageProvider';
import { initThemeListener, applyTheme } from '@/lib/theme';
import { isOnboardingDone } from '@/lib/onboarding';
import { useBandNotifications } from '@/hooks/useBandNotifications';
import { AnimatePresence, motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { EASE_OUT, EASE_IN, SPRING, SPRING_BOUNCY } from '@/lib/motion';

// Carga diferida: las pestañas se montan bajo demanda al navegar, no al abrir la app.
const Collection = lazy(() => import('@/pages/Collection'));
const Recordings = lazy(() => import('@/pages/Recordings'));
const Bands = lazy(() => import('@/pages/Bands'));

// Pestañas principales que se mantienen montadas para conservar estado y scroll.
const KEPT = [
  { match: (p) => p === '/biblioteca' || p === '/repertorios', key: 'collection', render: () => <Collection /> },
  { match: (p) => p === '/grabaciones', key: 'recordings', render: () => <Recordings /> },
  { match: (p) => p === '/modo-banda', key: 'bands', render: () => <Bands /> },
];

function KeepTabs({ peekKey = null, peekX }) {
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

  // La pestaña "padre" se monta bajo demanda cuando se empieza a deslizar para volver.
  useEffect(() => {
    if (peekKey) setMounted((m) => m[peekKey] ? m : { ...m, [peekKey]: true });
  }, [peekKey]);

  useEffect(() => {
    if (!activeKey) return;
    setMounted((m) => m[activeKey] ? m : { ...m, [activeKey]: true });
    const y = scroll.current[activeKey] || 0;
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'instant' })));
  }, [activeKey]);

  return (
    <>
      {KEPT.map((t) => {
        if (!mounted[t.key]) return null;
        const peeking = peekKey === t.key && activeKey !== t.key;
        const shown = activeKey === t.key || peeking;
        return (
          <motion.div
            key={t.key}
            // Al asomar, la pestaña ocupa la pantalla por detrás de la página de detalle, con parallax.
            style={peeking
              ? { display: 'block', position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, x: peekX, pointerEvents: 'none', background: '#121212' }
              : { display: shown ? 'block' : 'none' }}
            initial={{ opacity: 0, y: 8 }}
            animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <div className={peeking ? 'max-w-[1250px] w-full mx-auto px-4 sm:px-8 py-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]' : undefined}>
              <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin" /></div>}>
                {t.render()}
              </Suspense>
            </div>
          </motion.div>
        );
      })}
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
  const title = TITLES[loc.pathname] || 'Atril';
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
    <Link to={to} className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium select-none transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#8A94A8]'}`}>
      {isActive && (
        <motion.span
          layoutId="bottom-nav-pill"
          className="absolute inset-x-1.5 inset-y-1.5 rounded-2xl bg-[#8e9aaf]/15"
          transition={SPRING}
        />
      )}
      <motion.span className="relative" animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }} transition={SPRING_BOUNCY}>
        <Icon size={21} />
      </motion.span>
      <span className="relative">{label}</span>
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

// Gesto "volver deslizando desde el borde izquierdo" para las pantallas de detalle.
// La página sigue al dedo, deja ver la pantalla anterior por detrás (con parallax) y,
// si se suelta pasada la mitad de la zona o con velocidad, se cierra con resorte.
function useSwipeBack({ enabled, onBack }) {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  const st = useRef(null);
  const W = () => window.innerWidth;
  const peekX = useTransform(x, (v) => -W() * 0.28 * (1 - Math.min(Math.max(v / W(), 0), 1)));
  const scrim = useTransform(x, (v) => 0.45 * (1 - Math.min(Math.max(v / W(), 0), 1)));

  const handlers = enabled ? {
    onPointerDown: (e) => {
      if (e.pointerType !== 'touch') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      st.current = { x0: e.clientX, y0: e.clientY, t0: performance.now(), lock: null };
    },
    onPointerMove: (e) => {
      const s = st.current; if (!s) return;
      const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
      if (!s.lock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        s.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (s.lock === 'x') setSwiping(true);
      }
      if (s.lock === 'x') x.set(Math.max(0, dx));
    },
    onPointerUp: (e) => {
      const s = st.current; st.current = null;
      if (!s || s.lock !== 'x') { setSwiping(false); return; }
      const dx = e.clientX - s.x0;
      const v = dx / Math.max(performance.now() - s.t0, 1); // px/ms
      if (dx > W() * 0.35 || v > 0.6) {
        navigator.vibrate?.(8);
        animate(x, W(), { type: 'spring', stiffness: 320, damping: 36, onComplete: () => { onBack(); x.set(0); setSwiping(false); } });
      } else {
        animate(x, 0, { type: 'spring', stiffness: 420, damping: 36, onComplete: () => setSwiping(false) });
      }
    },
    onPointerCancel: () => { st.current = null; animate(x, 0, { type: 'spring', stiffness: 420, damping: 36, onComplete: () => setSwiping(false) }); },
  } : {};
  return { x, peekX, scrim, swiping, handlers };
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
  useBandNotifications(user?.id);
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
  // La barra inferior solo se oculta en vistas de pantalla completa (show, en vivo, detalle de grabación).
  // En el detalle de una banda (/modo-banda/:id) y en crear banda se mantiene visible.
  const isBandPage = segments[0] === 'modo-banda' && segments.length <= 2;
  const hideBottomNav = isDeepView && !isBandPage;
  // Volver deslizando: solo en detalle de banda/grabación (no en show ni en vivo, que usan gestos propios).
  const swipeBackEnabled = segments.length === 2 && ['grabaciones', 'modo-banda'].includes(segments[0]);
  const parentPath = '/' + (segments[0] || '');
  const parentKey = (KEPT.find((t) => t.match(parentPath)) || {}).key || null;
  const swipe = useSwipeBack({
    enabled: swipeBackEnabled,
    onBack: () => (window.history.length > 1 ? navigate(-1) : navigate(parentPath)),
  });
  const isKeptRoute = KEPT.some((t) => t.match(loc.pathname));
  const pageBox = 'flex-1 max-w-[1250px] w-full mx-auto px-4 sm:px-8 py-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:pt-6';
  // Salida corta (que no estorbe) y entrada con curva de aterrizaje suave.
  // Las páginas de primer nivel solo hacen fade: su contenido entra escalonado por su cuenta.
  const pageVariants = isDeepView
    ? {
        initial: { x: 36, opacity: 0 },
        animate: { x: 0, opacity: 1, transition: { duration: 0.42, ease: EASE_OUT } },
        exit: { x: -18, opacity: 0, transition: { duration: 0.14, ease: EASE_IN } },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } },
        exit: { opacity: 0, transition: { duration: 0.1, ease: EASE_IN } },
      };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#121212]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
          className="w-8 h-8 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin"
        />
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
            <span className="w-8 h-8 rounded-lg stage-grad flex items-center justify-center text-white"><Music2 size={18} /></span>Atril
          </Link>
          <div className="mt-5 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A94A8]" />
            <input value={sideQuery} onChange={onSideSearch} placeholder="Buscar partituras" className="stage-input pl-9 h-10 text-sm" />
          </div>
          <nav className="mt-6 space-y-1">
            {SIDE.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `relative flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition-colors select-none ${isActive ? 'text-white font-semibold' : 'text-[#8A94A8] hover:text-white hover:bg-[#202738]/60'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="side-nav-pill" className="absolute inset-0 rounded-xl bg-[#202738]" transition={SPRING} />}
                    <Icon size={18} className="relative" /><span className="relative">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <Link to="/biblioteca?importar=1" className="group flex items-center justify-center gap-2 rounded-full stage-grad text-white font-bold text-sm h-11 select-none transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.97]"><Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" /> Importar partitura</Link>
            <button onClick={toggleDark} className="flex items-center gap-3 text-[#8A94A8] text-sm px-3 h-9 hover:text-white select-none">{dark ? <Sun size={17} /> : <Moon size={17} />} Modo {dark ? 'claro' : 'oscuro'}</button>
            <Link to="/perfil" className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#202738] select-none">
              <Avatar size={36} />
              <div className="min-w-0"><div className="text-sm font-semibold truncate">Tu perfil</div><div className="text-xs text-[#8A94A8]">Cuenta y plan</div></div>
            </Link>
            <div className="flex gap-3 text-xs text-[#8A94A8] pt-1">
              <Link to="/acerca-de" className="hover:text-white transition-colors">Acerca de</Link>
              <span className="text-white/15">·</span>
              <Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link>
            </div>
          </div>
        </aside>

        <main className={`flex-1 min-w-0 flex flex-col ${hideBottomNav ? 'pb-0' : 'pb-20'} md:pb-0 overscroll-y-contain`}>
          {loc.pathname !== '/' && <TopHeader />}

          {/* Pestañas principales (siempre montadas) + páginas de primer nivel como Inicio o Perfil.
              En vistas de detalle este contenedor no ocupa espacio: solo aloja la pestaña "padre" que asoma al deslizar para volver. */}
          <div className={isDeepView ? 'contents' : pageBox}>
            <KeepTabs peekKey={swipe.swiping ? parentKey : null} peekX={swipe.peekX} />
            {!isKeptRoute && !isDeepView && (
              <AnimatePresence mode="wait">
                <motion.div key={loc.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin" /></div>}>
                    <Outlet />
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Vistas de detalle: la página va por encima y se desliza con el dedo. */}
          {isDeepView && (
            <motion.div
              style={{ x: swipeBackEnabled ? swipe.x : 0 }}
              className={`${pageBox} relative z-10 bg-[#121212] ${swipe.swiping ? 'shadow-[-14px_0_36px_rgba(0,0,0,0.45)]' : ''}`}
            >
              <AnimatePresence mode="wait">
                <motion.div key={loc.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-4 border-slate-700 border-t-[#8e9aaf] rounded-full animate-spin" /></div>}>
                    <Outlet />
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {swipe.swiping && <motion.div aria-hidden className="fixed inset-0 z-[5] bg-black pointer-events-none" style={{ opacity: swipe.scrim }} />}
          {swipeBackEnabled && <div {...swipe.handlers} aria-hidden className="md:hidden fixed left-0 top-0 bottom-16 w-5 z-40 touch-none" />}
        </main>

        {!hideBottomNav && (
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