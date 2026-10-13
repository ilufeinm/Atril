import React, { useRef, useState } from 'react';
import { UserRound, Camera, Crown, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import { planLabel, isPremium } from '@/lib/subscription';

export default function ProfileHeader() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onPick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true); setErr('');
    base44.integrations.Core.UploadPublicFile({ file: f })
      .then(({ file_url }) => base44.auth.updateMe({ photo_url: file_url }))
      .then(() => setBusy(false))
      .catch((e) => { setErr(e.message || 'No se pudo actualizar la foto'); setBusy(false); });
  };

  return (
    <div className="glass rounded-[26px] p-5 sm:p-6">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {user?.photo_url ? (
            <Image src={user.photo_url} fittingType="fill" className="w-[72px] h-[72px] rounded-full object-cover" />
          ) : (
            <span className="w-[72px] h-[72px] rounded-full bg-[#c9ef72]/15 flex items-center justify-center text-[#c9ef72]"><UserRound size={32} /></span>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Cambiar foto" className="home-cta absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md disabled:opacity-60">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-extrabold text-[22px] tracking-tight truncate">{user?.full_name || 'Músico de Atril'}</h2>
          <p className="text-white/70 text-sm mt-0.5 truncate">{user?.email || 'Tu cuenta musical'}</p>
          <span className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${isPremium(user) ? 'bg-[#c9ef72]/20 text-[#c9ef72] font-bold' : 'bg-white/[.12] text-white/70 font-semibold'}`}>
            <Crown size={12} /> {planLabel(user)}
          </span>
        </div>
      </div>
      {err && <p className="text-xs text-red-300 mt-3">{err}</p>}
    </div>
  );
}