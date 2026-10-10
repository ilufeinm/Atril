import React from 'react';
import { Link } from 'react-router-dom';
import { Music2, ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F4F5F8] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-xl border-b border-[#2b2b30]">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg stage-grad flex items-center justify-center text-white"><Music2 size={18} /></span>Atril
          </Link>
          <Link to="/" className="text-sm text-[#8e9aaf] flex items-center gap-1 hover:gap-1.5 transition-all">Ir a la app <ArrowRight size={15} /></Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-12">
        <div className="text-[#8e9aaf] uppercase tracking-[.2em] text-[11px] font-bold mb-3">SOBRE NOSOTROS</div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-6">Atril: el centro de mando musical para músicos en vivo</h1>

        <div className="prose prose-invert max-w-none space-y-5 text-white/70 text-base leading-relaxed">
          <p>
            Atril es una aplicación diseñada para músicos que tocan en vivo y necesitan tener sus partituras,
            repertorios y presentaciones organizadas en un solo lugar. Nació de una necesidad concreta:
            los músicos suelen llegar al escenario con hojas sueltas, PDFs dispersos en el teléfono y
            repertorios anotados a mano que se pierden o desordenan entre un ensayo y el siguiente.
          </p>
          <p>
            Con Atril podés importar tus partituras en PDF o como fotos, organizarlas en una biblioteca
            personal, agruparlas en repertorios para cada show y presentarlas en un visor optimizado para
            el escenario, con controles de zoom, brillo, bloqueo de pantalla y navegación por gestos o
            pedales Bluetooth. El Modo Banda permite que toda la banda trabaje sobre el mismo repertorio
            en tiempo real, sincronizando la canción activa entre todos los integrantes durante la
            presentación. Además, podés grabar tus presentaciones y ensayos directamente desde la app,
            con marcadores automáticos por canción para repasar después lo que funcionó y lo que no.
          </p>
          <p>
            Atril está pensado para músicos profesionales y aficionados de Latinoamérica y España: cantantes,
            guitarristas, pianistas, bajistas, bateristas y cualquier instrumentista que necesite leer
            música sobre el escenario. Es ideal para bandas de covers, músicos de sesión, coros de iglesia,
            grupos de teatro musical y profesores de música que organizan recitales de sus alumnos.
          </p>
          <p>
            La aplicación es construida y mantenida por un equipo dedicado a crear herramientas que
            realmente se usan en el escenario, no solo en el ensayo. Trabajamos en colaboración constante
            con músicos activos para que cada función resuelva un problema real del día a día.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/" className="h-11 px-6 rounded-xl stage-grad text-white font-bold text-sm flex items-center gap-2">Comenzar a usar Atril <ArrowRight size={17} /></Link>
          <Link to="/contacto" className="h-11 px-5 rounded-xl bg-white/10 text-white text-sm flex items-center gap-2 border border-white/[.06]">Contacto</Link>
        </div>
      </main>

      <footer className="border-t border-[#2b2b30] py-6">
        <div className="max-w-3xl mx-auto px-5 flex flex-wrap items-center justify-between gap-3 text-sm text-white/40">
          <span>© {new Date().getFullYear()} Atril</span>
          <div className="flex gap-4">
            <Link to="/acerca-de" className="hover:text-white transition-colors">Acerca de</Link>
            <Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link>
            <Link to="/" className="hover:text-white transition-colors">Ir a la app</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}