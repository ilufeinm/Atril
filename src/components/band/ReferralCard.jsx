import React from 'react';
import { Gift, Copy, Check } from 'lucide-react';

export default function ReferralCard({ referralCount = 0, onShare, copied }) {
  const count = referralCount || 0;
  const progress = count % 5;
  const monthsEarned = Math.floor(count / 5);
  return (
    <div className="bg-gradient-to-br from-[#c9ef72]/10 to-[#8e9aaf]/10 rounded-2xl p-5 border border-[#c9ef72]/15">
      <div className="flex items-center gap-2 mb-1">
        <Gift size={16} className="text-[#c9ef72]" />
        <h3 className="font-bold text-sm">Invita músicos y ganá Premium</h3>
      </div>
      <p className="text-xs text-white/50 mb-4">Cada 5 músicos que se unan con tu link, ganás 1 mes de Premium gratis.</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-[#c9ef72] rounded-full transition-all duration-500" style={{ width: `${(progress / 5) * 100}%` }} />
        </div>
        <span className="text-sm font-bold text-white/80 tabular-nums">{progress}/5</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-white/45">{count} invitado{count === 1 ? '' : 's'} · {monthsEarned} mes{monthsEarned === 1 ? '' : 'es'} ganado{monthsEarned === 1 ? '' : 's'}</span>
        <button onClick={onShare} className="h-9 px-3.5 rounded-full bg-[#c9ef72] text-[#172013] text-sm font-bold flex items-center gap-1.5 shrink-0">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? '¡Copiado!' : 'Compartir link'}
        </button>
      </div>
    </div>
  );
}