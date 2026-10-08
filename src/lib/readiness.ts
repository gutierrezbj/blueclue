import type { TrainingMode } from "./tracks.ts";
import type { LearningModuleId } from "./learningModules.ts";
import { learningModules } from "./learningModules.ts";
import { playbackSpeeds, speedLabels, type PlaybackSpeed } from "./playbackSpeed.ts";
import { practiceModes } from "./practice.ts";

export const ROUNDS_STORAGE_KEY = "blueclue-rounds-v1";
export const GOOD_ROUND_MIN_TARGETS = 8;
export const GOOD_ROUND_RATIO = 0.8;
export const ROUNDS_KEPT = 5;
export const GOOD_ROUNDS_TO_ADVANCE = 3;

export type RoundRecord = { total: number; perfect: number; close: number };
export type RoundSlot = { moduleId: LearningModuleId; mode: TrainingMode; speed: PlaybackSpeed };
export type RoundHistory = Record<string, RoundRecord[]>;

export function slotKey(slot: RoundSlot): string {
  return `${slot.moduleId}/${slot.mode}/${slot.speed}`;
}

export function isGoodRound(round: RoundRecord): boolean {
  return round.total >= GOOD_ROUND_MIN_TARGETS && (round.perfect + round.close) / round.total >= GOOD_ROUND_RATIO;
}

function isRoundRecord(value: unknown): value is RoundRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return [record.total, record.perfect, record.close].every(field => Number.isInteger(field) && (field as number) >= 0) &&
    (record.perfect as number) + (record.close as number) <= (record.total as number);
}

export function readRoundHistory(saved: string | null): RoundHistory {
  try {
    const parsed: unknown = JSON.parse(saved ?? "null");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const history: RoundHistory = {};
    for (const [key, rounds] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(rounds)) history[key] = rounds.filter(isRoundRecord).slice(-ROUNDS_KEPT);
    }
    return history;
  } catch {
    return {};
  }
}

export function recordRound(history: RoundHistory, slot: RoundSlot, round: RoundRecord): RoundHistory {
  const key = slotKey(slot);
  return { ...history, [key]: [...(history[key] ?? []), round].slice(-ROUNDS_KEPT) };
}

/** The next place in the recommended order: Teach → Assist → Train, then faster, then the next level. */
export function nextSuggestedSlot(slot: RoundSlot): RoundSlot | null {
  const modeIndex = practiceModes.indexOf(slot.mode);
  if (modeIndex + 1 < practiceModes.length) return { ...slot, mode: practiceModes[modeIndex + 1] };
  const speedIndex = playbackSpeeds.indexOf(slot.speed);
  if (speedIndex + 1 < playbackSpeeds.length) return { ...slot, mode: practiceModes[0], speed: playbackSpeeds[speedIndex + 1] };
  const moduleIndex = learningModules.findIndex(module => module.id === slot.moduleId);
  if (moduleIndex + 1 < learningModules.length) return { moduleId: learningModules[moduleIndex + 1].id, mode: practiceModes[0], speed: playbackSpeeds[0] };
  return null;
}

export type Readiness = { verdict: "repeat" | "advance" | "done"; message: string; goodRounds: number; next: RoundSlot | null };

export function assessReadiness(history: RoundHistory, slot: RoundSlot, latest: RoundRecord): Readiness {
  const rounds = history[slotKey(slot)] ?? [];
  const goodRounds = rounds.filter(isGoodRound).length;
  const next = nextSuggestedSlot(slot);
  if (goodRounds < GOOD_ROUNDS_TO_ADVANCE) {
    const message = latest.total < GOOD_ROUND_MIN_TARGETS ? "Ronda corta. Escucha el fragmento entero y vuelve a probar."
      : isGoodRound(latest) ? `Buena ronda. ${goodRounds} de ${GOOD_ROUNDS_TO_ADVANCE} para avanzar: otra vez.` : "Vas bien. Otra vez, sin prisa.";
    return { verdict: "repeat", message, goodRounds, next };
  }
  if (!next) return { verdict: "done", message: "Has completado los tres niveles con oído solo. Sigue con Escucha el cambio.", goodRounds, next };
  const modeNames: Record<TrainingMode, string> = { teach: "Teach", assist: "Assist", train: "Train" };
  const message = next.moduleId !== slot.moduleId ? `Ya puedes pasar al siguiente nivel: ${learningModules.find(module => module.id === next.moduleId)!.title}.`
    : next.speed !== slot.speed ? `Ya puedes probar más rápido: ${speedLabels[next.speed]}, otra vez con ${modeNames[next.mode]}.`
    : `Ya puedes probar con menos ayuda: ${modeNames[next.mode]}.`;
  return { verdict: "advance", message, goodRounds, next };
}
