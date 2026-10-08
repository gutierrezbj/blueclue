import assert from "node:assert/strict";
import test from "node:test";
import type { ListeningTrack } from "./listening.ts";
import { isListeningTrack, pickAnotherVariant, variantsFor } from "./listeningVariants.ts";

function track(id: string, instrument: ListeningTrack["instrument"]): ListeningTrack {
  return { id, instrument, title: id, bpm: 96, timeSignature: "4/4", audioFile: `/tracks/listening/${id}.wav`, beats: [], downbeats: [], difficulty: "easy", description: "", duration: 20, changes: [{ time: 5, action: "bass-in" }] };
}

const bass = track("bass-listening-v1", "bass");
const bassB = track("bass-variant-b", "bass");
const bassC = track("bass-variant-c", "bass");
const drums = track("percussion-variant-a", "percussion");

test("variants keep the approved sample first and only the same practice", () => {
  assert.deepEqual(variantsFor(bass, [drums, bassB, bass, bassC]).map(item => item.id), [bass.id, bassB.id, bassC.id]);
  assert.deepEqual(variantsFor(bass, []), [bass]);
});

test("another round never repeats the sample just practised when there is a choice", () => {
  const variants = [bass, bassB, bassC];
  for (const random of [0, 0.5, 0.999]) assert.notEqual(pickAnotherVariant(variants, bassB.id, random).id, bassB.id);
  assert.equal(pickAnotherVariant([bass], bass.id, 0.4).id, bass.id);
});

test("published variants are validated before use", () => {
  assert.equal(isListeningTrack(bass), true);
  assert.equal(isListeningTrack({ id: "x" }), false);
  assert.equal(isListeningTrack({ ...bass, changes: [{ time: "5", action: "bass-in" }] }), false);
});
