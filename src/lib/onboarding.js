// Estado del onboarding de StageBook.
// - Se marca completado cuando el usuario termina (o salta) la bienvenida.
// - Se limpia al cerrar sesión, de modo que la próxima apertura la muestre de nuevo.
const KEY = 'stage-onboarding-done';

export const isOnboardingDone = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

export const markOnboardingDone = () => {
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
};

export const clearOnboarding = () => {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
};