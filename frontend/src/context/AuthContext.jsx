import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("billing_auth_token") || null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      if (res.success && res.data) {
        setUser(res.data.user);
        setBusiness(res.data.business);
      }
    } catch (error) {
      console.warn("Failed to restore session:", error);
      setUser(null);
      setBusiness(null);
      setToken(null);
      localStorage.removeItem("billing_auth_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    const handleSessionExpired = () => {
      setUser(null);
      setBusiness(null);
      setToken(null);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [token, fetchProfile]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.success && res.data) {
      const { token: newToken, user: newUser, business: newBusiness } = res.data;
      localStorage.setItem("billing_auth_token", newToken);
      setToken(newToken);
      setUser(newUser);
      setBusiness(newBusiness);
      return res.data;
    }
    throw new Error(res.message || "Login failed");
  };

  const register = async (data) => {
    const res = await api.post("/auth/register", data);
    if (res.success && res.data) {
      const { token: newToken, user: newUser, business: newBusiness } = res.data;
      localStorage.setItem("billing_auth_token", newToken);
      setToken(newToken);
      setUser(newUser);
      setBusiness(newBusiness);
      return res.data;
    }
    throw new Error(res.message || "Registration failed");
  };

  const logout = () => {
    localStorage.removeItem("billing_auth_token");
    setToken(null);
    setUser(null);
    setBusiness(null);
  };

  const updateBusiness = (updatedBusiness) => {
    setBusiness(updatedBusiness);
  };

  const value = {
    user,
    business,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    updateBusiness,
    refreshProfile: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
