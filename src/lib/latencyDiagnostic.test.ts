import assert from "node:assert/strict";
import test from "node:test";
import { CLICK_COUNT, buildLatencyReport, describeLatency, interquartileRange, median, nearestClickOffsetMs, scheduleClicks } from "./latencyDiagnostic.ts";

test("twelve clicks one second apart from the first click", () => {
  const clicks = scheduleClicks(2.5);
  assert.equal(clicks.length, CLICK_COUNT);
  assert.equal(clicks[0], 2.5);
  assert.equal(clicks[11], 13.5);
});

test("offset is measured against the nearest click and signed", () => {
  const clicks = scheduleClicks(1);
  assert.equal(Math.round(nearestClickOffsetMs(3.08, clicks)!), 80);
  assert.equal(Math.round(nearestClickOffsetMs(2.95, clicks)!), -50);
  assert.equal(nearestClickOffsetMs(1, []), null);
});

test("median and interquartile range", () => {
  assert.equal(median([]), null);
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(interquartileRange([1]), null);
  assert.equal(interquartileRange([1, 2, 3, 4, 5]), 2);
});

test("the report discards the two settling taps and taps far from any click", () => {
  const clicks = scheduleClicks(1);
  const taps = [1.4, 1.9, 3.09, 4.11, 5.1, 6.08, 7.5, 8.1, 9.09, 10.12];
  const report = buildLatencyReport(taps, clicks);
  assert.equal(report.usedTaps, 7);
  assert.equal(report.discardedTaps, 3);
  assert.equal(report.medianMs, 100);
  assert.ok(report.meanMs !== null && report.meanMs >= 95 && report.meanMs <= 105);
  assert.ok(report.spreadMs !== null && report.spreadMs <= 30);
  assert.match(describeLatency(report), /100 ms después del clic/);
});

test("several taps on one click count as a single sample", () => {
  const clicks = scheduleClicks(1);
  const taps = [1.1, 2.1, 3.05, 3.1, 3.15, 3.2, 3.25, 4.1];
  const report = buildLatencyReport(taps, clicks);
  assert.deepEqual(report.offsetsMs, [50, 100]);
  assert.equal(report.usedTaps, 2);
  assert.equal(report.discardedTaps, 6);
  assert.match(describeLatency(report), /Pocos clics/);
});

test("too few useful taps asks to repeat", () => {
  const report = buildLatencyReport([1.1, 2.1, 3.1], scheduleClicks(1));
  assert.equal(report.usedTaps, 1);
  assert.match(describeLatency(report), /Pocos clics/);
});

test("each click contributes only its first valid tap, never a better duplicate", () => {
  const report = buildLatencyReport([1.1, 1.11, 2.1, 3.2, 3.01, 3.02, 3.03, 3.04], scheduleClicks(1));
  assert.equal(report.usedTaps, 1);
  assert.equal(report.medianMs, 200);
  assert.equal(report.warmupTaps, 2);
  assert.equal(report.duplicateTaps, 5);
  assert.match(describeLatency(report), /Pocos clics/);
});

test("twelve clicks provide at most ten samples even with repeated input", () => {
  const clicks = scheduleClicks(1);
  const taps = clicks.flatMap(click => [click + 0.1, click + 0.12]);
  const report = buildLatencyReport(taps, clicks);
  assert.equal(report.usedTaps, 10);
  assert.equal(report.medianMs, 100);
  assert.equal(report.duplicateTaps, 12);
  assert.equal(report.warmupTaps, 2);
  assert.equal(report.discardedTaps, 14);
});

test("settling belongs to the first two clicks, not the first two arbitrary taps", () => {
  const report = buildLatencyReport([0, 0.1, 3.1, 4.1, 5.1, 6.1], scheduleClicks(1));
  assert.equal(report.usedTaps, 4);
  assert.equal(report.warmupTaps, 0);
  assert.equal(report.outOfWindowTaps, 2);
  assert.equal(report.medianMs, 100);
});

test("outliers do not consume a click and invalid or boundary input stays safe", () => {
  const report = buildLatencyReport([NaN, Infinity, -Infinity, 3.4, 3.3, 3.1, 3.7, 5.300001], scheduleClicks(1));
  assert.deepEqual(report.offsetsMs, [300, -300]);
  assert.equal(report.outOfWindowTaps, 5);
  assert.equal(report.duplicateTaps, 1);
  assert.equal(report.discardedTaps + report.usedTaps, 8);
  assert.equal(buildLatencyReport([1, 2, 3], []).usedTaps, 0);
  assert.equal(nearestClickOffsetMs(NaN, scheduleClicks(1)), null);
});
