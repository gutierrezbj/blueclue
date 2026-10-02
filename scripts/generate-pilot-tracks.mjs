import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sampleRate = 22050;
const leadInSeconds = 3;
const tracks = [
  { id: "pulse", title: "Pulso claro", bpm: 100, difficulty: "very-easy", description: "Escucha el golpe grave que abre cada grupo de cuatro.", seed: 1 },
  { id: "four-count", title: "Cuenta cuatro", bpm: 112, difficulty: "easy", description: "La caja cae en el 2 y el 4. Vuelve al 1 después de cada cuatro golpes.", seed: 2 },
  { id: "offbeat", title: "Entre los golpes", bpm: 120, difficulty: "medium", description: "El charles suena entre beats. Mantén el pulso del bombo.", seed: 3 },
  { id: "return", title: "Vuelve al 1", bpm: 116, difficulty: "medium", description: "Hay una pausa a mitad. Cuenta por dentro y encuentra el siguiente 1.", seed: 4 },
  { id: "subtle-one", title: "El 1 sutil", bpm: 124, difficulty: "hard", description: "Menos acento en el inicio. Usa la caja y el patrón de cuatro.", seed: 5 }
];

function noise(index, seed) {
  const value = Math.sin((index + 1) * (seed * 19.19 + 67.13)) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function addTone(samples, start, frequency, seconds, gain, decay) {
  const first = Math.round(start * sampleRate);
  const length = Math.round(seconds * sampleRate);
  for (let index = 0; index < length && first + index < samples.length; index++) {
    const elapsed = index / sampleRate;
    const envelope = Math.exp(-elapsed * decay);
    samples[first + index] += Math.sin(2 * Math.PI * frequency * elapsed) * gain * envelope;
  }
}

function addKick(samples, start, gain) {
  const first = Math.round(start * sampleRate);
  const length = Math.round(0.28 * sampleRate);
  let phase = 0;
  for (let index = 0; index < length && first + index < samples.length; index++) {
    const elapsed = index / sampleRate;
    phase += (48 + 95 * Math.exp(-elapsed * 28)) / sampleRate;
    samples[first + index] += Math.sin(2 * Math.PI * phase) * gain * Math.exp(-elapsed * 18);
  }
}

function addNoise(samples, start, seconds, gain, seed, decay) {
  const first = Math.round(start * sampleRate);
  const length = Math.round(seconds * sampleRate);
  for (let index = 0; index < length && first + index < samples.length; index++) {
    const elapsed = index / sampleRate;
    samples[first + index] += noise(index + first, seed) * gain * Math.exp(-elapsed * decay);
  }
}

function encodeWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let index = 0; index < samples.length; index++) {
    const value = Math.max(-1, Math.min(1, samples[index] * 0.72));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  return buffer;
}

const root = process.cwd();
await mkdir(path.join(root, "public", "tracks"), { recursive: true });
await mkdir(path.join(root, "data", "tracks"), { recursive: true });

for (const track of tracks) {
  const beatLength = 60 / track.bpm;
  const beatTimes = Array.from({ length: 32 }, (_, index) => Number((leadInSeconds + 0.8 + index * beatLength).toFixed(4)));
  const downbeatTimes = beatTimes.filter((_, index) => index % 4 === 0);
  const duration = beatTimes.at(-1) + beatLength + 0.6;
  const samples = new Float32Array(Math.ceil(duration * sampleRate));

  beatTimes.forEach((time, index) => {
    if (track.id === "return" && index === 15) return;
    const position = index % 4;
    const kickGain = track.id === "subtle-one" && position === 0 ? 0.35 : position === 0 ? 0.9 : 0.65;
    addKick(samples, time, kickGain);
    if (position === 1 || position === 3) addNoise(samples, time, 0.13, 0.24, track.seed, 27);
    if (track.id !== "pulse") addNoise(samples, time, 0.055, 0.11, track.seed + 11, 55);
    if (track.id === "offbeat" || track.id === "subtle-one") {
      addNoise(samples, time + beatLength / 2, 0.06, 0.12, track.seed + 7, 51);
    }
    if (position === 0 && track.id !== "subtle-one") {
      addTone(samples, time, index < 16 ? 220 : 261.63, 0.4, track.id === "pulse" ? 0.4 : 0.23, 8);
    }
    if (track.id === "subtle-one" && position === 2) {
      addKick(samples, time + beatLength / 2, 0.28);
    }
  });

  const metadata = {
    id: track.id,
    title: track.title,
    bpm: track.bpm,
    timeSignature: "4/4",
    audioFile: `/tracks/${track.id}.wav`,
    leadInSeconds,
    beats: beatTimes,
    downbeats: downbeatTimes,
    difficulty: track.difficulty,
    description: track.description
  };
  await writeFile(path.join(root, "data", "tracks", `${track.id}.json`), `${JSON.stringify(metadata, null, 2)}\n`);
  await writeFile(path.join(root, "public", "tracks", `${track.id}.wav`), encodeWav(samples));
}
