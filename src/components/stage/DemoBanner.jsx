import React, { useState } from 'react';
import { Sparkles, Trash2, EyeOff } from 'lucide-react';
import { useStage } from './StageProvider';
import { useToast } from '@/components/ui/use-toast';

export default function DemoBanner() {
  const { demoDismissed, demoHidden, hasOwnContent, dismissDemo, hideDemos, demoSets } = useStage();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hiding, setHiding] = useState(false);
  const { toast } = useToast();
  if (demoDismissed || demoHidden || hasOwnContent || !demoSets?.length) return null;

  const doHide = async () => {
    setHiding(true);
    try { await hideDemos(); setConfirmHide(false); toast({ title: 'Demos ocultas', description: 'Ya no aparecen en tus listas.' }); }
    catch (e) { toast({ title: 'No se pudo ocultar', description: e.message, variant: 'destructive' }); }
    finally { setHiding(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[.04] border border-white/10 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#8e9aaf]/15 text-[#8e9aaf] flex items-center justify-center shrink-0"><Sparkles size={18} /></span>
          <div className="min-w-0">
            <div className="font-semibold text-sm flex items-center gap-2">Contenido de demostración <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/55">Demo</span></div>
            <p className="text-xs text-white/45 mt-0.5">Explora estos ejemplos para entender cómo funciona Atril.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setConfirmHide(true)} className="h-10 px-3 rounded-xl bg-white/10 text-white/60 text-sm font-semibold flex items-center gap-2"><EyeOff size={16} /> <span className="hidden sm:inline">Ocultar</span></button>
          <button onClick={() => setConfirmDelete(true)} className="h-10 px-3 rounded-xl bg-white/10 text-red-200 text-sm font-semibold flex items-center gap-2"><Trash2 size={16} /> <span className="hidden sm:inline">Eliminar</span></button>
        </div>
      </div>

      {confirmHide && (
        <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !hiding && setConfirmHide(false)}>
          <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white/60 flex items-center justify-center mx-auto mb-4"><EyeOff size={26} /></div>
            <h2 className="text-xl font-bold">¿Ocultar las demos?</h2>
            <p className="text-sm text-white/50 mt-2">Dejarán de aparecer en todas tus listas. No se borran: podés volver a verlas desde tu perfil.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmHide(false)} disabled={hiding} className="flex-1 h-12 rounded-xl bg-white/10 text-white font-semibold">Cancelar</button>
              <button onClick={doHide} disabled={hiding} className="flex-1 h-12 rounded-xl bg-[#8e9aaf] text-[#121212] font-bold disabled:opacity-50">{hiding ? 'Ocultando…' : 'Ocultar demos'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="anim-backdrop fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setConfirmDelete(false)}>
          <div className="bg-[#292d36] rounded-3xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 text-red-300 flex items-center justify-center mx-auto mb-4"><Trash2 size={26} /></div>
            <h2 className="text-xl font-bold">¿Eliminar contenido de demostración?</h2>
            <p className="text-sm text-white/50 mt-2">Se borrarán las partituras, repertorios y bandas de ejemplo. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 h-12 rounded-xl bg-white/10 text-white font-semibold">Cancelar</button>
              <button onClick={async () => { setDeleting(true); try { await dismissDemo(); } finally { setDeleting(false); } setConfirmDelete(false); }} disabled={deleting} className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50">{deleting ? 'Eliminando…' : 'Eliminar ejemplos'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}