import { getBeatPosition } from "./beatGrid.ts";
import { firstTargetTap, type ExerciseRound, type RoundOutcome } from "./exerciseRound.ts";
import { DEFAULT_THRESHOLDS, scoreAttempt } from "./scoring.ts";
import type { PlaybackSpeed } from "./playbackSpeed.ts";
import type { TrainingMode, TrainingTrack } from "./tracks.ts";

export function getEightBarPlan(track: TrainingTrack, duration: number, speed: PlaybackSpeed) {
  const downbeats = track.downbeats;
  const margin = DEFAULT_THRESHOLDS.retryMs / 1000 * speed;
  if (!Number.isFinite(duration) || !Number.isFinite(speed) || speed <= 0 || downbeats.length < 19 ||
    downbeats.some((time, index) => !Number.isFinite(time) || time < 0 || (index > 0 && time <= downbeats[index - 1])) ||
    downbeats[18] + margin >= duration) return null;
  return { start: downbeats[2], targets: [downbeats[10], downbeats[18]], end: downbeats[18] + margin };
}

export function getEightBarGuide(time: number, track: TrainingTrack, mode: TrainingMode) {
  const position = getBeatPosition(time, track.beats, track.downbeats);
  const barIndex = position.bar === null ? -1 : position.bar - 3;
  const bar = barIndex < 0 ? null : barIndex % 8 + 1;
  const starting = barIndex === 0;
  return {
    bar: mode === "teach" || starting ? bar : null,
    beat: mode === "teach" || starting ? position.count : null,
    starting,
    pulse: mode === "assist" && position.beatIndex >= 0 && time - track.beats[position.beatIndex] < 0.1
  };
}

export function evaluateEightBarTap(round: ExerciseRound, time: number, track: TrainingTrack, duration: number, speed: PlaybackSpeed) {
  const plan = getEightBarPlan(track, duration, speed);
  if (!plan || !Number.isFinite(time) || time < Math.max(round.start, plan.start) || time > plan.end) return null;
  const result = scoreAttempt(time, plan.targets, duration, DEFAULT_THRESHOLDS, speed);
  const messages = {
    clavado: "Clavado. Has vuelto al primer compás después de ocho.",
    cerca: "Cerca de la vuelta. Mantén ocho grupos de cuatro golpes.",
    temprano: "Te adelantaste a la vuelta: termina el 4 del octavo compás.",
    tarde: "La vuelta ya empezó. Anticipa el 1 después del octavo compás.",
    "otra-vez": "Aquí no toca: cuenta ocho compases, no pulses en cada 1."
  };
  const targetIndex = plan.targets.indexOf(result.target!);
  const tap = { time, result: { ...result, message: messages[result.classification], replayStart: targetIndex === 0 ? plan.start : plan.targets[0] } };
  const previous = result.errorMs !== null && Math.abs(result.errorMs) <= DEFAULT_THRESHOLDS.retryMs ? firstTargetTap(round, result.target) : undefined;
  return { round: { ...round, end: time, taps: [...round.taps, tap] }, feedback: previous ?? tap, repeated: Boolean(previous) };
}

export function summarizeEightBars(round: ExerciseRound, track: TrainingTrack, duration: number, speed: PlaybackSpeed) {
  const plan = getEightBarPlan(track, duration, speed);
  const margin = DEFAULT_THRESHOLDS.retryMs / 1000 * speed;
  const outcomes: RoundOutcome[] = (plan?.targets ?? []).filter(target => target + margin <= round.end + 1e-9).map(target => {
    const tap = firstTargetTap(round, target);
    return { target, tapTime: tap?.time ?? null, result: tap?.result ?? null };
  });
  return {
    outcomes,
    perfect: outcomes.filter(item => item.result?.classification === "clavado").length,
    close: outcomes.filter(item => item.result?.classification === "cerca").length,
    missed: outcomes.filter(item => !item.result).length,
    outside: outcomes.filter(item => item.result && !["clavado", "cerca"].includes(item.result.classification)).length,
    extra: round.taps.length - outcomes.filter(item => item.result).length
  };
}
