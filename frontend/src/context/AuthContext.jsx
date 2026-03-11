import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, signOut as apiSignOut } from '../services/auth.service';
import { unsubscribePush } from '../services/user.service';

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

  const login = (userData) => setUser(userData);

  const logout = async () => {
    // Unsubscribe push on this device before signing out so the subscription
    // is not shared with the next account that logs in on this device.
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint).catch(() => {});
          await sub.unsubscribe();
        }
      }
    } catch {
      // best-effort — don't block logout
    }
    try {
      await apiSignOut();
    } catch {
      // cookie cleared server-side; ignore errors
    }
    setUser(null);
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
