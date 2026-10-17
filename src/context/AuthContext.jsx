import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clinicApi } from '../api';
import { setAuthToken, setUnauthorizedHandler } from '../api/httpClient';
import { useToast } from './ToastContext';

const SESSION_KEY = 'clinic-portal-session-v2';
const AuthContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.token && session?.patient ? session : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable: session lasts until the tab is closed.
  }
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(() => {
    const stored = readSession();
    setAuthToken(stored?.token ?? null);
    return stored;
  });

  const startSession = useCallback(({ token, patient }) => {
    const next = { token, patient };
    setAuthToken(token);
    setSession(next);
    writeSession(next);
    return patient;
  }, []);

  const endSession = useCallback(() => {
    setAuthToken(null);
    setSession(null);
    writeSession(null);
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await clinicApi.login(credentials)),
    [startSession],
  );

  /** Registers the patient and signs in with the same credentials. */
  const register = useCallback(async (data) => {
    await clinicApi.registerPatient(data);
    return startSession(await clinicApi.login({ documentNumber: data.documentNumber, password: data.password }));
  }, [startSession]);

  const logout = useCallback(() => {
    clinicApi.logout();
    endSession();
  }, [endSession]);

  // Expired or invalid token (e.g. the in-memory backend restarted): force a new login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession();
      toast.error('Tu sesión expiró. Inicia sesión nuevamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, [endSession, toast]);

  const value = useMemo(
    () => ({ patient: session?.patient ?? null, isAuthenticated: Boolean(session), login, register, logout }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
