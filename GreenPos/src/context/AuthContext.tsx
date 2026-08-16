import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { ApiError, authApi } from '../api';
import { AuthProfile } from '../types';

interface AuthCtx {
  user: AuthProfile | null;
  login(username: string, password: string): Promise<boolean>;
  loginError: string | null;
  logout(): void;
}

const Auth = createContext<AuthCtx>({
  user: null,
  login: async () => false,
  loginError: null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

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
  }, []);

  return (
    <Auth.Provider value={{ user, login, loginError, logout }}>
      {children}
    </Auth.Provider>
  );
}

export function useAuth() {
  return useContext(Auth);
}
