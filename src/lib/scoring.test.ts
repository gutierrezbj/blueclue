import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateTimingError,
  classifyAttempt,
  getReplayStart,
  nearestDownbeat,
  scoreAttempt
} from "./scoring.ts";

const downbeats = [0.8, 3.2, 5.6];
const thresholds = { perfectMs: 85, closeMs: 180, retryMs: 450 };

test("a precise tap is clavado", () => {
  const result = scoreAttempt(3.2, downbeats, 8, thresholds);
  assert.equal(result.classification, "clavado");
  assert.equal(result.errorMs, 0);
  assert.equal(result.target, 3.2);
});

test("early and late taps retain their direction", () => {
  assert.equal(scoreAttempt(3.0, downbeats, 8, thresholds).classification, "temprano");
  assert.equal(scoreAttempt(3.4, downbeats, 8, thresholds).classification, "tarde");
  assert.equal(calculateTimingError(3.0, 3.2), -200);
});

test("nearest downbeat wins, with earlier target on a tie", () => {
  assert.equal(nearestDownbeat(5.5, downbeats), 5.6);
  assert.equal(nearestDownbeat(4.4, downbeats), 3.2);
  assert.equal(nearestDownbeat(10, []), null);
});

test("configurable tolerance boundaries are inclusive", () => {
  assert.equal(classifyAttempt(85, thresholds), "clavado");
  assert.equal(classifyAttempt(-180, thresholds), "cerca");
  assert.equal(classifyAttempt(181, thresholds), "tarde");
  assert.equal(classifyAttempt(-450, thresholds), "temprano");
  assert.equal(classifyAttempt(451, thresholds), "otra-vez");
});

test("out-of-range taps and replay near track edges", () => {
  assert.equal(scoreAttempt(-0.1, downbeats, 8, thresholds).classification, "otra-vez");
  assert.equal(scoreAttempt(8.1, downbeats, 8, thresholds).classification, "otra-vez");
  assert.equal(scoreAttempt(7.9, downbeats, 8, thresholds).classification, "otra-vez");
  assert.equal(getReplayStart(0.8), 0);
  assert.equal(getReplayStart(5.6), 3.1);
});
