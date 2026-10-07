import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { renderPercussionPreview } from "../scripts/percussion-preview.mjs";

const { wav, metadata } = renderPercussionPreview();
const sampleAt = index => wav.readInt16LE(44 + index * 2) / 32767;

test("public percussion practice uses the accepted sample and matching annotations", async () => {
  const published = await readFile(new URL("../public/tracks/listening/percussion.wav", import.meta.url));
  const track = JSON.parse(await readFile(new URL("../data/listening/percussion.json", import.meta.url), "utf8"));
  assert.deepEqual(published, wav);
  assert.equal(createHash("sha256").update(published).digest("hex"), "e70f4c94cd7c3127b92a5f901b5ddc866158e1f8599fa8df349f6a4c4cd6f94c");
  assert.equal(track.duration, metadata.duration);
  assert.equal(track.leadInSeconds, metadata.leadInSeconds);
  assert.equal(track.instrument, "percussion");
  assert.deepEqual(track.changes, metadata.changes);
  assert.ok(track.changes.every(change => track.beats.includes(change.time)));
});

function roughness(start, seconds = 0.12) {
  const first = Math.round(start * metadata.sampleRate);
  const count = Math.round(seconds * metadata.sampleRate);
  let energy = 0;
  for (let index = first + 1; index < first + count; index++) energy += (sampleAt(index) - sampleAt(index - 1)) ** 2;
  return energy / count;
}

test("percussion preview is reproducible, compact PCM with three seconds to get ready", () => {
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 22050);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.length, 44 + metadata.duration * metadata.sampleRate * 2);
  assert.equal(metadata.duration, 24);
  assert.ok(wav.length < 1_100_000);
  assert.deepEqual(renderPercussionPreview().wav, wav);
  for (let index = 0; index < metadata.leadInSeconds * metadata.sampleRate; index++) assert.equal(sampleAt(index), 0);
  for (let index = 0; index < metadata.duration * metadata.sampleRate; index++) assert.ok(Math.abs(sampleAt(index)) < 0.95);
});

test("percussion enters, leaves and returns over a continuing melodic backing", () => {
  assert.deepEqual(metadata.changes, [
    { time: 6.75, action: "percussion-in" },
    { time: 11.75, action: "percussion-out" },
    { time: 16.125, action: "percussion-in" }
  ]);
  assert.ok(roughness(6.75) > roughness(4.25) * 10);
  assert.ok(roughness(9.25) > roughness(11.75) * 10);
  assert.ok(roughness(16.125) > roughness(13.625) * 10);
  assert.ok(roughness(4.25) > 0);
  assert.ok(roughness(11.75) > 0);
  assert.ok(roughness(13.625) > 0);
});

test("changes are spaced for hearing rather than long counting and leave time to react", () => {
  assert.ok(metadata.changes[0].time - metadata.leadInSeconds >= 3);
  for (let index = 1; index < metadata.changes.length; index++) {
    const gap = metadata.changes[index].time - metadata.changes[index - 1].time;
    assert.ok(gap >= 3 && gap <= 6);
  }
  assert.ok(metadata.duration - metadata.changes.at(-1).time > 3);
});
