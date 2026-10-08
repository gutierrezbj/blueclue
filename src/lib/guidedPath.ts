export type GuidedStepId = "sounds" | "pulse" | "count" | "downbeat" | "bass" | "percussion" | "choice";
export type GuidedStep = { id: GuidedStepId; title: string; hash: string; hint: string };

export const guidedPath: readonly GuidedStep[] = [
  { id: "sounds", title: "Conoce los sonidos", hash: "#sonidos", hint: "Bombo, caja, charles y bajo. Solo escuchar y elegir." },
  { id: "pulse", title: "Sigue el pulso", hash: "#nivel-1", hint: "Toca el botón con cada golpe, como con el pie." },
  { id: "count", title: "Cuenta 1-2-3-4", hash: "#nivel-2", hint: "Toca solo al volver al 1." },
  { id: "downbeat", title: "Encuentra el 1", hash: "#nivel-3", hint: "Sin marcas. Cuenta por dentro." },
  { id: "bass", title: "Escucha el bajo", hash: "#escucha-el-bajo", hint: "Reconoce cuándo entra el bajo." },
  { id: "percussion", title: "Escucha la percusión", hash: "#escucha-la-percusion", hint: "Reconoce cuándo entra la batería." },
  { id: "choice", title: "¿Bajo o batería?", hash: "#bajo-o-bateria", hint: "Di cuál de los dos acaba de entrar." }
];

export const GUIDED_PATH_STORAGE_KEY = "blueclue-path-v1";

export type GuidedPathState = { stepId: GuidedStepId; updatedAt: string };

export function isGuidedStepId(value: unknown): value is GuidedStepId {
  return guidedPath.some(step => step.id === value);
}

export function getGuidedStep(id: GuidedStepId): GuidedStep {
  return guidedPath.find(step => step.id === id)!;
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

/** Where «Empieza aquí» should send the person: the saved step, or the first step. */
export function entryStep(state: GuidedPathState | null): GuidedStep {
  return state ? getGuidedStep(state.stepId) : guidedPath[0];
}
