import { firstTargetTap, type ExerciseRound, type RoundOutcome, type RoundTap } from "./exerciseRound.ts";
import { DEFAULT_THRESHOLDS, scoreAttempt } from "./scoring.ts";
import type { PlaybackSpeed } from "./playbackSpeed.ts";

export type RecoveryPlan = {
  firstDownbeat: number;
  targets: readonly number[];
  hiddenStarts: readonly number[];
  end: number;
};

export type RecoveryPhase = "prepare" | "guide" | "listen" | "mark" | "complete";

export function getRecoveryPlan(downbeats: readonly number[], duration: number, speed: PlaybackSpeed): RecoveryPlan | null {
  if (downbeats.length < 9 || !Number.isFinite(duration) || duration <= 0 ||
      downbeats.some((time, index) => !Number.isFinite(time) || time < 0 || (index > 0 && time <= downbeats[index - 1]))) return null;
  const margin = DEFAULT_THRESHOLDS.retryMs / 1000 * speed;
  const pairs = downbeats.flatMap((target, index) =>
    index > 0 && index % 4 === 0 && target + margin < duration
      ? [{ target, hiddenStart: downbeats[index - 2] }]
      : []
  ).slice(0, 5);
  if (pairs.length < 2) return null;
  const lastIndex = downbeats.indexOf(pairs[pairs.length - 1].target);
  const beatSeconds = (downbeats[lastIndex] - downbeats[lastIndex - 1]) / 4;
  return {
    firstDownbeat: downbeats[0],
    targets: pairs.map(pair => pair.target),
    hiddenStarts: pairs.map(pair => pair.hiddenStart),
    end: Math.min(duration, pairs[pairs.length - 1].target + Math.max(beatSeconds, margin))
  };
}

export function getRecoveryPhase(time: number, plan: RecoveryPlan | null, speed: PlaybackSpeed): RecoveryPhase {
  if (!plan || !Number.isFinite(time) || time < plan.firstDownbeat) return "prepare";
  if (time >= plan.end) return "complete";
  const margin = DEFAULT_THRESHOLDS.retryMs / 1000 * speed;
  const targetIndex = plan.targets.findIndex(target => time <= target + margin);
  if (targetIndex < 0) return "guide";
  if (time < plan.hiddenStarts[targetIndex]) return "guide";
  return time < plan.targets[targetIndex] - margin ? "listen" : "mark";
}

export function evaluateRecoveryTap(round: ExerciseRound, time: number, plan: RecoveryPlan | null, duration: number, speed: PlaybackSpeed) {
  const phase = getRecoveryPhase(time, plan, speed);
  if (!plan || (phase !== "listen" && phase !== "mark")) return null;
  const margin = DEFAULT_THRESHOLDS.retryMs / 1000 * speed;
  const target = plan.targets.find(candidate => time <= candidate + margin);
  if (target === undefined) return null;
  const result = scoreAttempt(time, [target], duration, DEFAULT_THRESHOLDS, speed);
  if (result.classification === "otra-vez") result.message = "Todavía no llega el 1. Sigue escuchando y contando.";
  const previous = firstTargetTap(round, target);
  const tap: RoundTap = { time, result };
  return {
    round: { ...round, end: Math.max(round.end, time), taps: [...round.taps, tap] },
    feedback: previous ?? tap,
    repeated: Boolean(previous)
  };
}

export function summarizeRecoveryRound(round: ExerciseRound, plan: RecoveryPlan) {
  const outcomes: RoundOutcome[] = plan.targets.map(target => {
    const tap = firstTargetTap(round, target);
    return { target, tapTime: tap?.time ?? null, result: tap?.result ?? null };
  });
  return {
    outcomes,
    perfect: outcomes.filter(outcome => outcome.result?.classification === "clavado").length,
    close: outcomes.filter(outcome => outcome.result?.classification === "cerca").length,
    early: outcomes.filter(outcome => outcome.result?.classification === "temprano").length,
    late: outcomes.filter(outcome => outcome.result?.classification === "tarde").length,
    missed: outcomes.filter(outcome => !outcome.result).length,
    extra: round.taps.length - outcomes.filter(outcome => outcome.result).length,
    total: outcomes.length
  };
}

export function getRecoveryReplayStart(plan: RecoveryPlan, target: number): number {
  const targetIndex = plan.targets.indexOf(target);
  return targetIndex < 0 ? plan.firstDownbeat : plan.hiddenStarts[targetIndex];
}
