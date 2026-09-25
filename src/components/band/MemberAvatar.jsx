import React from 'react';
import { getInstrument } from './instruments';

export default function MemberAvatar({ member, size = 44 }) {
  const inst = getInstrument(member?.instrument);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: (member?.color || inst.color) + '33', fontSize: size * 0.42 }}
      title={member?.instrument || 'Otro'}
    >
      {inst.emoji}
    </div>
  );
}