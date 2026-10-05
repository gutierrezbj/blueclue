import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { evaluateBarCountingTap, getBarCountingGuide, getBarCountingPlan, getBarLesson, summarizeBarCounting } from "./barCounting.ts";
import type { ExerciseRound } from "./exerciseRound.ts";
import type { TrainingTrack } from "./tracks.ts";

const track: TrainingTrack = {
  id: "test", title: "Test", bpm: 120, difficulty: "very-easy", timeSignature: "4/4", audioFile: "/test.wav", description: "Test",
  beats: Array.from({ length: 96 }, (_, index) => 3 + index * 0.5),
  downbeats: Array.from({ length: 24 }, (_, index) => 3 + index * 2)
};
const empty: ExerciseRound = { start: 0, end: 0, taps: [] };

test("sixteen bars require one long return, not two eight-bar hits", () => {
  assert.deepEqual(getBarCountingPlan(track, 51, 1, 16), { start: 7, targets: [39], end: 39.45 });
  assert.deepEqual(getBarCountingPlan(track, 51, 1, 8)?.targets, [23, 39]);
  const halfWay = evaluateBarCountingTap(empty, 23, track, 51, 1, 16)!;
  assert.equal(halfWay.feedback.result.classification, "otra-vez");
  assert.match(halfWay.feedback.result.message, /compás 9 es la mitad/);
  const correct = evaluateBarCountingTap(halfWay.round, 39, track, 51, 1, 16)!;
  assert.equal(correct.repeated, false);
  assert.equal(correct.feedback.result.classification, "clavado");
  const summary = summarizeBarCounting({ ...correct.round, end: 39.45 }, track, 51, 1, 16);
  assert.deepEqual([summary.outcomes.length, summary.perfect, summary.extra], [1, 1, 1]);
});

test("count continues eight to nine, then sixteen to one, after pause or replay", () => {
  for (const [time, bar, beat] of [[22.5, 8, 4], [23, 9, 1], [37, 16, 1], [38.5, 16, 4], [39, 1, 1], [7, 1, 1], [23, 9, 1]]) {
    const guide = getBarCountingGuide(time, track, "teach", 16);
    assert.equal(guide.bar, bar);
    assert.equal(guide.beat, beat);
  }
});

test("sixteen-bar Assist and Train never signal the halfway point or the return", () => {
  for (const mode of ["assist", "train"] as const) {
    assert.equal(getBarCountingGuide(7, track, mode, 16).bar, 1);
    for (const time of [9, 23, 37, 39]) {
      const guide = getBarCountingGuide(time, track, mode, 16);
      assert.equal(guide.bar, null);
      assert.equal(guide.beat, null);
      assert.equal(guide.starting, false);
    }
  }
});

test("sixteen-bar scoring preserves real tolerances and preparation at all speeds", () => {
  for (const speed of [0.65, 0.8, 1] as const) {
    for (const time of [NaN, -1, 0, 3, 5, 6.999, 40, Infinity]) assert.equal(evaluateBarCountingTap(empty, time, track, 51, speed, 16), null);
    for (const [offset, classification] of [[-0.451, "otra-vez"], [-0.45, "temprano"], [-0.181, "temprano"], [-0.18, "cerca"], [-0.085, "clavado"], [0, "clavado"], [0.085, "clavado"], [0.18, "cerca"], [0.181, "tarde"], [0.45, "tarde"]] as const) {
      const feedback = evaluateBarCountingTap(empty, 39 + offset * speed, track, 51, speed, 16)!.feedback;
      assert.equal(feedback.result.classification, classification);
      assert.equal(feedback.result.target, 39);
      assert.equal(feedback.result.replayStart, 7);
    }
    const plan = getBarCountingPlan(track, 51, speed, 16)!;
    assert.equal(summarizeBarCounting({ ...empty, end: plan.end - 0.001 }, track, 51, speed, 16).outcomes.length, 0);
    assert.equal(summarizeBarCounting({ ...empty, end: plan.end }, track, 51, speed, 16).missed, 1);
  }
});

test("repeated taps retain the first valid result and replay does not create another target", () => {
  const first = evaluateBarCountingTap(empty, 38.8, track, 51, 1, 16)!;
  const repeated = evaluateBarCountingTap(first.round, 39, track, 51, 1, 16)!;
  assert.equal(repeated.repeated, true);
  assert.equal(repeated.feedback.result.classification, "temprano");
  const summary = summarizeBarCounting({ ...repeated.round, end: 39.45 }, track, 51, 1, 16);
  assert.deepEqual([summary.perfect, summary.close, summary.outside, summary.missed, summary.extra], [0, 0, 1, 0, 1]);
  assert.equal(first.feedback.result.replayStart, track.downbeats[2]);
});

test("all five existing synthetic tracks allow sixteen bars without new audio", () => {
  for (const id of ["pulse", "four-count", "offbeat", "return", "subtle-one"]) {
    const pilot = JSON.parse(readFileSync(new URL(`../../data/tracks/${id}.json`, import.meta.url), "utf8")) as TrainingTrack;
    const duration = pilot.downbeats.at(-1)! + 240 / pilot.bpm;
    for (const speed of [0.65, 0.8, 1] as const) {
      const plan = getBarCountingPlan(pilot, duration, speed, 16)!;
      assert.equal(plan.targets.length, 1);
      assert.equal(plan.targets[0], pilot.downbeats[18]);
      assert.ok(plan.end < duration);
    }
  }
  assert.equal(getBarCountingPlan({ ...track, downbeats: track.downbeats.slice(0, 18) }, 51, 1, 16), null);
  assert.equal(getBarCountingPlan(track, 39.45, 1, 16), null);
});

test("eight-bar links and persistence remain compatible, sixteen-bar results stay separate", () => {
  assert.equal(getBarLesson(8).storagePrefix, "blueclue-eight-bars-v1");
  assert.equal(getBarLesson(8).hash, "#compases");
  assert.equal(getBarLesson(8).turns, 2);
  assert.notEqual(getBarLesson(16).storagePrefix, getBarLesson(8).storagePrefix);
  assert.equal(getBarLesson(16).hash, "#compases-16");
  assert.equal(getBarLesson(16).turns, 1);
});
