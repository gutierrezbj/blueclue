export const CLICK_COUNT = 12;
export const CLICK_INTERVAL_SECONDS = 1;
export const DISCARDED_LEADING_TAPS = 2;
export const MAX_TAP_DISTANCE_MS = 300;

export type LatencyReport = {
  medianMs: number | null;
  meanMs: number | null;
  spreadMs: number | null;
  usedTaps: number;
  discardedTaps: number;
  offsetsMs: number[];
};

/** Click times in AudioContext seconds, starting at `firstClick`. */
export function scheduleClicks(firstClick: number, count = CLICK_COUNT, interval = CLICK_INTERVAL_SECONDS): number[] {
  return Array.from({ length: count }, (_, index) => firstClick + index * interval);
}

export function nearestClickOffsetMs(tapTime: number, clicks: readonly number[]): number | null {
  let best: number | null = null;
  for (const click of clicks) {
    const offset = (tapTime - click) * 1000;
    if (best === null || Math.abs(offset) < Math.abs(best)) best = offset;
  }
  return best;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function quartile(sorted: readonly number[], fraction: number): number {
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function interquartileRange(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return quartile(sorted, 0.75) - quartile(sorted, 0.25);
}

/**
 * Compares taps with the clicks. The first taps are discarded as settling; taps far from any click are
 * discarded as misses. Positive offsets mean the tap registered after the click.
 */
export function buildLatencyReport(tapTimes: readonly number[], clicks: readonly number[]): LatencyReport {
  const considered = tapTimes.slice(DISCARDED_LEADING_TAPS);
  const offsets = considered.map(tap => nearestClickOffsetMs(tap, clicks)).filter((offset): offset is number => offset !== null);
  const kept = offsets.filter(offset => Math.abs(offset) <= MAX_TAP_DISTANCE_MS).map(offset => Math.round(offset));
  const mean = kept.length ? Math.round(kept.reduce((sum, value) => sum + value, 0) / kept.length) : null;
  const medianValue = median(kept);
  const spread = interquartileRange(kept);
  return {
    medianMs: medianValue === null ? null : Math.round(medianValue),
    meanMs: mean,
    spreadMs: spread === null ? null : Math.round(spread),
    usedTaps: kept.length,
    discardedTaps: tapTimes.length - kept.length,
    offsetsMs: kept
  };
}

export function describeLatency(report: LatencyReport): string {
  if (report.medianMs === null || report.usedTaps < 4) return "Pocos toques útiles para medir. Repite con los doce clics.";
  const direction = report.medianMs > 0 ? "después" : report.medianMs < 0 ? "antes" : "exactamente en";
  return `Tus toques llegan de mediana ${Math.abs(report.medianMs)} ms ${direction} del clic. Dispersión: ${report.spreadMs ?? 0} ms.`;
}
