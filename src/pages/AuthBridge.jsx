import React, { useEffect, useState } from 'react';
import { appParams } from '@/lib/app-params';
import { APP_SCHEME, safeNext } from '@/lib/nativeAuth';

// Página puente: se abre en Chrome después del login con Google.
// Toma la sesión y se la devuelve a la app Android con un enlace profundo.
export default function AuthBridge() {
  const [links, setLinks] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = safeNext(new URLSearchParams(window.location.search).get('next'));
    let token = appParams.token;
    if (!token) {
      try { token = window.localStorage.getItem('base44_access_token'); } catch (_) { token = null; }
    }
    if (!token) { setFailed(true); return; }

    const query = `token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
    // Enlace directo con el esquema propio (respaldo).
    const direct = `${APP_SCHEME}://auth?${query}`;
    // Enlace intent:// (el que Chrome en Android maneja mejor).
    const intent = `intent://auth?${query}#Intent;scheme=${APP_SCHEME};package=${APP_SCHEME};end`;

    setLinks({ direct, intent });
    // Intento automático (Chrome puede bloquearlo si no hay un toque del usuario).
    try { window.location.href = intent; } catch (_) { /* el botón queda como respaldo */ }
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-[#F4F5F8] px-6 flex flex-col items-center justify-center text-center">
      {failed ? (
        <>
          <h1 className="text-2xl font-bold">No pudimos completar el inicio de sesión</h1>
          <p className="text-[#a0a0a0] mt-3">Volvé a Atril e intentá de nuevo.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Volviendo a Atril…</h1>
          <p className="text-[#a0a0a0] mt-3">Si no se abre sola, tocá el botón.</p>
          {links && (
            <>
              <a
                href={links.intent}
                className="mt-8 h-12 px-8 rounded-full bg-[#8e9aaf] text-[#121212] font-bold flex items-center justify-center"
              >
                Abrir Atril
              </a>
              <a href={links.direct} className="mt-5 text-sm text-[#a0a0a0] underline">
                Probar otro método
              </a>
            </>
          )}
        </>
      )}
    </div>
  );
}
