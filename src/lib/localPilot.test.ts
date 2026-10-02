import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadLocalPilot, parseLocalPilot } from "./localPilot.ts";
import { getBeatPosition, isDownbeat } from "./beatGrid.ts";
import { scoreAttempt } from "./scoring.ts";

function fixture() {
  return {
    version: 1,
    tracks: Array.from({ length: 5 }, (_, index) => ({
      id: `local-test-${index}`, title: "Test", description: "Count four", sourceTitle: "Test source",
      referenceSource: "Test reference", referenceStatus: "pending-listening",
      duration: 4, bpm: 120, timeSignature: "4/4", difficulty: "easy",
      audioFile: `/tracks/local-pilot/local-test-${index}.wav`,
      beats: [0.2, 0.7, 1.2, 1.7, 2.2, 2.7, 3.2, 3.7], downbeats: [1.2, 3.2]
    }))
  };
}

test("local pilot requires five unique safe files and an explicit review status", () => {
  assert.equal(parseLocalPilot(fixture()).length, 5);
  const incomplete = fixture();
  incomplete.tracks.pop();
  assert.throws(() => parseLocalPilot(incomplete));
  const duplicated = fixture();
  duplicated.tracks[1] = duplicated.tracks[0];
  assert.throws(() => parseLocalPilot(duplicated));
  const unsafe = fixture();
  unsafe.tracks[0].audioFile = "/tracks/local-pilot/../../secret.wav";
  assert.throws(() => parseLocalPilot(unsafe));
  const unreviewed = fixture();
  unreviewed.tracks[0].referenceStatus = "unknown";
  assert.throws(() => parseLocalPilot(unreviewed));
});

test("pilot rejects timing references that disagree with the counter or audio bounds", () => {
  for (const invalidBeats of [[0.2, 0.1], [0.2, 5], [0.2, NaN], []]) {
    const invalid = fixture();
    invalid.tracks[0].beats = invalidBeats;
    assert.throws(() => parseLocalPilot(invalid));
  }
  for (const invalidDownbeats of [[0.3, 3.2], [0.7, 3.2]]) {
    const invalid = fixture();
    invalid.tracks[0].downbeats = invalidDownbeats;
    assert.throws(() => parseLocalPilot(invalid));
  }
});

test("pilot rejects invalid lead-ins and references that fall inside the silence", () => {
  for (const leadInSeconds of [-1, NaN, Infinity, 4, 0.5]) {
    const invalid = fixture();
    Object.assign(invalid.tracks[0], { leadInSeconds });
    assert.throws(() => parseLocalPilot(invalid));
  }
});

test("catalog loading falls back safely if its manifest or audio is missing", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "blueclue-pilot-test-"));
  try {
    assert.deepEqual(await loadLocalPilot(workspace), { tracks: null, notice: null });
    await mkdir(path.join(workspace, ".local"));
    await writeFile(path.join(workspace, ".local", "pilot.json"), JSON.stringify(fixture()));
    const missingAudio = await loadLocalPilot(workspace);
    assert.equal(missingAudio.tracks, null);
    assert.ok(missingAudio.notice);
    const directory = path.join(workspace, "public", "tracks", "local-pilot");
    await mkdir(directory, { recursive: true });
    for (const track of fixture().tracks) await writeFile(path.join(directory, `${track.id}.wav`), "test fixture");
    assert.equal((await loadLocalPilot(workspace)).tracks?.length, 5);
    await writeFile(path.join(workspace, ".local", "pilot.json"), "{");
    assert.equal((await loadLocalPilot(workspace)).tracks, null);
  } finally {
    assert.equal(path.dirname(path.resolve(workspace)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(workspace).startsWith("blueclue-pilot-test-"));
    await rm(workspace, { recursive: true, force: true });
  }
});

test("prepared pilot aligns overlay, count and scoring with every reference downbeat", async (context) => {
  let manifest: string;
  try {
    manifest = await readFile(new URL("../../.local/pilot.json", import.meta.url), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    context.skip("Private pilot audio is not installed on this checkout");
    return;
  }
  for (const track of parseLocalPilot(JSON.parse(manifest))) {
    assert.ok(track.duration! >= 60 && track.duration! <= 70, `${track.id}: allow a full minute of practice`);
    for (const downbeat of track.downbeats) {
      assert.equal(getBeatPosition(downbeat, track.beats, track.downbeats).count, 1, track.id);
      assert.ok(isDownbeat(downbeat, track.downbeats), track.id);
      assert.equal(scoreAttempt(downbeat, track.downbeats, track.duration!).classification, "clavado", track.id);
    }
  }
});

test("all five pilot recipes allow about a minute of continuous listening", async () => {
  const selection = JSON.parse(await readFile(new URL("../../data/pilots/course-pack.json", import.meta.url), "utf8"));
  assert.equal(selection.tracks.length, 5);
  for (const track of selection.tracks) {
    const seconds = selection.leadInSeconds + track.leadSeconds + track.bars * 240 / track.bpm;
    assert.ok(seconds >= 60 && seconds <= 70, track.id);
  }
});
