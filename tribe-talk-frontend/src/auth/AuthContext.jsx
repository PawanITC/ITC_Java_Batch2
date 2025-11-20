// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import axiosInstance from "../services/axiosInstance";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Runs once when app loads
  useEffect(() => {
    const validateUser = async () => {
      try {
        const res = await axiosInstance.get("/auth/validateUser");
        setIsAuthenticated(true);
        console.log("Validated user:", res.data);
        setUser(res.data);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateUser();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated,setIsAuthenticated, user,setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
