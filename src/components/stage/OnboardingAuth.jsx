import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import { toast } from '@/components/ui/use-toast';
import { loginWithGoogle } from '@/lib/nativeAuth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import OnboardingTop, { ONBOARDING_SHEET } from '@/components/stage/OnboardingTop';
import { tr } from '@/i18n';

const REDIRECT = '/bienvenida?step=listo';
const SCREEN = 'relative isolate min-h-[100svh] bg-[#121212] text-[#F4F5F8] px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+24px)] flex flex-col max-w-xl mx-auto overflow-hidden';
const CTA = 'w-full h-[54px] rounded-full home-cta font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[.98] transition-transform';

// La partitura asoma arriba: la cuenta se siente parte del mismo recorrido.
const SheetBanner = () => (
  <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[236px] -z-10 overflow-hidden">
    <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 80% at 50% 40%, rgba(38,64,140,.5) 0%, rgba(18,18,18,0) 75%)' }} />
    <img src={ONBOARDING_SHEET} alt="" className="absolute left-1/2 top-[96px] w-[250px] -ml-[125px] rounded-[3px] shadow-[0_24px_50px_rgba(0,0,0,.55)]" />
    <div className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-b from-[#121212]/0 via-[#121212]/90 via-45% to-[#121212] to-75%" />
  </div>
);

export default function OnboardingAuth({ onBack, initialMode = 'register' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = REDIRECT;
    } catch (err) {
      setError(err.message || tr('Correo o contraseña incorrectos'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || tr('No se pudo crear la cuenta'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = REDIRECT;
    } catch (err) {
      setError(err.message || tr('El código de verificación no es válido'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await base44.auth.resendOtp(email);
      toast({ title: tr('Código enviado'), description: tr('Revisá tu correo para ver el nuevo código.'), variant: 'success' });
    } catch (err) {
      setError(err.message || tr('No se pudo reenviar el código'));
    }
  };

  const handleGoogle = () => loginWithGoogle(REDIRECT);

  if (showOtp) {
    return (
      <div className={SCREEN}>
        <OnboardingTop step={2} onBack={() => { setShowOtp(false); setError(''); }} />
        <h1 className="font-display text-[32px] leading-[1.08] font-extrabold tracking-tight mt-10">{tr('Verificá tu correo')}</h1>
        <p className="text-white/80 mt-3 text-[15px] leading-relaxed">{tr('Enviamos un código a')}{' '}<span className="text-white font-medium">{email}</span></p>

        {error && <div role="alert" className="mt-6 p-3 rounded-2xl bg-red-500/10 text-red-300 text-sm">{error}</div>}

        <div className="flex justify-center mt-8">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
              <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <button onClick={handleVerify} disabled={loading || otpCode.length < 6} className={`${CTA} mt-8`}>
          {loading ? <><Loader2 className="animate-spin" size={18} /> {tr('Verificando…')}</> : <>{tr('Verificar')}{' '}<ArrowRight size={18} /></>}
        </button>
        <p className="text-center text-sm text-white/75 mt-4">{tr('¿No recibiste el código?')}{' '}<button onClick={handleResend} className="text-white font-semibold underline underline-offset-[3px]">{tr('Reenviar')}</button></p>
      </div>
    );
  }

  const isLogin = mode === 'login';
  return (
    <div className={SCREEN}>
      <SheetBanner />
      <OnboardingTop step={2} onBack={onBack} />
      <h1 className="font-display text-[32px] leading-[1.08] font-extrabold tracking-tight mt-[158px]">{isLogin ? tr('Iniciar sesión') : tr('Creá tu cuenta')}</h1>
      <p className="text-white/80 mt-2 text-[15px] leading-relaxed">{isLogin ? tr('Entrá para ver tus partituras y tus shows.') : tr('Para guardar tus partituras y compartir repertorios con tu banda.')}</p>

      <button onClick={handleGoogle} className="mt-6 w-full h-[50px] rounded-full glass text-white font-semibold flex items-center justify-center gap-2.5 hover:bg-[#262629] transition-colors">
        <GoogleIcon className="w-5 h-5" /> {tr('Continuar con Google')}
      </button>

      <div className="flex items-center gap-3 my-4 text-[13px] text-white/60">
        <div className="flex-1 h-px bg-[#2b2b30]" />{tr('o con tu correo')}<div className="flex-1 h-px bg-[#2b2b30]" />
      </div>

      {error && <div role="alert" className="mb-4 p-3 rounded-2xl bg-red-500/10 text-red-300 text-sm">{error}</div>}

      <form onSubmit={isLogin ? handleLogin : handleRegister} className="flex flex-col flex-1">
        <div className="space-y-3">
          <div>
            <label htmlFor="ob-email" className="block text-[13px] text-white/75 mb-1.5">{tr('Correo electrónico')}</label>
            <div className="relative">
              <Mail aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-white/50 pointer-events-none" />
              <input id="ob-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tr('tu@correo.com')} className="stage-input !min-h-[50px] !pl-11" />
            </div>
          </div>
          <div>
            <label htmlFor="ob-password" className="block text-[13px] text-white/75 mb-1.5">{tr('Contraseña')}</label>
            <div className="relative">
              <Lock aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-white/50 pointer-events-none" />
              <input id="ob-password" type={showPw ? 'text' : 'password'} required minLength={isLogin ? undefined : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isLogin ? '••••••••' : tr('Mínimo 8 caracteres')} className="stage-input !min-h-[50px] !pl-11 !pr-12" />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} aria-label={showPw ? tr('Ocultar contraseña') : tr('Mostrar contraseña')} className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-white/70">
                {showPw ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>
          {isLogin && (
            <div className="text-right -mt-1"><Link to="/forgot-password" className="inline-block py-1.5 text-[13px] text-white/75 underline underline-offset-[3px]">{tr('¿Olvidaste tu contraseña?')}</Link></div>
          )}
        </div>
        <div className="mt-auto pt-6">
          <button type="submit" disabled={loading} className={CTA}>
            {loading ? <><Loader2 className="animate-spin" size={18} /> {isLogin ? tr('Ingresando…') : tr('Creando cuenta…')}</> : <>{isLogin ? tr('Iniciar sesión') : tr('Crear cuenta')} <ArrowRight size={18} /></>}
          </button>
          <p className="text-center text-sm text-white/75 mt-3">
            {isLogin ? tr('¿No tenés cuenta?') : tr('¿Ya tenés cuenta?')}{' '}
            <button type="button" onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }} className="text-white font-semibold underline underline-offset-[3px] py-1.5">
              {isLogin ? tr('Crear cuenta') : tr('Iniciar sesión')}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
