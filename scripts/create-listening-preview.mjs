import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 22050;
const bpm = 96;
const beatSeconds = 60 / bpm;
const startSeconds = 2;
const duration = 23;
const samples = new Float64Array(sampleRate * duration);

function addVoice(start, length, voice) {
  const first = Math.round(start * sampleRate);
  for (let index = 0; index < Math.round(length * sampleRate) && first + index < samples.length; index++) {
    samples[first + index] += voice(index / sampleRate, index);
  }
}

function noise(index) {
  const value = Math.sin(index * 78.233 + 12.9898) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

for (let beat = 0; beat < 32; beat++) {
  const start = startSeconds + beat * beatSeconds;
  addVoice(start, 0.2, time => 0.24 * Math.exp(-time * 24) * Math.sin(2 * Math.PI * (52 * time + 1.8 * (1 - Math.exp(-time * 32)))));
  if (beat % 4 === 1 || beat % 4 === 3) {
    addVoice(start, 0.14, (time, index) => 0.13 * noise(index) * Math.exp(-time * 30));
  }
  for (const offset of [0, 0.5]) {
    addVoice(start + offset * beatSeconds, 0.045, (time, index) => 0.055 * noise(index + 917) * Math.exp(-time * 80));
  }
  if (beat % 4 === 0) {
    for (const frequency of [261.63, 311.13, 392]) {
      addVoice(start, 0.6, time => 0.028 * Math.sin(2 * Math.PI * frequency * time) * (1 - Math.exp(-time * 100)) * Math.exp(-time * 7));
    }
  }
  if ((beat >= 8 && beat < 16) || beat >= 24) {
    const frequency = [130.81, 130.81, 155.56, 116.54][beat % 4];
    addVoice(start, 0.5, time => {
      const attack = Math.min(1, time / 0.012);
      const release = Math.min(1, (0.5 - time) / 0.04);
      return 0.23 * attack * release * Math.exp(-time * 2) * (Math.sin(2 * Math.PI * frequency * time) + 0.3 * Math.sin(4 * Math.PI * frequency * time));
    });
  }
}

const peak = Math.max(...Array.from({ length: duration }, (_, second) => {
  let maximum = 0;
  for (let index = second * sampleRate; index < (second + 1) * sampleRate; index++) maximum = Math.max(maximum, Math.abs(samples[index]));
  return maximum;
}));
if (!Number.isFinite(peak) || peak >= 1 || peak === 0) throw new Error("Invalid preview amplitude");
const wav = Buffer.alloc(44 + samples.length * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(samples.length * 2, 40);
for (let index = 0; index < samples.length; index++) wav.writeInt16LE(Math.round(samples[index] * 32767), 44 + index * 2);
await mkdir(".local", { recursive: true });
await writeFile(".local/escucha-el-bajo.wav", wav);
await writeFile(".local/escucha-el-bajo.json", JSON.stringify({ bpm, duration, preparation: [0, 2], changes: [{ time: 7, action: "bass-in" }, { time: 12, action: "bass-out" }, { time: 17, action: "bass-in" }], peak }, null, 2));
console.log(`Muestra local: ${duration} segundos, ${wav.length} bytes, pico ${peak.toFixed(3)}. No publicada ni integrada en el catálogo.`);
