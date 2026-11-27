import { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import AuthScreen from "./components/AuthScreen";
import HomeDashboard from "./components/HomeDashboard";
import TransactionsScreen from "./components/TransactionsScreen";
import TransactionFormModal from "./components/TransactionFormModal";
import FinancialGoalsScreen from "./components/FinancialGoalsScreen";
import ProfileScreen from "./components/ProfileScreen";
import BottomNavigation from "./components/BottomNavigation";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<"splash" | "auth" | "app">("splash");
  const [activeScreen, setActiveScreen] = useState("home");
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentView(user ? "app" : "auth");
    }, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!isLoading && user && currentView === "auth") {
      setCurrentView("app");
    }
  }, [user, isLoading, currentView]);

  const handleAuthenticated = () => {
    setCurrentView("app");
  };

  const handleLogout = () => {
    logout();
    setShowAddTransaction(false);
    setActiveScreen("home");
    setCurrentView("auth");
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeDashboard />;
      case "transactions":
        return <TransactionsScreen />;
      case "goals":
        return <FinancialGoalsScreen />;
      case "profile":
        return <ProfileScreen onLogout={handleLogout} />;
      default:
        return <HomeDashboard />;
    }
  };

  if (currentView === "splash") {
    return <SplashScreen />;
  }

  if (currentView === "auth" || !user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="ff-app-shell">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeScreen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Atalho para nova transação só na tela inicial: Transações e Metas já têm o "+" no cabeçalho */}
      <AnimatePresence>
        {activeScreen === "home" && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-50">
            <motion.button
              onClick={() => setShowAddTransaction(true)}
              className="ff-fab pointer-events-auto ml-auto mr-5 w-14 h-14 rounded-full flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Adicionar transação"
            >
              <Plus className="w-7 h-7" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <BottomNavigation activeScreen={activeScreen} onNavigate={setActiveScreen} />

      <AnimatePresence>
        {showAddTransaction && (
          <TransactionFormModal onClose={() => setShowAddTransaction(false)} />
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}

export default function App() {
  return <AppContent />;
}
