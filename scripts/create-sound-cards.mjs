// Paso 0 · Conoce los sonidos: cuatro sonidos aislados, sin base, con las mismas voces
// que las muestras de escucha (listening-arrangement.mjs). Reproducibles y propios.
import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 22050;
const duration = 2.5;
const bpm = 96;
const beatSeconds = 60 / bpm;

function noise(index) {
  const value = Math.sin(index * 78.233 + 12.9898) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function render(voices) {
  const samples = new Float64Array(Math.round(sampleRate * duration));
  function addVoice(start, length, voice) {
    const first = Math.round(start * sampleRate);
    for (let index = 0; index < Math.round(length * sampleRate) && first + index < samples.length; index++) {
      samples[first + index] += voice(index / sampleRate, index);
    }
  }
  voices(addVoice);
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (!Number.isFinite(peak) || peak >= 1 || peak === 0) throw new Error("Invalid sound amplitude");
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
  return { wav, peak };
}

const kick = (start) => (addVoice) => addVoice(start, 0.22, time => 0.6 * Math.exp(-time * 24) * Math.sin(2 * Math.PI * (52 * time + 1.8 * (1 - Math.exp(-time * 32)))));
const snare = (start) => (addVoice) => addVoice(start, 0.14, (time, index) => 0.5 * noise(index) * Math.exp(-time * 30));
const hihat = (start) => (addVoice) => addVoice(start, 0.045, (time, index) => 0.45 * noise(index + 917) * Math.exp(-time * 80));
const bass = (start, frequency) => (addVoice) => addVoice(start, 0.5, time => {
  const envelope = Math.min(1, time / 0.035) * Math.min(1, (0.5 - time) / 0.08);
  return 0.55 * envelope * Math.exp(-time * 2) * Math.sin(2 * Math.PI * frequency * time);
});

export const soundCards = {
  bombo: addVoice => { for (let beat = 0; beat < 4; beat++) kick(0.1 + beat * beatSeconds)(addVoice); },
  caja: addVoice => { for (let beat = 0; beat < 4; beat++) snare(0.1 + beat * beatSeconds)(addVoice); },
  charles: addVoice => { for (let step = 0; step < 8; step++) hihat(0.1 + step * beatSeconds / 2)(addVoice); },
  bajo: addVoice => { [130.81, 130.81, 155.56, 116.54].forEach((frequency, beat) => bass(0.1 + beat * beatSeconds, frequency)(addVoice)); }
};

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) {
  await mkdir("public/tracks/sounds", { recursive: true });
  for (const [name, voices] of Object.entries(soundCards)) {
    const { wav, peak } = render(voices);
    await writeFile(`public/tracks/sounds/${name}.wav`, wav);
    console.log(`${name}.wav · ${duration} s · ${wav.length} bytes · pico ${peak.toFixed(3)}`);
  }
}
