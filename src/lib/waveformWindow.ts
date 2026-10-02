export const WAVEFORM_SECONDS = 8;
export type WaveformWindow = { start: number; end: number };

export function waveformPosition(time: number, window: WaveformWindow): number | null {
  if (!Number.isFinite(time) || !Number.isFinite(window.start) || !Number.isFinite(window.end) || window.end <= window.start || time < window.start || time > window.end) return null;
  return (time - window.start) / (window.end - window.start) * 100;
}
