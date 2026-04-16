"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  grade: string;
  avatarColour: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isPremium: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isPremium: false,
  login: () => {},
  logout: () => {},
  loading: true,
});

// Cookie helpers
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("zim_token");
    const storedUser = localStorage.getItem("zim_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Ensure cookie is set (in case it was cleared)
      setCookie("zim_token", storedToken, 7);
      checkSubscription(storedToken);
    }
    setLoading(false);
  }, []);

  const checkSubscription = async (authToken: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/subscriptions/status`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setIsPremium(data.isPremium);
      }
    } catch {
      // silent fail — default to false
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("zim_token", newToken);
    localStorage.setItem("zim_user", JSON.stringify(newUser));
    // Also set cookie so middleware can read it
    setCookie("zim_token", newToken, 7);
    checkSubscription(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsPremium(false);
    localStorage.removeItem("zim_token");
    localStorage.removeItem("zim_user");
    deleteCookie("zim_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, isPremium, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
