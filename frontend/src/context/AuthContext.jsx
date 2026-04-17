import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("mediconnect_token");
    const savedUser = localStorage.getItem("mediconnect_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("mediconnect_user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("mediconnect_token", authToken);
    localStorage.setItem("mediconnect_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("mediconnect_token");
    localStorage.removeItem("mediconnect_user");
  };

  const updateUser = (partialUserData) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...partialUserData };
      localStorage.setItem("mediconnect_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const isPatient = user?.role === "patient";
  const isDoctor = user?.role === "doctor";
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isPatient, isDoctor, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
