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
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type AuthProvider as FirebaseAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../services/firebase";
import { profilePhotoDoc, userDoc } from "../services/db";
import { getInitials } from "../utils/format";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarInitials?: string;
  photoURL?: string;
}

type Result = { success: boolean; error?: string };

export type SocialProvider = "google" | "apple";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (data: { fullName: string; email: string; password: string }) => Promise<Result>;
  requestPasswordReset: (email: string) => Promise<Result>;
  loginWithProvider: (provider: SocialProvider) => Promise<Result>;
  logout: () => void;
  updateProfile: (
    data: Partial<{ fullName: string; phone: string; avatarInitials: string }>
  ) => Promise<Result>;
  changePassword: (current: string, newPassword: string) => Promise<Result>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Traduz códigos de erro do Firebase Auth para chaves do i18n */
function authErrorKey(err: unknown, fallback: string): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "auth.invalidCredentials";
    case "auth/email-already-in-use":
      return "auth.emailExists";
    case "auth/weak-password":
      return "validation.passwordMin";
    case "auth/too-many-requests":
      return "auth.tooManyRequests";
    case "auth/network-request-failed":
      return "auth.networkError";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return "auth.socialCancelled";
    case "auth/account-exists-with-different-credential":
      return "auth.socialAccountExists";
    case "auth/operation-not-allowed":
    case "auth/unauthorized-domain":
      return "auth.socialNotAvailable";
    default:
      return fallback;
  }
}

/** Monta o usuário da interface a partir do perfil users/{uid} e da foto em settings/profilePhoto */
async function loadUser(firebaseUser: FirebaseUser): Promise<AuthUser> {
  const [profileSnap, photoSnap] = await Promise.all([
    getDoc(userDoc(firebaseUser.uid)),
    getDoc(profilePhotoDoc(firebaseUser.uid)).catch(() => null),
  ]);
  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const fullName = (profile.fullName as string) || firebaseUser.displayName || firebaseUser.email || "";
  return {
    id: firebaseUser.uid,
    fullName,
    email: (profile.email as string) || firebaseUser.email || "",
    phone: (profile.phone as string) ?? "",
    avatarInitials: (profile.avatarInitials as string) || getInitials(fullName),
    photoURL: photoSnap?.exists() ? (photoSnap.data().dataUrl as string) : undefined,
  };
}

function buildProvider(provider: SocialProvider): FirebaseAuthProvider {
  if (provider === "google") {
    const google = new GoogleAuthProvider();
    google.setCustomParameters({ prompt: "select_account" });
    return google;
  }
  const apple = new OAuthProvider("apple.com");
  apple.addScope("email");
  apple.addScope("name");
  return apple;
}

/** Na primeira entrada com Google/Apple, cria o perfil em users/{uid} */
async function ensureProfile(firebaseUser: FirebaseUser) {
  const ref = userDoc(firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const email = (firebaseUser.email ?? "").toLowerCase() || "sem e-mail";
  const fullName = (firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário").slice(0, 100);
  await setDoc(ref, {
    fullName,
    email,
    phone: "",
    avatarInitials: getInitials(fullName),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    setUser(await loadUser(firebaseUser));
  }, []);

  // Volta de um login por redirecionamento (usado quando o pop-up é bloqueado)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        await ensureProfile(result.user);
        setUser(await loadUser(result.user));
      })
      .catch((err) => console.error("Erro no login por redirecionamento:", err));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser ? await loadUser(firebaseUser) : null);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<Result> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true };
    } catch (err) {
      return { success: false, error: authErrorKey(err, "auth.invalidCredentials") };
    }
  };

  const register = async (data: { fullName: string; email: string; password: string }): Promise<Result> => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );
      const fullName = data.fullName.trim();
      const profile = {
        fullName,
        email: data.email.trim().toLowerCase(),
        phone: "",
        avatarInitials: getInitials(fullName),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDoc(firebaseUser.uid), profile);
      setUser({ id: firebaseUser.uid, ...profile, photoURL: undefined });
      return { success: true };
    } catch (err) {
      return { success: false, error: authErrorKey(err, "auth.registerFailed") };
    }
  };

  const requestPasswordReset = async (email: string): Promise<Result> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err) {
      const key = authErrorKey(err, "auth.resetFailed");
      // Não revela se o e-mail existe ou não
      if (key === "auth.invalidCredentials") return { success: true };
      return { success: false, error: key };
    }
  };

  const loginWithProvider = async (provider: SocialProvider): Promise<Result> => {
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, buildProvider(provider));
      await ensureProfile(firebaseUser);
      setUser(await loadUser(firebaseUser));
      return { success: true };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // navegadores que bloqueiam pop-up (comum no celular): usa redirecionamento
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, buildProvider(provider));
        return { success: true };
      }
      return { success: false, error: authErrorKey(err, "auth.socialFailed") };
    }
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
  };

  const updateProfile = async (
    data: Partial<{ fullName: string; phone: string; avatarInitials: string }>
  ): Promise<Result> => {
    if (!user) return { success: false, error: "auth.userNotFound" };
    try {
      const changes = {
        ...(data.fullName !== undefined && {
          fullName: data.fullName.trim(),
          avatarInitials: getInitials(data.fullName),
        }),
        ...(data.avatarInitials && { avatarInitials: data.avatarInitials.toUpperCase().slice(0, 3) }),
        ...(data.phone !== undefined && { phone: data.phone }),
      };
      await updateDoc(userDoc(user.id), { ...changes, updatedAt: serverTimestamp() });
      setUser({ ...user, ...changes });
      return { success: true };
    } catch {
      return { success: false, error: "auth.updateFailed" };
    }
  };

  const changePassword = async (current: string, newPassword: string): Promise<Result> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) return { success: false, error: "auth.userNotFound" };
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, current);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      return { success: true };
    } catch (err) {
      const key = authErrorKey(err, "auth.updateFailed");
      return { success: false, error: key === "auth.invalidCredentials" ? "auth.wrongPassword" : key };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        requestPasswordReset,
        loginWithProvider,
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
