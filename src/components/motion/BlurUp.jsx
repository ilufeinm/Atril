import React, { useEffect, useRef, useState } from 'react';

// Envuelve una imagen: entra borrosa y se enfoca cuando termina de cargar ("blur-up").
// Escucha el `load` de cualquier <img> hijo, así sirve también con componentes de imagen propios.
export default function BlurUp({ children, className = '', ...rest }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = ref.current?.querySelector('img');
    if (img?.complete && img.naturalWidth > 0) { setLoaded(true); return undefined; }
    const t = setTimeout(() => setLoaded(true), 2500); // si falla la carga, no queda borroso para siempre
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={ref} data-loaded={loaded} onLoadCapture={() => setLoaded(true)} onErrorCapture={() => setLoaded(true)} className={`blur-up ${className}`} {...rest}>
      {children}
    </div>
  );
}
