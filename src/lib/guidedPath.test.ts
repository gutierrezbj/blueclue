import assert from "node:assert/strict";
import test from "node:test";
import { entryStep, guidedPath, nextGuidedStep, readGuidedPathState, serializeGuidedPathState, stepForHash } from "./guidedPath.ts";
import { enterPractice, readAppRoute } from "./navigation.ts";
import { getPracticeNeighbor, type PracticeSession } from "./practice.ts";

test("the path follows course levels: sounds, rhythm, then song listening", () => {
  assert.deepEqual(guidedPath.map(step => step.id), ["sounds", "pulse", "count", "downbeat", "bass", "percussion", "choice"]);
  assert.equal(guidedPath[0].hash, "#sonidos");
  assert.equal(nextGuidedStep("sounds")?.id, "pulse");
  assert.equal(nextGuidedStep("downbeat")?.id, "bass");
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

import { addDoneStep, legacyDoneSteps, readDoneSteps, stages, stepLabel, type GuidedStepId } from "./guidedPath.ts";

const opened = (stepId: GuidedStepId) => ({ stepId, updatedAt: "" });

test("practice labels describe the skill without competing step numbering", () => {
  assert.equal(stepLabel("sounds"), "Nivel 1 · Sonidos");
  assert.equal(stepLabel("choice"), "Nivel 3 · Canción");
  assert.equal(stepLabel("downbeat"), "Nivel 2 · Ritmo");
  for (const step of guidedPath) assert.ok(stages.some(stage => stage.id === step.stage));
});

test("done steps are stored once, in path order, and survive bad input", () => {
  assert.deepEqual([...readDoneSteps("nope")], []);
  let saved = addDoneStep(null, "pulse");
  saved = addDoneStep(saved, "sounds");
  saved = addDoneStep(saved, "pulse");
  assert.deepEqual(JSON.parse(saved), ["sounds", "pulse"]);
  assert.deepEqual([...readDoneSteps(JSON.stringify(["bass", "unknown", 3]))], ["bass"]);
});

test("results saved before the done list count as done", () => {
  const rounds = JSON.stringify({ "count/teach/0.65": [{ total: 10, perfect: 1, close: 0, extra: 0, offTarget: 0 }], "downbeat/train/1": [] });
  assert.deepEqual(legacyDoneSteps([
    ["blueclue-sounds-v1", "{\"correct\":5,\"total\":8}"],
    ["blueclue-listening-bass-variant-b", "{}"],
    ["blueclue-listening-choice-listening-v1", "{}"],
    ["blueclue-listening-percussion-listening-v1", null],
    ["blueclue-rounds-v2", rounds],
    ["blueclue-rounds-v1", rounds]
  ]), ["sounds", "count", "bass", "choice"]);
  assert.deepEqual(legacyDoneSteps([["blueclue-rounds-v2", "{broken"]]), []);
});

test("completing a practice never moves the resume target to another exercise or Challenge", () => {
  for (const step of guidedPath) {
    const practiced = readDoneSteps(addDoneStep(null, step.id));
    assert.ok(practiced.has(step.id));
    assert.equal(entryStep(opened(step.id)).id, step.id);
  }
  const practiced = readDoneSteps(JSON.stringify(guidedPath.map(step => step.id)));
  assert.equal(practiced.size, 7);
  assert.equal(entryStep(opened("bass")).id, "bass");
});
