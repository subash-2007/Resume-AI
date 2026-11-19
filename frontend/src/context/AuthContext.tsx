import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiLogin, apiRegister, apiGetMe } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; role?: string; organization_name?: string }) => Promise<User>;
  logout: () => void;
  loginAsDemo: (demoRole: 'hr' | 'candidate') => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('resumeai_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('resumeai_token');
      if (storedToken) {
        try {
          const res = await apiGetMe();
          setUser(res.data);
        } catch (e) {
          console.error("Token verification failed:", e);
          localStorage.removeItem('resumeai_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await apiLogin({ email, password: pass });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('resumeai_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (data: { email: string; password: string; full_name: string; role?: string; organization_name?: string }): Promise<User> => {
    const res = await apiRegister(data);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('resumeai_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('resumeai_token');
    setToken(null);
    setUser(null);
  };

  const loginAsDemo = async (demoRole: 'hr' | 'candidate'): Promise<User> => {
    if (demoRole === 'hr') {
      return await login('hr@resumeai.io', 'Password123!');
    } else {
      return await login('candidate@resumeai.io', 'Password123!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginAsDemo,
      }}
    >
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

