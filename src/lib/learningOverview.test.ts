import assert from "node:assert/strict";
import test from "node:test";
import { guidedPath, stepForHash } from "./guidedPath.ts";
import { getLearningOverview, learningOverviews, overviewForHash } from "./learningOverview.ts";
import { readAppRoute } from "./navigation.ts";

test("existing introductions follow the seven-level course order", () => {
  assert.deepEqual(learningOverviews.map(overview => overview.id), ["sounds", "pulse", "count", "downbeat", "recover", "listening"]);
  assert.deepEqual(learningOverviews.flatMap(overview => overview.steps), guidedPath.map(step => step.id));
  assert.equal(new Set(learningOverviews.map(overview => overview.hash)).size, 6);
});

test("every introduction has a real exercise and explains practice without certifying mastery", () => {
  for (const overview of learningOverviews) {
    assert.equal(overviewForHash(overview.hash), overview);
    assert.equal(getLearningOverview(overview.id), overview);
    assert.ok(overview.steps.includes(stepForHash(overview.practiceHash)!.id));
    assert.ok(overview.purpose.length > 0);
    assert.equal(overview.instructions.length, 3);
    assert.ok(overview.result.length > 0);
    assert.doesNotMatch(overview.label, /Paso|de 7|Etapa/);
    assert.deepEqual(readAppRoute(overview.hash), overview.id === "listening" ? { screen: "listening-menu" } : { screen: "overview", overviewId: overview.id });
  }
  assert.equal(overviewForHash("#not-an-overview"), null);
});

test("reading an introduction does not mark a practice as opened", () => {
  for (const overview of learningOverviews) assert.equal(stepForHash(overview.hash), null);
});
