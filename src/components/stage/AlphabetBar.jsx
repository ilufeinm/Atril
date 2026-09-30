import React from 'react';

const ALL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export default function AlphabetBar({ letters, onJump }) {
  if (!letters || letters.length < 2) return null;
  const set = new Set(letters);
  return (
    <div className="fixed right-1 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center select-none">
      {ALL.map((l) => (
        <button
          key={l}
          onClick={() => set.has(l) && onJump(l)}
          disabled={!set.has(l)}
          className={`text-[9px] font-bold w-5 h-3 flex items-center justify-center transition-colors ${set.has(l) ? 'text-[#8e9aaf] hover:bg-white/10 rounded' : 'text-white/15'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}