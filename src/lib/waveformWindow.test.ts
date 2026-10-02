import assert from "node:assert/strict";
import test from "node:test";
import { WAVEFORM_SECONDS, waveformPosition } from "./waveformWindow.ts";

test("three silent seconds occupy a generous part of the beginner viewport", () => {
  const window = { start: 0, end: WAVEFORM_SECONDS };
  assert.equal(waveformPosition(0, window), 0);
  assert.equal(waveformPosition(3, window), 37.5);
  assert.equal(waveformPosition(4, window), 50);
});

test("markers and playhead use the scrolled window, not the whole track", () => {
  const window = { start: 12, end: 20 };
  assert.equal(waveformPosition(12, window), 0);
  assert.equal(waveformPosition(16, window), 50);
  assert.equal(waveformPosition(20, window), 100);
  assert.equal(waveformPosition(11.9, window), null);
  assert.equal(waveformPosition(20.1, window), null);
});

test("empty or invalid waveform windows cannot render misplaced markers", () => {
  assert.equal(waveformPosition(0, { start: 0, end: 0 }), null);
  assert.equal(waveformPosition(NaN, { start: 0, end: 8 }), null);
  assert.equal(waveformPosition(0, { start: 0, end: Infinity }), null);
});
