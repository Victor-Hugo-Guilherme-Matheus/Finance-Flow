import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
    <div className="ff-app-shell">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* FAB global para adicionar transação rápida */}
      <motion.button
        onClick={() => setShowAddTransaction(true)}
        className="ff-fab fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ maxWidth: "calc(448px - 3rem)", marginLeft: "auto", marginRight: "1.5rem" }}
        aria-label="Adicionar transação"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      <BottomNavigation activeScreen={activeScreen} onNavigate={setActiveScreen} />

      <AnimatePresence>
        {showAddTransaction && (
          <TransactionFormModal onClose={() => setShowAddTransaction(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
