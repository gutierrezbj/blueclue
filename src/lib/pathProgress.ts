import { GUIDED_PATH_STORAGE_KEY, PATH_DONE_STORAGE_KEY, addDoneStep, legacyDoneSteps, readDoneSteps, readGuidedPathState, type GuidedPathState, type GuidedStepId } from "./guidedPath.ts";

/** Marks a step as completed once. Storage failures are ignored: the path still works without saving. */
export function markStepDone(id: GuidedStepId): void {
  try { localStorage.setItem(PATH_DONE_STORAGE_KEY, addDoneStep(localStorage.getItem(PATH_DONE_STORAGE_KEY), id)); }
  catch { /* sin almacenamiento */ }
}

export function readPathProgress(): { lastOpened: GuidedPathState | null; done: Set<GuidedStepId>; storage: boolean } {
  try {
    const done = readDoneSteps(localStorage.getItem(PATH_DONE_STORAGE_KEY));
    const entries: [string, string | null][] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key) entries.push([key, localStorage.getItem(key)]);
    }
    for (const id of legacyDoneSteps(entries)) done.add(id);
    return { lastOpened: readGuidedPathState(localStorage.getItem(GUIDED_PATH_STORAGE_KEY)), done, storage: true };
  } catch {
    return { lastOpened: null, done: new Set(), storage: false };
  }
}
