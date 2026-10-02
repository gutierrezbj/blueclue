import { DEFAULT_THRESHOLDS, scoreAttempt, type AttemptResult } from "./scoring.ts";

export const LISTENING_BARS = 2;
export type PracticeEntry = { target: number; opensAt: number };

export function getPracticeEntry(downbeats: readonly number[], duration: number): PracticeEntry | null {
  const target = downbeats[LISTENING_BARS];
  if (!Number.isFinite(duration) || !Number.isFinite(target) || target < 0 || target >= duration) return null;
  return { target, opensAt: Math.max(0, target - DEFAULT_THRESHOLDS.retryMs / 1000) };
}

export function scorePracticeAttempt(
  tapTime: number,
  downbeats: readonly number[],
  duration: number,
  entry: PracticeEntry | null
): AttemptResult | null {
  if (!entry || !Number.isFinite(tapTime) || tapTime < entry.opensAt || tapTime > duration) return null;
  return scoreAttempt(tapTime, downbeats.filter((downbeat) => downbeat >= entry.target), duration);
}
