import { motion } from "motion/react";
import { Home, Receipt, Target, User } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

interface BottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

const navItems = [
  { id: "home", icon: Home, labelKey: "nav.home" },
  { id: "transactions", icon: Receipt, labelKey: "nav.transactions" },
  { id: "goals", icon: Target, labelKey: "nav.goals" },
  { id: "profile", icon: User, labelKey: "nav.profile" },
] as const;

export default function BottomNavigation({ activeScreen, onNavigate }: BottomNavigationProps) {
  const { t } = useLanguage();

  return (
    <div className="ff-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const color = isActive ? "var(--ff-cyan)" : "var(--ff-text-muted)";

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center gap-1 py-2 px-4"
              whileTap={{ scale: 0.9 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl ff-nav-active"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon className="w-6 h-6 transition-colors" style={{ color }} />
                {isActive && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--ff-blue)" }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  />
                )}
              </div>
              <span className="text-xs transition-colors" style={{ color }}>
                {t(item.labelKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
