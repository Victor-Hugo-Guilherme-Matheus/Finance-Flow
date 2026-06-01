import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Achievement } from "../../services/achievementService";

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed bottom-24 z-50 px-4"
          style={{ left: 0, right: 0, maxWidth: "448px", margin: "0 auto" }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={onClose}
        >
          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: "linear-gradient(to right, color-mix(in srgb, var(--ff-blue) 30%, var(--ff-surface)), color-mix(in srgb, var(--ff-cyan) 30%, var(--ff-surface)))",
              border: "1px solid color-mix(in srgb, var(--ff-cyan) 40%, transparent)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: "color-mix(in srgb, var(--ff-cyan) 20%, transparent)" }}
            >
              {achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="ff-heading font-semibold text-sm">🎉 Conquista desbloqueada!</p>
              <p className="ff-text text-sm font-medium truncate">{achievement.title}</p>
              <p className="ff-text-muted text-xs truncate">{achievement.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}