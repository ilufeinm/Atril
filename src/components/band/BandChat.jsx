import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import MemberAvatar from './MemberAvatar';

export default function BandChat({ band, me }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    try { setMsgs(band?.chat ? JSON.parse(band.chat) : []); } catch { setMsgs([]); }
  }, [band?.chat]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    if (!text.trim() || busy) return;
    const body = text.trim();
    const optimistic = { name: me?.name || 'Tú', text: body, time: new Date().toISOString(), color: me?.color, _pending: true };
    const base = msgs.filter((m) => !m._pending);
    const next = base.map(({ _pending, ...rest }) => rest).concat({ name: optimistic.name, text: body, time: optimistic.time, color: optimistic.color });
    setMsgs((m) => [...m, optimistic]);
    setText('');
    setBusy(true);
    try {
      await base44.entities.Band.update(band.id, { chat: JSON.stringify(next) });
    } catch (e) {
      setMsgs((m) => m.filter((x) => x !== optimistic));
      toast({ title: 'No se pudo enviar el mensaje', description: 'Revisá tu conexión e intenta de nuevo.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[440px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m._pending ? 'opacity-60' : ''}`}>
            <MemberAvatar member={{ name: m.name, instrument: 'Otro', color: m.color }} size={36} />
            <div>
              <div className="text-xs text-white/40 mb-1">{m.name} · {new Date(m.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="bg-[#292d36] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-md">{m.text}</div>
            </div>
          </div>
        ))}
        {!msgs.length && <div className="text-center text-white/35 text-sm py-12">Sin mensajes aún. Coordiná el show desde aquí.</div>}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Escribí un mensaje para la banda..." className="stage-input flex-1" />
        <button onClick={send} disabled={busy} className="w-11 h-11 rounded-xl bg-[#c9ef72] text-[#172013] flex items-center justify-center shrink-0"><Send size={18} /></button>
      </div>
    </div>
  );
}