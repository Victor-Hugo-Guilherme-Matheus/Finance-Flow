import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Plus, Star, Trash2, Edit, Smartphone, Shield } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";
import type { PaymentCard, UserPreferences } from "../../types";
import { exportToCSV, exportToPDF } from "../../utils/exportReport";
import { formatCurrency } from "../../utils/format";
import {
  detectCardBrand,
  maskCardNumber,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
} from "../../utils/validation";
import { generateId } from "../../utils/format";
import { AlertMessage, BackHeader, FormField } from "./shared/UiHelpers";

export type ProfileSubView =
  | null
  | "personal"
  | "notifications"
  | "security"
  | "payment"
  | "export"
  | "help";

interface ProfileSubScreensProps {
  view: ProfileSubView;
  onBack: () => void;
}

export default function ProfileSubScreens({ view, onBack }: ProfileSubScreensProps) {
  if (!view) return null;

  const screens: Record<Exclude<ProfileSubView, null>, ReactNode> = {
    personal: <PersonalInfoScreen onBack={onBack} />,
    notifications: <NotificationsScreen onBack={onBack} />,
    security: <SecurityScreen onBack={onBack} />,
    payment: <PaymentMethodsScreen onBack={onBack} />,
    export: <ExportReportScreen onBack={onBack} />,
    help: <HelpSupportScreen onBack={onBack} />,
  };

  return (
    <div className="ff-page">
      <div className="p-6">{screens[view]}</div>
    </div>
  );
}

function PersonalInfoScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarInitials, setAvatarInitials] = useState(user?.avatarInitials ?? "");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSave = async () => {
    const nameError = validateRequired(fullName, "validation.nameRequired");
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    if (nameError || emailError || phoneError) {
      setMessage({ type: "error", text: t(nameError ?? emailError ?? phoneError!) });
      return;
    }

    const result = await updateProfile({ fullName, email, phone, avatarInitials });
    if (result.success) {
      setMessage({ type: "success", text: t("profile.saved") });
    } else {
      setMessage({ type: "error", text: t(result.error ?? "common.error") });
    }
  };

  return (
    <>
      <BackHeader title={t("profile.personalInfo")} onBack={onBack} />
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full ff-avatar flex items-center justify-center text-3xl font-bold">
            {avatarInitials || "?"}
          </div>
          <button
            type="button"
            onClick={() => {
              const initials = window.prompt(t("profile.avatarPrompt"), avatarInitials);
              if (initials && initials.length <= 3) setAvatarInitials(initials.toUpperCase());
            }}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full ff-fab flex items-center justify-center text-xs"
          >
            <Edit className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <FormField label={t("auth.fullName")}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="ff-input px-4 py-3" />
        </FormField>
        <FormField label={t("login.email")}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ff-input px-4 py-3" />
        </FormField>
        <FormField label={t("profile.phone")}>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="ff-input px-4 py-3" placeholder="(11) 99999-9999" />
        </FormField>
        {message && <AlertMessage type={message.type} message={message.text} />}
        <motion.button type="button" onClick={handleSave} className="w-full ff-btn-primary py-4" whileTap={{ scale: 0.98 }}>
          {t("common.save")}
        </motion.button>
      </div>
    </>
  );
}

function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { preferences, updatePreferences } = useFinance();
  const [prefs, setPrefs] = useState(preferences.notifications);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    updatePreferences({ ...preferences, notifications: updated });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items: { key: keyof typeof prefs; label: string }[] = [
    { key: "income", label: t("profile.notif.income") },
    { key: "expenses", label: t("profile.notif.expenses") },
    { key: "goals", label: t("profile.notif.goals") },
    { key: "reports", label: t("profile.notif.reports") },
    { key: "reminders", label: t("profile.notif.reminders") },
  ];

  return (
    <>
      <BackHeader title={t("profile.notifications")} onBack={onBack} />
      <div className="space-y-3">
        {items.map(({ key, label }) => (
          <div key={key} className="ff-card-lg p-4 flex items-center justify-between">
            <span className="ff-text text-sm">{label}</span>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${prefs[key] ? "ff-toggle-track-on" : "ff-toggle-track-off"}`}
              aria-pressed={prefs[key]}
            >
              <div
                className="w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: prefs[key] ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
          </div>
        ))}
        {saved && <AlertMessage type="success" message={t("profile.saved")} />}
      </div>
    </>
  );
}

function SecurityScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { changePassword } = useAuth();
  const { preferences, updatePreferences } = useFinance();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleChangePassword = async () => {
    const currentError = validatePassword(currentPassword);
    const newError = validatePassword(newPassword);
    if (currentError || newError) {
      setMessage({ type: "error", text: t(currentError ?? newError!) });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("validation.passwordMismatch") });
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      setMessage({ type: "success", text: t("profile.passwordChanged") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: t(result.error ?? "common.error") });
    }
  };

  const toggleSecurity = (key: "twoFactorEnabled" | "biometricEnabled") => {
    const updated = {
      ...preferences,
      security: {
        ...preferences.security,
        [key]: !preferences.security[key],
      },
    };
    updatePreferences(updated);
  };

  const logoutSession = (sessionId: string) => {
    const updated = {
      ...preferences,
      security: {
        ...preferences.security,
        sessions: preferences.security.sessions.filter((s) => s.id !== sessionId),
      },
    };
    updatePreferences(updated);
  };

  return (
    <>
      <BackHeader title={t("profile.security")} onBack={onBack} />

      <h3 className="ff-heading font-semibold mb-3 text-sm">{t("profile.changePassword")}</h3>
      <div className="space-y-3 mb-6">
        <input
          type={showPassword ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t("profile.currentPassword")}
          className="ff-input px-4 py-3"
        />
        <input
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t("profile.newPassword")}
          className="ff-input px-4 py-3"
        />
        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("auth.confirmPassword")}
          className="ff-input px-4 py-3"
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm" style={{ color: "var(--ff-cyan)" }}>
          {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
        </button>
        <motion.button type="button" onClick={handleChangePassword} className="w-full ff-btn-primary py-3" whileTap={{ scale: 0.98 }}>
          {t("profile.changePassword")}
        </motion.button>
      </div>

      <h3 className="ff-heading font-semibold mb-3 text-sm">{t("profile.twoFactor")}</h3>
      <div className="ff-card-lg p-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
          <span className="ff-text text-sm">{t("profile.twoFactor")}</span>
        </div>
        <button
          type="button"
          onClick={() => toggleSecurity("twoFactorEnabled")}
          className={`w-12 h-6 rounded-full p-1 ${preferences.security.twoFactorEnabled ? "ff-toggle-track-on" : "ff-toggle-track-off"}`}
        >
          <div className="w-4 h-4 rounded-full bg-white" style={{ transform: preferences.security.twoFactorEnabled ? "translateX(24px)" : "translateX(0)" }} />
        </button>
      </div>

      <div className="ff-card-lg p-4 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5" style={{ color: "var(--ff-blue)" }} />
          <span className="ff-text text-sm">{t("profile.biometric")}</span>
        </div>
        <button
          type="button"
          onClick={() => toggleSecurity("biometricEnabled")}
          className={`w-12 h-6 rounded-full p-1 ${preferences.security.biometricEnabled ? "ff-toggle-track-on" : "ff-toggle-track-off"}`}
        >
          <div className="w-4 h-4 rounded-full bg-white" style={{ transform: preferences.security.biometricEnabled ? "translateX(24px)" : "translateX(0)" }} />
        </button>
      </div>

      <h3 className="ff-heading font-semibold mb-3 text-sm">{t("profile.activeSessions")}</h3>
      <div className="space-y-3 mb-4">
        {preferences.security.sessions.map((session) => (
          <div key={session.id} className="ff-card-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="ff-text text-sm font-medium">{session.device}</p>
                <p className="ff-text-muted text-xs">{session.location}</p>
                {session.isCurrent && (
                  <span className="text-xs" style={{ color: "var(--ff-success)" }}>
                    {t("profile.currentSession")}
                  </span>
                )}
              </div>
              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => logoutSession(session.id)}
                  className="text-xs"
                  style={{ color: "var(--ff-expense)" }}
                >
                  {t("profile.logoutDevice")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {message && <AlertMessage type={message.type} message={message.text} />}
    </>
  );
}

function PaymentMethodsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { cards, updateCards } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null);
  const [form, setForm] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
    holderName: "",
    type: "credit" as "credit" | "debit",
  });

  const resetForm = () => {
    setForm({ name: "", number: "", expiry: "", cvv: "", holderName: "", type: "credit" });
    setEditingCard(null);
    setShowForm(false);
  };

  const handleSaveCard = () => {
    if (!form.name || !form.number || !form.expiry || !form.holderName) return;

    const brand = detectCardBrand(form.number) as PaymentCard["brand"];
    const cardData: PaymentCard = {
      id: editingCard?.id ?? generateId(),
      name: form.name,
      number: form.number.replace(/\D/g, ""),
      expiry: form.expiry,
      cvv: form.cvv,
      brand,
      holderName: form.holderName,
      type: form.type,
      isPrimary: editingCard?.isPrimary ?? cards.length === 0,
      isHidden: editingCard?.isHidden ?? false,
    };

    if (editingCard) {
      updateCards(cards.map((c) => (c.id === editingCard.id ? cardData : c)));
    } else {
      updateCards([...cards, cardData]);
    }
    resetForm();
  };

  const toggleHidden = (id: string) => {
    updateCards(cards.map((c) => (c.id === id ? { ...c, isHidden: !c.isHidden } : c)));
  };

  const setPrimary = (id: string) => {
    updateCards(cards.map((c) => ({ ...c, isPrimary: c.id === id })));
  };

  const removeCard = (id: string) => {
    if (window.confirm(t("profile.confirmRemoveCard"))) {
      updateCards(cards.filter((c) => c.id !== id));
    }
  };

  return (
    <>
      <BackHeader title={t("profile.paymentMethods")} onBack={onBack} />

      <div className="space-y-3 mb-6">
        {cards.map((card) => (
          <div key={card.id} className="ff-card-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="ff-heading font-semibold">{card.name}</p>
                  {card.isPrimary && (
                    <Star className="w-4 h-4" style={{ color: "var(--ff-warning)" }} fill="var(--ff-warning)" />
                  )}
                </div>
                <p className="ff-text-muted text-sm">
                  {card.isHidden ? maskCardNumber(card.number) : card.number.replace(/(\d{4})/g, "$1 ").trim()}
                </p>
                <p className="ff-text-muted text-xs mt-1">
                  {card.holderName} · {t(`profile.cardType.${card.type}`)} · {card.brand.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button type="button" onClick={() => toggleHidden(card.id)} className="text-xs px-3 py-1 ff-card-interactive rounded-full flex items-center gap-1">
                {card.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {card.isHidden ? t("profile.showData") : t("profile.hideData")}
              </button>
              {!card.isPrimary && (
                <button type="button" onClick={() => setPrimary(card.id)} className="text-xs px-3 py-1 ff-card-interactive rounded-full">
                  {t("profile.setPrimary")}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingCard(card);
                  setForm({
                    name: card.name,
                    number: card.number,
                    expiry: card.expiry,
                    cvv: card.cvv,
                    holderName: card.holderName,
                    type: card.type,
                  });
                  setShowForm(true);
                }}
                className="text-xs px-3 py-1 ff-card-interactive rounded-full"
              >
                {t("common.edit")}
              </button>
              <button type="button" onClick={() => removeCard(card.id)} className="text-xs px-3 py-1 rounded-full" style={{ color: "var(--ff-expense)" }}>
                <Trash2 className="w-3 h-3 inline" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <motion.button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full ff-card-interactive py-4 flex items-center justify-center gap-2"
          style={{ color: "var(--ff-cyan)" }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          {t("profile.addCard")}
        </motion.button>
      ) : (
        <div className="ff-card-lg p-4 space-y-3">
          <FormField label={t("profile.cardName")}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ff-input px-4 py-3" />
          </FormField>
          <FormField label={t("profile.cardNumber")}>
            <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="ff-input px-4 py-3" maxLength={19} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("profile.cardExpiry")}>
              <input value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="ff-input px-4 py-3" placeholder="MM/AA" />
            </FormField>
            <FormField label="CVV">
              <input value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} className="ff-input px-4 py-3" maxLength={4} type="password" />
            </FormField>
          </div>
          <FormField label={t("profile.cardHolder")}>
            <input value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} className="ff-input px-4 py-3" />
          </FormField>
          <FormField label={t("profile.cardTypeLabel")}>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "credit" | "debit" })} className="ff-input px-4 py-3">
              <option value="credit">{t("profile.cardType.credit")}</option>
              <option value="debit">{t("profile.cardType.debit")}</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={resetForm} className="py-3 ff-card-interactive rounded-xl">
              {t("common.cancel")}
            </button>
            <motion.button type="button" onClick={handleSaveCard} className="py-3 ff-btn-primary rounded-xl" whileTap={{ scale: 0.98 }}>
              {t("common.save")}
            </motion.button>
          </div>
        </div>
      )}
    </>
  );
}

function ExportReportScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { transactions } = useFinance();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");

  const labels: Record<string, string> = {
    income: t("transactions.type.income"),
    expense: t("transactions.type.expense"),
    transfer: t("transactions.type.transfer"),
    food: t("categories.food"),
    transport: t("categories.transport"),
    shopping: t("categories.shopping"),
    bills: t("categories.bills"),
    entertainment: t("categories.entertainment"),
    health: t("categories.health"),
    savings: t("categories.savings"),
    other: t("categories.other"),
  };

  const filters = { startDate: startDate || undefined, endDate: endDate || undefined, category, type };

  return (
    <>
      <BackHeader title={t("profile.exportReport")} onBack={onBack} />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t("transactions.periodStart")}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ff-input px-4 py-3" />
          </FormField>
          <FormField label={t("transactions.periodEnd")}>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ff-input px-4 py-3" />
          </FormField>
        </div>
        <FormField label={t("transactions.category")}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="ff-input px-4 py-3">
            <option value="all">{t("transactions.allCategories")}</option>
            {Object.keys(labels).filter((k) => !["income", "expense", "transfer"].includes(k)).map((cat) => (
              <option key={cat} value={cat}>{labels[cat]}</option>
            ))}
          </select>
        </FormField>
        <FormField label={t("transactions.form.type")}>
          <select value={type} onChange={(e) => setType(e.target.value)} className="ff-input px-4 py-3">
            <option value="all">{t("transactions.type.all")}</option>
            <option value="income">{t("transactions.type.income")}</option>
            <option value="expense">{t("transactions.type.expense")}</option>
            <option value="transfer">{t("transactions.type.transfer")}</option>
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <motion.button
            type="button"
            onClick={() => exportToCSV(transactions, filters, labels)}
            className="py-4 ff-card-interactive rounded-xl text-sm font-medium"
            whileTap={{ scale: 0.98 }}
          >
            {t("profile.exportCSV")}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => exportToPDF(transactions, filters, labels, t("profile.exportReport"))}
            className="py-4 ff-btn-primary rounded-xl text-sm font-medium"
            whileTap={{ scale: 0.98 }}
          >
            {t("profile.exportPDF")}
          </motion.button>
        </div>

        <p className="ff-text-muted text-xs text-center">
          {t("profile.exportHint", { count: transactions.length })}
        </p>
      </div>
    </>
  );
}

function HelpSupportScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const faqItems = [
    { q: "profile.faq.q1", a: "profile.faq.a1" },
    { q: "profile.faq.q2", a: "profile.faq.a2" },
    { q: "profile.faq.q3", a: "profile.faq.a3" },
  ];

  const topics = ["account", "security", "goals", "transactions", "cards"] as const;

  const handleContact = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
    setTimeout(() => setContactSent(false), 3000);
  };

  return (
    <>
      <BackHeader title={t("profile.help")} onBack={onBack} />

      <h3 className="ff-heading font-semibold mb-3">{t("profile.faqTitle")}</h3>
      <div className="space-y-2 mb-6">
        {faqItems.map((item, i) => (
          <div key={i} className="ff-card-lg p-4">
            <p className="ff-text font-medium text-sm mb-2">{t(item.q)}</p>
            <p className="ff-text-muted text-xs">{t(item.a)}</p>
          </div>
        ))}
      </div>

      <h3 className="ff-heading font-semibold mb-3">{t("profile.helpCenter")}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {topics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
            className={`px-4 py-2 rounded-full text-sm ${activeTopic === topic ? "ff-nav-active" : "ff-card-interactive"}`}
          >
            {t(`profile.helpTopics.${topic}`)}
          </button>
        ))}
      </div>
      {activeTopic && (
        <div className="ff-card-lg p-4 mb-6">
          <p className="ff-text-muted text-sm">{t(`profile.helpContent.${activeTopic}`)}</p>
        </div>
      )}

      <h3 className="ff-heading font-semibold mb-3">{t("profile.contact")}</h3>
      <div className="space-y-3">
        <input
          value={contactForm.name}
          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
          placeholder={t("auth.fullName")}
          className="ff-input px-4 py-3"
        />
        <input
          type="email"
          value={contactForm.email}
          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
          placeholder={t("login.email")}
          className="ff-input px-4 py-3"
        />
        <textarea
          value={contactForm.message}
          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
          placeholder={t("profile.message")}
          className="ff-input px-4 py-3 min-h-[100px] resize-none"
          rows={4}
        />
        {contactSent && <AlertMessage type="success" message={t("profile.contactSent")} />}
        <motion.button type="button" onClick={handleContact} className="w-full ff-btn-primary py-4" whileTap={{ scale: 0.98 }}>
          {t("profile.sendMessage")}
        </motion.button>
      </div>
    </>
  );
}
