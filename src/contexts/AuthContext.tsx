import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { User, LoginCredentials, SignupCredentials } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder login function - connect to your backend
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Validation
      if (!credentials.name || !credentials.password) {
        return { success: false, error: "Name and password are required" };
      }

      if (credentials.password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" };
      }

      // Mock successful login
      const mockUser: User = {
        id: "user-1",
        name: credentials.name,
        email: credentials.email,
        createdAt: new Date(),
      };

      setUser(mockUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: "An error occurred during login" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Placeholder signup function - connect to your backend
  const signup = useCallback(async (credentials: SignupCredentials) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Validation
      if (!credentials.name || !credentials.password) {
        return { success: false, error: "Name and password are required" };
      }

      if (credentials.password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" };
      }

      if (credentials.password !== credentials.confirmPassword) {
        return { success: false, error: "Passwords do not match" };
      }

      // Mock successful signup
      const mockUser: User = {
        id: "user-" + Date.now(),
        name: credentials.name,
        email: credentials.email,
        createdAt: new Date(),
      };

      setUser(mockUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: "An error occurred during signup" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
