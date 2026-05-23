import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

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

          <div className="text-right">
            <button
              className="text-sm transition-colors"
              style={{ color: "var(--ff-cyan)" }}
            >
              {t("login.forgotPassword")}
            </button>
          </div>

          <motion.button
            onClick={onLogin}
            className="w-full ff-btn-primary px-6 py-4"
            whileTap={{ scale: 0.98 }}
          >
            {t("login.signIn")}
          </motion.button>

          <div className="text-center mt-6">
            <p className="ff-text-muted text-sm">
              {t("login.noAccount")}{" "}
              <button className="transition-colors" style={{ color: "var(--ff-cyan)" }}>
                {t("login.signUp")}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--ff-border)" }} />
          <span className="ff-text-faint text-sm">{t("login.orContinue")}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--ff-border)" }} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button className="ff-card-interactive py-3 ff-text">Google</button>
          <button className="ff-card-interactive py-3 ff-text">Apple</button>
        </div>
      </motion.div>
    </div>
  );
}
