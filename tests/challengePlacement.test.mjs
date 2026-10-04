import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const trainer = await readFile(new URL("../src/components/BeatTrainer.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("Challenge has one placement after all practice and continuation controls", () => {
  assert.equal(trainer.match(/\{challengePanel\}/g)?.length, 1);
  const placement = trainer.indexOf('<div className="challenge-next-step">');
  assert.ok(placement > trainer.indexOf('aria-label="Acciones del ejercicio"'));
  assert.ok(placement > trainer.indexOf('className="journey-actions"'));
  assert.ok(placement < trainer.indexOf('<footer className="page-footer">'));
});

test("mobile keeps Challenge last and outside the clean practice screen", () => {
  assert.match(css, /\.challenge-next-step\s*\{\s*order: 6;/);
  assert.match(css, /\[data-mobile-screen="practice"\] \.challenge-next-step\s*\{\s*display: none;/);
  assert.doesNotMatch(css, /\[data-mobile-screen="settings"\] \.mobile-actions\s*\{[^}]*position: sticky/);
});
