import { createContext, useContext, useEffect, useState } from "react";
import { api, clearTokens, isAuthenticated, setTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    // simplejwt authenticates on the USERNAME_FIELD — the backend uses
    // Django's default `username`, so callers should pass that here.
    const data = await api.login({ username: email, password });
    setTokens({ access: data.access, refresh: data.refresh });
    const me = await api.me();
    setUser(me);
    return me;
  }

  async function register(payload, accountType = "student") {
    if (accountType === "teacher") {
      await api.registerTeacher(payload);
    } else if (accountType === "affiliate") {
      await api.registerAffiliate(payload);
    } else {
      await api.register(payload);
    }
    return login(payload.username, payload.password);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
