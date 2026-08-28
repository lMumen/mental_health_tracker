import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const value = localStorage.getItem('user');
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const value = useMemo(() => ({
    user, token, isAuthenticated: Boolean(user && token),
    login(userData, authToken) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);
      setUser(userData); setToken(authToken);
    },
    logout() {
      localStorage.removeItem('user'); localStorage.removeItem('token');
      setUser(null); setToken(null);
    },
  }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
