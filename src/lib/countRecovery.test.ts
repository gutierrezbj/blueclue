import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { evaluateRecoveryTap, getRecoveryPhase, getRecoveryPlan, getRecoveryReplayStart, summarizeRecoveryRound } from "./countRecovery.ts";
import type { ExerciseRound } from "./exerciseRound.ts";

const trackDirectory = new URL("../../data/tracks/", import.meta.url);
const tracks = readdirSync(trackDirectory).filter(name => name.endsWith(".json")).map(name =>
  JSON.parse(readFileSync(new URL(name, trackDirectory), "utf8")) as { downbeats: number[] }
);

const speed = 0.65;
const track = tracks[0];
const duration = track.downbeats[track.downbeats.length - 1] + 3;
const plan = getRecoveryPlan(track.downbeats, duration, speed)!;
const emptyRound: ExerciseRound = { start: 0, end: 0, taps: [] };

test("every public track has repeated guide-hide-mark cycles with safe final margins", () => {
  for (const candidate of tracks) {
    for (const playbackSpeed of [0.65, 0.8, 1] as const) {
      const candidatePlan = getRecoveryPlan(candidate.downbeats, candidate.downbeats.at(-1)! + 3, playbackSpeed)!;
      assert.equal(candidatePlan.targets.length, 5);
      assert.deepEqual(candidatePlan.targets, [4, 8, 12, 16, 20].map(index => candidate.downbeats[index]));
      assert.deepEqual(candidatePlan.hiddenStarts, [2, 6, 10, 14, 18].map(index => candidate.downbeats[index]));
      assert.ok(candidatePlan.end < candidate.downbeats.at(-1)! + 3);
    }
  }
});

test("long local references stop after five opportunities instead of extending the lesson", () => {
  const barSeconds = track.downbeats[1] - track.downbeats[0];
  const longDownbeats = Array.from({ length: 32 }, (_, index) => track.downbeats[0] + index * barSeconds);
  const longPlan = getRecoveryPlan(longDownbeats, longDownbeats.at(-1)! + 3, speed)!;
  assert.equal(longPlan.targets.length, 5);
  assert.equal(longPlan.targets.at(-1), longDownbeats[20]);
  assert.ok(longPlan.end < longDownbeats[21]);
});

test("the guide disappears for two bars and does not reveal the target inside its scoring window", () => {
  const target = plan.targets[0];
  const margin = 0.45 * speed;
  assert.equal(getRecoveryPhase(0, plan, speed), "prepare");
  assert.equal(getRecoveryPhase(track.downbeats[0], plan, speed), "guide");
  assert.equal(getRecoveryPhase(plan.hiddenStarts[0], plan, speed), "listen");
  assert.equal(getRecoveryPhase(target - margin / 2, plan, speed), "mark");
  assert.equal(getRecoveryPhase(target, plan, speed), "mark");
  assert.equal(getRecoveryPhase(target + margin / 2, plan, speed), "mark");
  assert.equal(getRecoveryPhase(target + margin + 0.001, plan, speed), "guide");
  assert.equal(getRecoveryPhase(plan.end, plan, speed), "complete");
});

test("only hidden-phase taps score; duplicate taps cannot replace the first result", () => {
  const target = plan.targets[0];
  assert.equal(evaluateRecoveryTap(emptyRound, 0, plan, duration, speed), null);
  assert.equal(evaluateRecoveryTap(emptyRound, track.downbeats[1], plan, duration, speed), null);
  const first = evaluateRecoveryTap(emptyRound, target + 0.08 * speed, plan, duration, speed)!;
  assert.equal(first.feedback.result.classification, "clavado");
  const duplicate = evaluateRecoveryTap(first.round, target, plan, duration, speed)!;
  assert.equal(duplicate.repeated, true);
  assert.equal(duplicate.feedback.time, first.feedback.time);
  const summary = summarizeRecoveryRound(duplicate.round, plan);
  assert.equal(summary.perfect, 1);
  assert.equal(summary.missed, 4);
  assert.equal(summary.extra, 1);
});

test("real-time early, late and distant taps keep the same scoring thresholds as Beat Trainer", () => {
  const target = plan.targets[0];
  const early = evaluateRecoveryTap(emptyRound, target - 0.25 * speed, plan, duration, speed)!;
  const late = evaluateRecoveryTap(emptyRound, target + 0.25 * speed, plan, duration, speed)!;
  const distant = evaluateRecoveryTap(emptyRound, plan.hiddenStarts[0], plan, duration, speed)!;
  assert.equal(early.feedback.result.classification, "temprano");
  assert.equal(late.feedback.result.classification, "tarde");
  assert.equal(distant.feedback.result.classification, "otra-vez");
  assert.equal(summarizeRecoveryRound(distant.round, plan).extra, 1);
  const corrected = evaluateRecoveryTap(distant.round, target, plan, duration, speed)!;
  assert.equal(corrected.feedback.result.classification, "clavado");
  assert.equal(summarizeRecoveryRound(corrected.round, plan).perfect, 1);
  assert.equal(getRecoveryReplayStart(plan, target), plan.hiddenStarts[0]);
});

test("short, unsorted or non-finite references cannot start the lesson", () => {
  assert.equal(getRecoveryPlan(track.downbeats.slice(0, 8), duration, speed), null);
  assert.equal(getRecoveryPlan([1, 3, 2, 4, 5, 6, 7, 8, 9], duration, speed), null);
  assert.equal(getRecoveryPlan(track.downbeats, NaN, speed), null);
  assert.equal(getRecoveryPlan(track.downbeats, plan.targets[1], speed), null);
});
