import fourCount from "../../data/tracks/four-count.json";
import offbeat from "../../data/tracks/offbeat.json";
import pulse from "../../data/tracks/pulse.json";
import returnTrack from "../../data/tracks/return.json";
import subtleOne from "../../data/tracks/subtle-one.json";

export type TrainingMode = "teach" | "assist" | "train";
export type Difficulty = "very-easy" | "easy" | "medium" | "hard";

export type TrainingTrack = {
  id: string;
  title: string;
  bpm: number;
  timeSignature: "4/4";
  audioFile: string;
  beats: number[];
  downbeats: number[];
  difficulty: Difficulty;
  description: string;
};

export const tracks: TrainingTrack[] = [pulse, fourCount, offbeat, returnTrack, subtleOne] as TrainingTrack[];

export const difficultyLabels: Record<Difficulty, string> = {
  "very-easy": "Muy fácil",
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil"
};
