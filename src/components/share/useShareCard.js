import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { tr } from '@/i18n';
import { isNativeApp, shareFileNative } from '@/lib/nativeFiles';

// Hook para capturar una ShareCard con html2canvas y compartirla
// via navigator.share (con archivo) o descargarla como fallback.
// En la app de Android no hay navigator.share ni descargas: se usa el menú de compartir nativo.
export default function useShareCard() {
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef(null);
  const { toast } = useToast();

  const share = useCallback(async (item) => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      // Espera a que las imágenes de la tarjeta terminen de cargar
      const images = cardRef.current.querySelectorAll('img');
      await Promise.all([...images].map((img) =>
        img.complete ? Promise.resolve() : new Promise((res) => { img.onload = () => res(); img.onerror = () => res(); })
      ));
      await new Promise((r) => setTimeout(r, 120));

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#121212',
        scale: 1,
        logging: false,
      });

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const slug = (item?.title || item?.name || 'atril').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      const file = new File([blob], `atril-${slug}.png`, { type: 'image/png' });

      if (isNativeApp()) {
        await shareFileNative(blob, file.name, { title: item?.title || item?.name || 'Atril', text: item?.title || item?.name || '' });
      } else if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: item?.title || item?.name || 'Atril', text: item?.title || item?.name || '' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: tr('Imagen descargada'), description: tr('Quedó en tu carpeta de descargas.'), variant: 'success' });
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        toast({ title: tr('No se pudo compartir'), description: e?.message || tr('Intentá de nuevo.'), variant: 'destructive' });
      }
    } finally {
      setSharing(false);
    }
  }, [sharing, toast]);

  return { sharing, cardRef, share };
}