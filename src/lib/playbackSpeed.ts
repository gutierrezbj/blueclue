import type { Difficulty } from "./tracks.ts";

export const playbackSpeeds = [0.65, 0.8, 1] as const;
export type PlaybackSpeed = typeof playbackSpeeds[number];
export const speedLabels: Record<PlaybackSpeed, string> = { 0.65: "Despacio", 0.8: "Intermedio", 1: "Original" };

export function isPlaybackSpeed(value: unknown): value is PlaybackSpeed {
  return playbackSpeeds.some((speed) => speed === value);
}

export function suggestedSpeed(difficulty: Difficulty): PlaybackSpeed {
  return difficulty === "very-easy" ? 0.65 : difficulty === "easy" ? 0.8 : 1;
}

export function listeningSeconds(time: number, speed: PlaybackSpeed): number {
  return time / speed;
}
