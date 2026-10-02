import { DEFAULT_THRESHOLDS, scoreAttempt, type AttemptResult } from "./scoring.ts";

export const LISTENING_BARS = 2;
export type PracticeEntry = { target: number; opensAt: number };

export function getPracticeEntry(downbeats: readonly number[], duration: number, playbackRate = 1): PracticeEntry | null {
  const target = downbeats[LISTENING_BARS];
  if (!Number.isFinite(duration) || !Number.isFinite(target) || target < 0 || target >= duration || !Number.isFinite(playbackRate) || playbackRate <= 0) return null;
  return { target, opensAt: Math.max(0, target - DEFAULT_THRESHOLDS.retryMs / 1000 * playbackRate) };
}

export function scorePracticeAttempt(
  tapTime: number,
  downbeats: readonly number[],
  duration: number,
  entry: PracticeEntry | null,
  playbackRate = 1
): AttemptResult | null {
  if (!entry || !Number.isFinite(tapTime) || tapTime < entry.opensAt || tapTime > duration) return null;
  return scoreAttempt(tapTime, downbeats.filter((downbeat) => downbeat >= entry.target), duration, DEFAULT_THRESHOLDS, playbackRate);
}
