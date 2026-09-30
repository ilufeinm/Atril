import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Muestra notificaciones del navegador cuando llega un mensaje nuevo de la banda,
// si el usuario activó los avisos y concedió permiso.
export function useBandNotifications() {
  useEffect(() => {
    if (!('Notification' in window)) return;
    const unsubscribe = base44.entities.BandMessage.subscribe((event) => {
      if (event.type !== 'create') return;
      if (localStorage.getItem('stage-notify') !== 'on') return;
      if (Notification.permission !== 'granted') return;
      const sender = event.data?.sender_name || 'Banda';
      const text = event.data?.text || '';
      try { new Notification(sender, { body: text }); } catch {}
    });
    return unsubscribe;
  }, []);
}