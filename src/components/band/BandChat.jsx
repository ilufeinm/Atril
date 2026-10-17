import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import MemberAvatar from './MemberAvatar';
import { tr, dateLocale } from '@/i18n';

const HISTORY_LIMIT = 80;

export default function BandChat({ band, me }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [denied, setDenied] = useState(false);
  const endRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!band?.id) return;
    let alive = true;
    setConnected(false); setDenied(false); setMsgs([]);

    base44.entities.BandMessage
      .filter({ band_id: band.id }, { sort: '-created_date', limit: HISTORY_LIMIT })
      .then((rows) => { if (alive) { setMsgs([...rows].reverse()); setConnected(true); } })
      .catch(() => { if (alive) setDenied(true); });

    // Mensajes nuevos en tiempo real (Supabase Realtime).
    const unsub = base44.entities.BandMessage.subscribe((ev) => {
      if (ev.type !== 'create' || ev.data?.band_id !== band.id) return;
      setMsgs((m) => (m.some((x) => x.id === ev.data.id) ? m : [...m, ev.data]));
    });
    return () => { alive = false; unsub(); };
  }, [band?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const t = text.trim().slice(0, 1000);
    if (!t || !band?.id) return;
    setText('');
    try {
      const row = await base44.entities.BandMessage.create({ band_id: band.id, text: t });
      setMsgs((m) => (m.some((x) => x.id === row.id) ? m : [...m, row]));
    } catch (e) {
      setText(t);
      toast({ title: tr('No se pudo enviar el mensaje'), description: e.message });
    }
  };

  if (denied && !connected) return (
    <div className="text-center text-white/40 text-sm py-12">{tr('No tenés acceso al chat de esta banda.')}</div>
  );

  return (
    <div className="flex flex-col h-[440px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {msgs.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.sender_id === me?.id ? 'flex-row-reverse' : ''}`}>
            <MemberAvatar member={{ name: m.sender_name, instrument: 'Otro', color: '#94a3b8' }} size={36} />
            <div className={m.sender_id === me?.id ? 'text-right' : ''}>
              <div className="text-xs text-white/40 mb-1">{m.sender_name} · {new Date(m.created_date).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="bg-[#292d36] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-md inline-block">{m.text}</div>
            </div>
          </div>
        ))}
        {!msgs.length && <div className="text-center text-white/35 text-sm py-12">{connected ? tr('Sin mensajes aún. Coordiná el show desde aquí.') : tr('Conectando al chat...')}</div>}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={tr('Escribí un mensaje para la banda...')} className="stage-input flex-1" />
        <button onClick={send} className="w-11 h-11 rounded-xl bg-[#c9ef72] text-[#172013] flex items-center justify-center shrink-0"><Send size={18} /></button>
      </div>
    </div>
  );
}
