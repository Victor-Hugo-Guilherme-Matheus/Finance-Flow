import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authService } from "../services/dataService";

type AuthUser = NonNullable<ReturnType<typeof authService.getCurrentUser>>;

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (
    data: Partial<{ fullName: string; email: string; phone: string; avatarInitials: string }>
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    current: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(() => {
    setUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    const sessionId = authService.getSession();
    if (sessionId) {
      const current = authService.getCurrentUser();
      if (current) setUser(current);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = authService.login(email, password);
    if (result.success) setUser(result.user);
    return result;
  };

  const register = async (data: { fullName: string; email: string; password: string }) => {
    const result = authService.register(data);
    if (result.success) setUser(result.user);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (
    data: Partial<{ fullName: string; email: string; phone: string; avatarInitials: string }>
  ) => {
    if (!user) return { success: false, error: "auth.userNotFound" };
    const result = authService.updateProfile(user.id, data);
    if (result.success) setUser(result.user);
    return result;
  };

  const changePassword = async (current: string, newPassword: string) => {
    if (!user) return { success: false, error: "auth.userNotFound" };
    return authService.changePassword(user.id, current, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
