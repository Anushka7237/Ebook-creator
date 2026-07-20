import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await API.get("/api/auth/profile");
          setUser(res.data);
        } catch (err) {
          console.error("Token validation failed", err);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post("/api/auth/login", { email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem("token", token);
      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error("Login failed", err);
      const errMsg = err.response?.data?.message || "Invalid email or password";
      return { success: false, message: errMsg };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await API.post("/api/auth/register", { name, email, password });
      const { token } = res.data;
      localStorage.setItem("token", token);
      
      // Fetch user profile to populate context
      const profileRes = await API.get("/api/auth/profile");
      setUser(profileRes.data);
      return { success: true };
    } catch (err) {
      console.error("Registration failed", err);
      const errMsg = err.response?.data?.message || "Registration failed. Try again.";
      return { success: false, message: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateProfile = async (name, password) => {
    try {
      const res = await API.put("/api/auth/profile", { name, password });
      setUser((prev) => ({ ...prev, name: res.data.name }));
      return { success: true };
    } catch (err) {
      console.error("Profile update failed", err);
      const errMsg = err.response?.data?.message || "Update failed.";
      return { success: false, message: errMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
