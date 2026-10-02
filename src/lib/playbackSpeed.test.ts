import assert from "node:assert/strict";
import test from "node:test";
import { audioPlaybackRate, isPlaybackSpeed, listeningSeconds, suggestedSpeed } from "./playbackSpeed.ts";
import { calculateTimingError, DEFAULT_THRESHOLDS, scoreAttempt } from "./scoring.ts";

test("beginner levels suggest slower practice without preventing the original tempo", () => {
  assert.equal(suggestedSpeed("very-easy"), 0.65);
  assert.equal(suggestedSpeed("easy"), 0.8);
  assert.equal(suggestedSpeed("medium"), 1);
  assert.equal(suggestedSpeed("hard"), 1);
  assert.ok(isPlaybackSpeed(1));
  assert.ok(!isPlaybackSpeed(0));
  assert.ok(!isPlaybackSpeed("0.65"));
});

test("three silent seconds stay three real seconds at every supported practice speed", () => {
  for (const speed of [0.65, 0.8, 1] as const) {
    assert.equal(audioPlaybackRate(0, 3, speed), 1);
    assert.equal(audioPlaybackRate(2.999, 3, speed), 1);
    assert.equal(audioPlaybackRate(3, 3, speed), speed);
    assert.equal(audioPlaybackRate(0, 0, speed), speed);
    assert.equal(listeningSeconds(3, 3, speed), 3);
    assert.equal(listeningSeconds(3 + 10 * speed, 3, speed), 13);
  }
});

test("slower playback measures error in real milliseconds, not compressed audio time", () => {
  for (const speed of [0.65, 0.8, 1]) {
    for (const errorMs of [-450, -181, -180, -85, 0, 85, 180, 181, 450, 451]) {
      const time = 10 + errorMs / 1000 * speed;
      const slow = scoreAttempt(time, [10], 20, DEFAULT_THRESHOLDS, speed);
      const original = scoreAttempt(10 + errorMs / 1000, [10], 20);
      assert.equal(slow.errorMs, original.errorMs);
      assert.equal(slow.classification, original.classification);
    }
  }
  for (const invalid of [0, -1, NaN, Infinity]) assert.throws(() => calculateTimingError(10, 10, invalid), RangeError);
});
