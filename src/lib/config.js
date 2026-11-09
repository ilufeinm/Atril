// Dirección pública de la web de Atril: links de invitación, correos de la cuenta y compartir.
// Es la misma que figura en la ficha de Google Play. Si algún día se compra un dominio propio
// (por ejemplo atril.app), se cambia acá y esta dirección tiene que seguir andando para los links viejos.
// Antes era https://atril.base44.app: esa es la app vieja de Base44, con la base de datos de antes de la migración.
export const PUBLIC_BASE_URL = 'https://atril.atrilapp.workers.dev';

// URL de Google Play para descargar la app de Android.
// El ID de paquete es com.scorebook.musicapp (applicationId en android/app/build.gradle) y no se puede cambiar.
// "com.stagebook.app" era un error de las notas viejas: Play responde "No se ha encontrado".
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.scorebook.musicapp';
