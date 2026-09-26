import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { House, Library, ListMusic, Heart, UserRound, Music2, Plus, Moon, Sun, Users, Mic } from 'lucide-react';
import StageProvider from './StageProvider';
const links = [['/','Inicio',House],['/biblioteca','Biblioteca',Library],['/repertorios','Repertorios',ListMusic],['/grabaciones','Grabaciones',Mic],['/modo-banda','Bandas',Users],['/favoritos','Favoritos',Heart],['/perfil','Perfil',UserRound]];
export default function StageShell() {
  const [dark,setDark] = React.useState(localStorage.getItem('stage-theme') !== 'light');
  React.useEffect(() => { document.documentElement.classList.toggle('stage-light',!dark); localStorage.setItem('stage-theme',dark?'dark':'light'); return () => document.documentElement.classList.remove('stage-light'); },[dark]);
  return <StageProvider><div className="stage-app min-h-screen flex text-[#f5f3f0]">
    <aside className="hidden md:flex w-[232px] shrink-0 flex-col bg-[#12141b] border-r border-white/10 p-6 sticky top-0 h-screen">
      <Link to="/" className="flex items-center gap-3 text-xl font-bold tracking-tight"><span className="w-9 h-9 rounded-xl stage-grad text-white flex items-center justify-center"><Music2 size={21}/></span>StageBook</Link>
      <div className="mt-12 text-[10px] tracking-[.22em] uppercase text-white/35 font-semibold px-3">TU ESPACIO</div>
      <nav className="mt-4 space-y-1">{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex items-center gap-3 px-3 h-11 rounded-xl text-sm transition-colors ${isActive?'bg-[#c9ef72]/12 text-[#d8f4a3] font-semibold':'text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon size={19}/>{label}</NavLink>)}</nav>
      <div className="mt-auto space-y-4"><Link to="/biblioteca?importar=1" className="flex items-center justify-center gap-2 rounded-full stage-grad text-white font-bold text-sm h-11"><Plus size={18}/> Importar partitura</Link><button onClick={()=>setDark(!dark)} className="flex items-center gap-3 text-white/50 text-sm px-3 h-10 hover:text-white">{dark?<Sun size={18}/>:<Moon size={18}/>} Modo {dark?'claro':'oscuro'}</button><div className="border-t border-white/10 pt-4 text-xs text-white/30">Tu música, lista para salir a escena.</div></div>
    </aside>
    <main className="flex-1 min-w-0 bg-[#1a1d25] pb-24 md:pb-0"><div className="max-w-[1250px] mx-auto px-5 sm:px-8 lg:px-12 py-7 md:py-9"><Outlet/></div></main>
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#12141b]/95 backdrop-blur-xl border-t border-white/10 flex justify-around px-2 pb-[env(safe-area-inset-bottom)]">{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex flex-col items-center justify-center min-w-[48px] flex-1 h-[65px] gap-1 text-[10px] ${isActive?'text-[#c9ef72]':'text-white/45'}`}><Icon size={21}/>{label}</NavLink>)}</nav>
  </div></StageProvider>;
}