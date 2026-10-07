import assert from "node:assert/strict";
import test from "node:test";
import { enterPractice, readAppRoute } from "./navigation.ts";
import type { PracticeSession } from "./practice.ts";

test("home contains two learning blocks with explicit level entry points", () => {
  for (const hash of ["", "#inicio", "#unknown"]) assert.deepEqual(readAppRoute(hash), { screen: "home" });
  assert.deepEqual(readAppRoute("#marca-el-1"), { screen: "rhythm" });
  assert.deepEqual(readAppRoute("#escucha-el-cambio"), { screen: "listening-menu" });
  assert.deepEqual(readAppRoute("#escucha-el-bajo"), { screen: "bass" });
  assert.deepEqual(readAppRoute("#escucha-la-percusion"), { screen: "percussion" });
  for (const [index, moduleId] of ["pulse", "count", "downbeat"].entries()) assert.deepEqual(readAppRoute(`#nivel-${index + 1}`), { screen: "practice", moduleId });
});

test("legacy links preserve exercises and practice anchors", () => {
  for (const [hash, bars] of [["#compases", 8], ["#compases-16", 16], ["#compases-32", 32]] as const) assert.deepEqual(readAppRoute(hash), { screen: "bars", bars });
  for (const hash of ["#practice-controls", "#listening", "#track-select", "#pocket-mode"]) assert.deepEqual(readAppRoute(hash), { screen: "practice" });
});

const session: PracticeSession = { trackId: "pulse", moduleId: "downbeat", mode: "train", playbackSpeed: 1, position: 19.5, progress: { attempts: [{ trackId: "pulse", classification: "cerca", errorMs: 120 }] } };

test("reentering the same level resumes settings without discarding progress", () => {
  assert.equal(enterPractice(session, "downbeat"), session);
  assert.equal(enterPractice(session), session);
});

test("choosing another level starts gently without losing track or history", () => {
  const next = enterPractice(session, "count");
  assert.equal(next.trackId, session.trackId);
  assert.equal(next.progress, session.progress);
  assert.equal(next.moduleId, "count");
  assert.equal(next.mode, "teach");
  assert.equal(next.playbackSpeed, 0.65);
  assert.equal(next.position, 0);
  assert.equal(session.position, 19.5);
});
