// src/auth/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/* ===============================
   Provider
================================ */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user'))
  );

  function login(data) {
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  }

  function logout() {
    localStorage.removeItem('user');
    setUser(null);
  }

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
