import type { TrainingTrack } from "./tracks.ts";
import { listeningLessons, type ListeningInstrument, type ListeningLesson } from "./listeningLessons.ts";

export type ListeningTrack = TrainingTrack & {
  duration: number;
  instrument?: ListeningLesson;
  changes: { time: number; action: "bass-in" | "bass-out" | "percussion-in" | "percussion-out" }[];
};

export type ListeningTap = { time: number; target: number | null; result: "recognized" | "wrong" | "repeated" | "outside"; choice?: ListeningInstrument; expected?: ListeningInstrument };
export const RECOGNITION_SECONDS = 2.5;

export function listeningStorageKey(track: ListeningTrack) {
  return `blueclue-listening-${track.id}`;
}

export function getListeningEntries(track: ListeningTrack) {
  return track.changes.filter(change => isListeningEntry(track, change.action)).map(change => change.time);
}

function isListeningEntry(track: ListeningTrack, action: ListeningTrack["changes"][number]["action"]) {
  return track.instrument === "choice" ? action.endsWith("-in") : action === `${track.instrument ?? "bass"}-in`;
}

export function evaluateListeningTap(track: ListeningTrack, taps: ListeningTap[], time: number, choice?: ListeningInstrument): ListeningTap | null {
  if (!Number.isFinite(time) || time < 0 || time >= track.duration) return null;
  if (track.instrument === "choice" && choice !== "bass" && choice !== "percussion") return null;
  const change = track.changes.findLast(item => item.time <= time);
  if (!change || !isListeningEntry(track, change.action) || time - change.time > RECOGNITION_SECONDS) {
    return { time, target: null, result: "outside" };
  }
  const repeated = taps.some(tap => tap.target === change.time && (tap.result === "recognized" || tap.result === "wrong"));
  if (track.instrument === "choice") {
    const expected = change.action === "bass-in" ? "bass" : "percussion";
    return { time, target: change.time, choice, expected, result: repeated ? "repeated" : choice === expected ? "recognized" : "wrong" };
  }
  return { time, target: change.time, result: repeated ? "repeated" : "recognized" };
}

export function summarizeListening(track: ListeningTrack, taps: ListeningTap[]) {
  const entries = getListeningEntries(track).map(time => {
    const response = taps.find(tap => tap.target === time && (tap.result === "recognized" || tap.result === "wrong"));
    return { time, recognized: response?.result === "recognized", wrong: response?.result === "wrong" };
  });
  return {
    entries,
    recognized: entries.filter(entry => entry.recognized).length,
    wrong: entries.filter(entry => entry.wrong).length,
    missed: entries.filter(entry => !entry.recognized && !entry.wrong).length,
    extra: taps.filter(tap => tap.result === "repeated" || tap.result === "outside").length
  };
}

export function getListeningFeedback(track: ListeningTrack, feedback?: ListeningTap) {
  const lesson = listeningLessons[track.instrument ?? "bass"];
  if (!feedback) return lesson.ready;
  if (feedback.result === "repeated") return "Esta entrada ya está registrada. Conservamos tu primera respuesta; escucha la siguiente.";
  if (feedback.result === "outside") return lesson.outside;
  if (track.instrument !== "choice") return lesson.recognized;
  const sound = feedback.expected === "bass" ? "el bajo: notas graves" : "la batería: bombo, caja y platos";
  return feedback.result === "wrong" ? `Era ${sound}. Al terminar puedes volver a escucharlo.` : `Bien: has reconocido ${sound}.`;
}

export function getListeningGuide(track: ListeningTrack, time: number) {
  const lesson = listeningLessons[track.instrument ?? "bass"];
  if (time < (track.leadInSeconds ?? 0)) return "Acomódate. Primero escucha la base.";
  const change = track.changes.findLast(item => item.time <= time);
  if (!change) return lesson.base;
  if (track.instrument === "choice") {
    const sound = change.action.startsWith("bass") ? "el bajo" : "la batería";
    if (change.action.endsWith("-out")) return `Sale ${sound}. No es una entrada.`;
    return time - change.time < 2 ? listeningLessons[change.action === "bass-in" ? "bass" : "percussion"].entry : "El sonido continúa. Espera otro cambio.";
  }
  if (change.action === `${track.instrument ?? "bass"}-out`) return lesson.exit;
  return time - change.time < 2 ? lesson.entry : lesson.ongoing;
}

export function getListeningReview(track: ListeningTrack, target: number) {
  return { start: Math.max(0, target - 2), end: Math.min(track.duration, target + 3) };
}
