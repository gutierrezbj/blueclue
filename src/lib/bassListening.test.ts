import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { evaluateListeningTap, getListeningEntries as getBassEntries, getListeningGuide as getBassGuide, getListeningReview, summarizeListening, type ListeningTrack } from "./listening.ts";

const track = JSON.parse(readFileSync(new URL("../../data/listening/bass.json", import.meta.url), "utf8")) as ListeningTrack;

test("bass recognition accepts hearing the change, not just millisecond accuracy", () => {
  assert.deepEqual(getBassEntries(track), [7, 17]);
  for (const time of [7, 7.8, 9.5, 17, 19.5]) assert.equal(evaluateListeningTap(track, [], time)?.result, "recognized");
  for (const time of [0, 6.99, 9.501, 12, 16.99, 19.501]) assert.equal(evaluateListeningTap(track, [], time)?.result, "outside");
});

test("early and off-event taps never consume a later entry", () => {
  const early = evaluateListeningTap(track, [], 6.9)!;
  const recognized = evaluateListeningTap(track, [early], 8)!;
  const repeated = evaluateListeningTap(track, [early, recognized], 8.5)!;
  const returnTap = evaluateListeningTap(track, [early, recognized, repeated], 18)!;
  assert.equal(repeated.result, "repeated");
  const summary = summarizeListening(track, [early, recognized, repeated, returnTap]);
  assert.equal(summary.recognized, 2);
  assert.equal(summary.missed, 0);
  assert.equal(summary.extra, 2);
});

test("round summaries distinguish missed entries and never award duplicate credit", () => {
  const tap = evaluateListeningTap(track, [], 7.4)!;
  assert.equal(summarizeListening(track, []).missed, 2);
  assert.equal(summarizeListening(track, [tap, tap]).recognized, 1);
  assert.equal(summarizeListening(track, [tap]).missed, 1);
});

test("track boundaries and invalid timestamps cannot score", () => {
  for (const time of [-1, 23, 24, NaN, Infinity]) assert.equal(evaluateListeningTap(track, [], time), null);
});

test("guide never announces a change before it is audible; review includes its context", () => {
  assert.match(getBassGuide(track, 1), /Acomódate/);
  assert.match(getBassGuide(track, 6.99), /todavía sin bajo/);
  assert.match(getBassGuide(track, 7), /Entra el bajo/);
  assert.match(getBassGuide(track, 11), /sigue/);
  assert.match(getBassGuide(track, 12), /Sale el bajo/);
  assert.match(getBassGuide(track, 17), /Entra el bajo/);
  assert.deepEqual(getListeningReview(track, 7), { start: 5, end: 10 });
  assert.deepEqual(getListeningReview(track, 17), { start: 15, end: 20 });
});
