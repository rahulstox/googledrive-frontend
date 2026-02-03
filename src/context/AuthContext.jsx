import { createContext, useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

export const AuthContext = createContext(null);

const TOKEN_KEY = "drive_token";
const USER_KEY = "drive_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!token);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // If user is already loaded (e.g. from login), don't refetch
    if (user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api("/auth/me")
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        // Only logout on auth errors (401)
        if (err.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, [token, user]);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
