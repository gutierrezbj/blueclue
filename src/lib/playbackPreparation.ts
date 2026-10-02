export function getPreparationSeconds(audioTime: number, leadInSeconds = 0): number | null {
  if (!Number.isFinite(audioTime) || !Number.isFinite(leadInSeconds) || audioTime < 0 || audioTime >= leadInSeconds) return null;
  return Math.ceil(leadInSeconds - audioTime);
}
