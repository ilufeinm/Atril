import React from 'react';
import { Image } from '@/components/ui/image';
import { Music2 } from 'lucide-react';
import useSignedUrl from '@/hooks/useSignedUrl';
import BlurUp from '@/components/motion/BlurUp';
import { resolvePage } from '@/lib/songPages';

export default function ScoreThumb({ song }) {
  const resolved = song ? resolvePage(song, 1) : null;
  const thumbUri = song?.thumb_url || (resolved?.kind === 'image' ? resolved.src : null);
  const signedUrl = useSignedUrl(thumbUri);
  if (!song) {
    return <div className="w-full h-full flex items-center justify-center bg-[#1e1e22] text-white/25"><Music2 size={22} /></div>;
  }
  if (signedUrl) {
    return <BlurUp className="w-full h-full"><Image src={signedUrl} alt={`Partitura de ${song.title}`} className="w-full h-full" fittingType="fill" /></BlurUp>;
  }
  return (
    <div className="w-full h-full bg-[#fffdf7] text-[#222329] flex flex-col items-center justify-center p-2 text-center">
      <div className="text-[7px] tracking-[.2em] text-[#8b8b84] font-semibold">Atril</div>
      <div className="text-[10px] font-bold leading-tight mt-1 line-clamp-2">{song.title}</div>
      <div className="text-[7px] text-[#777970] mt-0.5">{song.key || 'Do'} · {song.bpm || ''} BPM</div>
    </div>
  );
}