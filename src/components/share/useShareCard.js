import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Hook para capturar una ShareCard con html2canvas y compartirla
// via navigator.share (con archivo) o descargarla como fallback.
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
      const slug = (item?.title || item?.name || 'stagebook').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      const file = new File([blob], `stagebook-${slug}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: item?.title || item?.name || 'StageBook', text: item?.title || item?.name || '' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Imagen descargada', description: 'Encontrala en tu galería para compartirla.' });
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        toast({ title: 'No se pudo compartir', description: e?.message || 'Intentá de nuevo.', variant: 'destructive' });
      }
    } finally {
      setSharing(false);
    }
  }, [sharing, toast]);

  return { sharing, cardRef, share };
}