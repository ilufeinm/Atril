export const THEME_MODES = ['dark', 'light', 'system'];

export function getThemeMode() {
  return localStorage.getItem('stage-theme-mode') || 'dark';
}

export function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

export function applyTheme(mode) {
  const dark = mode === 'system' ? systemPrefersDark() : mode === 'dark';
  localStorage.setItem('stage-theme-mode', mode);
  localStorage.setItem('stage-theme', dark ? 'dark' : 'light');
  document.documentElement.classList.toggle('stage-light', !dark);
  return dark;
}

export function initThemeListener() {
  applyTheme(getThemeMode());
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (getThemeMode() === 'system') applyTheme('system'); };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }
  return () => {};
}