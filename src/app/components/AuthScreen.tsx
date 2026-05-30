import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/dataService";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequired,
} from "../../utils/validation";
import { AlertMessage, FormField } from "./shared/UiHelpers";

type AuthView = "login" | "signup" | "forgot" | "reset";

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async () => {
    clearMessages();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setError(t(emailError ?? passwordError!));
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      onAuthenticated();
    } else {
      setError(t(result.error ?? "auth.invalidCredentials"));
    }
  };

  const handleSignup = async () => {
    clearMessages();
    const nameError = validateRequired(fullName, "validation.nameRequired");
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    if (nameError || emailError || passwordError || confirmError) {
      setError(t(nameError ?? emailError ?? passwordError ?? confirmError!));
      return;
    }

    setLoading(true);
    const result = await register({ fullName, email, password });
    setLoading(false);

    if (result.success) {
      onAuthenticated();
    } else {
      setError(t(result.error ?? "auth.registerFailed"));
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(t(emailError));
      return;
    }

    setLoading(true);
    const result = authService.requestPasswordReset(email);
    setLoading(false);

    if (result.success) {
      setResetToken(result.token);
      setSuccess(t("auth.resetEmailSent"));
      setView("reset");
    } else {
      setError(t(result.error ?? "auth.emailNotFound"));
    }
  };

  const handleResetPassword = async () => {
    clearMessages();
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    if (passwordError || confirmError) {
      setError(t(passwordError ?? confirmError!));
      return;
    }

    setLoading(true);
    const result = authService.resetPassword(resetToken, password);
    setLoading(false);

    if (result.success) {
      setSuccess(t("auth.passwordResetSuccess"));
      setTimeout(() => {
        setView("login");
        setPassword("");
        setConfirmPassword("");
        setSuccess("");
      }, 2000);
    } else {
      setError(t(result.error ?? "auth.resetFailed"));
    }
  };

  const titles: Record<AuthView, string> = {
    login: t("login.title"),
    signup: t("auth.signUpTitle"),
    forgot: t("auth.forgotTitle"),
    reset: t("auth.resetTitle"),
  };

  const subtitles: Record<AuthView, string> = {
    login: t("login.subtitle"),
    signup: t("auth.signUpSubtitle"),
    forgot: t("auth.forgotSubtitle"),
    reset: t("auth.resetSubtitle"),
  };

  return (
    <div className="ff-page flex items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom right, color-mix(in srgb, var(--ff-cyan) 10%, transparent), transparent, color-mix(in srgb, var(--ff-blue) 10%, transparent))",
        }}
      />

      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {view !== "login" && (
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setView(view === "reset" ? "forgot" : "login");
            }}
            className="flex items-center gap-2 mb-6 ff-text-muted text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </button>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold ff-heading mb-2">{titles[view]}</h1>
          <p className="ff-text-muted">{subtitles[view]}</p>
        </div>

        <div className="space-y-4">
          {view === "signup" && (
            <FormField label={t("auth.fullName")}>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <User className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                  className="ff-input px-12 py-4"
                  autoComplete="name"
                />
              </div>
            </FormField>
          )}

          {(view === "login" || view === "signup" || view === "forgot") && (
            <FormField label={t("login.email")}>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.email")}
                  className="ff-input px-12 py-4"
                  autoComplete="email"
                />
              </div>
            </FormField>
          )}

          {(view === "login" || view === "signup" || view === "reset") && (
            <FormField label={t("login.password")}>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.password")}
                  className="ff-input px-12 py-4"
                  autoComplete={view === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 ff-text-faint hover:opacity-80 transition-colors"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </FormField>
          )}

          {(view === "signup" || view === "reset") && (
            <FormField label={t("auth.confirmPassword")}>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("auth.confirmPassword")}
                  className="ff-input px-12 py-4"
                  autoComplete="new-password"
                />
              </div>
            </FormField>
          )}

          {view === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setView("forgot");
                }}
                className="text-sm transition-colors"
                style={{ color: "var(--ff-cyan)" }}
              >
                {t("login.forgotPassword")}
              </button>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AlertMessage type="error" message={error} />
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AlertMessage type="success" message={success} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => {
              if (view === "login") handleLogin();
              else if (view === "signup") handleSignup();
              else if (view === "forgot") handleForgotPassword();
              else handleResetPassword();
            }}
            disabled={loading}
            className="w-full ff-btn-primary px-6 py-4 disabled:opacity-60"
            whileTap={{ scale: 0.98 }}
          >
            {loading
              ? t("common.loading")
              : view === "login"
                ? t("login.signIn")
                : view === "signup"
                  ? t("auth.createAccount")
                  : view === "forgot"
                    ? t("auth.sendResetLink")
                    : t("auth.resetPassword")}
          </motion.button>

          {view === "login" && (
            <div className="text-center mt-6">
              <p className="ff-text-muted text-sm">
                {t("login.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setView("signup");
                  }}
                  className="transition-colors"
                  style={{ color: "var(--ff-cyan)" }}
                >
                  {t("login.signUp")}
                </button>
              </p>
            </div>
          )}

          {view === "signup" && (
            <div className="text-center mt-6">
              <p className="ff-text-muted text-sm">
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setView("login");
                  }}
                  className="transition-colors"
                  style={{ color: "var(--ff-cyan)" }}
                >
                  {t("login.signIn")}
                </button>
              </p>
            </div>
          )}
        </div>

        {view === "login" && (
          <>
            <div className="mt-12 flex items-center gap-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--ff-border)" }} />
              <span className="ff-text-faint text-sm">{t("login.orContinue")}</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--ff-border)" }} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="ff-card-interactive py-3 ff-text"
                onClick={() => setError(t("auth.socialNotAvailable"))}
              >
                Google
              </button>
              <button
                type="button"
                className="ff-card-interactive py-3 ff-text"
                onClick={() => setError(t("auth.socialNotAvailable"))}
              >
                Apple
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
