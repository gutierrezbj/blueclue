import assert from "node:assert/strict";
import test from "node:test";
import { getLearningModule, learningModules, scoreExerciseAttempt } from "./learningModules.ts";
import { getPracticeEntry } from "./practiceEntry.ts";
import type { TrainingTrack } from "./tracks.ts";

const track: TrainingTrack = {
  id: "test", title: "Test", bpm: 120, difficulty: "very-easy", timeSignature: "4/4", audioFile: "/test.wav", description: "Test",
  leadInSeconds: 3, beats: Array.from({ length: 32 }, (_, index) => 3.5 + index * 0.5), downbeats: [3.5, 5.5, 7.5, 9.5, 11.5, 13.5, 15.5, 17.5]
};

test("pulse accepts every beat while counting and downbeat target only the 1", () => {
  assert.equal(scoreExerciseAttempt(8, track, 20, "pulse", 0.65)?.classification, "clavado");
  assert.equal(scoreExerciseAttempt(8, track, 20, "pulse", 0.65)?.message, "Clavado. Ese era el pulso.");
  for (const moduleId of ["count", "downbeat"] as const) {
    assert.notEqual(scoreExerciseAttempt(8, track, 20, moduleId, 0.65)?.classification, "clavado");
    assert.equal(scoreExerciseAttempt(9.5, track, 20, moduleId, 0.65)?.classification, "clavado");
  }
});

test("all modules preserve unscored lead-in and listening bars at every speed", () => {
  for (const module of learningModules) {
    for (const speed of [0.65, 0.8, 1] as const) {
      for (const time of [0, 2.99, 3.5, 5.5]) assert.equal(scoreExerciseAttempt(time, track, 20, module.id, speed), null);
      const entry = getPracticeEntry(track.downbeats, 20, speed)!;
      assert.equal(scoreExerciseAttempt(entry.opensAt - 0.001, track, 20, module.id, speed), null);
      assert.equal(scoreExerciseAttempt(entry.opensAt, track, 20, module.id, speed)?.errorMs, -450);
      assert.equal(scoreExerciseAttempt(7.5, track, 20, module.id, speed)?.classification, "clavado");
    }
  }
});

test("later modules withdraw guidance rather than requiring an automatic pass", () => {
  assert.equal(getLearningModule("pulse").defaultMode, "teach");
  assert.equal(getLearningModule("count").defaultMode, "teach");
  assert.equal(getLearningModule("downbeat").defaultMode, "assist");
  assert.equal(learningModules.length, 3);
});
