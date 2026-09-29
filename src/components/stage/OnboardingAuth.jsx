import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import { toast } from '@/components/ui/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const REDIRECT = '/bienvenida?step=listo';

export default function OnboardingAuth({ onBack }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setError(err.message || 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta');
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
      setError(err.message || 'El código de verificación no es válido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await base44.auth.resendOtp(email);
      toast({ title: 'Código enviado', description: 'Revisa tu correo para ver el nuevo código.' });
    } catch (err) {
      setError(err.message || 'No se pudo reenviar el código');
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider('google', REDIRECT);

  if (showOtp) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F4F5F8] px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col justify-center max-w-xl mx-auto">
        <button onClick={onBack} className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-8" aria-label="Volver"><ArrowLeft /></button>
        <span className="text-[#8e9aaf] text-xs font-bold tracking-widest">VERIFICACIÓN</span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">Verifica tu correo</h1>
        <p className="text-[#a0a0a0] mt-4 text-base leading-relaxed">Enviamos un código a <span className="text-white font-medium">{email}</span></p>

        {error && <div className="mt-6 p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">{error}</div>}

        <div className="flex justify-center mt-8">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
              <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <button onClick={handleVerify} disabled={loading || otpCode.length < 6} className="mt-8 w-full h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Loader2 className="animate-spin" size={18} /> Verificando…</> : <>Verificar <ArrowRight size={18} /></>}
        </button>
        <p className="text-center text-sm text-[#a0a0a0] mt-4">¿No recibiste el código? <button onClick={handleResend} className="text-[#8e9aaf] font-medium underline">Reenviar</button></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F4F5F8] px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col justify-center max-w-xl mx-auto">
      <button onClick={onBack} className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-8" aria-label="Volver"><ArrowLeft /></button>
      <span className="text-[#8e9aaf] text-xs font-bold tracking-widest">CUENTA</span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
      <p className="text-[#a0a0a0] mt-4 text-base leading-relaxed">{mode === 'login' ? 'Entrá a tu cuenta para continuar con la configuración.' : 'Creá tu cuenta para empezar a usar ScoreBook.'}</p>

      <button onClick={handleGoogle} className="mt-8 w-full h-12 rounded-full bg-[#1e1e22] border border-[#2b2b30] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#262629] transition-colors">
        <GoogleIcon className="w-5 h-5" /> Continuar con Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2b2b30]" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#121212] px-3 text-[#a0a0a0]">o</span></div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">{error}</div>}

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="stage-input pl-10" autoFocus />
          </div>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-2">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="stage-input pl-10" />
          </div>
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-sm text-white/60 mb-2">Confirmar contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="stage-input pl-10" />
            </div>
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-[#8e9aaf] text-[#121212] font-bold flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Loader2 className="animate-spin" size={18} /> {mode === 'login' ? 'Ingresando…' : 'Creando cuenta…'}</> : <>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="text-center text-sm text-[#a0a0a0] mt-6">
        {mode === 'login' ? '¿Aún no tenés cuenta? ' : '¿Ya tenés cuenta? '}
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-[#8e9aaf] font-medium underline">
          {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </p>
    </div>
  );
}