import type { TrainingTrack } from "./tracks.ts";

export type ListeningTrack = TrainingTrack & {
  duration: number;
  changes: { time: number; action: "bass-in" | "bass-out" }[];
};

export type ListeningTap = { time: number; target: number | null; result: "recognized" | "repeated" | "outside" };
export const RECOGNITION_SECONDS = 2.5;

export function getBassEntries(track: ListeningTrack) {
  return track.changes.filter(change => change.action === "bass-in").map(change => change.time);
}

export function evaluateListeningTap(track: ListeningTrack, taps: ListeningTap[], time: number): ListeningTap | null {
  if (!Number.isFinite(time) || time < 0 || time >= track.duration) return null;
  const change = track.changes.findLast(item => item.time <= time);
  if (!change || change.action !== "bass-in" || time - change.time > RECOGNITION_SECONDS) {
    return { time, target: null, result: "outside" };
  }
  const repeated = taps.some(tap => tap.target === change.time && tap.result === "recognized");
  return { time, target: change.time, result: repeated ? "repeated" : "recognized" };
}

export function summarizeListening(track: ListeningTrack, taps: ListeningTap[]) {
  const entries = getBassEntries(track).map(time => ({ time, recognized: taps.some(tap => tap.target === time && tap.result === "recognized") }));
  return {
    entries,
    recognized: entries.filter(entry => entry.recognized).length,
    missed: entries.filter(entry => !entry.recognized).length,
    extra: taps.filter(tap => tap.result !== "recognized").length
  };
}

export function getBassGuide(track: ListeningTrack, time: number) {
  if (time < (track.leadInSeconds ?? 0)) return "Acomódate. Primero escucha la base.";
  const change = track.changes.findLast(item => item.time <= time);
  if (!change) return "Esta es la base, todavía sin bajo.";
  if (change.action === "bass-out") return "Sale el bajo. La base sigue sonando.";
  return time - change.time < 2 ? "Entra el bajo: escucha las notas graves." : "El bajo sigue. No es otra entrada.";
}

export function getListeningReview(track: ListeningTrack, target: number) {
  return { start: Math.max(0, target - 2), end: Math.min(track.duration, target + 3) };
}
