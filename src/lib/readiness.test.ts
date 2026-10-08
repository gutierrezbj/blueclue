import assert from "node:assert/strict";
import test from "node:test";
import { assessReadiness, isGoodRound, nextSuggestedSlot, readRoundHistory, recordRound, type RoundHistory } from "./readiness.ts";

const good = { total: 10, perfect: 6, close: 2 };
const weak = { total: 10, perfect: 3, close: 2 };
const short = { total: 5, perfect: 5, close: 0 };

test("a good round needs eight opportunities and eighty percent on target", () => {
  assert.equal(isGoodRound(good), true);
  assert.equal(isGoodRound(weak), false);
  assert.equal(isGoodRound(short), false);
  assert.equal(isGoodRound({ total: 8, perfect: 4, close: 2 }), false);
  assert.equal(isGoodRound({ total: 8, perfect: 4, close: 3 }), true);
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
