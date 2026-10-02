import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getBeatPosition } from "./beatGrid.ts";
import { getPracticeEntry, scorePracticeAttempt } from "./practiceEntry.ts";
import { parseLocalPilot } from "./localPilot.ts";
import type { TrainingTrack } from "./tracks.ts";

async function checkSilentLeadIn(track: TrainingTrack) {
  const audio = await readFile(new URL(`../../public${track.audioFile}`, import.meta.url));
  assert.equal(audio.toString("ascii", 0, 4), "RIFF");
  assert.equal(audio.toString("ascii", 8, 12), "WAVE");
  let format: Buffer | undefined;
  let samples: Buffer | undefined;
  for (let offset = 12; offset + 8 <= audio.length;) {
    const size = audio.readUInt32LE(offset + 4);
    const end = offset + 8 + size;
    assert.ok(end <= audio.length);
    const name = audio.toString("ascii", offset, offset + 4);
    if (name === "fmt ") format = audio.subarray(offset + 8, end);
    if (name === "data") samples = audio.subarray(offset + 8, end);
    offset = end + size % 2;
  }
  assert.ok(format && samples, track.id);
  assert.equal(format.readUInt16LE(0), 1, "Uncompressed PCM");
  assert.ok(format.readUInt16LE(14) >= 16);
  assert.equal(track.leadInSeconds, 3);
  const bytesPerSecond = format.readUInt32LE(8);
  const silentBytes = 3 * bytesPerSecond;
  assert.ok(samples.length > silentBytes);
  assert.ok(samples.subarray(0, silentBytes).every((sample) => sample === 0), `${track.id}: actual silence, not a visual offset`);
  assert.ok(samples.subarray(silentBytes).some((sample) => sample !== 0), `${track.id}: music remains after the lead-in`);
  const duration = samples.length / bytesPerSecond;
  if (track.duration !== undefined) assert.ok(Math.abs(duration - track.duration) < 0.000001, track.id);
  assert.ok(track.beats[0] >= 3);
  assert.equal(getBeatPosition(2.999, track.beats, track.downbeats).count, null);
  const entry = getPracticeEntry(track.downbeats, duration);
  assert.equal(scorePracticeAttempt(2.999, track.downbeats, duration, entry), null);
  assert.equal(scorePracticeAttempt(track.downbeats[2], track.downbeats, duration, entry)?.classification, "clavado");
  for (let index = 1; index < track.beats.length; index += 1) {
    assert.ok(Math.abs(track.beats[index] - track.beats[index - 1] - 60 / track.bpm) < 0.00011, `${track.id}: tempo stays unchanged`);
  }
}

test("all bundled demo waveforms have three real silent seconds and aligned references", async () => {
  for (const identifier of ["pulse", "four-count", "offbeat", "return", "subtle-one"]) {
    const track = JSON.parse(await readFile(new URL(`../../data/tracks/${identifier}.json`, import.meta.url), "utf8"));
    await checkSilentLeadIn(track);
  }
});

test("private pilot audio and scoring share the same three-second lead-in", async (context) => {
  let manifest: string;
  try {
    manifest = await readFile(new URL("../../.local/pilot.json", import.meta.url), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    context.skip("Private pilot audio is not installed on this checkout");
    return;
  }
  for (const track of parseLocalPilot(JSON.parse(manifest))) await checkSilentLeadIn(track);
});
