import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
import StageSettings from '@/components/profile/StageSettings';
import PreferencesSection from '@/components/profile/PreferencesSection';
import GoogleDriveSync from '@/components/profile/GoogleDriveSync';
import BackupPanel from '@/components/profile/BackupPanel';
import { SectionLabel } from '@/components/glass';

const SectionTitle = ({ children }) => <SectionLabel className="mb-3">{children}</SectionLabel>;

// Configuración de la app: todo lo que antes estaba suelto al final del Perfil.
export default function Settings() {
  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link to="/perfil" className="glass inline-flex h-10 pl-2.5 pr-4 rounded-full text-sm font-semibold items-center gap-1"><ChevronLeft size={18} /> Perfil</Link>
        <h1 className="font-display text-[34px] sm:text-4xl font-extrabold tracking-tight leading-none mt-5">Configuración</h1>
      </div>
      <section><SectionTitle>Modo En Vivo</SectionTitle><StageSettings /></section>
      <section><SectionTitle>Apariencia y avisos</SectionTitle><PreferencesSection /></section>
      <section>
        <SectionTitle>Sincronización y copias</SectionTitle>
        <div className="glass-flat rounded-3xl divide-y divide-white/10">
          <div className="p-5"><GoogleDriveSync /></div>
          <div className="p-5"><div className="text-sm font-semibold mb-3">Copia de seguridad local</div><BackupPanel /></div>
        </div>
      </section>
      <section>
        <SectionTitle>Ayuda</SectionTitle>
        <Link to="/bienvenida" className="glass-flat flex justify-between items-center p-5 text-sm rounded-3xl"><span className="flex items-center gap-3"><Music2 size={18} /> Ver bienvenida</span><ChevronRight size={18} className="text-white/60" /></Link>
      </section>
      <p className="text-xs text-white/60">Tus canciones y repertorios se guardan en tu espacio de Atril.</p>
    </div>
  );
}
