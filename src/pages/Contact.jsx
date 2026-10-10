import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music2, ArrowRight, Mail, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast({ title: 'Mensaje enviado', description: 'Te responderemos a la brevedad.', variant: 'success' });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast({ title: 'No se pudo enviar', description: 'Intentá de nuevo más tarde.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

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
        <div className="text-[#8e9aaf] uppercase tracking-[.2em] text-[11px] font-bold mb-3">CONTACTO</div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">Ponete en contacto con nosotros</h1>
        <p className="text-white/60 text-base mb-8">¿Tenés dudas, sugerencias o querés reportar un problema? Escribinos y te responderemos a la brevedad.</p>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <a href="mailto:hola@atril.base44.app" className="flex items-center gap-3 p-4 rounded-xl bg-[#1e1e22] border border-[#2b2b30] hover:border-[#8e9aaf]/40 transition-colors">
              <span className="w-10 h-10 rounded-lg stage-grad-soft text-[#8e9aaf] flex items-center justify-center"><Mail size={18} /></span>
              <div><div className="font-semibold text-sm">Email</div><div className="text-xs text-white/50">hola@atril.base44.app</div></div>
            </a>
            <div className="p-4 rounded-xl bg-[#1e1e22] border border-[#2b2b30]">
              <div className="font-semibold text-sm mb-1">Soporte para músicos</div>
              <p className="text-xs text-white/50 leading-relaxed">Respondemos consultas sobre partituras, repertorios, Modo Banda y pedales Bluetooth. Tiempo de respuesta habitual: 24-48 horas hábiles.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm text-white/55">Nombre<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="stage-input mt-1.5" placeholder="Tu nombre" /></label>
            <label className="block text-sm text-white/55">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="stage-input mt-1.5" placeholder="tu@email.com" /></label>
            <label className="block text-sm text-white/55">Mensaje<textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="stage-input mt-1.5 resize-none" placeholder="Contanos en qué podemos ayudarte" /></label>
            <button disabled={sending} type="submit" className="w-full h-11 rounded-xl stage-grad text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Send size={16} /> {sending ? 'Enviando…' : 'Enviar mensaje'}</button>
          </form>
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