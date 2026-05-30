import type { Transaction, Goal, PaymentCard, UserPreferences, ResetToken } from "../types";
import { STORAGE_KEYS } from "../utils/constants";
import { generateId, getInitials } from "../utils/format";
import { getItem, setItem } from "./storage";

/** Dados iniciais para demonstração quando não há dados persistidos */
function createSeedTransactions(): Transaction[] {
  const now = new Date();
  const iso = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  return [
    {
      id: generateId(),
      name: "Spotify",
      description: "Assinatura mensal",
      amount: 12.99,
      type: "expense",
      category: "entertainment",
      date: iso(0),
      paymentMethod: "creditCard",
      notes: "Plano individual",
      history: [{ date: iso(0), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Salário",
      description: "Salário mensal",
      amount: 4500,
      type: "income",
      category: "income",
      date: iso(1),
      paymentMethod: "debitCard",
      history: [{ date: iso(1), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Supermercado",
      description: "Compras da semana",
      amount: 86.45,
      type: "expense",
      category: "food",
      date: iso(1),
      paymentMethod: "creditCard",
      history: [{ date: iso(1), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Uber",
      amount: 23.5,
      type: "expense",
      category: "transport",
      date: iso(2),
      paymentMethod: "digitalWallet",
      history: [{ date: iso(2), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Freelance",
      amount: 1200,
      type: "income",
      category: "income",
      date: iso(5),
      paymentMethod: "debitCard",
      history: [{ date: iso(5), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Conta de luz",
      amount: 156.8,
      type: "expense",
      category: "bills",
      date: iso(3),
      paymentMethod: "debitCard",
      history: [{ date: iso(3), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Transferência poupança",
      amount: 500,
      type: "transfer",
      category: "savings",
      date: iso(4),
      paymentMethod: "debitCard",
      notes: "Transferência para reserva",
      history: [{ date: iso(4), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function createSeedGoals(): Goal[] {
  const deadline = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  return [
    {
      id: generateId(),
      name: "emergencyFund",
      targetAmount: 10000,
      currentAmount: 6500,
      deadline: deadline(45),
      category: "savings",
      icon: "🎯",
      color: "#079697",
      status: "active",
      history: [{ date: new Date().toISOString(), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "vacationBali",
      targetAmount: 5000,
      currentAmount: 3200,
      deadline: deadline(90),
      category: "travel",
      icon: "✈️",
      color: "#5b6bf5",
      status: "active",
      history: [{ date: new Date().toISOString(), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "newLaptop",
      targetAmount: 2500,
      currentAmount: 2500,
      deadline: deadline(30),
      category: "technology",
      icon: "💻",
      color: "#00d4aa",
      status: "completed",
      history: [
        { date: new Date().toISOString(), action: "created" },
        { date: new Date().toISOString(), action: "completed" },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "investmentPortfolio",
      targetAmount: 15000,
      currentAmount: 4200,
      deadline: deadline(180),
      category: "investment",
      icon: "📈",
      color: "#ff6b9d",
      status: "active",
      history: [{ date: new Date().toISOString(), action: "created" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function createDefaultPreferences(): UserPreferences {
  return {
    notifications: {
      income: true,
      expenses: true,
      goals: true,
      reports: false,
      reminders: true,
    },
    security: {
      twoFactorEnabled: false,
      biometricEnabled: false,
      sessions: [
        {
          id: generateId(),
          device: "Chrome — Windows",
          location: "São Paulo, BR",
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
        {
          id: generateId(),
          device: "Safari — iPhone 15",
          location: "São Paulo, BR",
          lastActive: new Date(Date.now() - 86400000 * 2).toISOString(),
          isCurrent: false,
        },
      ],
    },
  };
}

function createSeedCards(userId: string): PaymentCard[] {
  return [
    {
      id: generateId(),
      name: "Nubank",
      number: "4111111111111111",
      expiry: "12/28",
      cvv: "123",
      brand: "visa",
      holderName: "Victor Hugo",
      type: "credit",
      isPrimary: true,
      isHidden: false,
    },
  ];
}

/** Serviço de autenticação simulada — pronto para substituição por API REST */
export const authService = {
  getUsers() {
    return getItem<{ id: string; fullName: string; email: string; password: string; phone?: string; avatarInitials?: string; createdAt: string }[]>(
      STORAGE_KEYS.users,
      []
    );
  },

  saveUsers(users: ReturnType<typeof authService.getUsers>) {
    setItem(STORAGE_KEYS.users, users);
  },

  getSession(): string | null {
    return getItem<string | null>(STORAGE_KEYS.session, null);
  },

  setSession(userId: string | null) {
    if (userId) setItem(STORAGE_KEYS.session, userId);
    else setItem(STORAGE_KEYS.session, null);
  },

  getCurrentUser() {
    const sessionId = authService.getSession();
    if (!sessionId) return null;
    return authService.getUsers().find((u) => u.id === sessionId) ?? null;
  },

  register(data: { fullName: string; email: string; password: string }) {
    const users = authService.getUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false as const, error: "auth.emailExists" };
    }

    const user = {
      id: generateId(),
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      phone: "",
      avatarInitials: getInitials(data.fullName),
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    authService.saveUsers(users);
    authService.setSession(user.id);
    financeService.initializeUserData(user.id);
    return { success: true as const, user };
  },

  login(email: string, password: string) {
    const user = authService
      .getUsers()
      .find((u) => u.email === email.trim().toLowerCase() && u.password === password);

    if (!user) return { success: false as const, error: "auth.invalidCredentials" };
    authService.setSession(user.id);
    return { success: true as const, user };
  },

  logout() {
    authService.setSession(null);
  },

  updateProfile(userId: string, data: Partial<{ fullName: string; email: string; phone: string; avatarInitials: string }>) {
    const users = authService.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return { success: false as const, error: "auth.userNotFound" };

    if (data.email && users.some((u, i) => i !== index && u.email === data.email!.toLowerCase())) {
      return { success: false as const, error: "auth.emailExists" };
    }

    users[index] = {
      ...users[index],
      ...data,
      email: data.email?.toLowerCase() ?? users[index].email,
      avatarInitials: data.fullName ? getInitials(data.fullName) : users[index].avatarInitials,
    };
    authService.saveUsers(users);
    return { success: true as const, user: users[index] };
  },

  changePassword(userId: string, currentPassword: string, newPassword: string) {
    const users = authService.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return { success: false as const, error: "auth.userNotFound" };
    if (users[index].password !== currentPassword) {
      return { success: false as const, error: "auth.wrongPassword" };
    }
    users[index].password = newPassword;
    authService.saveUsers(users);
    return { success: true as const };
  },

  requestPasswordReset(email: string) {
    const user = authService.getUsers().find((u) => u.email === email.trim().toLowerCase());
    if (!user) return { success: false as const, error: "auth.emailNotFound" };

    const token = generateId();
    const tokens = getItem<ResetToken[]>(STORAGE_KEYS.resetTokens, []);
    tokens.push({
      email: user.email,
      token,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    setItem(STORAGE_KEYS.resetTokens, tokens);
    return { success: true as const, token };
  },

  resetPassword(token: string, newPassword: string) {
    const tokens = getItem<ResetToken[]>(STORAGE_KEYS.resetTokens, []);
    const resetEntry = tokens.find((t) => t.token === token);
    if (!resetEntry) return { success: false as const, error: "auth.invalidToken" };
    if (new Date(resetEntry.expiresAt) < new Date()) {
      return { success: false as const, error: "auth.tokenExpired" };
    }

    const users = authService.getUsers();
    const index = users.findIndex((u) => u.email === resetEntry.email);
    if (index === -1) return { success: false as const, error: "auth.userNotFound" };

    users[index].password = newPassword;
    authService.saveUsers(users);
    setItem(
      STORAGE_KEYS.resetTokens,
      tokens.filter((t) => t.token !== token)
    );
    return { success: true as const };
  },

  /** Cria usuário demo na primeira execução */
  seedDemoUser() {
    const users = authService.getUsers();
    if (users.length > 0) return;

    const user = {
      id: generateId(),
      fullName: "Victor Hugo",
      email: "victorhugo_souza99@live.com",
      password: "123456",
      phone: "(11) 98765-4321",
      avatarInitials: "VH",
      createdAt: new Date().toISOString(),
    };
    authService.saveUsers([user]);
    financeService.initializeUserData(user.id, true);
  },
};

/** Serviço financeiro — CRUD local preparado para API */
export const financeService = {
  userKey(base: string, userId: string) {
    return `${base}-${userId}`;
  },

  initializeUserData(userId: string, withSeed = false) {
    const txKey = financeService.userKey(STORAGE_KEYS.transactions, userId);
    const goalsKey = financeService.userKey(STORAGE_KEYS.goals, userId);
    const cardsKey = financeService.userKey(STORAGE_KEYS.cards, userId);
    const prefsKey = financeService.userKey(STORAGE_KEYS.preferences, userId);

    if (withSeed || getItem<Transaction[]>(txKey, []).length === 0) {
      setItem(txKey, createSeedTransactions());
    }
    if (withSeed || getItem<Goal[]>(goalsKey, []).length === 0) {
      setItem(goalsKey, createSeedGoals());
    }
    if (getItem<PaymentCard[]>(cardsKey, []).length === 0) {
      setItem(cardsKey, createSeedCards(userId));
    }
    if (!getItem<UserPreferences | null>(prefsKey, null)) {
      setItem(prefsKey, createDefaultPreferences());
    }
  },

  getTransactions(userId: string) {
    return getItem<Transaction[]>(
      financeService.userKey(STORAGE_KEYS.transactions, userId),
      []
    );
  },

  saveTransactions(userId: string, transactions: Transaction[]) {
    setItem(financeService.userKey(STORAGE_KEYS.transactions, userId), transactions);
  },

  addTransaction(userId: string, data: Omit<Transaction, "id" | "history" | "createdAt" | "updatedAt">) {
    const transactions = financeService.getTransactions(userId);
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      history: [{ date: now, action: "created" }],
      createdAt: now,
      updatedAt: now,
    };
    transactions.unshift(transaction);
    financeService.saveTransactions(userId, transactions);
    return transaction;
  },

  updateTransaction(userId: string, id: string, data: Partial<Transaction>) {
    const transactions = financeService.getTransactions(userId);
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    transactions[index] = {
      ...transactions[index],
      ...data,
      id,
      updatedAt: now,
      history: [...transactions[index].history, { date: now, action: "updated" }],
    };
    financeService.saveTransactions(userId, transactions);
    return transactions[index];
  },

  deleteTransaction(userId: string, id: string) {
    const transactions = financeService.getTransactions(userId);
    financeService.saveTransactions(
      userId,
      transactions.filter((t) => t.id !== id)
    );
  },

  getGoals(userId: string) {
    return getItem<Goal[]>(financeService.userKey(STORAGE_KEYS.goals, userId), []);
  },

  saveGoals(userId: string, goals: Goal[]) {
    setItem(financeService.userKey(STORAGE_KEYS.goals, userId), goals);
  },

  addGoal(userId: string, data: Omit<Goal, "id" | "history" | "status" | "createdAt" | "updatedAt">) {
    const goals = financeService.getGoals(userId);
    const now = new Date().toISOString();
    const goal: Goal = {
      ...data,
      id: generateId(),
      status: "active",
      history: [{ date: now, action: "created" }],
      createdAt: now,
      updatedAt: now,
    };
    goals.unshift(goal);
    financeService.saveGoals(userId, goals);
    return goal;
  },

  updateGoal(userId: string, id: string, data: Partial<Goal>) {
    const goals = financeService.getGoals(userId);
    const index = goals.findIndex((g) => g.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    goals[index] = {
      ...goals[index],
      ...data,
      id,
      updatedAt: now,
      history: [...goals[index].history, { date: now, action: "updated", amount: data.currentAmount }],
    };
    financeService.saveGoals(userId, goals);
    return goals[index];
  },

  deleteGoal(userId: string, id: string) {
    const goals = financeService.getGoals(userId);
    financeService.saveGoals(
      userId,
      goals.filter((g) => g.id !== id)
    );
  },

  getCards(userId: string) {
    return getItem<PaymentCard[]>(financeService.userKey(STORAGE_KEYS.cards, userId), []);
  },

  saveCards(userId: string, cards: PaymentCard[]) {
    setItem(financeService.userKey(STORAGE_KEYS.cards, userId), cards);
  },

  getPreferences(userId: string) {
    return getItem<UserPreferences>(
      financeService.userKey(STORAGE_KEYS.preferences, userId),
      createDefaultPreferences()
    );
  },

  savePreferences(userId: string, prefs: UserPreferences) {
    setItem(financeService.userKey(STORAGE_KEYS.preferences, userId), prefs);
  },
};

// Inicializa dados demo na carga do módulo
authService.seedDemoUser();
