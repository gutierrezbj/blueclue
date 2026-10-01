export function isDownbeat(beat: number, downbeats: readonly number[]): boolean {
  return downbeats.some((downbeat) => Math.abs(downbeat - beat) < 0.001);
}

export function getBeatPosition(time: number, beats: readonly number[], downbeats: readonly number[]) {
  const beatIndex = beats.findLastIndex((beat) => beat <= time);
  const downbeatIndex = downbeats.findLastIndex((downbeat) => downbeat <= time);
  const anchor = downbeats[Math.max(0, downbeatIndex)];
  const anchorIndex = beats.findIndex((beat) => Math.abs(beat - anchor) < 0.001);
  if (!Number.isFinite(time) || beatIndex < 0 || anchorIndex < 0) {
    return { beatIndex, count: null, bar: null };
  }
  return {
    beatIndex,
    count: ((beatIndex - anchorIndex) % 4 + 4) % 4 + 1,
    bar: downbeatIndex < 0 ? null : downbeatIndex + 1
  };
}
