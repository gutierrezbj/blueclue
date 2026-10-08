import assert from "node:assert/strict";
import test from "node:test";
import { assessReadiness, completedReadinessRound, isGoodRound, nextSuggestedSlot, readRoundHistory, recordRound, type RoundHistory } from "./readiness.ts";
import { recordRoundTap, type ExerciseRound } from "./exerciseRound.ts";
import type { TrainingTrack } from "./tracks.ts";

const good = { total: 10, perfect: 6, close: 2, extra: 0, offTarget: 0 };
const weak = { ...good, perfect: 3 };
const short = { ...good, total: 5, perfect: 5, close: 0 };

test("a good round needs eight opportunities and eighty percent on target", () => {
  assert.equal(isGoodRound(good), true);
  assert.equal(isGoodRound(weak), false);
  assert.equal(isGoodRound(short), false);
  assert.equal(isGoodRound({ ...good, total: 8, perfect: 4, close: 2 }), false);
  assert.equal(isGoodRound({ ...good, total: 8, perfect: 4, close: 3 }), true);
});

const track: TrainingTrack = { id: "test", title: "Test", bpm: 120, timeSignature: "4/4", audioFile: "test.wav", difficulty: "very-easy", description: "", beats: Array.from({ length: 96 }, (_, index) => 3 + index * 0.5), downbeats: Array.from({ length: 24 }, (_, index) => 3 + index * 2) };
const slot = { moduleId: "downbeat", mode: "train", speed: 1 } as const;

function practice(times: number[], start = 0): ExerciseRound {
  let round: ExerciseRound = { start, end: start, taps: [] };
  for (const time of times) round = recordRoundTap(round, time, track, slot.moduleId, slot.speed, 51);
  return { ...round, end: 51 };
}

test("tapping every beat cannot qualify as recognizing the downbeat", () => {
  const result = completedReadinessRound(practice(track.beats), track, slot, 51)!;
  assert.deepEqual([result.total, result.perfect, result.offTarget], [22, 22, 66]);
  assert.equal(isGoodRound(result), false);
  assert.equal(isGoodRound({ ...good, extra: 1 }), false);
  const accurate = completedReadinessRound(practice(track.downbeats), track, slot, 51)!;
  assert.equal(isGoodRound(accurate), true);
});

test("partial, resumed and unverified rounds never become advancement records", () => {
  const full = practice(track.downbeats);
  assert.equal(completedReadinessRound(practice(track.downbeats, 32), track, slot, 51), null);
  assert.equal(completedReadinessRound({ ...full, end: 50.99 }, track, slot, 51), null);
  assert.equal(completedReadinessRound(full, { ...track, referenceStatus: "pending-listening" }, slot, 51), null);
  for (const duration of [0, NaN, Infinity]) assert.equal(completedReadinessRound(full, track, slot, duration), null);
  assert.ok(completedReadinessRound(full, track, slot, 51));
  const history = recordRound(recordRound(recordRound({}, slot, good), slot, good), slot, good);
  assert.equal(assessReadiness(history, slot, null).verdict, "repeat");
  assert.match(assessReadiness(history, slot, null).message, /desde el principio/);
});

test("old records without additional taps are not treated as trustworthy", () => {
  assert.deepEqual(readRoundHistory(JSON.stringify({ "downbeat/train/1": [{ total: 22, perfect: 22, close: 0 }] })), { "downbeat/train/1": [] });
});

test("the suggested order removes help, then speeds up, then changes level", () => {
  assert.deepEqual(nextSuggestedSlot({ moduleId: "pulse", mode: "teach", speed: 0.65 }), { moduleId: "pulse", mode: "assist", speed: 0.65 });
  assert.deepEqual(nextSuggestedSlot({ moduleId: "pulse", mode: "train", speed: 0.65 }), { moduleId: "pulse", mode: "teach", speed: 0.8 });
  assert.deepEqual(nextSuggestedSlot({ moduleId: "pulse", mode: "train", speed: 1 }), { moduleId: "count", mode: "teach", speed: 0.65 });
  assert.equal(nextSuggestedSlot({ moduleId: "downbeat", mode: "train", speed: 1 }), null);
});

test("history keeps the last five rounds per slot and survives bad input", () => {
  let history: RoundHistory = readRoundHistory("not json");
  assert.deepEqual(history, {});
  const slot = { moduleId: "count" as const, mode: "teach" as const, speed: 0.65 as const };
  for (let index = 0; index < 7; index++) history = recordRound(history, slot, index % 2 ? good : weak);
  assert.equal(history["count/teach/0.65"].length, 5);
  const reread = readRoundHistory(JSON.stringify({ ...history, junk: [{ total: 1, perfect: 5, close: 0 }, "x"] }));
  assert.deepEqual(reread["count/teach/0.65"], history["count/teach/0.65"]);
  assert.deepEqual(reread.junk, []);
});

test("three good rounds out of the last five suggest advancing; fewer suggest repeating", () => {
  const slot = { moduleId: "pulse" as const, mode: "teach" as const, speed: 0.65 as const };
  let history: RoundHistory = {};
  history = recordRound(history, slot, good);
  let readiness = assessReadiness(history, slot, good);
  assert.equal(readiness.verdict, "repeat");
  assert.match(readiness.message, /1 de 3/);
  history = recordRound(history, slot, weak);
  readiness = assessReadiness(history, slot, weak);
  assert.equal(readiness.verdict, "repeat");
  assert.match(readiness.message, /Vas bien/);
  readiness = assessReadiness(history, slot, short);
  assert.match(readiness.message, /Ronda corta/);
  history = recordRound(recordRound(history, slot, good), slot, good);
  readiness = assessReadiness(history, slot, good);
  assert.equal(readiness.verdict, "advance");
  assert.match(readiness.message, /menos ayuda: Assist/);
  const fast = { moduleId: "pulse" as const, mode: "train" as const, speed: 0.65 as const };
  let fastHistory: RoundHistory = {};
  for (let index = 0; index < 3; index++) fastHistory = recordRound(fastHistory, fast, good);
  assert.match(assessReadiness(fastHistory, fast, good).message, /más rápido: Intermedio/);
  const last = { moduleId: "downbeat" as const, mode: "train" as const, speed: 1 as const };
  let lastHistory: RoundHistory = {};
  for (let index = 0; index < 3; index++) lastHistory = recordRound(lastHistory, last, good);
  assert.equal(assessReadiness(lastHistory, last, good).verdict, "done");
});
