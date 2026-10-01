import React from 'react';
import { Image } from '@/components/ui/image';
import { Music2 } from 'lucide-react';

export default function ScoreThumb({ song }) {
  if (!song) {
    return <div className="w-full h-full flex items-center justify-center bg-[#1e1e22] text-white/25"><Music2 size={22} /></div>;
  }
  if (song.file_url) {
    if (song.file_url.toLowerCase().includes('.pdf')) {
      return <iframe title={`Partitura de ${song.title}`} src={`${song.file_url}#page=1&view=FitH&toolbar=0&navpanes=0`} className="w-full h-full" scrolling="no" />;
    }
    return <Image src={song.file_url} alt={`Partitura de ${song.title}`} className="w-full h-full" fittingType="fill" />;
  }
  return (
    <div className="w-full h-full bg-[#fffdf7] text-[#222329] flex flex-col items-center justify-center p-2 text-center">
      <div className="text-[7px] tracking-[.2em] text-[#8b8b84] font-semibold">SCOREBOOK</div>
      <div className="text-[10px] font-bold leading-tight mt-1 line-clamp-2">{song.title}</div>
      <div className="text-[7px] text-[#777970] mt-0.5">{song.key || 'Do'} · {song.bpm || ''} BPM</div>
    </div>
  );
}