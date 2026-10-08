import type { ListeningTrack } from "./listening.ts";
import type { ListeningLesson } from "./listeningLessons.ts";

/** The approved sample first, then the published variants of the same practice. */
export function variantsFor(base: ListeningTrack, published: readonly ListeningTrack[]): ListeningTrack[] {
  const lesson: ListeningLesson = base.instrument ?? "bass";
  return [base, ...published.filter(track => (track.instrument ?? "bass") === lesson && track.id !== base.id)];
}

/** Another sample for the next round; never the one just practised when there is a choice. `random` is in [0, 1). */
export function pickAnotherVariant(variants: readonly ListeningTrack[], currentId: string, random: number): ListeningTrack {
  const others = variants.filter(track => track.id !== currentId);
  if (others.length === 0) return variants.find(track => track.id === currentId) ?? variants[0];
  const index = Math.min(others.length - 1, Math.max(0, Math.floor(random * others.length)));
  return others[index];
}

export function isListeningTrack(value: unknown): value is ListeningTrack {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.audioFile === "string" && typeof record.duration === "number" &&
    Array.isArray(record.changes) && record.changes.every(change => typeof change === "object" && change !== null &&
      typeof (change as Record<string, unknown>).time === "number" && typeof (change as Record<string, unknown>).action === "string");
}
