import assert from "node:assert/strict";
import test from "node:test";
import { getPracticeNeighbor, getResumePosition, readPracticeSession, type PracticeLocation } from "./practice.ts";

const trackIds = ["pulse", "four-count"];

test("practice advances through the help modes before changing track", () => {
  assert.deepEqual(getPracticeNeighbor(trackIds, { trackId: "pulse", mode: "teach" }, 1), { trackId: "pulse", mode: "assist" });
  assert.deepEqual(getPracticeNeighbor(trackIds, { trackId: "pulse", mode: "assist" }, 1), { trackId: "pulse", mode: "train" });
  assert.deepEqual(getPracticeNeighbor(trackIds, { trackId: "pulse", mode: "train" }, 1), { trackId: "four-count", mode: "teach" });
});

test("previous step works across track boundaries without wrapping", () => {
  assert.deepEqual(getPracticeNeighbor(trackIds, { trackId: "four-count", mode: "teach" }, -1), { trackId: "pulse", mode: "train" });
  assert.equal(getPracticeNeighbor(trackIds, { trackId: "pulse", mode: "teach" }, -1), null);
  assert.equal(getPracticeNeighbor(trackIds, { trackId: "four-count", mode: "train" }, 1), null);
  assert.equal(getPracticeNeighbor(trackIds, { trackId: "missing", mode: "teach" }, 1), null);
});

test("all five pilot tracks form a reversible fifteen-step route", () => {
  const pilotIds = ["pulse", "four-count", "offbeat", "return", "subtle-one"];
  let location: PracticeLocation = { trackId: pilotIds[0], mode: "teach" };
  for (let step = 0; step < 14; step += 1) {
    const next = getPracticeNeighbor(pilotIds, location, 1)!;
    assert.deepEqual(getPracticeNeighbor(pilotIds, next, -1), location);
    location = next;
  }
  assert.deepEqual(location, { trackId: "subtle-one", mode: "train" });
  assert.equal(getPracticeNeighbor(pilotIds, location, 1), null);
});

test("session restores track, mode, playhead and previous attempts", () => {
  const session = { trackId: "four-count", mode: "train", position: 12.5, progress: { attempts: [{ trackId: "pulse", classification: "cerca", errorMs: -90 }] } };
  assert.deepEqual(readPracticeSession(JSON.stringify(session), trackIds), session);
  assert.equal(readPracticeSession(JSON.stringify({ ...session, position: undefined }), trackIds).position, 0);
});

test("invalid saved state cannot break navigation or progress rendering", () => {
  for (const saved of [null, "{", "null", "[]"]) {
    assert.equal(readPracticeSession(saved, trackIds).trackId, "pulse");
  }
  const restored = readPracticeSession(JSON.stringify({ trackId: "missing", mode: "train", position: 8, progress: { attempts: [null, {}, { trackId: "pulse", classification: "clavado", errorMs: 0 }] } }), trackIds);
  assert.equal(restored.trackId, "pulse");
  assert.equal(restored.mode, "teach");
  assert.equal(restored.position, 0);
  assert.equal(restored.progress.attempts.length, 1);
  assert.equal(readPracticeSession(JSON.stringify({ trackId: "pulse", mode: "unknown", position: -2 }), trackIds).position, 0);
});

test("resume rejects finished or invalid positions so practice can restart", () => {
  assert.equal(getResumePosition(12.5, 30), 12.5);
  for (const position of [-1, 30, 40, Infinity, NaN]) assert.equal(getResumePosition(position, 30), 0);
});
