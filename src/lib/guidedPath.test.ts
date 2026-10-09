import assert from "node:assert/strict";
import test from "node:test";
import { entryStep, guidedPath, nextGuidedStep, readGuidedPathState, serializeGuidedPathState, stepForHash } from "./guidedPath.ts";
import { enterPractice, readAppRoute } from "./navigation.ts";
import { getPracticeNeighbor, type PracticeSession } from "./practice.ts";

test("the path goes ear, listening, then rhythm", () => {
  assert.deepEqual(guidedPath.map(step => step.id), ["sounds", "bass", "percussion", "choice", "pulse", "count", "downbeat"]);
  assert.equal(guidedPath[0].hash, "#sonidos");
  assert.equal(nextGuidedStep("sounds")?.id, "bass");
  assert.equal(nextGuidedStep("choice")?.id, "pulse");
  assert.equal(nextGuidedStep("downbeat"), null);
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

import { addDoneStep, futureStages, homeState, legacyDoneSteps, readDoneSteps, stageStatus, stages, stepLabel, stepNumber, type GuidedStepId } from "./guidedPath.ts";

const opened = (stepId: GuidedStepId) => ({ stepId, updatedAt: "" });

test("one numbering: steps 1 to 7 inside stages 1 to 3, future stages 4 to 6", () => {
  assert.equal(stepLabel("sounds"), "Paso 1 de 7 · Oído");
  assert.equal(stepLabel("choice"), "Paso 4 de 7 · Escucha");
  assert.equal(stepLabel("downbeat"), "Paso 7 de 7 · Ritmo");
  assert.deepEqual(stages.map(stage => stage.number), [1, 2, 3]);
  assert.deepEqual(futureStages.map(stage => stage.number), [4, 5, 6]);
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
  ]), ["sounds", "bass", "choice", "count"]);
  assert.deepEqual(legacyDoneSteps([["blueclue-rounds-v2", "{broken"]]), []);
});

test("home A: nothing done and at most step 1 opened says Empieza aquí at step 1", () => {
  for (const last of [null, opened("sounds")]) {
    const state = homeState(last, new Set());
    assert.equal(state.kind, "first");
    assert.ok(state.kind === "first" && state.target.id === "sounds");
  }
});

test("home B: resumes the last opened step, or the next one not done, and offers restart only after step 1", () => {
  let state = homeState(opened("choice"), new Set(["sounds", "bass", "percussion"]));
  assert.ok(state.kind === "progress" && state.target.id === "choice" && state.doneCount === 3 && state.canRestart);
  state = homeState(opened("bass"), new Set(["sounds", "bass"]));
  assert.ok(state.kind === "progress" && state.target.id === "percussion");
  state = homeState(opened("count"), new Set());
  assert.ok(state.kind === "progress" && state.target.id === "count" && state.doneCount === 0);
  state = homeState(opened("sounds"), new Set(["bass"]));
  assert.ok(state.kind === "progress" && state.target.id === "sounds" && !state.canRestart);
  state = homeState(opened("downbeat"), new Set(["sounds", "downbeat"]));
  assert.ok(state.kind === "progress" && state.target.id === "bass");
});

test("home C: all seven done points to the challenge", () => {
  const state = homeState(opened("downbeat"), new Set(guidedPath.map(step => step.id)));
  assert.deepEqual(state, { kind: "complete", doneCount: 7 });
});

test("stage status is here for the target stage, done when all its steps are done", () => {
  const done = new Set<GuidedStepId>(["sounds", "bass"]);
  assert.equal(stageStatus("ear", done, "percussion"), "done");
  assert.equal(stageStatus("listen", done, "percussion"), "here");
  assert.equal(stageStatus("rhythm", done, "percussion"), "pending");
  assert.equal(stepNumber("pulse"), 5);
});
