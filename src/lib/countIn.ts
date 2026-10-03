export function getCountIn(time: number, firstDownbeat: number, bpm: number) {
  if (!Number.isFinite(time) || time < 0 || !Number.isFinite(firstDownbeat) || !Number.isFinite(bpm) || bpm <= 0) return null;
  const beatSeconds = 60 / bpm;
  if (time >= firstDownbeat + beatSeconds) return null;
  if (time < firstDownbeat - 3 * beatSeconds) return { phase: "settle" as const, count: null };
  if (time >= firstDownbeat) return { phase: "landing" as const, count: 1 };
  return { phase: "count" as const, count: Math.min(4, Math.ceil((firstDownbeat - time) / beatSeconds - 1e-9) + 1) };
}
