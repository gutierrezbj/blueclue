import assert from "node:assert/strict";
import test from "node:test";
import { entryStep, guidedPath, nextGuidedStep, readGuidedPathState, serializeGuidedPathState, stepForHash } from "./guidedPath.ts";
import { enterPractice, readAppRoute } from "./navigation.ts";
import { getPracticeNeighbor, type PracticeSession } from "./practice.ts";

test("the guided path starts with the sounds and ends with the choice practice", () => {
  assert.deepEqual(guidedPath.map(step => step.id), ["sounds", "pulse", "count", "downbeat", "bass", "percussion", "choice"]);
  assert.equal(guidedPath[0].hash, "#sonidos");
  assert.equal(nextGuidedStep("sounds")?.id, "pulse");
  assert.equal(nextGuidedStep("choice"), null);
});

test("every path hash resolves to its step and foreign hashes do not", () => {
  for (const step of guidedPath) assert.equal(stepForHash(step.hash)?.id, step.id);
  assert.equal(stepForHash("#compases"), null);
  assert.equal(stepForHash("#inicio"), null);
});

test("saved state is validated and drives the entry button", () => {
  assert.equal(readGuidedPathState(null), null);
  assert.equal(readGuidedPathState("{broken"), null);
  assert.equal(readGuidedPathState(JSON.stringify({ stepId: "unknown" })), null);
  const saved = serializeGuidedPathState("count", new Date("2026-10-08T10:00:00Z"));
  const state = readGuidedPathState(saved);
  assert.deepEqual(state, { stepId: "count", updatedAt: "2026-10-08T10:00:00.000Z" });
  assert.equal(entryStep(state).hash, "#nivel-2");
  assert.equal(entryStep(null).hash, "#sonidos");
});

test("resuming an internally selected level keeps its aids, speed and position", () => {
  for (const moduleId of ["pulse", "count", "downbeat"] as const) {
    const session: PracticeSession = { trackId: "pulse", moduleId, mode: "train", playbackSpeed: 0.8, position: 25, progress: { attempts: [] } };
    const state = readGuidedPathState(serializeGuidedPathState(session.moduleId));
    const route = readAppRoute(entryStep(state).hash);
    assert.equal(route.screen, "practice");
    assert.ok(route.screen === "practice");
    assert.equal(enterPractice(session, route.moduleId), session);
  }
});

test("the path follows internal next, previous and next-track transitions", () => {
  for (const direction of [-1, 1] as const) {
    const next = getPracticeNeighbor(["first", "second"], { trackId: "second", moduleId: "pulse", mode: "teach", playbackSpeed: 0.65 }, direction)!;
    const state = readGuidedPathState(serializeGuidedPathState(next.moduleId));
    assert.equal(entryStep(state).id, next.moduleId);
  }
  const next = getPracticeNeighbor(["first", "second"], { trackId: "first", moduleId: "downbeat", mode: "train", playbackSpeed: 1 }, 1)!;
  assert.equal(entryStep(readGuidedPathState(serializeGuidedPathState(next.moduleId))).id, "pulse");
});
