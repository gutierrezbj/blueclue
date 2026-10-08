import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { allVariantIds, buildVariant } from "../scripts/create-listening-variants.mjs";

const approved = {
  bass: JSON.parse(await readFile(new URL("../data/listening/bass.json", import.meta.url), "utf8")),
  percussion: JSON.parse(await readFile(new URL("../data/listening/percussion.json", import.meta.url), "utf8")),
  choice: JSON.parse(await readFile(new URL("../data/listening/choice.json", import.meta.url), "utf8"))
};

test("twelve variants, four per practice, published audio matches verified metadata", async () => {
  assert.equal(allVariantIds().length, 12);
  const published = JSON.parse(await readFile(new URL("../data/listening/variants.json", import.meta.url), "utf8"));
  assert.ok(Array.isArray(published));
  assert.equal(new Set(published.map(track => track.id)).size, published.length);
  for (const track of published) {
    assert.equal(track.referenceStatus, "listening-verified");
    assert.ok(allVariantIds().includes(track.id));
    const [instrument, , letter] = track.id.split("-");
    const generated = buildVariant(instrument, letter);
    assert.deepEqual(track, { ...generated.track, referenceStatus: "listening-verified" });
    const audio = await readFile(new URL(`../public${track.audioFile}`, import.meta.url));
    assert.ok(audio.equals(generated.wav), `${track.id}: WAV y referencias corresponden al mismo generador`);
  }
});

test("variants never reuse the approved entry times, leave room to react and keep changes apart", () => {
  for (const id of allVariantIds()) {
    const [instrument, , letter] = id.split("-");
    const { track, wav } = buildVariant(instrument, letter);
    assert.equal(track.referenceStatus, "pending-listening");
    assert.equal(track.duration, approved[instrument].duration);
    assert.equal(track.instrument, instrument);
    const approvedTimes = approved[instrument].changes.map(change => change.time);
    const entries = track.changes.filter(change => change.action.endsWith("-in") && change.time > track.leadInSeconds);
    assert.ok(entries.length >= 2, `${id} tiene al menos dos entradas`);
    for (const entry of entries) {
      assert.ok(!approvedTimes.includes(entry.time), `${id} repite ${entry.time}`);
      assert.ok(entry.time + 2.5 <= track.duration);
    }
    for (let index = 1; index < track.changes.length; index++) assert.ok(track.changes[index].time - track.changes[index - 1].time >= 2.5);
    assert.ok(wav.length > 44);
  }
});

test("variants of the same practice differ from each other in their entry times", () => {
  for (const instrument of ["bass", "percussion", "choice"]) {
    const signatures = ["b", "c", "d", "e"].map(letter => JSON.stringify(buildVariant(instrument, letter).track.changes));
    assert.equal(new Set(signatures).size, 4);
  }
});

test("the choice variants alternate which instrument enters first", () => {
  const firsts = ["b", "c", "d", "e"].map(letter => buildVariant("choice", letter).track.changes[0].action);
  assert.ok(firsts.includes("bass-in") && firsts.includes("percussion-in"));
});
