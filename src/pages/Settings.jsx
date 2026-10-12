import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Music2 } from 'lucide-react';
import StageSettings from '@/components/profile/StageSettings';
import PreferencesSection from '@/components/profile/PreferencesSection';
import GoogleDriveSync from '@/components/profile/GoogleDriveSync';
import BackupPanel from '@/components/profile/BackupPanel';

const SectionTitle = ({ children }) => (
  <h2 className="text-sm text-white/40 uppercase tracking-widest font-bold mb-3">{children}</h2>
);

// Configuración de la app: todo lo que antes estaba suelto al final del Perfil.
export default function Settings() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link to="/perfil" className="text-white/55 text-sm flex items-center gap-2"><ArrowLeft size={16} /> Perfil</Link>
        <h1 className="text-3xl sm:text-4xl font-bold mt-3">Configuración</h1>
      </div>
      <section><SectionTitle>Modo En Vivo</SectionTitle><StageSettings /></section>
      <section><SectionTitle>Apariencia y avisos</SectionTitle><PreferencesSection /></section>
      <section>
        <SectionTitle>Sincronización y copias</SectionTitle>
        <div className="bg-[#242831] rounded-2xl divide-y divide-white/10">
          <div className="p-5"><GoogleDriveSync /></div>
          <div className="p-5"><div className="text-sm font-semibold mb-3">Copia de seguridad local</div><BackupPanel /></div>
        </div>
      </section>
      <section>
        <SectionTitle>Ayuda</SectionTitle>
        <Link to="/bienvenida" className="flex justify-between items-center p-5 text-sm bg-[#242831] rounded-2xl"><span className="flex items-center gap-3"><Music2 size={18} /> Ver bienvenida</span><ArrowRight size={17} className="text-white/45" /></Link>
      </section>
      <p className="text-xs text-white/35">Tus canciones y repertorios se guardan en tu espacio de Atril.</p>
    </div>
  );
}
