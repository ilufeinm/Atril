export const INSTRUMENTS = [
  { value: 'Voz', color: '#e879f9' },
  { value: 'Guitarra', color: '#f97316' },
  { value: 'Piano', color: '#3b82f6' },
  { value: 'Bajo', color: '#22c55e' },
  { value: 'Batería', color: '#ef4444' },
  { value: 'Saxofón', color: '#facc15' },
  { value: 'Vientos', color: '#06b6d4' },
  { value: 'Cuerdas', color: '#a78bfa' },
  { value: 'Otro', color: '#94a3b8' },
];

export const getInstrument = (v) => INSTRUMENTS.find((i) => i.value === v) || INSTRUMENTS[INSTRUMENTS.length - 1];
