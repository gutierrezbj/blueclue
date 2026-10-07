import { renderListeningArrangement } from "./listening-arrangement.mjs";

export function renderPercussionPreview() {
  return renderListeningArrangement({
    bpm: 96, leadInSeconds: 3, duration: 24, beatCount: 32,
    changes: [
      { time: 6.75, action: "percussion-in" },
      { time: 11.75, action: "percussion-out" },
      { time: 16.125, action: "percussion-in" }
    ]
  });
}
