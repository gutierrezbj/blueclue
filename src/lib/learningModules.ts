import type { TrainingMode, TrainingTrack } from "./tracks.ts";
import type { PlaybackSpeed } from "./playbackSpeed.ts";
import { getPracticeEntry, scorePracticeAttempt } from "./practiceEntry.ts";
import type { AttemptClassification } from "./scoring.ts";

export type LearningModuleId = "pulse" | "count" | "downbeat";
type LearningModule = {
  id: LearningModuleId;
  title: string;
  instruction: string;
  readiness: string;
  tapLabel: string;
  targetLabel: string;
  defaultMode: TrainingMode;
};

export const learningModules: readonly LearningModule[] = [
  {
    id: "pulse", title: "Sigue el pulso", defaultMode: "teach", tapLabel: "MARCAR EL PULSO", targetLabel: "EL PULSO",
    instruction: "Escucha el ritmo regular. Pulsa el botón grande en cada beat, como si acompañaras con el pie. Todavía no busques el 1.",
    readiness: "Pasa a contar cuando puedas mantener varios pulsos seguidos sin acelerarte."
  },
  {
    id: "count", title: "Cuenta 1-2-3-4", defaultMode: "teach", tapLabel: "MARCAR EL 1", targetLabel: "EL 1",
    instruction: "Cuenta 1-2-3-4 en voz alta. Pulsa el botón grande solo al volver del 4 al 1; deja pasar el 2, el 3 y el 4.",
    readiness: "Pasa al siguiente módulo cuando puedas contar varios grupos sin perderte."
  },
  {
    id: "downbeat", title: "Encuentra el 1", defaultMode: "assist", tapLabel: "MARCAR EL 1", targetLabel: "EL 1",
    instruction: "Cuenta por dentro y marca el comienzo de cada grupo. Empieza con menos guía y prueba Train cuando te sientas preparado.",
    readiness: "Prueba Train sin marcas. Después cambia de pista para comprobar si reconoces el 1 por oído."
  }
];

export function isLearningModuleId(value: unknown): value is LearningModuleId {
  return learningModules.some((module) => module.id === value);
}

export function getLearningModule(id: LearningModuleId): LearningModule {
  return learningModules.find((module) => module.id === id)!;
}

export function scoreExerciseAttempt(time: number, track: TrainingTrack, duration: number, moduleId: LearningModuleId, speed: PlaybackSpeed) {
  const entry = getPracticeEntry(track.downbeats, duration, speed);
  const targets = moduleId === "pulse" ? track.beats : track.downbeats;
  const result = scorePracticeAttempt(time, targets, duration, entry, speed);
  if (!result || moduleId !== "pulse") return result;
  const messages: Record<AttemptClassification, string> = {
    clavado: "Clavado. Ese era el pulso.",
    cerca: "Cerca del pulso. Sigue el ritmo sin acelerar.",
    temprano: "Te adelantaste al pulso. Deja el mismo espacio entre tus toques.",
    tarde: "Llegaste después del pulso. Intenta acompañar el siguiente golpe.",
    "otra-vez": "Escucha el pulso regular y vuelve a acompañarlo."
  };
  return { ...result, message: messages[result.classification] };
}
