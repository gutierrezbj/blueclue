export type GuidedStepId = "sounds" | "bass" | "percussion" | "choice" | "pulse" | "count" | "downbeat";
export type StageId = "ear" | "listen" | "rhythm";
export type GuidedStep = { id: GuidedStepId; title: string; hash: string; hint: string; stage: StageId };

/** The recommended order: hear the sounds, recognise what enters, then keep time. */
export const guidedPath: readonly GuidedStep[] = [
  { id: "sounds", stage: "ear", title: "Los cuatro sonidos", hash: "#sonidos", hint: "Bombo, caja, charles y bajo. Solo escuchar y elegir." },
  { id: "bass", stage: "listen", title: "El bajo", hash: "#escucha-el-bajo", hint: "Reconoce cuándo entra el bajo." },
  { id: "percussion", stage: "listen", title: "La percusión", hash: "#escucha-la-percusion", hint: "Reconoce cuándo entra la batería." },
  { id: "choice", stage: "listen", title: "¿Bajo o batería?", hash: "#bajo-o-bateria", hint: "Di cuál de los dos acaba de entrar." },
  { id: "pulse", stage: "rhythm", title: "Sigue el pulso", hash: "#nivel-1", hint: "Toca el botón con cada golpe, como con el pie." },
  { id: "count", stage: "rhythm", title: "Cuenta 1-2-3-4", hash: "#nivel-2", hint: "Toca solo al volver al 1." },
  { id: "downbeat", stage: "rhythm", title: "Encuentra el 1", hash: "#nivel-3", hint: "Sin marcas. Cuenta por dentro." }
];

export type Stage = { id: StageId; number: number; title: string };
export const stages: readonly Stage[] = [
  { id: "ear", number: 1, title: "Oído" },
  { id: "listen", number: 2, title: "Escucha" },
  { id: "rhythm", number: 3, title: "Ritmo" }
];

/** Shown greyed out until they are built; never linked. */
export const futureStages: readonly { number: number; title: string; version: string }[] = [
  { number: 4, title: "Canción", version: "V0.3" },
  { number: 5, title: "Mezcla", version: "V0.4" },
  { number: 6, title: "FLX4", version: "V0.5" }
];

/** Every built stage ends with real music once the course tracks are verified by ear. */
export const REAL_SONG_STEP_TITLE = "Ahora en una canción de verdad";

export const GUIDED_PATH_STORAGE_KEY = "blueclue-path-v1";
export const PATH_DONE_STORAGE_KEY = "blueclue-path-done-v1";

export type GuidedPathState = { stepId: GuidedStepId; updatedAt: string };

export function isGuidedStepId(value: unknown): value is GuidedStepId {
  return guidedPath.some(step => step.id === value);
}

export function getGuidedStep(id: GuidedStepId): GuidedStep {
  return guidedPath.find(step => step.id === id)!;
}

export function stepNumber(id: GuidedStepId): number {
  return guidedPath.findIndex(step => step.id === id) + 1;
}

export function getStage(id: StageId): Stage {
  return stages.find(stage => stage.id === id)!;
}

/** «Paso 3 de 7 · Escucha» */
export function stepLabel(id: GuidedStepId): string {
  return `Paso ${stepNumber(id)} de ${guidedPath.length} · ${getStage(getGuidedStep(id).stage).title}`;
}

export function stepForHash(hash: string): GuidedStep | null {
  return guidedPath.find(step => step.hash === hash) ?? null;
}

export function nextGuidedStep(id: GuidedStepId): GuidedStep | null {
  const index = guidedPath.findIndex(step => step.id === id);
  return index >= 0 && index + 1 < guidedPath.length ? guidedPath[index + 1] : null;
}

export function readGuidedPathState(saved: string | null): GuidedPathState | null {
  try {
    const parsed: unknown = JSON.parse(saved ?? "null");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (!isGuidedStepId(record.stepId)) return null;
    return { stepId: record.stepId, updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "" };
  } catch {
    return null;
  }
}

export function serializeGuidedPathState(stepId: GuidedStepId, now = new Date()): string {
  return JSON.stringify({ stepId, updatedAt: now.toISOString() } satisfies GuidedPathState);
}

/** The last opened step, or the first step. */
export function entryStep(state: GuidedPathState | null): GuidedStep {
  return state ? getGuidedStep(state.stepId) : guidedPath[0];
}

export function readDoneSteps(saved: string | null): Set<GuidedStepId> {
  try {
    const parsed: unknown = JSON.parse(saved ?? "null");
    return new Set(Array.isArray(parsed) ? parsed.filter(isGuidedStepId) : []);
  } catch {
    return new Set();
  }
}

export function addDoneStep(saved: string | null, id: GuidedStepId): string {
  const done = readDoneSteps(saved);
  done.add(id);
  return JSON.stringify(guidedPath.map(step => step.id).filter(stepId => done.has(stepId)));
}

/**
 * Steps already completed before the done list existed, inferred from results saved by each practice:
 * the sound quiz, the last recognition round of each listening practice and complete rhythm rounds.
 */
export function legacyDoneSteps(entries: readonly (readonly [string, string | null])[]): GuidedStepId[] {
  const done = new Set<GuidedStepId>();
  for (const [key, value] of entries) {
    if (value === null) continue;
    if (key === "blueclue-sounds-v1") done.add("sounds");
    for (const id of ["bass", "percussion", "choice"] as const) if (key.startsWith(`blueclue-listening-${id}-`)) done.add(id);
    if (key === "blueclue-rounds-v2") {
      try {
        const history: unknown = JSON.parse(value);
        if (typeof history === "object" && history !== null) {
          for (const [slot, rounds] of Object.entries(history as Record<string, unknown>)) {
            const moduleId = slot.split("/")[0];
            if (Array.isArray(rounds) && rounds.length > 0 && isGuidedStepId(moduleId)) done.add(moduleId);
          }
        }
      } catch { /* historial ilegible: no aporta pasos */ }
    }
  }
  return guidedPath.map(step => step.id).filter(id => done.has(id));
}

export type HomeState =
  | { kind: "first"; target: GuidedStep; doneCount: 0 }
  | { kind: "progress"; target: GuidedStep; doneCount: number; canRestart: boolean }
  | { kind: "complete"; doneCount: number };

export function homeState(lastOpened: GuidedPathState | null, done: ReadonlySet<GuidedStepId>): HomeState {
  const doneCount = guidedPath.filter(step => done.has(step.id)).length;
  if (doneCount === guidedPath.length) return { kind: "complete", doneCount };
  const opened = lastOpened ? stepNumber(lastOpened.stepId) : 0;
  if (doneCount === 0 && opened <= 1) return { kind: "first", target: guidedPath[0], doneCount: 0 };
  const startIndex = Math.max(0, opened - 1);
  const target = lastOpened && !done.has(lastOpened.stepId) ? getGuidedStep(lastOpened.stepId)
    : guidedPath.slice(startIndex).find(step => !done.has(step.id)) ?? guidedPath.find(step => !done.has(step.id))!;
  return { kind: "progress", target, doneCount, canRestart: stepNumber(target.id) > 1 };
}

export type StageStatus = "done" | "here" | "pending";

export function stageStatus(stage: StageId, done: ReadonlySet<GuidedStepId>, target: GuidedStepId | null): StageStatus {
  const steps = guidedPath.filter(step => step.stage === stage);
  if (target && steps.some(step => step.id === target)) return "here";
  return steps.every(step => done.has(step.id)) ? "done" : "pending";
}
