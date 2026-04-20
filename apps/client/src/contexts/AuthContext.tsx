import React, { createContext, useContext, useState } from "react";
import { normalizeUserProfile } from "../lib/profile";
import type { AppUser } from "../lib/profile";

export type User = AppUser;

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return normalizeUserProfile(JSON.parse(storedUser) as User);
      } catch (err) {
        console.error("Failed to parse stored user", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  // Sync loading state if needed - but here we resolve immediately from localStorage

  const [loading] = useState(false);

  const login = (userData: User, jwt: string) => {
    const normalizedUser = normalizeUserProfile(userData);
    setUser(normalizedUser);
    setToken(jwt);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateUser = (userData: User) => {
    const normalizedUser = normalizeUserProfile(userData);
    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
