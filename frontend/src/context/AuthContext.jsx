import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  AUTH_TOKEN_KEY,
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile as updateProfileRequest,
} from "../api/client.js";

const AuthContext = createContext(null);

function getInitialToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getMe();
        if (isMounted) {
          setUser(data);
        }
      } catch {
        if (isMounted) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const setSession = (data) => {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (payload) => {
    const data = await loginUser(payload);
    setSession(data);
    return data.user;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    setSession(data);
    return data.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutUser();
      }
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const data = await getMe();
    setUser(data);
    return data;
  };

  const updateProfile = async (payload) => {
    const data = await updateProfileRequest(payload);
    setUser(data);
    return data;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: Boolean(user?.is_staff || user?.is_superuser),
      login,
      logout,
      register,
      refreshUser,
      updateProfile,
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
