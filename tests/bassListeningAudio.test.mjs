import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public bass practice preserves the approved sample and annotated audible changes", async () => {
  const audio = await readFile(new URL("../public/tracks/listening/bass.wav", import.meta.url));
  const track = JSON.parse(await readFile(new URL("../data/listening/bass.json", import.meta.url), "utf8"));
  assert.equal(createHash("sha256").update(audio).digest("hex"), "d1d56bdf24c2a0e875dab5608844f7fb7f66d640a21c199c07d70503ea819d76");
  assert.equal(audio.length, 1_014_344);
  assert.equal(track.duration, 23);
  assert.deepEqual(track.changes, [{ time: 7, action: "bass-in" }, { time: 12, action: "bass-out" }, { time: 17, action: "bass-in" }]);
  for (let offset = 44; offset < 44 + 2 * 22_050 * 2; offset += 2) assert.equal(audio.readInt16LE(offset), 0);
});
