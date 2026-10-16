import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clinicApi } from '../api';

const SESSION_KEY = 'clinic-portal-session';
const AuthContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(patient) {
  try {
    if (patient) localStorage.setItem(SESSION_KEY, JSON.stringify(patient));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable: session lasts until the tab is closed.
  }
}

export function AuthProvider({ children }) {
  const [patient, setPatient] = useState(readSession);

  const startSession = useCallback((profile) => {
    setPatient(profile);
    writeSession(profile);
    return profile;
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await clinicApi.login(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (data) => startSession(await clinicApi.registerPatient(data)),
    [startSession],
  );

  const logout = useCallback(() => {
    setPatient(null);
    writeSession(null);
  }, []);

  const value = useMemo(
    () => ({ patient, isAuthenticated: Boolean(patient), login, register, logout }),
    [patient, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
