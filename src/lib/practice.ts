import type { AttemptClassification } from "./scoring";
import type { TrainingMode } from "./tracks";

export const practiceModes: readonly TrainingMode[] = ["teach", "assist", "train"];
export const modeLabels: Record<TrainingMode, string> = {
  teach: "Teach · Con guía",
  assist: "Assist · Menos ayuda",
  train: "Train · Solo oído"
};

export type PracticeLocation = { trackId: string; mode: TrainingMode };
export type SavedAttempt = { trackId: string; classification: AttemptClassification; errorMs: number | null };
export type PracticeSession = PracticeLocation & { position: number; progress: { attempts: SavedAttempt[] } };

export function getPracticeNeighbor(
  trackIds: readonly string[],
  location: PracticeLocation,
  direction: -1 | 1
): PracticeLocation | null {
  const trackIndex = trackIds.indexOf(location.trackId);
  const modeIndex = practiceModes.indexOf(location.mode);
  if (trackIndex < 0 || modeIndex < 0) return null;
  const nextIndex = trackIndex * practiceModes.length + modeIndex + direction;
  if (nextIndex < 0 || nextIndex >= trackIds.length * practiceModes.length) return null;
  return {
    trackId: trackIds[Math.floor(nextIndex / practiceModes.length)],
    mode: practiceModes[nextIndex % practiceModes.length]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSavedAttempt(value: unknown): value is SavedAttempt {
  return isRecord(value) && typeof value.trackId === "string" &&
    ["clavado", "cerca", "temprano", "tarde", "otra-vez"].includes(String(value.classification)) &&
    (value.errorMs === null || (typeof value.errorMs === "number" && Number.isFinite(value.errorMs)));
}

export function readPracticeSession(saved: string | null, trackIds: readonly string[]): PracticeSession {
  const fallback: PracticeSession = { trackId: trackIds[0], mode: "teach", position: 0, progress: { attempts: [] } };
  try {
    const parsed: unknown = JSON.parse(saved ?? "null");
    if (!isRecord(parsed)) return fallback;
    const hasTrack = typeof parsed.trackId === "string" && trackIds.includes(parsed.trackId);
    const attempts = isRecord(parsed.progress) && Array.isArray(parsed.progress.attempts)
      ? parsed.progress.attempts.filter(isSavedAttempt).slice(-100)
      : [];
    return {
      trackId: hasTrack ? parsed.trackId as string : fallback.trackId,
      mode: hasTrack && practiceModes.includes(parsed.mode as TrainingMode) ? parsed.mode as TrainingMode : "teach",
      position: hasTrack && typeof parsed.position === "number" && Number.isFinite(parsed.position) && parsed.position >= 0
        ? parsed.position : 0,
      progress: { attempts }
    };
  } catch {
    return fallback;
  }
}

export function getResumePosition(position: number, duration: number): number {
  return Number.isFinite(position) && position >= 0 && position < duration - 0.05 ? position : 0;
}
