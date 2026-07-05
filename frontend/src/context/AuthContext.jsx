import { createContext, useContext, useState, useCallback } from "react";
import { logoutUser } from "../api/authApi";

const AuthContext = createContext(null);

// Decode JWT payload without a library — safe for reading claims only
const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const avatar = localStorage.getItem("avatar");
    const profileImageUrl = localStorage.getItem("profileImageUrl");
    return accessToken
      ? { accessToken, refreshToken, userId, username, avatar, profileImageUrl }
      : null;
  });

  const login = useCallback((data) => {
    const { accessToken, refreshToken } = data;
    // Decode JWT to get userId + username — works for both login and register
    const claims = decodeJwt(accessToken);
    const userId = data.userId || claims.userId || null;
    const username = data.username || claims.username || null;
    const avatar = data.avatar || claims.avatar || "nova";
    const profileImageUrl = data.profileImageUrl || claims.profileImageUrl || null;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    if (userId) localStorage.setItem("userId", userId);
    if (username) localStorage.setItem("username", username);
    localStorage.setItem("avatar", avatar);
    if (profileImageUrl) localStorage.setItem("profileImageUrl", profileImageUrl);
    else localStorage.removeItem("profileImageUrl");

    setAuth({ accessToken, refreshToken, userId, username, avatar, profileImageUrl });
  }, []);

  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    try {
      if (storedRefreshToken) await logoutUser(storedRefreshToken);
    } catch {
      // proceed regardless
    } finally {
      localStorage.clear();
      setAuth(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthenticated: !!auth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
