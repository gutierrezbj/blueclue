import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { evaluateBarCountingTap, getBarCountingGuide, getBarCountingPlan, getBarLesson, getVisibleBars, summarizeBarCounting } from "./barCounting.ts";
import type { ExerciseRound } from "./exerciseRound.ts";
import type { TrainingTrack } from "./tracks.ts";

const track: TrainingTrack = {
  id: "long", title: "Long", bpm: 120, difficulty: "easy", timeSignature: "4/4", audioFile: "/long.wav", description: "Test",
  beats: Array.from({ length: 144 }, (_, index) => 3 + index * 0.5),
  downbeats: Array.from({ length: 36 }, (_, index) => 3 + index * 2)
};
const empty: ExerciseRound = { start: 0, end: 0, taps: [] };

test("32 bars: only the final return counts, intermediate groups cannot steal it", () => {
  assert.deepEqual(getBarCountingPlan(track, 75, 1, 32), { start: 7, targets: [71], end: 71.45 });
  let round = empty;
  for (const time of [23, 39, 55]) {
    const result = evaluateBarCountingTap(round, time, track, 75, 1, 32)!;
    assert.equal(result.feedback.result.classification, "otra-vez");
    round = result.round;
  }
  const exact = evaluateBarCountingTap(round, 71, track, 75, 1, 32)!;
  assert.equal(exact.feedback.result.classification, "clavado");
  assert.equal(exact.repeated, false);
  assert.equal(exact.feedback.result.replayStart, 7);
  const summary = summarizeBarCounting({ ...exact.round, end: 71.45 }, track, 75, 1, 32);
  assert.deepEqual([summary.outcomes.length, summary.perfect, summary.extra], [1, 1, 3]);
});

test("32 bars: eight-slot windows and count stay aligned at all four group boundaries", () => {
  assert.deepEqual(getVisibleBars(null), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (let bar = 1; bar <= 32; bar++) {
    const time = 7 + (bar - 1) * 2;
    const guide = getBarCountingGuide(time, track, "teach", 32);
    assert.equal(guide.bar, bar);
    const visible = getVisibleBars(guide.bar);
    assert.equal(visible.length, 8);
    assert.ok(visible.includes(bar));
    assert.equal(visible[0], Math.floor((bar - 1) / 8) * 8 + 1);
    for (const mode of ["assist", "train"] as const) {
      assert.equal(getBarCountingGuide(time, track, mode, 32).bar, bar === 1 ? 1 : null);
    }
  }
  assert.equal(getBarCountingGuide(70.5, track, "teach", 32).bar, 32);
  assert.equal(getBarCountingGuide(71, track, "teach", 32).bar, 1);
  assert.equal(getBarCountingGuide(71, track, "train", 32).bar, null);
});

test("32 bars: real tolerances, preparation, duplicate feedback and final window at every speed", () => {
  for (const speed of [0.65, 0.8, 1] as const) {
    const plan = getBarCountingPlan(track, 75, speed, 32)!;
    for (const time of [NaN, -1, 6.999, plan.end + 0.001, Infinity]) assert.equal(evaluateBarCountingTap(empty, time, track, 75, speed, 32), null);
    for (const [offset, classification] of [[-0.451, "otra-vez"], [-0.45, "temprano"], [-0.181, "temprano"], [-0.18, "cerca"], [-0.085, "clavado"], [0, "clavado"], [0.085, "clavado"], [0.18, "cerca"], [0.181, "tarde"], [0.45, "tarde"]] as const) {
      assert.equal(evaluateBarCountingTap(empty, 71 + offset * speed, track, 75, speed, 32)!.feedback.result.classification, classification);
    }
    const first = evaluateBarCountingTap(empty, 71 - 0.2 * speed, track, 75, speed, 32)!;
    const duplicate = evaluateBarCountingTap(first.round, 71, track, 75, speed, 32)!;
    assert.equal(duplicate.repeated, true);
    assert.equal(duplicate.feedback.result.classification, "temprano");
    const summary = summarizeBarCounting({ ...duplicate.round, end: plan.end }, track, 75, speed, 32);
    assert.deepEqual([summary.perfect, summary.outside, summary.extra], [0, 1, 1]);
    assert.equal(summarizeBarCounting({ ...empty, end: plan.end - 0.001 }, track, 75, speed, 32).missed, 0);
    assert.equal(summarizeBarCounting({ ...empty, end: plan.end }, track, 75, speed, 32).missed, 1);
  }
});

test("32-bar tracks contain sufficient real audio, silence and an audible final downbeat", () => {
  for (const id of ["pulse", "four-count", "offbeat", "return", "subtle-one"]) {
    const pilot = JSON.parse(readFileSync(new URL(`../../data/tracks/count-32/${id}.json`, import.meta.url), "utf8")) as TrainingTrack;
    const original = JSON.parse(readFileSync(new URL(`../../data/tracks/${id}.json`, import.meta.url), "utf8")) as TrainingTrack;
    assert.notEqual(pilot.id, original.id);
    assert.notEqual(pilot.audioFile, original.audioFile);
    assert.equal(original.downbeats.length, 24);
    assert.equal(pilot.downbeats.length, 36);
    assert.equal(pilot.beats.length, 144);
    const wav = readFileSync(new URL(`../../public${pilot.audioFile}`, import.meta.url));
    const sampleRate = wav.readUInt32LE(24);
    const duration = (wav.length - 44) / 2 / sampleRate;
    for (let sample = 0; sample < sampleRate * 3; sample++) assert.equal(wav.readInt16LE(44 + sample * 2), 0);
    for (let index = 0; index < pilot.downbeats.length; index++) {
      const downbeat = pilot.downbeats[index];
      assert.equal(downbeat, pilot.beats[index * 4]);
      if (index) assert.ok(Math.abs(downbeat - pilot.downbeats[index - 1] - 240 / pilot.bpm) < 0.0002);
      const first = Math.round(downbeat * sampleRate);
      let peak = 0;
      for (let sample = first; sample < first + sampleRate * 0.02; sample++) peak = Math.max(peak, Math.abs(wav.readInt16LE(44 + sample * 2)));
      assert.ok(peak > 1000);
    }
    for (const speed of [0.65, 0.8, 1] as const) {
      const plan = getBarCountingPlan(pilot, duration, speed, 32)!;
      assert.equal(plan.targets[0], pilot.downbeats[34]);
      assert.ok(plan.end < duration);
    }
    assert.equal(getBarCountingPlan(original, 90, 1, 32), null);
  }
});

test("32 bars do not reuse earlier storage or silently accept short references", () => {
  assert.equal(new Set([8, 16, 32].map(bars => getBarLesson(bars as 8 | 16 | 32).storagePrefix)).size, 3);
  assert.equal(getBarLesson(32).hash, "#compases-32");
  assert.equal(getBarCountingPlan({ ...track, downbeats: track.downbeats.slice(0, 34) }, 75, 1, 32), null);
  assert.equal(getBarCountingPlan(track, 71.45, 1, 32), null);
  assert.deepEqual(getBarCountingPlan(track, 75, 1, 8)?.targets, [23, 39]);
  assert.deepEqual(getBarCountingPlan(track, 75, 1, 16)?.targets, [39]);
});
