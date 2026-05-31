import { useState } from "react";
import { motion } from "motion/react";
import {
  User,
  Bell,
  Moon,
  Lock,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Languages,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";
import type { Locale } from "../../i18n/translations";
import { formatCurrency } from "../../utils/format";
import ProfileSubScreens, { type ProfileSubView } from "./ProfileSubScreens";

interface ProfileScreenProps {
  onLogout: () => void;
}

const menuItems = [
  { id: "personal", icon: User, labelKey: "profile.personalInfo", color: "#079697" },
  { id: "notifications", icon: Bell, labelKey: "profile.notifications", color: "#5b6bf5", badge: "3" },
  { id: "security", icon: Lock, labelKey: "profile.security", color: "#ff6b9d" },
  { id: "payment", icon: CreditCard, labelKey: "profile.paymentMethods", color: "#ffd93d" },
  { id: "export", icon: FileText, labelKey: "profile.exportReport", color: "#079697" },
  { id: "help", icon: HelpCircle, labelKey: "profile.help", color: "#5b6bf5" },
] as const;

function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  const options: { value: Locale; label: string }[] = [
    { value: "pt", label: "PT" },
    { value: "en", label: "EN" },
  ];

  return (
    <div className="ff-card-lg p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ff-icon-chip">
        <Languages className="w-5 h-5" />
      </div>
      <span className="flex-1 text-left ff-text text-sm">{t("profile.language")}</span>
      <div
        className="flex gap-1 p-1 rounded-full"
        style={{
          backgroundColor: "var(--ff-accent-highlight)",
          border: "1px solid var(--ff-border)",
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              locale === option.value ? "text-white" : "ff-text-muted"
            }`}
            style={
              locale === option.value ? { backgroundColor: "var(--ff-cyan)" } : undefined
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DarkModeToggle() {
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      className="w-full ff-card-interactive p-4 flex items-center gap-4"
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "color-mix(in srgb, var(--ff-success) 20%, transparent)" }}
      >
        <Moon className="w-5 h-5" style={{ color: "var(--ff-success)" }} />
      </div>
      <span className="flex-1 text-left ff-text">{t("profile.darkMode")}</span>
      <div
        className={`w-12 h-6 rounded-full p-1 transition-colors ${
          isDark ? "ff-toggle-track-on" : "ff-toggle-track-off"
        }`}
      >
        <motion.div
          className="w-4 h-4 rounded-full bg-white"
          animate={{ x: isDark ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>
    </motion.button>
  );
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { goals, dashboardStats } = useFinance();
  const [subView, setSubView] = useState<ProfileSubView>(null);

  const activeGoals = goals.filter((g) => g.status === "active");
  const avgProgress =
    activeGoals.length > 0
      ? activeGoals.reduce((s, g) => s + (g.currentAmount / g.targetAmount) * 100, 0) /
        activeGoals.length
      : 0;

  if (subView) {
    return <ProfileSubScreens view={subView} onBack={() => setSubView(null)} />;
  }

  return (
    <div className="ff-page">
      <div className="p-6">
        <h2 className="ff-heading text-2xl mb-8">{t("profile.title")}</h2>

        <motion.div className="ff-card-lg p-6 mb-6" whileHover={{ scale: 1.01 }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full ff-avatar flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {user?.avatarInitials ?? "?"}
            </div>
            <div className="flex-1">
              <h3 className="ff-heading text-xl">{user?.fullName ?? ""}</h3>
              <p className="ff-text-muted text-sm">{user?.email ?? ""}</p>
              <div
                className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--ff-success) 20%, transparent)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--ff-success)" }}
                />
                <span className="text-xs" style={{ color: "var(--ff-success)" }}>
                  {t("profile.premiumMember")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="ff-card-lg p-4 text-center">
            <p className="ff-heading text-xl font-bold">{activeGoals.length}</p>
            <p className="ff-text-muted text-xs mt-1">{t("profile.statGoals")}</p>
          </div>
          <div className="ff-card-lg p-4 text-center">
            <p className="ff-heading text-xl font-bold">
              {formatCurrency(dashboardStats.accumulatedSavings)}
            </p>
            <p className="ff-text-muted text-xs mt-1">{t("profile.statSaved")}</p>
          </div>
          <div className="ff-card-lg p-4 text-center">
            <p className="ff-heading text-xl font-bold">{avgProgress.toFixed(0)}%</p>
            <p className="ff-text-muted text-xs mt-1">{t("profile.statProgress")}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <LanguageToggle />
          <DarkModeToggle />
        </div>

        <div className="space-y-3 mb-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setSubView(item.id as ProfileSubView)}
                className="w-full ff-card-interactive p-4 flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="flex-1 text-left ff-text">{t(item.labelKey)}</span>
                {"badge" in item && item.badge && (
                  <span
                    className="text-white text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: "var(--ff-expense)" }}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 ff-text-faint" />
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          onClick={onLogout}
          className="w-full ff-card-lg p-4 flex items-center justify-center gap-3 transition-all"
          style={{
            borderColor: "color-mix(in srgb, var(--ff-expense) 40%, transparent)",
          }}
          whileHover={{
            backgroundColor: "color-mix(in srgb, var(--ff-expense) 10%, var(--ff-surface))",
          }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" style={{ color: "var(--ff-expense)" }} />
          <span className="font-semibold" style={{ color: "var(--ff-expense)" }}>
            {t("profile.logOut")}
          </span>
        </motion.button>

        <div className="mt-6 text-center">
          <p className="ff-text-faint text-xs">FinanceFlow v1.0.0</p>
          <p className="ff-text-faint text-xs mt-1">{t("profile.rights")}</p>
        </div>
      </div>
    </div>
  );
}
