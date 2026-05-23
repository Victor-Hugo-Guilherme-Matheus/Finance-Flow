import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import LoginScreen from "./components/LoginScreen";
import HomeDashboard from "./components/HomeDashboard";
import AddExpenseScreen from "./components/AddExpenseScreen";
import FinancialGoalsScreen from "./components/FinancialGoalsScreen";
import ProfileScreen from "./components/ProfileScreen";
import BottomNavigation from "./components/BottomNavigation";
import { Plus } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"splash" | "login" | "app">("splash");
  const [activeScreen, setActiveScreen] = useState("home");
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentView("login");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setCurrentView("app");
  };

  const handleLogout = () => {
    setShowAddExpense(false);
    setActiveScreen("home");
    setCurrentView("login");
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeDashboard />;
      case "transactions":
        return <HomeDashboard />;
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

  if (currentView === "login") {
    return <LoginScreen onLogin={handleLogin} />;
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

      <motion.button
        onClick={() => setShowAddExpense(true)}
        className="ff-fab fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ maxWidth: "calc(448px - 3rem)", marginLeft: "auto", marginRight: "1.5rem" }}
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      <BottomNavigation activeScreen={activeScreen} onNavigate={setActiveScreen} />

      <AnimatePresence>
        {showAddExpense && <AddExpenseScreen onClose={() => setShowAddExpense(false)} />}
      </AnimatePresence>
    </div>
  );
}
