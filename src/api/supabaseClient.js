import { createClient } from '@supabase/supabase-js';

// Estas dos claves son PÚBLICAS por diseño (van en el navegador).
// La seguridad real la dan las políticas RLS de la base de datos.
// Se pueden sobreescribir con un archivo .env (ver .env.example).
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://jxoepizrwrhsbyvspbgg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NDmUShTK6nwwzni-tAwppg_R4ipmRJD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // "implicit": los enlaces de mail (recuperar contraseña) y el login con Google
    // funcionan aunque se abran en otro navegador o en la app de Android.
    flowType: 'implicit',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
