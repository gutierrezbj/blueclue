import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { evaluateListeningTap, getListeningEntries, getListeningFeedback, getListeningGuide, getListeningReview, listeningStorageKey, summarizeListening, type ListeningTrack } from "./listening.ts";

const track = JSON.parse(readFileSync(new URL("../../data/listening/choice.json", import.meta.url), "utf8")) as ListeningTrack;

test("choice scores the entered instrument and allows the full recognition window", () => {
  assert.deepEqual(getListeningEntries(track), [6.75, 11.75, 18.625, 25.5]);
  for (const change of track.changes.filter(change => change.action.endsWith("-in"))) {
    const correct = change.action === "bass-in" ? "bass" : "percussion";
    const wrong = correct === "bass" ? "percussion" : "bass";
    for (const offset of [0, 0.8, 2.5]) {
      assert.equal(evaluateListeningTap(track, [], change.time + offset, correct)?.result, "recognized");
      assert.equal(evaluateListeningTap(track, [], change.time + offset, wrong)?.result, "wrong");
    }
    assert.equal(evaluateListeningTap(track, [], change.time + 2.501, correct)?.result, "outside");
  }
});

test("choice rejects invalid input and never credits early taps or exits", () => {
  for (const time of [-1, 32, 33, NaN, Infinity]) assert.equal(evaluateListeningTap(track, [], time, "bass"), null);
  assert.equal(evaluateListeningTap(track, [], 7), null);
  for (const time of [0, 3, 6.749, 16.125, 18.624, 22.375, 25.499, 31.99]) {
    assert.equal(evaluateListeningTap(track, [], time, "bass")?.result, "outside");
  }
  const early = evaluateListeningTap(track, [], 6.7, "bass")!;
  assert.equal(evaluateListeningTap(track, [early], 7, "bass")?.result, "recognized");
});

test("a wrong choice consumes only that entry; trying both buttons cannot earn credit", () => {
  const wrong = evaluateListeningTap(track, [], 7, "percussion")!;
  const repeat = evaluateListeningTap(track, [wrong], 7.3, "bass")!;
  const correct = evaluateListeningTap(track, [wrong, repeat], 12, "percussion")!;
  const extra = evaluateListeningTap(track, [wrong, repeat, correct], 16.125, "bass")!;
  const summary = summarizeListening(track, [wrong, repeat, correct, extra]);
  assert.equal(repeat.result, "repeated");
  assert.equal(summary.recognized, 1);
  assert.equal(summary.wrong, 1);
  assert.equal(summary.missed, 2);
  assert.equal(summary.extra, 2);
  assert.equal(summary.recognized + summary.wrong + summary.missed, 4);
  assert.equal(summarizeListening(track, []).missed, 4);
  assert.equal(summarizeListening(track, [wrong, wrong]).wrong, 1);
});

test("correct choices cannot become wrong through duplicates and four correct answers total four", () => {
  const taps = getListeningEntries(track).map((time, index) => evaluateListeningTap(track, [], time + 0.5, index % 2 === 0 ? "bass" : "percussion")!);
  const repeated = evaluateListeningTap(track, taps, 26.1, "bass")!;
  assert.equal(repeated.result, "repeated");
  const result = summarizeListening(track, [...taps, repeated]);
  assert.equal(result.recognized, 4);
  assert.equal(result.wrong, 0);
  assert.equal(result.missed, 0);
  assert.equal(result.extra, 1);
});

test("choice feedback explains mistakes and guide never reveals a future entrance", () => {
  assert.match(getListeningFeedback(track), /Acomódate/);
  const wrong = evaluateListeningTap(track, [], 7, "percussion")!;
  assert.match(getListeningFeedback(track, wrong), /Era el bajo: notas graves/);
  assert.match(getListeningFeedback(track, evaluateListeningTap(track, [wrong], 8, "bass")!), /primera respuesta/);
  assert.match(getListeningFeedback(track, evaluateListeningTap(track, [], 12, "bass")!), /Era la batería/);
  assert.match(getListeningFeedback(track, evaluateListeningTap(track, [], 12, "percussion")!), /Bien:/);
  assert.match(getListeningGuide(track, 2.99), /Acomódate/);
  assert.match(getListeningGuide(track, 6.749), /sin bajo ni batería/);
  assert.match(getListeningGuide(track, 6.75), /Entra el bajo/);
  assert.match(getListeningGuide(track, 11.749), /continúa/);
  assert.match(getListeningGuide(track, 11.75), /Entra la batería/);
  assert.match(getListeningGuide(track, 16.125), /Sale el bajo/);
  assert.match(getListeningGuide(track, 18.625), /Entra el bajo/);
  assert.match(getListeningGuide(track, 22.375), /Sale la batería/);
  assert.match(getListeningGuide(track, 25.5), /Entra la batería/);
  assert.deepEqual(getListeningReview(track, 25.5), { start: 23.5, end: 28.5 });
  assert.equal(listeningStorageKey(track), "blueclue-listening-choice-listening-v1");
});
