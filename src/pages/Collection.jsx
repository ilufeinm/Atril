import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Library as LibraryIcon, ListMusic } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-[#1e1e22] border border-[#2b2b30] max-w-[300px]">
        <button
          onClick={() => switchTab('biblioteca')}
          className={`flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all select-none ${tab === 'biblioteca' ? 'bg-[#8e9aaf] text-[#121212]' : 'text-white/55 hover:text-white'}`}
        >
          <LibraryIcon size={16} /> Biblioteca
        </button>
        <button
          onClick={() => switchTab('repertorios')}
          className={`flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all select-none ${tab === 'repertorios' ? 'bg-[#8e9aaf] text-[#121212]' : 'text-white/55 hover:text-white'}`}
        >
          <ListMusic size={16} /> Repertorios
        </button>
      </div>
      {tab === 'biblioteca' ? <LibraryPage /> : <SetlistsPage />}
    </div>
  );
}