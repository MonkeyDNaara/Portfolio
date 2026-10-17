import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { api } from "./api.js";

const KEY = "portfolio_token";
const AuthContext = createContext(null);

function readToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken);

  const login = useCallback(async (username, password) => {
    const data = await api("/auth/login", { method: "POST", body: { username, password } });
    try {
      localStorage.setItem(KEY, data.access_token);
    } catch {
      /* storage can be blocked, the session then lasts until reload */
    }
    setToken(data.access_token);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
  }, []);

  const value = useMemo(() => ({ token, login, logout }), [token, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
