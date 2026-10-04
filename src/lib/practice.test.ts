import assert from "node:assert/strict";
import test from "node:test";
import { getPracticeNeighbor, getResumePosition, readPracticeSession, type PracticeStep } from "./practice.ts";

const trackIds = ["pulse", "four-count"];

test("practice removes help before increasing speed", () => {
  const start: PracticeStep = { trackId: "pulse", moduleId: "pulse", mode: "teach", playbackSpeed: 0.65 };
  const assist = { ...start, mode: "assist" as const };
  const train = { ...start, mode: "train" as const };
  assert.deepEqual(getPracticeNeighbor(trackIds, start, 1), assist);
  assert.deepEqual(getPracticeNeighbor(trackIds, assist, 1), train);
  assert.deepEqual(getPracticeNeighbor(trackIds, train, 1), { ...start, playbackSpeed: 0.8 });
  assert.deepEqual(getPracticeNeighbor(trackIds, { ...train, playbackSpeed: 0.8 }, 1), { ...start, playbackSpeed: 1 });
  assert.deepEqual(getPracticeNeighbor(trackIds, { ...train, playbackSpeed: 1 }, 1), { ...start, moduleId: "count" });
});

test("previous step works across track boundaries without wrapping", () => {
  const first: PracticeStep = { trackId: "pulse", moduleId: "pulse", mode: "teach", playbackSpeed: 0.65 };
  const last: PracticeStep = { trackId: "four-count", moduleId: "downbeat", mode: "train", playbackSpeed: 1 };
  assert.deepEqual(getPracticeNeighbor(trackIds, { ...first, trackId: "four-count" }, -1), { ...last, trackId: "pulse" });
  assert.equal(getPracticeNeighbor(trackIds, first, -1), null);
  assert.equal(getPracticeNeighbor(trackIds, last, 1), null);
  assert.equal(getPracticeNeighbor(trackIds, { ...first, trackId: "missing" }, 1), null);
  assert.equal(getPracticeNeighbor([], first, 1), null);
});

test("five tracks cover every module, speed and help combination reversibly", () => {
  const pilotIds = ["pulse", "four-count", "offbeat", "return", "subtle-one"];
  let location: PracticeStep = { trackId: pilotIds[0], moduleId: "pulse", mode: "teach", playbackSpeed: 0.65 };
  const visited = new Set([JSON.stringify(location)]);
  for (let step = 0; step < 134; step += 1) {
    const next = getPracticeNeighbor(pilotIds, location, 1)!;
    assert.deepEqual(getPracticeNeighbor(pilotIds, next, -1), location);
    assert.equal(visited.has(JSON.stringify(next)), false);
    visited.add(JSON.stringify(next));
    location = next;
  }
  assert.equal(visited.size, 135);
  assert.deepEqual(location, { trackId: "subtle-one", moduleId: "downbeat", mode: "train", playbackSpeed: 1 });
  assert.equal(getPracticeNeighbor(pilotIds, location, 1), null);
});

test("a freely chosen or restored step keeps its position in the route", () => {
  const saved = readPracticeSession(JSON.stringify({ trackId: "four-count", moduleId: "count", mode: "assist", playbackSpeed: 0.8, position: 12 }), trackIds);
  const location: PracticeStep = { ...saved, playbackSpeed: saved.playbackSpeed! };
  assert.deepEqual(getPracticeNeighbor(trackIds, location, 1), { trackId: "four-count", moduleId: "count", mode: "train", playbackSpeed: 0.8 });
  assert.deepEqual(getPracticeNeighbor(trackIds, location, -1), { trackId: "four-count", moduleId: "count", mode: "teach", playbackSpeed: 0.8 });
});

test("session restores module, speed, mode, playhead and previous attempts", () => {
  const session = { trackId: "four-count", moduleId: "count", playbackSpeed: 0.65, mode: "train", position: 12.5, progress: { attempts: [{ trackId: "pulse", moduleId: "pulse", playbackSpeed: 0.8, classification: "cerca", errorMs: -90 }] } };
  assert.deepEqual(readPracticeSession(JSON.stringify(session), trackIds), session);
  assert.equal(readPracticeSession(JSON.stringify({ ...session, position: undefined }), trackIds).position, 0);
});

test("legacy sessions retain their downbeat exercise and do not invent a saved speed", () => {
  const session = readPracticeSession(JSON.stringify({ trackId: "pulse", mode: "teach", position: 5 }), trackIds);
  assert.equal(session.moduleId, "downbeat");
  assert.equal(session.position, 5);
  assert.equal(session.playbackSpeed, undefined);
  assert.equal(readPracticeSession(null, trackIds).moduleId, "pulse");
});

test("invalid module and speed values cannot corrupt an exercise", () => {
  const session = readPracticeSession(JSON.stringify({ trackId: "pulse", moduleId: "fake", playbackSpeed: -1, mode: "train", position: 5, progress: { attempts: [
    { trackId: "pulse", moduleId: "fake", classification: "clavado", errorMs: 0 },
    { trackId: "pulse", moduleId: "pulse", playbackSpeed: 8, classification: "clavado", errorMs: 0 }
  ] } }), trackIds);
  assert.equal(session.moduleId, "pulse");
  assert.equal(session.mode, "teach");
  assert.equal(session.position, 0);
  assert.equal(session.playbackSpeed, undefined);
  assert.equal(session.progress.attempts.length, 0);
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
