export const INSTRUMENTS = [
  { value: 'Voz', emoji: '🎤', color: '#e879f9' },
  { value: 'Guitarra', emoji: '🎸', color: '#f97316' },
  { value: 'Piano', emoji: '🎹', color: '#3b82f6' },
  { value: 'Bajo', emoji: '🎸', color: '#22c55e' },
  { value: 'Batería', emoji: '🥁', color: '#ef4444' },
  { value: 'Saxofón', emoji: '🎷', color: '#facc15' },
  { value: 'Vientos', emoji: '🎺', color: '#06b6d4' },
  { value: 'Cuerdas', emoji: '🎻', color: '#a78bfa' },
  { value: 'Otro', emoji: '🎵', color: '#94a3b8' },
];

export const getInstrument = (v) => INSTRUMENTS.find((i) => i.value === v) || INSTRUMENTS[INSTRUMENTS.length - 1];