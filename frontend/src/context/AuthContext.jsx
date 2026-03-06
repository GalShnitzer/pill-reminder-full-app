import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, signOut as apiSignOut } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = (userData, token) => {
    if (token) localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiSignOut();
    } catch {
      // cookie cleared server-side; ignore errors
    }
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('theme');
  };

  const refreshUser = async () => {
    try {
      const { user } = await getMe();
      setUser(user);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
