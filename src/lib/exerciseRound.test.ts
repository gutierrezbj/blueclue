import assert from "node:assert/strict";
import test from "node:test";
import { recordRoundTap, summarizeRound, reviewOutcome, type ExerciseRound } from "./exerciseRound.ts";
import type { TrainingTrack } from "./tracks.ts";

const track: TrainingTrack = { id: "test", title: "Test", bpm: 120, timeSignature: "4/4", audioFile: "test.wav", difficulty: "very-easy", description: "", beats: Array.from({ length: 40 }, (_, index) => 3.5 + index * 0.5), downbeats: [3.5, 5.5, 7.5, 9.5, 11.5, 13.5, 15.5, 17.5, 19.5, 21.5] };

test("round counts opportunities, uses first tap and reports duplicates separately", () => {
  let round: ExerciseRound = { start: 0, end: 0, taps: [] };
  for (const time of [7.5, 7.51, 9.65, 11.8]) round = recordRoundTap(round, time, track, "downbeat", 1, 24);
  const summary = summarizeRound({ ...round, end: 14 }, track, "downbeat", 1, 24);
  assert.deepEqual([summary.total, summary.perfect, summary.close, summary.outside, summary.missed, summary.extra], [4, 1, 1, 1, 1, 1]);
  assert.equal(reviewOutcome(summary.outcomes[3]).target, 13.5);
  assert.equal(reviewOutcome(summary.outcomes[3]).errorMs, null);
});

test("summary excludes warmup, future targets and partially heard opportunities", () => {
  assert.equal(summarizeRound({ start: 0, end: 7.5, taps: [] }, track, "downbeat", 1, 24).total, 0);
  assert.equal(summarizeRound({ start: 9.4, end: 12, taps: [] }, track, "downbeat", 1, 24).total, 1);
  assert.equal(summarizeRound({ start: 0, end: 6, taps: [] }, track, "downbeat", 1, 24).total, 0);
  assert.equal(summarizeRound({ start: 0, end: 22, taps: [] }, track, "downbeat", 1, 22).total, 8);
});

test("slow summary preserves real tolerances and pulse targets", () => {
  let round: ExerciseRound = { start: 0, end: 0, taps: [] };
  round = recordRoundTap(round, 8 + 0.18 * 0.65, track, "pulse", 0.65, 24);
  const summary = summarizeRound({ ...round, end: 8.5 }, track, "pulse", 0.65, 24);
  assert.equal(summary.total, 2);
  assert.equal(summary.close, 1);
  assert.equal(summary.missed, 1);
  assert.equal(summary.outcomes[1].result?.errorMs, 180);
  assert.equal(recordRoundTap(round, 2, track, "pulse", 0.65, 24), round);
});

test("repeated presses cannot replace a poor first attempt with a perfect one", () => {
  let round: ExerciseRound = { start: 0, end: 0, taps: [] };
  round = recordRoundTap(round, 7.2, track, "downbeat", 1, 24);
  round = recordRoundTap(round, 7.5, track, "downbeat", 1, 24);
  const summary = summarizeRound({ ...round, end: 8 }, track, "downbeat", 1, 24);
  assert.equal(summary.perfect, 0);
  assert.equal(summary.outside, 1);
  assert.equal(summary.extra, 1);
  assert.equal(summary.outcomes[0].result?.errorMs, -300);
});
