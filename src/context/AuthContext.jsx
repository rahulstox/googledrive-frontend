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
        // Logout on auth errors (401) or forbidden (403 - inactive)
        if (err.status === 401 || err.status === 403) {
          logout();
        }
      })
      .finally(() => setLoading(false));
  }, [token, user, logout]);

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === TOKEN_KEY) {
        const newToken = e.newValue;
        if (newToken) {
          setToken(newToken);
          const storedUser = localStorage.getItem(USER_KEY);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          setToken(null);
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
  }, []);

  const refreshUser = useCallback(() => {
    if (!token) return Promise.resolve();
    return api("/auth/me")
      .then((data) => {
        setUser(data.user);
        // Update local storage user just in case
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch((err) => {
        console.error("Auth refresh failed:", err);
        // Don't logout on refresh error unless it's 401 or 403
        if (err.status === 401 || err.status === 403) {
          logout();
        }
      });
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
