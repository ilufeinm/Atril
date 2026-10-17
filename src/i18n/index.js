import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en/index.js';

// Idiomas de Atril. El castellano es el idioma base: los textos del código están en castellano y sirven de clave.
// Si a una clave le falta la traducción al inglés, se muestra el castellano (nunca un texto roto).
export const LANGUAGES = ['es', 'en'];
export const FALLBACK = 'es';
const STORAGE_KEY = 'atril-lang'; // preferencia manual: 'es' | 'en'. Sin valor = automático.

// Preferencia elegida a mano en Configuración (tiene prioridad sobre el dispositivo).
export function getManualLanguage() {
  try { const v = localStorage.getItem(STORAGE_KEY); return LANGUAGES.includes(v) ? v : null; } catch { return null; }
}

// Idioma del dispositivo. En la web es el del navegador; en Android (Capacitor) el WebView informa el del
// sistema en navigator.language, así que no hace falta ningún plugin ni permiso. Sin GPS ni ubicación.
// Se mira solo el idioma preferido: en-US / en-GB → inglés; es-AR / es-ES → castellano; cualquier otro → castellano.
export function getDeviceLanguage() {
  const primary = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || '';
  const base = primary.toLowerCase().split(/[-_]/)[0];
  return LANGUAGES.includes(base) ? base : FALLBACK;
}

export function resolveLanguage() {
  return getManualLanguage() || getDeviceLanguage();
}

// mode: 'auto' | 'es' | 'en'. 'auto' borra la preferencia y vuelve a seguir al dispositivo.
export function setLanguagePreference(mode) {
  try {
    if (mode === 'auto') localStorage.removeItem(STORAGE_KEY);
    else if (LANGUAGES.includes(mode)) localStorage.setItem(STORAGE_KEY, mode);
  } catch { /* sin almacenamiento: solo cambia esta sesión */ }
  return i18n.changeLanguage(mode === 'auto' ? getDeviceLanguage() : mode);
}

// Locale para fechas y números ("25 oct" / "Oct 25").
export function dateLocale(lang = i18n.language) {
  return lang === 'en' ? 'en-US' : 'es';
}

const syncHtmlLang = (lng) => { if (typeof document !== 'undefined') document.documentElement.lang = lng; };

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    lng: resolveLanguage(),
    fallbackLng: false, // sin traducción → la clave, que ya es el texto en castellano
    supportedLngs: LANGUAGES,
    keySeparator: false, // las claves son frases: pueden tener puntos
    nsSeparator: false, // y dos puntos
    interpolation: { escapeValue: false }, // React ya escapa
    returnEmptyString: false,
    react: { useSuspense: false },
  });

syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;

// Traducir fuera de React o en cualquier parte del código: tr('Texto en castellano', { variables }).
// El idioma queda fijo durante la sesión; al cambiarlo a mano en Configuración la app se recarga.
export const tr = (key, vars) => i18n.t(key, vars);
