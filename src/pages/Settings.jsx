import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
import StageSettings from '@/components/profile/StageSettings';
import PreferencesSection from '@/components/profile/PreferencesSection';
import GoogleDriveSync from '@/components/profile/GoogleDriveSync';
import BackupPanel from '@/components/profile/BackupPanel';
import LanguageSection from '@/components/profile/LanguageSection';
import { SectionLabel } from '@/components/glass';
import { tr } from '@/i18n';

const SectionTitle = ({ children }) => <SectionLabel className="mb-3">{children}</SectionLabel>;

// Configuración de la app: todo lo que antes estaba suelto al final del Perfil.
export default function Settings() {
  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link to="/perfil" className="glass inline-flex h-10 pl-2.5 pr-4 rounded-full text-sm font-semibold items-center gap-1"><ChevronLeft size={18} /> {tr('Perfil')}</Link>
        <h1 className="font-display text-[28px] sm:text-[32px] font-bold tracking-tight leading-none mt-5">{tr('Configuración')}</h1>
      </div>
      <section><SectionTitle>{tr('Modo En Vivo')}</SectionTitle><StageSettings /></section>
      <section><SectionTitle>{tr('Apariencia y avisos')}</SectionTitle><div className="space-y-3"><PreferencesSection /><LanguageSection /></div></section>
      <section>
        <SectionTitle>{tr('Sincronización y copias')}</SectionTitle>
        <div className="glass-flat rounded-2xl divide-y divide-white/10">
          <div className="p-5"><GoogleDriveSync /></div>
          <div className="p-5"><div className="text-sm font-semibold mb-3">{tr('Copia de seguridad local')}</div><BackupPanel /></div>
        </div>
      </section>
      <section>
        <SectionTitle>{tr('Ayuda')}</SectionTitle>
        <Link to="/bienvenida" className="glass-flat flex justify-between items-center p-5 text-sm rounded-2xl"><span className="flex items-center gap-3"><Music2 size={18} /> {tr('Ver bienvenida')}</span><ChevronRight size={18} className="text-white/60" /></Link>
      </section>
      <p className="text-xs text-white/60">{tr('Tus canciones y repertorios se guardan en tu espacio de Atril.')}</p>
    </div>
  );
}
