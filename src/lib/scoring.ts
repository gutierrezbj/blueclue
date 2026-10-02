export type ScoringThresholds = {
  perfectMs: number;
  closeMs: number;
  retryMs: number;
};

export type AttemptClassification = "clavado" | "cerca" | "temprano" | "tarde" | "otra-vez";

export type AttemptResult = {
  target: number | null;
  errorMs: number | null;
  classification: AttemptClassification;
  message: string;
  replayStart: number | null;
};

export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  perfectMs: 85,
  closeMs: 180,
  retryMs: 450
};

export function nearestDownbeat(time: number, downbeats: readonly number[]): number | null {
  if (!Number.isFinite(time)) return null;
  let nearest: number | null = null;
  for (const downbeat of downbeats) {
    if (!Number.isFinite(downbeat)) continue;
    if (
      nearest === null ||
      Math.abs(downbeat - time) < Math.abs(nearest - time) - 1e-9 ||
      (Math.abs(Math.abs(downbeat - time) - Math.abs(nearest - time)) <= 1e-9 && downbeat < nearest)
    ) {
      nearest = downbeat;
    }
  }
  return nearest;
}

export function calculateTimingError(tapTime: number, target: number, playbackRate = 1): number {
  if (!Number.isFinite(playbackRate) || playbackRate <= 0) throw new RangeError("Playback rate must be positive");
  return Math.round((tapTime - target) * 1000 / playbackRate);
}

export function getReplayStart(target: number, leadSeconds = 2.5): number {
  return Math.max(0, Math.round((target - leadSeconds) * 1000) / 1000);
}

export function classifyAttempt(errorMs: number, thresholds: ScoringThresholds): AttemptClassification {
  const absoluteError = Math.abs(errorMs);
  if (absoluteError <= thresholds.perfectMs) return "clavado";
  if (absoluteError <= thresholds.closeMs) return "cerca";
  if (absoluteError > thresholds.retryMs) return "otra-vez";
  return errorMs < 0 ? "temprano" : "tarde";
}

export function scoreAttempt(
  tapTime: number,
  downbeats: readonly number[],
  duration: number,
  thresholds: ScoringThresholds = DEFAULT_THRESHOLDS,
  playbackRate = 1
): AttemptResult {
  const target = nearestDownbeat(tapTime, downbeats);
  if (target === null || tapTime < 0 || tapTime > duration) {
    return {
      target,
      errorMs: null,
      classification: "otra-vez",
      message: "Escucha de nuevo y busca el siguiente 1.",
      replayStart: target === null ? null : getReplayStart(target)
    };
  }

  const errorMs = calculateTimingError(tapTime, target, playbackRate);
  const classification = classifyAttempt(errorMs, thresholds);
  const messages: Record<AttemptClassification, string> = {
    clavado: "Clavado. Ese era el 1.",
    cerca: "Cerca. Escúchalo otra vez.",
    temprano: "Te adelantaste. Espera al inicio del grupo de cuatro.",
    tarde: "Llegaste tarde. Anticipa el próximo 1.",
    "otra-vez": "Escucha de nuevo y busca el siguiente 1."
  };

  return {
    target,
    errorMs,
    classification,
    message: messages[classification],
    replayStart: getReplayStart(target)
  };
}
