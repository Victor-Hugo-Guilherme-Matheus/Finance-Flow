import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { auth } from "../../services/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError("Erro ao criar conta. Verifique os dados.");
    } finally {
      setLoading(false);
    }
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold ff-heading mb-2">{t("login.title")}</h1>
          <p className="ff-text-muted">{t("login.subtitle")}</p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Mail className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
            </div>
            <input
              type="email"
              placeholder={t("login.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ff-input px-12 py-4"
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Lock className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("login.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ff-input px-12 py-4"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 ff-text-faint hover:opacity-80 transition-colors"
              style={{ color: "var(--ff-cyan)" }}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <motion.button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full ff-btn-primary px-6 py-4"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Entrando..." : t("login.signIn")}
          </motion.button>

          <div className="text-center mt-6">
            <p className="ff-text-muted text-sm">
              {t("login.noAccount")}{" "}
              <button
                onClick={handleSignUp}
                className="transition-colors"
                style={{ color: "var(--ff-cyan)" }}
              >
                {t("login.signUp")}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}