import type { LearningModuleId } from "./learningModules.ts";
import type { PracticeSession } from "./practice.ts";

export type AppRoute =
  | { screen: "home" | "rhythm" | "listening-menu" | "bass" }
  | { screen: "bars"; bars: 8 | 16 | 32 }
  | { screen: "practice"; moduleId?: LearningModuleId };

export function readAppRoute(hash: string): AppRoute {
  if (hash === "#marca-el-1") return { screen: "rhythm" };
  if (hash === "#escucha-el-cambio") return { screen: "listening-menu" };
  if (hash === "#escucha-el-bajo") return { screen: "bass" };
  if (hash === "#compases") return { screen: "bars", bars: 8 };
  if (hash === "#compases-16") return { screen: "bars", bars: 16 };
  if (hash === "#compases-32") return { screen: "bars", bars: 32 };
  if (hash === "#nivel-1") return { screen: "practice", moduleId: "pulse" };
  if (hash === "#nivel-2") return { screen: "practice", moduleId: "count" };
  if (hash === "#nivel-3") return { screen: "practice", moduleId: "downbeat" };
  if (["#practice-controls", "#listening", "#track-select", "#pocket-mode"].includes(hash)) return { screen: "practice" };
  return { screen: "home" };
}

export function enterPractice(session: PracticeSession, moduleId?: LearningModuleId): PracticeSession {
  if (!moduleId || session.moduleId === moduleId) return session;
  return { ...session, moduleId, mode: "teach", playbackSpeed: 0.65, position: 0 };
}
