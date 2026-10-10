import type { GuidedStepId } from "./guidedPath.ts";
import type { LearningModuleId } from "./learningModules.ts";

export type OverviewId = "sounds" | "listening" | LearningModuleId;
export type LearningOverview = {
  id: OverviewId;
  title: string;
  label: string;
  hint: string;
  hash: string;
  practiceHash: string;
  steps: readonly GuidedStepId[];
  purpose: string;
  instructions: readonly string[];
  result: string;
};

export const learningOverviews: readonly LearningOverview[] = [
  {
    id: "sounds", title: "Conoce los sonidos", label: "Empieza aquí",
    hint: "Distingue bombo, caja, charles y bajo.", hash: "#aprender-sonidos", practiceHash: "#sonidos", steps: ["sounds"],
    purpose: "Pon nombre a lo que oyes. Distingue una nota de bajo de un golpe de bombo antes de buscar cambios en la música.",
    instructions: ["Escucha los cuatro sonidos, sin puntuación.", "Repítelos las veces que necesites.", "Reconócelos sin mirar su nombre."],
    result: "Verás qué sonidos reconociste y cuáles conviene volver a escuchar."
  },
  {
    id: "listening", title: "Escucha el cambio", label: "Escucha",
    hint: "Reconoce qué entra y qué sale.", hash: "#escucha-el-cambio", practiceHash: "#escucha-el-bajo", steps: ["bass", "percussion", "choice"],
    purpose: "Notar cuándo aparece el bajo o cambia la percusión te ayuda a escuchar cómo se organiza la música. No necesitas contar.",
    instructions: ["Escucha una entrada con ayuda.", "Reconócela sin el aviso visual.", "Repite con otra muestra para no aprenderla de memoria."],
    result: "Verás qué entradas reconociste y podrás volver a escuchar las que se escaparon."
  },
  {
    id: "pulse", title: "Sigue el pulso", label: "Ritmo · Nivel 1",
    hint: "Acompaña la música sin perderte.", hash: "#aprender-pulso", practiceHash: "#nivel-1", steps: ["pulse"],
    purpose: "Sentir el pulso es una base para mantenerte a tiempo cuando más adelante practiques con tu equipo.",
    instructions: ["Empieza despacio y con la guía visible.", "Deja pasar la preparación y escucha el pulso.", "Marca cada golpe; repite antes de quitar ayudas."],
    result: "Verás tus aciertos y errores de la ronda. Completar no significa dominar."
  },
  {
    id: "count", title: "Cuenta 1-2-3-4", label: "Ritmo · Nivel 2",
    hint: "Agrupa los golpes y mantén la cuenta.", hash: "#aprender-cuenta", practiceHash: "#nivel-2", steps: ["count"],
    purpose: "Oriéntate dentro del compás, en vez de oír una sucesión de golpes sin saber dónde estás.",
    instructions: ["Escucha y sigue el contador con ayuda.", "Cuenta 1-2-3-4 y pulsa solo al volver al 1.", "Prueba con menos ayuda cuando te resulte cómodo."],
    result: "Verás si tus toques coinciden con el 1 y podrás repetir los momentos difíciles."
  },
  {
    id: "downbeat", title: "Encuentra el 1", label: "Ritmo · Nivel 3",
    hint: "Reconoce dónde empieza cada compás.", hash: "#aprender-el-1", practiceHash: "#nivel-3", steps: ["downbeat"],
    purpose: "Empieza a ubicar una entrada musical. Marcar el 1 es una base; todavía no demuestra que sepas mezclar dos canciones.",
    instructions: ["Escucha cómo llega el 1 después del 4.", "Marca solo el comienzo de cada compás.", "Repite los fallos; deja el Challenge para después."],
    result: "Verás clavadas, cerca y fallos. Después podrás probarte sin ayudas."
  }
];

export function overviewForHash(hash: string): LearningOverview | null {
  return learningOverviews.find(overview => overview.hash === hash) ?? null;
}

export function getLearningOverview(id: OverviewId): LearningOverview {
  return learningOverviews.find(overview => overview.id === id)!;
}
