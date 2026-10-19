import React from 'react';
import { Music2 } from 'lucide-react';
import ScorePaper from '@/components/stage/ScorePaper';

// Miniatura de la partitura de una grabación. Usa la miniatura común (v3): página real o papel con el título.
export default function ScoreThumb({ song }) {
  if (!song) {
    return <div className="w-full h-full flex items-center justify-center bg-[#fffdf7] text-[#222329]/30"><Music2 size={22} /></div>;
  }
  return <ScorePaper song={song} className="w-full h-full !rounded-none" titleSize="text-[10px]" />;
}
