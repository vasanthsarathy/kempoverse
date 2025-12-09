import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { LoginRequest, LoginResponse } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'kempoverse_token';
const EXPIRES_KEY = 'kempoverse_expires';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedExpires = localStorage.getItem(EXPIRES_KEY);

    if (storedToken && storedExpires) {
      const expiresAt = new Date(storedExpires);
      if (expiresAt > new Date()) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        // Token expired, clean up
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRES_KEY);
      }
    }
  }, []);

  const login = async (password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password } as LoginRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const { data } = await response.json();
    const { token: newToken, expiresAt } = data as LoginResponse;

    // Store token and expiration
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(EXPIRES_KEY, expiresAt);

    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
