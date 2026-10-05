import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { evaluateBarCountingTap as evaluateEightBarTap, getBarCountingGuide as getEightBarGuide, getBarCountingPlan as getEightBarPlan, summarizeBarCounting as summarizeEightBars } from "./barCounting.ts";
import type { ExerciseRound } from "./exerciseRound.ts";
import type { TrainingTrack } from "./tracks.ts";

const track: TrainingTrack = {
  id: "test", title: "Test", audioFile: "/test.wav", bpm: 120, timeSignature: "4/4", difficulty: "very-easy", description: "Test",
  beats: Array.from({ length: 96 }, (_, index) => 3 + index * 0.5),
  downbeats: Array.from({ length: 24 }, (_, index) => 3 + index * 2)
};
const duration = 51;
const empty: ExerciseRound = { start: 0, end: 0, taps: [] };

test("the five public tracks support both complete returns at every speed", () => {
  for (const id of ["pulse", "four-count", "offbeat", "return", "subtle-one"]) {
    const pilot = JSON.parse(readFileSync(new URL(`../../data/tracks/${id}.json`, import.meta.url), "utf8")) as TrainingTrack;
    const end = pilot.downbeats.at(-1)! + 240 / pilot.bpm;
    for (const speed of [0.65, 0.8, 1] as const) {
      const plan = getEightBarPlan(pilot, end, speed)!;
      assert.ok(plan);
      assert.equal(plan.targets.length, 2);
      assert.ok(plan.end < end);
      assert.equal(summarizeEightBars({ ...empty, end: plan.end }, pilot, end, speed).missed, 2);
    }
  }
});

test("two listening bars precede two complete eight-bar returns", () => {
  assert.deepEqual(getEightBarPlan(track, duration, 1), { start: 7, targets: [23, 39], end: 39.45 });
  for (const time of [NaN, -1, 0, 3, 5, 6.999, 39.451, 51, Infinity]) assert.equal(evaluateEightBarTap(empty, time, track, duration, 1), null);
  assert.notEqual(evaluateEightBarTap(empty, 7, track, duration, 1)?.feedback.result.classification, "clavado");
});

test("short or invalid references cannot start an exercise", () => {
  assert.equal(getEightBarPlan({ ...track, downbeats: track.downbeats.slice(0, 18) }, duration, 1), null);
  assert.equal(getEightBarPlan(track, 39.45, 1), null);
  assert.equal(getEightBarPlan(track, NaN, 1), null);
  assert.equal(getEightBarPlan({ ...track, downbeats: [NaN, ...track.downbeats] }, duration, 1), null);
  assert.equal(getEightBarPlan({ ...track, downbeats: [3, ...track.downbeats] }, duration, 1), null);
});

test("guide counts bars and beats from the listening boundary, including eight to one", () => {
  assert.equal(getEightBarGuide(5, track, "teach").bar, null);
  assert.equal(getEightBarGuide(7, track, "teach").bar, 1);
  assert.equal(getEightBarGuide(21, track, "teach").bar, 8);
  assert.equal(getEightBarGuide(22.5, track, "teach").beat, 4);
  assert.equal(getEightBarGuide(23, track, "teach").bar, 1);
  assert.equal(getEightBarGuide(39, track, "teach").bar, 1);
  assert.equal(getEightBarGuide(7, track, "teach").bar, 1);
});

test("Assist and Train expose only the initial anchor, never subsequent answers", () => {
  for (const mode of ["assist", "train"] as const) {
    assert.equal(getEightBarGuide(7, track, mode).starting, true);
    assert.equal(getEightBarGuide(7, track, mode).bar, 1);
    for (const time of [9, 21, 23, 39]) {
      assert.equal(getEightBarGuide(time, track, mode).bar, null);
      assert.equal(getEightBarGuide(time, track, mode).beat, null);
      assert.equal(getEightBarGuide(time, track, mode).starting, false);
    }
  }
  assert.equal(getEightBarGuide(9, track, "assist").pulse, true);
  assert.equal(getEightBarGuide(9, track, "train").pulse, false);
});

test("all speeds score real milliseconds and select the closest return", () => {
  for (const speed of [0.65, 0.8, 1] as const) {
    for (const [offset, classification] of [[0, "clavado"], [0.085, "clavado"], [0.18, "cerca"], [-0.25, "temprano"], [0.25, "tarde"], [0.451, "otra-vez"]] as const) {
      const feedback = evaluateEightBarTap(empty, 23 + offset * speed, track, duration, speed)!.feedback;
      assert.equal(feedback.result.classification, classification);
      assert.equal(feedback.result.target, 23);
    }
    assert.equal(evaluateEightBarTap(empty, 38.9, track, duration, speed)?.feedback.result.target, 39);
  }
});

test("far taps do not steal returns and repeated taps cannot inflate the summary", () => {
  let round = evaluateEightBarTap(empty, 9, track, duration, 1)!.round;
  round = evaluateEightBarTap(round, 23, track, duration, 1)!.round;
  const repeated = evaluateEightBarTap(round, 23.1, track, duration, 1)!;
  assert.equal(repeated.repeated, true);
  assert.equal(repeated.feedback.result.classification, "clavado");
  round = evaluateEightBarTap(repeated.round, 39.15, track, duration, 1)!.round;
  const summary = summarizeEightBars({ ...round, end: 39.45 }, track, duration, 1);
  assert.deepEqual([summary.perfect, summary.close, summary.missed, summary.outside, summary.extra], [1, 1, 0, 0, 2]);
});

test("unfinished targets are not failures and replay covers all eight bars", () => {
  assert.equal(summarizeEightBars({ ...empty, end: 22 }, track, duration, 1).outcomes.length, 0);
  assert.equal(summarizeEightBars({ ...empty, end: 39.45 }, track, duration, 1).missed, 2);
  assert.equal(evaluateEightBarTap(empty, 23, track, duration, 1)?.feedback.result.replayStart, 7);
  assert.equal(evaluateEightBarTap(empty, 39, track, duration, 1)?.feedback.result.replayStart, 23);
});
