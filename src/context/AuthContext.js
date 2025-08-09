"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { apiCall, BASE_URL } from "@/lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [auth, setAuth] = useState({
    token: null,
    user: null,
    tempToken: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(token)
    const user = localStorage.getItem("user");
    if (token && user) {
      setAuth({ token, user: JSON.parse(user), tempToken: null });
    }
  }, []);

  const loginStepOne = async (username, password) => {
    try {
      const res = await apiCall({
        endpoint: "/api/superadmin/login-step-one",
        method: "POST",
        data: { username, password },
      });
      setAuth(prev => ({ ...prev, tempToken: res.tempToken || null }));
      return res;
    } catch (error) {
      throw error;
    }
  };

  const resendOtp = async (username) => {
    try {
      const res = await apiCall({
        endpoint: "/api/superadmin/resend-otp",
        method: "POST",
        data: { username },
      });
      return res;
    } catch (error) {
      throw error;
    }
  };

  const loginStepTwo = async (username, otp) => {
    try {
      const res = await apiCall({
        endpoint: "/api/superadmin/login-step-two",
        method: "POST",
        data: { username, otp },
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setAuth({ token: res.token, user: res.user, tempToken: null });
      router.replace("/dashboard/admin");
      return res;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null, tempToken: null });
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ 
      auth, 
      loginStepOne, 
      loginStepTwo, 
      resendOtp,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);