import type { Goal } from "../types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export function checkAchievements(
  previousGoals: Goal[],
  currentGoals: Goal[],
  justUpdatedGoal?: Goal
): Achievement[] {
  const unlocked: Achievement[] = [];

  const prevCompleted = previousGoals.filter((g) => g.status === "completed").length;
  const currCompleted = currentGoals.filter((g) => g.status === "completed").length;
  const prevActive = previousGoals.filter((g) => g.status === "active").length;
  const currActive = currentGoals.filter((g) => g.status === "active").length;

  // 🌱 Primeiro Passo — criou a primeira meta
  if (previousGoals.length === 0 && currentGoals.length >= 1) {
    unlocked.push({
      id: "first_goal",
      title: "Primeiro Passo",
      description: "Você criou sua primeira meta financeira!",
      icon: "🌱",
    });
  }

  // 🎯 Ambicioso — 3 ou mais metas ativas
  if (prevActive < 3 && currActive >= 3) {
    unlocked.push({
      id: "ambitious",
      title: "Ambicioso",
      description: "Você tem 3 ou mais metas ativas ao mesmo tempo!",
      icon: "🎯",
    });
  }

  // 💰 Meio Caminho — atingiu 50% de uma meta
  if (justUpdatedGoal) {
    const prev = previousGoals.find((g) => g.id === justUpdatedGoal.id);
    const prevProgress = prev ? (prev.currentAmount / prev.targetAmount) * 100 : 0;
    const currProgress = (justUpdatedGoal.currentAmount / justUpdatedGoal.targetAmount) * 100;
    if (prevProgress < 50 && currProgress >= 50) {
      unlocked.push({
        id: "halfway",
        title: "Meio Caminho",
        description: "Você atingiu 50% de uma meta. Continue assim!",
        icon: "💰",
      });
    }
  }

  // 🏆 Meta Concluída — primeira vez
  if (prevCompleted === 0 && currCompleted >= 1) {
    unlocked.push({
      id: "first_complete",
      title: "Meta Concluída",
      description: "Parabéns! Você concluiu sua primeira meta!",
      icon: "🏆",
    });
  }

  // 🔥 Antecipado — concluiu antes do prazo
  if (justUpdatedGoal?.status === "completed") {
    const days = Math.ceil(
      (new Date(justUpdatedGoal.deadline).getTime() - Date.now()) / 86400000
    );
    if (days > 0) {
      unlocked.push({
        id: "early",
        title: "Antecipado",
        description: `Você concluiu uma meta ${days} dias antes do prazo!`,
        icon: "🔥",
      });
    }
  }

  // 💎 Dedicado — 3 metas concluídas
  if (prevCompleted < 3 && currCompleted >= 3) {
    unlocked.push({
      id: "dedicated",
      title: "Dedicado",
      description: "Você concluiu 3 metas. Incrível disciplina!",
      icon: "💎",
    });
  }

  // 🌟 Mestre das Finanças — 5 metas concluídas
  if (prevCompleted < 5 && currCompleted >= 5) {
    unlocked.push({
      id: "master",
      title: "Mestre das Finanças",
      description: "Você concluiu 5 metas. Você é um mestre!",
      icon: "🌟",
    });
  }

  return unlocked;
}