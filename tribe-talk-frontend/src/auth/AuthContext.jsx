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
        const res = await axiosInstance.get("/auth/validateUser", {
          maxRedirects: 0, // Don't follow redirects
          validateStatus: function (status) {
            // Only accept 200 as success, treat everything else (including 302) as error
            return status === 200;
          }
        });

        // Only set authenticated if we got a 200 response with user data
        if (res.status === 200 && res.data) {
          setIsAuthenticated(true);
          console.log("Validated user:", res.data);
          setUser(res.data);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        // Any error (including 302, 401, 403) means not authenticated
        console.log("User not authenticated:", error.response?.status || error.message);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateUser();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
