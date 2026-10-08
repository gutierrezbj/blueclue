export type SoundId = "kick" | "snare" | "hihat" | "bass";

export type SoundCard = { id: SoundId; name: string; hint: string; audioFile: string; durationSeconds: number };

export const soundCards: readonly SoundCard[] = [
  { id: "kick", name: "Bombo", hint: "El golpe grave y redondo. Lo notas en el pecho.", audioFile: "/tracks/sounds/bombo.wav", durationSeconds: 2.5 },
  { id: "snare", name: "Caja", hint: "El golpe seco, como una palmada. Suele caer en el 2 y el 4.", audioFile: "/tracks/sounds/caja.wav", durationSeconds: 2.5 },
  { id: "hihat", name: "Charles", hint: "El «tss» metálico y corto, entre golpe y golpe.", audioFile: "/tracks/sounds/charles.wav", durationSeconds: 2.5 },
  { id: "bass", name: "Bajo", hint: "Notas graves que suenan y duran. No es un golpe: es una nota.", audioFile: "/tracks/sounds/bajo.wav", durationSeconds: 2.5 }
];

export const QUIZ_LENGTH = 8;
export const QUIZ_PASS = 6;
export const SOUNDS_STORAGE_KEY = "blueclue-sounds-v1";

export type QuizQuestion = { sound: SoundId; answer: SoundId | null };
export type QuizRound = { questions: QuizQuestion[] };

export function isSoundId(value: unknown): value is SoundId {
  return soundCards.some(card => card.id === value);
}

export function getSoundCard(id: SoundId): SoundCard {
  return soundCards.find(card => card.id === id)!;
}

/** Picks the next sound, never the same as the previous one. `random` is in [0, 1). */
export function pickQuizSound(previous: SoundId | null, random: number): SoundId {
  const candidates = soundCards.map(card => card.id).filter(id => id !== previous);
  const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(random * candidates.length)));
  return candidates[index];
}

export function startQuizRound(random: () => number): QuizRound {
  return { questions: [{ sound: pickQuizSound(null, random()), answer: null }] };
}

export function currentQuestion(round: QuizRound): QuizQuestion | null {
  const last = round.questions.at(-1);
  return last && last.answer === null ? last : null;
}

export function isQuizFinished(round: QuizRound): boolean {
  return round.questions.length >= QUIZ_LENGTH && round.questions.every(question => question.answer !== null);
}

/** Records the first answer for the open question and opens the next one when the round continues. */
export function answerQuiz(round: QuizRound, choice: SoundId, random: () => number): QuizRound {
  const open = currentQuestion(round);
  if (!open) return round;
  const answered = round.questions.map(question => question === open ? { ...question, answer: choice } : question);
  if (answered.length >= QUIZ_LENGTH) return { questions: answered };
  return { questions: [...answered, { sound: pickQuizSound(open.sound, random()), answer: null }] };
}

export function summarizeQuiz(round: QuizRound) {
  const answered = round.questions.filter(question => question.answer !== null);
  const correct = answered.filter(question => question.answer === question.sound).length;
  const confused = answered.filter(question => question.answer !== question.sound).map(question => ({ sound: question.sound, answer: question.answer as SoundId }));
  return { correct, total: answered.length, confused, passed: correct >= QUIZ_PASS && answered.length >= QUIZ_LENGTH };
}

export function quizFeedback(question: QuizQuestion): string {
  if (question.answer === null) return "Escucha y elige qué suena.";
  const expected = getSoundCard(question.sound).name.toLowerCase();
  return question.answer === question.sound ? `Sí: era ${expected === "charles" ? "el charles" : expected === "caja" ? "la caja" : `el ${expected}`}.` : `Era ${expected === "charles" ? "el charles" : expected === "caja" ? "la caja" : `el ${expected}`}. Puedes volver a oírlo.`;
}

export function quizClosing(summary: ReturnType<typeof summarizeQuiz>): string {
  if (summary.total < QUIZ_LENGTH) return "Todavía no has terminado las ocho preguntas.";
  return summary.passed ? "Ya distingues los sonidos. Siguiente: Sigue el pulso." : "Vuelve a oírlos con calma y repite. No hay prisa.";
}

export function readSavedQuiz(saved: string | null): { correct: number; total: number } | null {
  try {
    const parsed: unknown = JSON.parse(saved ?? "null");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (!Number.isInteger(record.correct) || !Number.isInteger(record.total)) return null;
    const correct = record.correct as number;
    const total = record.total as number;
    if (total !== QUIZ_LENGTH || correct < 0 || correct > total) return null;
    return { correct, total };
  } catch {
    return null;
  }
}
