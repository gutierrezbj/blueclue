import { DEFAULT_THRESHOLDS, getReplayStart, type AttemptResult } from "./scoring.ts";
import { getPracticeEntry } from "./practiceEntry.ts";
import { scoreExerciseAttempt, type LearningModuleId } from "./learningModules.ts";
import type { TrainingTrack } from "./tracks.ts";
import type { PlaybackSpeed } from "./playbackSpeed.ts";

export type RoundTap = { time: number; result: AttemptResult };
export type RoundOutcome = { target: number; tapTime: number | null; result: AttemptResult | null };
export type ExerciseRound = { start: number; end: number; taps: RoundTap[] };

export function isTargetTap(tap: RoundTap): boolean {
  return tap.result.target !== null && tap.result.errorMs !== null && Math.abs(tap.result.errorMs) <= DEFAULT_THRESHOLDS.retryMs;
}

export function firstTargetTap(round: ExerciseRound, target: number | null): RoundTap | undefined {
  return round.taps.find(tap => tap.result.target === target && isTargetTap(tap));
}

export function summarizeRound(round: ExerciseRound, track: TrainingTrack, moduleId: LearningModuleId, speed: PlaybackSpeed, duration: number) {
  const entry = getPracticeEntry(track.downbeats, duration, speed);
  const margin = DEFAULT_THRESHOLDS.retryMs / 1000 * speed;
  const targets = (moduleId === "pulse" ? track.beats : track.downbeats).filter(target =>
    entry && target >= entry.target && target - margin >= round.start && target < duration &&
    (target + margin <= round.end || (round.end >= duration && target <= round.end))
  );
  const outcomes: RoundOutcome[] = targets.map(target => {
    const tap = firstTargetTap(round, target);
    return { target, tapTime: tap?.time ?? null, result: tap?.result ?? null };
  });
  const perfect = outcomes.filter(outcome => outcome.result?.classification === "clavado").length;
  const close = outcomes.filter(outcome => outcome.result?.classification === "cerca").length;
  const missed = outcomes.filter(outcome => !outcome.result).length;
  const targetTaps = round.taps.filter(isTargetTap);
  const extra = targetTaps.filter((tap, index, taps) => taps.findIndex(candidate => candidate.result.target === tap.result.target) !== index).length;
  const offTarget = round.taps.length - targetTaps.length;
  return { outcomes, perfect, close, missed, outside: outcomes.length - perfect - close - missed, extra, offTarget, total: outcomes.length };
}

export function reviewOutcome(outcome: RoundOutcome): AttemptResult {
  return outcome.result ?? { target: outcome.target, errorMs: null, classification: "otra-vez", message: "Aquí no marcaste. Escucha la referencia y vuelve a intentarlo.", replayStart: getReplayStart(outcome.target) };
}

export function recordRoundTap(round: ExerciseRound, time: number, track: TrainingTrack, moduleId: LearningModuleId, speed: PlaybackSpeed, duration: number): ExerciseRound {
  const entry = getPracticeEntry(track.downbeats, duration, speed);
  if (!entry || time < Math.max(round.start, entry.opensAt) || time > duration || !Number.isFinite(time)) return round;
  const result = scoreExerciseAttempt(time, track, duration, moduleId, speed);
  if (!result) return round;
  return { ...round, end: Math.max(round.end, time), taps: [...round.taps, { time, result }] };
}

export function evaluateRoundTap(round: ExerciseRound, time: number, track: TrainingTrack, moduleId: LearningModuleId, speed: PlaybackSpeed, duration: number) {
  const updatedRound = recordRoundTap(round, time, track, moduleId, speed, duration);
  if (updatedRound === round) return null;
  const tap = updatedRound.taps[updatedRound.taps.length - 1];
  const previous = isTargetTap(tap) ? firstTargetTap(round, tap.result.target) : undefined;
  return { round: updatedRound, feedback: previous ?? tap, repeated: Boolean(previous) };
}
