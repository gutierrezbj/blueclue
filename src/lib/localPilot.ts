import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import type { TrainingTrack } from "./tracks";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimeline(value: unknown, duration: number): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 512 && value.every((time, index) =>
    typeof time === "number" && Number.isFinite(time) && time >= 0 && time < duration && (index === 0 || time > value[index - 1]));
}

export function parseLocalPilot(value: unknown): TrainingTrack[] {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.tracks) || value.tracks.length !== 5) {
    throw new Error("The local pilot must contain exactly five tracks");
  }
  const identifiers = new Set<string>();
  return value.tracks.map((track) => {
    if (!isRecord(track) || typeof track.id !== "string" || !/^local-[a-z0-9-]{1,60}$/.test(track.id) || identifiers.has(track.id) ||
      typeof track.duration !== "number" || !Number.isFinite(track.duration) || track.duration <= 0 || track.duration > 90 ||
      (track.leadInSeconds !== undefined && (typeof track.leadInSeconds !== "number" || !Number.isFinite(track.leadInSeconds) || track.leadInSeconds < 0 || track.leadInSeconds >= track.duration)) ||
      typeof track.bpm !== "number" || !Number.isFinite(track.bpm) || track.bpm < 40 || track.bpm > 240 || track.timeSignature !== "4/4" ||
      !["very-easy", "easy", "medium", "hard"].includes(String(track.difficulty)) ||
      !["pending-listening", "listening-verified"].includes(String(track.referenceStatus)) ||
      ![track.title, track.description, track.sourceTitle, track.referenceSource].every((text) => typeof text === "string" && text.trim().length > 0 && text.length <= 500) ||
      track.audioFile !== `/tracks/local-pilot/${track.id}.wav` ||
      !isTimeline(track.beats, track.duration) || !isTimeline(track.downbeats, track.duration) ||
      !track.downbeats.every((downbeat) => (track.beats as number[]).some((beat) => Math.abs(beat - downbeat) < 0.001))) {
      throw new Error("Invalid local pilot track");
    }
    identifiers.add(track.id);
    if (track.leadInSeconds !== undefined && track.beats[0] < (track.leadInSeconds as number)) {
      throw new Error("Beats cannot fall inside the silent lead-in");
    }
    const downbeatIndices = track.downbeats.map((downbeat) => (track.beats as number[]).findIndex((beat) => Math.abs(beat - downbeat) < 0.001));
    if (downbeatIndices.some((beatIndex, index) => index > 0 && beatIndex - downbeatIndices[index - 1] !== 4)) {
      throw new Error("Downbeats must agree with the 4/4 beat timeline");
    }
    return track as TrainingTrack;
  });
}

export async function loadLocalPilot(workspace: string): Promise<{ tracks: TrainingTrack[] | null; notice: string | null }> {
  let raw: string;
  try {
    const manifest = path.join(workspace, ".local", "pilot.json");
    if ((await stat(manifest)).size > 256_000) throw new Error("Pilot manifest is too large");
    raw = await readFile(manifest, "utf8");
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") return { tracks: null, notice: null };
    return { tracks: null, notice: "No se pudo leer el piloto local. Puedes practicar con las pistas de demostración." };
  }
  try {
    const tracks = parseLocalPilot(JSON.parse(raw));
    const directory = await realpath(path.join(workspace, "public", "tracks", "local-pilot"));
    for (const track of tracks) {
      const audio = await realpath(path.join(directory, `${track.id}.wav`));
      if (path.dirname(audio) !== directory || !(await stat(audio)).isFile()) throw new Error("Missing local audio");
    }
    return { tracks, notice: null };
  } catch {
    return { tracks: null, notice: "El piloto local está incompleto o tiene referencias inválidas. Mostramos las pistas de demostración para que puedas continuar." };
  }
}
