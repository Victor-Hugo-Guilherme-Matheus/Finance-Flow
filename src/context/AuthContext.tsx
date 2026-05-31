import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarInitials?: string;
}

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

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
    if (docSnap.exists()) {
      setUser({ id: firebaseUser.uid, ...docSnap.data() } as AuthUser);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (docSnap.exists()) {
          setUser({ id: firebaseUser.uid, ...docSnap.data() } as AuthUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch {
      return { success: false, error: "auth.invalidCredentials" };
    }
  };

  const register = async (data: { fullName: string; email: string; password: string }) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const userData = {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: "",
        avatarInitials: data.fullName.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      };
      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      setUser({ id: firebaseUser.uid, ...userData });
      return { success: true };
    } catch {
      return { success: false, error: "auth.registerFailed" };
    }
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
  };

  const updateProfile = async (
    data: Partial<{ fullName: string; email: string; phone: string; avatarInitials: string }>
  ) => {
    if (!user) return { success: false, error: "auth.userNotFound" };
    try {
      await updateDoc(doc(db, "users", user.id), data);
      setUser({ ...user, ...data });
      return { success: true };
    } catch {
      return { success: false, error: "auth.updateFailed" };
    }
  };

  const changePassword = async (current: string, newPassword: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) return { success: false, error: "auth.userNotFound" };
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, current);
     await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      return { success: true };
    } catch {
      return { success: false, error: "auth.wrongPassword" };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, updateProfile, changePassword, refreshUser }}
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