import assert from "node:assert/strict";
import test from "node:test";
import { challengePercent, challengeReadiness, completeChallenge, readChallengeRecords, saveChallengeRecord, passesChallenge } from "./challenge.ts";
import { recordRoundTap, type ExerciseRound } from "./exerciseRound.ts";
import type { TrainingTrack } from "./tracks.ts";

const track: TrainingTrack = { id: "one", title: "One", bpm: 120, audioFile: "/one.wav?v=1", difficulty: "easy", timeSignature: "4/4", description: "Test",
  beats: Array.from({ length: 96 }, (_, index) => 4 + index * 0.5), downbeats: Array.from({ length: 24 }, (_, index) => 4 + index * 2) };
const other = { ...track, id: "two", audioFile: "/two.wav" };
const completedAt = "2026-10-04T12:00:00.000Z";

function input(hits = 18) {
  let round: ExerciseRound = { start: 0, end: 52, taps: [] };
  for (const target of track.downbeats.slice(2, 2 + hits)) round = recordRoundTap(round, target, track, "downbeat", 1, 52);
  return { round: { ...round, end: 52 }, track, moduleId: "downbeat" as const, speed: 1 as const, mode: "train" as const, duration: 52, reachedEnd: true, invalidated: false, completedAt };
}

test("challenge counts misses in the denominator and never rounds up to a pass", () => {
  const below = completeChallenge(input(17))!;
  const above = completeChallenge(input(18))!;
  assert.equal(below.total, 22);
  assert.equal(below.missed, 5);
  assert.equal(challengePercent(below), 77);
  assert.equal(passesChallenge(below), false);
  assert.equal(passesChallenge(above), true);
  assert.equal(passesChallenge({ ...above, total: 1000, perfect: 799, close: 0 }), false);
  assert.equal(passesChallenge({ ...above, total: 20, perfect: 16, close: 0 }), true);
});

test("partial, skipped, assisted and provisional rounds cannot create a record", () => {
  const base = input();
  for (const overrides of [{ reachedEnd: false }, { invalidated: true }, { mode: "teach" as const }, { mode: "assist" as const },
    { round: { ...base.round, start: 1 } }, { round: { ...base.round, end: 30 } }, { duration: NaN },
    { completedAt: "invalid" }, { track: { ...track, referenceStatus: "pending-listening" as const } },
    { track: { ...track, downbeats: track.downbeats.slice(0, 10) } }]) assert.equal(completeChallenge({ ...base, ...overrides }), null);
});

test("duplicate taps do not improve the first response or the challenge score", () => {
  const base = input(0);
  const late = recordRoundTap(base.round, 8.3, track, "downbeat", 1, 52);
  const repeated = recordRoundTap(late, 8, track, "downbeat", 1, 52);
  const result = completeChallenge({ ...base, round: { ...repeated, end: 52 } })!;
  assert.equal(result.perfect, 0);
  assert.equal(result.outside, 1);
  assert.equal(result.missed, 21);
});

test("records retain the best comparable round, breaking ties by nailed targets", () => {
  const best = completeChallenge(input(20))!;
  const lower = completeChallenge(input(18))!;
  assert.deepEqual(saveChallengeRecord([best], lower), [best]);
  assert.deepEqual(saveChallengeRecord([lower], best), [best]);
  const near = { ...best, perfect: 0, close: 20 };
  assert.deepEqual(saveChallengeRecord([near], best), [best]);
  assert.equal(saveChallengeRecord([best], { ...best, speed: 0.65 }).length, 2);
  assert.equal(saveChallengeRecord([best], { ...best, moduleId: "count" }).length, 2);
});

test("recommendation requires two distinct current tracks at the same level and speed", () => {
  const first = completeChallenge(input())!;
  const second = completeChallenge({ ...input(), track: other })!;
  assert.equal(challengeReadiness([first, first], [track, other], "downbeat", 1).ready, false);
  assert.equal(challengeReadiness([first, { ...second, speed: 0.65 }], [track, other], "downbeat", 1).ready, false);
  assert.equal(challengeReadiness([first, second], [track, other], "downbeat", 1).ready, true);
  assert.equal(challengeReadiness([first, second], [track, other], "pulse", 1).ready, false);
  assert.equal(challengeReadiness([first, second], [{ ...track, bpm: 121 }, other], "downbeat", 1).ready, false);
});

test("record storage tolerates corruption and drops obsolete references without touching practice", () => {
  const record = completeChallenge(input())!;
  assert.deepEqual(readChallengeRecords(JSON.stringify([record]), [track]), [record]);
  assert.deepEqual(readChallengeRecords("bad json", [track]), []);
  assert.deepEqual(readChallengeRecords(JSON.stringify([null, { ...record, total: -1 }, { ...record, perfect: 99 }, { ...record, speed: 2 }, { ...record, completedAt: false }]), [track]), []);
  assert.deepEqual(readChallengeRecords(JSON.stringify([record]), [{ ...track, beats: [1, 2] }]), []);
  assert.deepEqual(readChallengeRecords(JSON.stringify([record]), [{ ...track, audioFile: "/one.wav?v=2" }]), [record]);
  assert.deepEqual(readChallengeRecords(JSON.stringify([record]), [{ ...track, referenceStatus: "pending-listening" }]), []);
});

test("all speeds keep the same opportunities and real timing tolerances", () => {
  for (const speed of [0.65, 0.8, 1] as const) {
    let round: ExerciseRound = { start: 0, end: 0, taps: [] };
    for (const target of track.downbeats.slice(2)) round = recordRoundTap(round, target + 0.17 * speed, track, "downbeat", speed, 52);
    const result = completeChallenge({ ...input(), round: { ...round, end: 52 }, speed })!;
    assert.equal(result.close, 22);
    assert.equal(result.total, 22);
    assert.equal(challengePercent(result), 100);
  }
  assert.equal(completeChallenge({ ...input(0), moduleId: "pulse" })?.total, 88);
});
