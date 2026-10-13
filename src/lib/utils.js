import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Fecha local en formato AAAA-MM-DD. No usar toISOString() para "hoy":
// devuelve la fecha en UTC y en Argentina (UTC-3) pasa al día siguiente desde las 21:00.
export function localDateISO(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Fecha corta de show: "25 oct · 21:00". Acepta "AAAA-MM-DD" (sin corrimiento por zona horaria).
export function formatShowDate(date, time) {
  if (!date) return time || '';
  const d = new Date(`${date}T12:00:00`);
  if (isNaN(d)) return date;
  const day = d.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');
  return time ? `${day} · ${time}` : day;
}
