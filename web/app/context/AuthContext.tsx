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
      // Check subscription status
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
    // Check subscription after login
    checkSubscription(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsPremium(false);
    localStorage.removeItem("zim_token");
    localStorage.removeItem("zim_user");
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
