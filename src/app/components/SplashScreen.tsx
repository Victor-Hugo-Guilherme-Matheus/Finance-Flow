import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function SplashScreen() {
  const { t } = useLanguage();

  return (
    <div className="ff-page flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom right, color-mix(in srgb, var(--ff-cyan) 20%, transparent), transparent, color-mix(in srgb, var(--ff-blue) 20%, transparent))",
        }}
      />

      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: "var(--ff-cyan)",
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="relative"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-24 h-24 rounded-full ff-avatar p-1">
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--ff-bg)" }}
            >
              <Sparkles className="w-12 h-12" style={{ color: "var(--ff-cyan)" }} />
            </div>
          </div>
        </motion.div>

        <motion.h1
          className="mt-6 text-3xl font-bold ff-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          FinanceFlow
        </motion.h1>

        <motion.p
          className="mt-2 text-sm"
          style={{ color: "var(--ff-cyan)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {t("splash.tagline")}
        </motion.p>

        <motion.div
          className="mt-12 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--ff-cyan)" }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
