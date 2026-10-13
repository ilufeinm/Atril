import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { usesPlayBilling, syncPremium } from '@/lib/billing';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const u = await base44.auth.me();
      setUser(u);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status && error.status !== 401) {
        setAuthError({ type: 'unknown', message: error.message });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkAppState = checkUserAuth;

  useEffect(() => {
    checkUserAuth();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Se difiere con setTimeout: no hay que llamar a Supabase dentro de este callback.
      if (event === 'SIGNED_OUT') {
        setTimeout(() => { setUser(null); setIsAuthenticated(false); }, 0);
      } else if (event === 'SIGNED_IN') {
        setTimeout(() => { checkUserAuth(); }, 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [checkUserAuth]);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? window.location.origin : undefined);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // Tiempo real sobre el perfil: el plan Premium y otros datos se actualizan solos
  // cuando el servidor los cambia (por ejemplo el webhook de Stripe).
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = base44.entities.User.subscribe((event) => {
      if (event.id !== user.id) return;
      if (event.type === 'update') setUser((prev) => ({ ...(prev || {}), ...event.data, email: prev?.email ?? event.data?.email }));
      else if (event.type === 'delete') { setUser(null); setIsAuthenticated(false); }
    });
    return unsubscribe;
  }, [user?.id]);

  // Android: al abrir la app, re-verificar la suscripción de Google Play en el servidor.
  // Así se registran las renovaciones mensuales (premium_until se extiende) sin depender del celular.
  useEffect(() => {
    if (!user?.id || !usesPlayBilling()) return;
    syncPremium().catch(() => { /* sin conexión o sin Google Play: se reintenta en la próxima apertura */ });
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
