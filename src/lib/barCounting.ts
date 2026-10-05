import { getBeatPosition } from "./beatGrid.ts";
import { firstTargetTap, type ExerciseRound, type RoundOutcome } from "./exerciseRound.ts";
import { DEFAULT_THRESHOLDS, scoreAttempt } from "./scoring.ts";
import type { PlaybackSpeed } from "./playbackSpeed.ts";
import type { TrainingMode, TrainingTrack } from "./tracks.ts";
import { LISTENING_BARS } from "./practiceEntry.ts";

export type BarCount = 8 | 16 | 32;

export function getBarLesson(bars: BarCount) {
  if (bars === 32) return { word: "treinta y dos", lastBar: "trigésimo segundo", turns: 1, storagePrefix: "blueclue-thirty-two-bars-v1", hash: "#compases-32" };
  return bars === 8
    ? { word: "ocho", lastBar: "octavo", turns: 2, storagePrefix: "blueclue-eight-bars-v1", hash: "#compases" }
    : { word: "dieciséis", lastBar: "decimosexto", turns: 1, storagePrefix: "blueclue-sixteen-bars-v1", hash: "#compases-16" };
}

export function getBarCountingPlan(track: TrainingTrack, duration: number, speed: PlaybackSpeed, bars: BarCount = 8) {
  const downbeats = track.downbeats;
  const margin = DEFAULT_THRESHOLDS.retryMs / 1000 * speed;
  const lastTargetIndex = LISTENING_BARS + getBarLesson(bars).turns * bars;
  if (![8, 16, 32].includes(bars) || !Number.isFinite(duration) || !Number.isFinite(speed) || speed <= 0 || downbeats.length <= lastTargetIndex ||
    downbeats.some((time, index) => !Number.isFinite(time) || time < 0 || (index > 0 && time <= downbeats[index - 1])) ||
    downbeats[lastTargetIndex] + margin >= duration) return null;
  const targets = Array.from({ length: getBarLesson(bars).turns }, (_, index) => downbeats[LISTENING_BARS + (index + 1) * bars]);
  return { start: downbeats[LISTENING_BARS], targets, end: downbeats[lastTargetIndex] + margin };
}

export function getVisibleBars(bar: number | null) {
  const start = bar === null ? 1 : Math.floor((bar - 1) / 8) * 8 + 1;
  return Array.from({ length: 8 }, (_, index) => start + index);
}

export function getBarCountingGuide(time: number, track: TrainingTrack, mode: TrainingMode, bars: BarCount = 8) {
  const position = getBeatPosition(time, track.beats, track.downbeats);
  const barIndex = position.bar === null ? -1 : position.bar - LISTENING_BARS - 1;
  const bar = barIndex < 0 ? null : barIndex % bars + 1;
  const starting = barIndex === 0;
  return {
    bar: mode === "teach" || starting ? bar : null,
    beat: mode === "teach" || starting ? position.count : null,
    starting,
    pulse: mode === "assist" && position.beatIndex >= 0 && time - track.beats[position.beatIndex] < 0.1
  };
}

export function evaluateBarCountingTap(round: ExerciseRound, time: number, track: TrainingTrack, duration: number, speed: PlaybackSpeed, bars: BarCount = 8) {
  const plan = getBarCountingPlan(track, duration, speed, bars);
  if (!plan || !Number.isFinite(time) || time < Math.max(round.start, plan.start) || time > plan.end) return null;
  const result = scoreAttempt(time, plan.targets, duration, DEFAULT_THRESHOLDS, speed);
  const lesson = getBarLesson(bars);
  const messages = {
    clavado: `Clavado. Has vuelto al primer compás después de ${lesson.word}.`,
    cerca: `Cerca de la vuelta. Mantén ${lesson.word} grupos de cuatro golpes.`,
    temprano: `Te adelantaste a la vuelta: termina el 4 del ${lesson.lastBar} compás.`,
    tarde: `La vuelta ya empezó. Anticipa el 1 después del ${lesson.lastBar} compás.`,
    "otra-vez": bars === 32 ? "Aún no: son cuatro grupos de ocho. Pulsa solo después del 32." : bars === 16 ? "Aún no: cuenta 8 + 8. El compás 9 es la mitad, no la llegada." : "Aquí no toca: cuenta ocho compases, no pulses en cada 1."
  };
  const targetIndex = plan.targets.indexOf(result.target!);
  const tap = { time, result: { ...result, message: messages[result.classification], replayStart: targetIndex === 0 ? plan.start : plan.targets[0] } };
  const previous = result.errorMs !== null && Math.abs(result.errorMs) <= DEFAULT_THRESHOLDS.retryMs ? firstTargetTap(round, result.target) : undefined;
  return { round: { ...round, end: time, taps: [...round.taps, tap] }, feedback: previous ?? tap, repeated: Boolean(previous) };
}

export function summarizeBarCounting(round: ExerciseRound, track: TrainingTrack, duration: number, speed: PlaybackSpeed, bars: BarCount = 8) {
  const plan = getBarCountingPlan(track, duration, speed, bars);
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
