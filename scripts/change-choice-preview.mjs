import { renderListeningArrangement } from "./listening-arrangement.mjs";

export function renderChangeChoicePreview() {
  return renderListeningArrangement({
    bpm: 96, leadInSeconds: 3, duration: 32, beatCount: 44,
    bassInitiallyPresent: false, bassGain: 0.22,
    changes: [
      { time: 6.75, action: "bass-in" },
      { time: 11.75, action: "percussion-in" },
      { time: 16.125, action: "bass-out" },
      { time: 18.625, action: "bass-in" },
      { time: 22.375, action: "percussion-out" },
      { time: 25.5, action: "percussion-in" }
    ]
  });
}
