'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, authApi, getAuthToken } from './api';
import { AuthProfile } from './types';

interface AuthCtx {
  user: AuthProfile | null;
  loading: boolean;
  login(username: string, password: string): Promise<boolean>;
  loginError: string | null;
  logout(): void;
  refresh(): Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => false,
  loginError: null,
  logout: () => {},
  refresh: async () => {},
});

// Mirrors GreenPos/src/context/AuthContext.tsx's shape, but persists the
// token to localStorage (see lib/api.ts) so a page refresh doesn't force
// a re-login the way the mobile app's in-memory-only token does — that
// trade-off makes sense for a web back-office people keep open all day.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  const loadMe = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await authApi.me();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    function onExpired() {
      setUser(null);
      router.push('/login');
    }
    window.addEventListener('greenpos:session-expired', onExpired);
    return () => window.removeEventListener('greenpos:session-expired', onExpired);
  }, [router]);

  const login = useCallback(async (username: string, password: string) => {
    setLoginError(null);
    try {
      const profile = await authApi.login(username, password);
      setUser(profile);
      return true;
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Tidak bisa masuk.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => undefined);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <Ctx.Provider value={{ user, loading, login, loginError, logout, refresh: loadMe }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
