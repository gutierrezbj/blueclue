import assert from "node:assert/strict";
import test from "node:test";
import { learningLevels, levelForHash } from "./learningLevels.ts";
import { readAppRoute } from "./navigation.ts";

test("the seven course levels have unique reachable pages in the agreed order", () => {
  assert.deepEqual(learningLevels.map(level => level.number), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(learningLevels.map(level => level.id), ["sounds", "rhythm", "song", "entry", "mix", "controller", "session"]);
  assert.equal(new Set(learningLevels.map(level => level.hash)).size, 7);
  for (const level of learningLevels) {
    assert.equal(levelForHash(level.hash), level);
    assert.deepEqual(readAppRoute(level.hash), { screen: "level", levelId: level.id });
  }
});

test("available lessons use existing exercises; planned lessons are never linked to another level", () => {
  const available = learningLevels.flatMap(level => level.lessons.filter(lesson => lesson.hash));
  assert.equal(available.length, 8);
  for (const lesson of available) assert.notEqual(readAppRoute(lesson.hash!).screen, "home");
  for (const level of learningLevels.slice(3)) assert.ok(level.lessons.every(lesson => !lesson.hash));
});
