import type { AttemptClassification } from "./scoring";
import type { TrainingMode } from "./tracks";
import { getLearningModule, isLearningModuleId, learningModules, type LearningModuleId } from "./learningModules.ts";
import { isPlaybackSpeed, type PlaybackSpeed } from "./playbackSpeed.ts";

export const practiceModes: readonly TrainingMode[] = ["teach", "assist", "train"];
export const modeLabels: Record<TrainingMode, string> = {
  teach: "Teach · Con guía",
  assist: "Assist · Menos ayuda",
  train: "Train · Solo oído"
};

export type PracticeLocation = { trackId: string; moduleId: LearningModuleId; mode: TrainingMode };
export type SavedAttempt = { trackId: string; moduleId?: LearningModuleId; playbackSpeed?: PlaybackSpeed; classification: AttemptClassification; errorMs: number | null };
export type PracticeSession = PracticeLocation & { playbackSpeed?: PlaybackSpeed; position: number; progress: { attempts: SavedAttempt[] } };

export function getPracticeNeighbor(
  trackIds: readonly string[],
  location: PracticeLocation,
  direction: -1 | 1
): PracticeLocation | null {
  const trackIndex = trackIds.indexOf(location.trackId);
  const moduleIndex = learningModules.findIndex((module) => module.id === location.moduleId);
  if (trackIndex < 0 || moduleIndex < 0) return null;
  const nextIndex = trackIndex * learningModules.length + moduleIndex + direction;
  if (nextIndex < 0 || nextIndex >= trackIds.length * learningModules.length) return null;
  const nextModule = learningModules[nextIndex % learningModules.length];
  return {
    trackId: trackIds[Math.floor(nextIndex / learningModules.length)],
    moduleId: nextModule.id,
    mode: nextModule.defaultMode
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSavedAttempt(value: unknown): value is SavedAttempt {
  return isRecord(value) && typeof value.trackId === "string" &&
    (value.moduleId === undefined || isLearningModuleId(value.moduleId)) &&
    (value.playbackSpeed === undefined || isPlaybackSpeed(value.playbackSpeed)) &&
    ["clavado", "cerca", "temprano", "tarde", "otra-vez"].includes(String(value.classification)) &&
    (value.errorMs === null || (typeof value.errorMs === "number" && Number.isFinite(value.errorMs)));
}

export function readPracticeSession(saved: string | null, trackIds: readonly string[]): PracticeSession {
  const fallback: PracticeSession = { trackId: trackIds[0], moduleId: "pulse", mode: "teach", position: 0, progress: { attempts: [] } };
  try {
    const parsed: unknown = JSON.parse(saved ?? "null");
    if (!isRecord(parsed)) return fallback;
    const hasTrack = typeof parsed.trackId === "string" && trackIds.includes(parsed.trackId);
    const hasModule = parsed.moduleId === undefined || isLearningModuleId(parsed.moduleId);
    const moduleId = hasTrack ? isLearningModuleId(parsed.moduleId) ? parsed.moduleId : parsed.moduleId === undefined ? "downbeat" : "pulse" : "pulse";
    const attempts = isRecord(parsed.progress) && Array.isArray(parsed.progress.attempts)
      ? parsed.progress.attempts.filter(isSavedAttempt).slice(-100)
      : [];
    return {
      trackId: hasTrack ? parsed.trackId as string : fallback.trackId,
      moduleId,
      mode: hasTrack && hasModule && practiceModes.includes(parsed.mode as TrainingMode) ? parsed.mode as TrainingMode : getLearningModule(moduleId).defaultMode,
      ...(hasTrack && isPlaybackSpeed(parsed.playbackSpeed) ? { playbackSpeed: parsed.playbackSpeed } : {}),
      position: hasTrack && hasModule && typeof parsed.position === "number" && Number.isFinite(parsed.position) && parsed.position >= 0
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
