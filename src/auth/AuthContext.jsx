// src/auth/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import { apiPost } from '../api/api';
import {
  getQueuedTransactions,
  clearQueue
} from '../component/offlineQueue';
import { useToast } from './../component/ToastContext';

const AuthContext = createContext(null);

/* ===============================
   Provider
================================ */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user'))
  );

  const { showToast } = useToast();

  function login(data) {
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  }

  function logout() {
    localStorage.removeItem('user');
    setUser(null);
  }

  /* ===============================
     Offline Queue Sync
  ================================ */

  useEffect(() => {
    if (!user) return;

    async function flushOfflineQueue() {
      const queue = getQueuedTransactions();
      if (!queue.length) return;

      for (const item of queue) {
        try {
          await apiPost(item.action, item.payload, item.user);
        } catch (err) {
          // Stop retrying if still offline or server error
          return;
        }
      }

      clearQueue();
      showToast('Offline transactions synced', 'success');
    }

    // Run on app load
    flushOfflineQueue();

    // Run when network is back
    window.addEventListener('online', flushOfflineQueue);

    return () => {
      window.removeEventListener('online', flushOfflineQueue);
    };
  }, [user, showToast]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ===============================
   Custom Hook
================================ */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
