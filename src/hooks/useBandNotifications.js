import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

// Avisos de la banda:
//  · dentro de la app: un toast que baja con resorte (si no estás justo en el chat de esa banda);
//  · fuera de la app: notificación del navegador, si el usuario activó los avisos y dio permiso.
export function useBandNotifications(userId) {
  useEffect(() => {
    const unsubscribe = base44.entities.BandMessage.subscribe((event) => {
      if (event.type !== 'create') return;
      const sender = event.data?.sender_name || 'Banda';
      const text = event.data?.text || '';
      if (userId && event.data?.sender_id === userId) return; // no avisar de tus propios mensajes

      const inThatBand = window.location.pathname.startsWith(`/modo-banda/${event.data?.band_id}`);
      if (document.visibilityState === 'visible') {
        if (!inThatBand) toast({ title: sender, description: text });
        return;
      }
      if (!('Notification' in window)) return;
      if (localStorage.getItem('stage-notify') !== 'on') return;
      if (Notification.permission !== 'granted') return;
      try { new Notification(sender, { body: text }); } catch { /* sin permiso o no soportado */ }
    });
    return unsubscribe;
  }, [userId]);
}
