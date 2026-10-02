import assert from "node:assert/strict";
import test from "node:test";
import { getPracticeEntry, scorePracticeAttempt } from "./practiceEntry.ts";

const downbeats = [0.5, 2.5, 4.5, 6.5, 8.5];
const duration = 10;

test("the first two bars are for listening, not scoring", () => {
  const entry = getPracticeEntry(downbeats, duration);
  assert.deepEqual(entry, { target: 4.5, opensAt: 4.05 });
  for (const time of [0, 0.5, 2.5, 4.049]) {
    assert.equal(scorePracticeAttempt(time, downbeats, duration, entry), null);
  }
});

test("TAP opens before the first practice downbeat and accepts early, exact and late taps", () => {
  const entry = getPracticeEntry(downbeats, duration);
  for (const [time, classification] of [[4.05, "temprano"], [4.5, "clavado"], [4.8, "tarde"]] as const) {
    const result = scorePracticeAttempt(time, downbeats, duration, entry);
    assert.equal(result?.target, 4.5);
    assert.equal(result?.classification, classification);
  }
  assert.equal(scorePracticeAttempt(6.5, downbeats, duration, entry)?.classification, "clavado");
});

test("entry follows reference downbeats at different tempos and with a pickup", () => {
  for (const bpm of [90, 122, 128]) {
    const barLength = 240 / bpm;
    const references = Array.from({ length: 8 }, (_, index) => 0.65 + index * barLength);
    const entry = getPracticeEntry(references, 30);
    assert.equal(entry?.target, references[2]);
    assert.equal(scorePracticeAttempt(references[1], references, 30, entry), null);
    assert.equal(scorePracticeAttempt(references[2], references, 30, entry)?.classification, "clavado");
  }
});

test("restarting or seeking back restores listening without counting an attempt", () => {
  const entry = getPracticeEntry(downbeats, duration);
  assert.ok(scorePracticeAttempt(8.5, downbeats, duration, entry));
  assert.equal(scorePracticeAttempt(0.5, downbeats, duration, entry), null);
  assert.ok(scorePracticeAttempt(4.5, downbeats, duration, entry));
});

test("short fragments and invalid or out-of-bounds positions never produce an attempt", () => {
  assert.equal(getPracticeEntry([], duration), null);
  assert.equal(getPracticeEntry([0.5, 2.5], duration), null);
  assert.equal(getPracticeEntry(downbeats, 4.5), null);
  assert.equal(getPracticeEntry(downbeats, NaN), null);
  const entry = getPracticeEntry(downbeats, duration);
  for (const time of [-1, NaN, Infinity, duration + 0.01]) {
    assert.equal(scorePracticeAttempt(time, downbeats, duration, entry), null);
  }
  assert.equal(scorePracticeAttempt(4.5, downbeats, duration, null), null);
});
