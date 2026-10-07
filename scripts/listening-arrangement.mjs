export function renderListeningArrangement({ bpm, leadInSeconds, duration, beatCount, changes, bassInitiallyPresent = true, bassGain = 0.12 }) {
  const sampleRate = 22050;
  const beatSeconds = 60 / bpm;
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

  for (let beat = 0; beat < beatCount; beat++) {
    const start = leadInSeconds + beat * beatSeconds;
    const bassFrequency = [130.81, 130.81, 155.56, 116.54][beat % 4];
    const bassChange = changes.findLast(item => item.time <= start && item.action.startsWith("bass-"));
    const bassPresent = bassChange ? bassChange.action === "bass-in" : bassInitiallyPresent;
    if (bassPresent) {
      addVoice(start, 0.5, time => {
        const envelope = Math.min(1, time / 0.035) * Math.min(1, (0.5 - time) / 0.08);
        return bassGain * envelope * Math.exp(-time * 2) * Math.sin(2 * Math.PI * bassFrequency * time);
      });
    }
    if (beat % 4 === 0) {
      for (const frequency of [261.63, 311.13, 392]) {
        addVoice(start, 1.5, time => {
          const envelope = Math.min(1, time / 0.06) * Math.min(1, (1.5 - time) / 0.12);
          return 0.035 * envelope * Math.exp(-time * 2) * Math.sin(2 * Math.PI * frequency * time);
        });
      }
    }

    const change = changes.findLast(item => item.time <= start && item.action.startsWith("percussion-"));
    if (change?.action !== "percussion-in") continue;
    addVoice(start, 0.22, time => 0.3 * Math.exp(-time * 24) * Math.sin(2 * Math.PI * (52 * time + 1.8 * (1 - Math.exp(-time * 32)))));
    if (beat % 2 === 1) {
      addVoice(start, 0.14, (time, index) => 0.18 * noise(index) * Math.exp(-time * 30));
    }
    for (const offset of [0, 0.5]) {
      addVoice(start + offset * beatSeconds, 0.045, (time, index) => 0.09 * noise(index + 917) * Math.exp(-time * 80));
    }
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
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
  return { wav, metadata: { bpm, duration, sampleRate, leadInSeconds, changes, peak } };
}
