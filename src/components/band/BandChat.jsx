import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import MemberAvatar from './MemberAvatar';

export default function BandChat({ band, me }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [denied, setDenied] = useState(false);
  const endRef = useRef(null);
  const roomRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!band?.id) return;
    let connId = sessionStorage.getItem('bandchat-conn');
    if (!connId) { connId = crypto.randomUUID(); sessionStorage.setItem('bandchat-conn', connId); }
    const room = base44.actors.BandChatRoom(band.id).connect({ id: connId });
    roomRef.current = room;
    const sub = room.subscribe((msg) => {
      if (msg.type === 'history') { setMsgs(msg.messages || []); setConnected(true); }
      else if (msg.type === 'message') { setMsgs((m) => [...m, msg.message]); }
      else if (msg.type === 'error' || msg.type === 'reject') { setDenied(true); }
    });
    return () => { sub.unsubscribe(); room.close(); };
  }, [band?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = () => {
    if (!text.trim() || !roomRef.current) return;
    roomRef.current.send({ type: 'send', text: text.trim() });
    setText('');
  };

  if (denied && !connected) return (
    <div className="text-center text-white/40 text-sm py-12">No tenés acceso al chat de esta banda.</div>
  );

  return (
    <div className="flex flex-col h-[440px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {msgs.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.sender_id === me?.id ? 'flex-row-reverse' : ''}`}>
            <MemberAvatar member={{ name: m.sender_name, instrument: 'Otro', color: '#94a3b8' }} size={36} />
            <div className={m.sender_id === me?.id ? 'text-right' : ''}>
              <div className="text-xs text-white/40 mb-1">{m.sender_name} · {new Date(m.created).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="bg-[#292d36] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-md inline-block">{m.text}</div>
            </div>
          </div>
        ))}
        {!msgs.length && <div className="text-center text-white/35 text-sm py-12">{connected ? 'Sin mensajes aún. Coordiná el show desde aquí.' : 'Conectando al chat...'}</div>}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Escribí un mensaje para la banda..." className="stage-input flex-1" />
        <button onClick={send} className="w-11 h-11 rounded-xl bg-[#c9ef72] text-[#172013] flex items-center justify-center shrink-0"><Send size={18} /></button>
      </div>
    </div>
  );
}