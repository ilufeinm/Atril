import React from 'react';

// Iniciales del integrante sobre tonos de la marca (antes: emoji del instrumento sobre colores sueltos).
const TONES = ['#22355F', '#34467A', '#2C2C31', '#3A3A40'];

const initials = (name) => (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·';

export default function MemberAvatar({ member, size = 44 }) {
  const name = member?.name || '';
  const tone = TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];
  return (
    <div
      aria-hidden="true"
      className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{ width: size, height: size, background: tone, color: '#F2F3F5', fontSize: Math.round(size * 0.34) }}
    >
      {initials(name)}
    </div>
  );
}
