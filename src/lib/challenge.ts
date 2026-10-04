import { summarizeRound, type ExerciseRound } from "./exerciseRound.ts";
import { isLearningModuleId, type LearningModuleId } from "./learningModules.ts";
import { isPlaybackSpeed, type PlaybackSpeed } from "./playbackSpeed.ts";
import { DEFAULT_THRESHOLDS } from "./scoring.ts";
import type { TrainingMode, TrainingTrack } from "./tracks.ts";

export const CHALLENGE_RULES = { version: 1, minimumTargets: 20, successPercent: 80, distinctTracks: 2 } as const;

export type ChallengeRecord = {
  trackId: string;
  moduleId: LearningModuleId;
  speed: PlaybackSpeed;
  reference: string;
  total: number;
  perfect: number;
  close: number;
  outside: number;
  missed: number;
  extra: number;
  offTarget: number;
  completedAt: string;
};

export function challengeReference(track: TrainingTrack): string {
  const source = JSON.stringify([CHALLENGE_RULES.version, track.id, track.audioFile.split("?")[0], track.sourceStart, track.bpm, track.beats, track.downbeats, DEFAULT_THRESHOLDS]);
  let hash = 2166136261;
  for (const character of source) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `${CHALLENGE_RULES.version}-${(hash >>> 0).toString(16)}`;
}

export function challengePercent(record: ChallengeRecord): number {
  return Math.floor((record.perfect + record.close) * 100 / (record.total + record.extra + record.offTarget));
}

export function passesChallenge(record: ChallengeRecord): boolean {
  return record.total >= CHALLENGE_RULES.minimumTargets && (record.perfect + record.close) * 100 >= CHALLENGE_RULES.successPercent * (record.total + record.extra + record.offTarget);
}

export function completeChallenge(input: {
  round: ExerciseRound;
  track: TrainingTrack;
  moduleId: LearningModuleId;
  speed: PlaybackSpeed;
  mode: TrainingMode;
  duration: number;
  reachedEnd: boolean;
  invalidated: boolean;
  completedAt: string;
}): ChallengeRecord | null {
  const { round, track, moduleId, speed, mode, duration, reachedEnd, invalidated, completedAt } = input;
  if (!reachedEnd || invalidated || mode !== "train" || track.referenceStatus === "pending-listening" ||
    !Number.isFinite(duration) || duration <= 0 || round.start !== 0 || round.end < duration || !Number.isFinite(Date.parse(completedAt))) return null;
  const summary = summarizeRound(round, track, moduleId, speed, duration);
  if (summary.total < CHALLENGE_RULES.minimumTargets) return null;
  return { trackId: track.id, moduleId, speed, reference: challengeReference(track), total: summary.total,
    perfect: summary.perfect, close: summary.close, outside: summary.outside, missed: summary.missed, extra: summary.extra, offTarget: summary.offTarget, completedAt };
}

export function sameChallenge(left: ChallengeRecord, right: ChallengeRecord): boolean {
  return left.trackId === right.trackId && left.moduleId === right.moduleId && left.speed === right.speed && left.reference === right.reference;
}

export function isBetterChallenge(candidate: ChallengeRecord, previous: ChallengeRecord): boolean {
  const candidateHits = candidate.perfect + candidate.close;
  const previousHits = previous.perfect + previous.close;
  const candidateTotal = candidate.total + candidate.extra + candidate.offTarget;
  const previousTotal = previous.total + previous.extra + previous.offTarget;
  return candidateHits * previousTotal > previousHits * candidateTotal ||
    (candidateHits * previousTotal === previousHits * candidateTotal && candidate.perfect * previousTotal > previous.perfect * candidateTotal);
}

export function saveChallengeRecord(records: readonly ChallengeRecord[], candidate: ChallengeRecord): ChallengeRecord[] {
  const previous = records.find(record => sameChallenge(record, candidate));
  if (previous && !isBetterChallenge(candidate, previous)) return [...records];
  return [...records.filter(record => !sameChallenge(record, candidate)), candidate];
}

export function readChallengeRecords(saved: string | null, tracks: readonly TrainingTrack[]): ChallengeRecord[] {
  try {
    const parsed: unknown = JSON.parse(saved ?? "null");
    if (!Array.isArray(parsed)) return [];
    let records: ChallengeRecord[] = [];
    for (const value of parsed.slice(-tracks.length * 9 * 4)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const track = tracks.find(item => item.id === value.trackId);
      if (!track || track.referenceStatus === "pending-listening" || value.reference !== challengeReference(track) ||
        !isLearningModuleId(value.moduleId) || !isPlaybackSpeed(value.speed) ||
        typeof value.completedAt !== "string" || !Number.isFinite(Date.parse(value.completedAt))) continue;
      const counts = [value.total, value.perfect, value.close, value.outside, value.missed, value.extra, value.offTarget];
      if (!counts.every(count => Number.isSafeInteger(count) && count >= 0) || value.total < CHALLENGE_RULES.minimumTargets ||
        value.total > (value.moduleId === "pulse" ? track.beats.length : track.downbeats.length) ||
        value.perfect + value.close + value.outside + value.missed !== value.total) continue;
      records = saveChallengeRecord(records, value as ChallengeRecord);
    }
    return records;
  } catch {
    return [];
  }
}

export function challengeReadiness(records: readonly ChallengeRecord[], tracks: readonly TrainingTrack[], moduleId: LearningModuleId, speed: PlaybackSpeed) {
  const passedTrackIds = tracks.filter(track => track.referenceStatus !== "pending-listening" && records.some(record =>
    record.trackId === track.id && record.reference === challengeReference(track) && record.moduleId === moduleId && record.speed === speed && passesChallenge(record)
  )).map(track => track.id);
  return { passedTrackIds, ready: passedTrackIds.length >= CHALLENGE_RULES.distinctTracks };
}
