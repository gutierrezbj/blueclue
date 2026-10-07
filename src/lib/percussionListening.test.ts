import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { evaluateListeningTap, getListeningEntries, getListeningGuide, getListeningReview, listeningStorageKey, summarizeListening, type ListeningTrack } from "./listening.ts";

const percussion = JSON.parse(readFileSync(new URL("../../data/listening/percussion.json", import.meta.url), "utf8")) as ListeningTrack;
const bass = JSON.parse(readFileSync(new URL("../../data/listening/bass.json", import.meta.url), "utf8")) as ListeningTrack;

test("percussion only recognizes annotated entries after hearing them, including the tolerance edge", () => {
  assert.deepEqual(getListeningEntries(percussion), [6.75, 16.125]);
  for (const time of [6.75, 7, 9.25, 16.125, 18.625]) assert.equal(evaluateListeningTap(percussion, [], time)?.result, "recognized");
  for (const time of [0, 3, 6.749, 9.251, 11.75, 16.124, 18.626, 23.99]) assert.equal(evaluateListeningTap(percussion, [], time)?.result, "outside");
  for (const time of [-1, 24, 25, NaN, Infinity]) assert.equal(evaluateListeningTap(percussion, [], time), null);
});

test("early taps and duplicates do not consume another percussion entry or inflate the summary", () => {
  const early = evaluateListeningTap(percussion, [], 6.7)!;
  const first = evaluateListeningTap(percussion, [early], 7.5)!;
  const repeated = evaluateListeningTap(percussion, [early, first], 8)!;
  const exit = evaluateListeningTap(percussion, [early, first, repeated], 11.75)!;
  const second = evaluateListeningTap(percussion, [early, first, repeated, exit], 17)!;
  assert.equal(repeated.result, "repeated");
  assert.deepEqual(summarizeListening(percussion, [early, first, repeated, exit, second]), {
    entries: [{ time: 6.75, recognized: true, wrong: false }, { time: 16.125, recognized: true, wrong: false }], recognized: 2, wrong: 0, missed: 0, extra: 3
  });
  assert.equal(summarizeListening(percussion, []).missed, 2);
  assert.equal(summarizeListening(percussion, [first]).missed, 1);
});

test("percussion guidance follows the sound and review brackets each change without mutating results", () => {
  assert.match(getListeningGuide(percussion, 2.99), /Acomódate/);
  assert.match(getListeningGuide(percussion, 6.749), /sin batería/);
  assert.match(getListeningGuide(percussion, 6.75), /Entra la batería/);
  assert.match(getListeningGuide(percussion, 10), /sigue/);
  assert.match(getListeningGuide(percussion, 11.75), /Sale la batería/);
  assert.match(getListeningGuide(percussion, 16.125), /Entra la batería/);
  assert.deepEqual(getListeningReview(percussion, 6.75), { start: 4.75, end: 9.75 });
  assert.deepEqual(getListeningReview(percussion, 16.125), { start: 14.125, end: 19.125 });
});

test("bass references and existing storage key stay compatible and separate from percussion", () => {
  assert.equal(listeningStorageKey(bass), "blueclue-listening-bass-listening-v1");
  assert.equal(listeningStorageKey(percussion), "blueclue-listening-percussion-listening-v1");
  assert.deepEqual(getListeningEntries(bass), [7, 17]);
  assert.match(getListeningGuide(bass, 7), /Entra el bajo/);
  assert.equal(evaluateListeningTap(bass, [], 6.75)?.result, "outside");
});
