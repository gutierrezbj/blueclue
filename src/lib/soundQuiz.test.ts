import assert from "node:assert/strict";
import test from "node:test";
import { QUIZ_LENGTH, answerQuiz, currentQuestion, isQuizFinished, pickQuizSound, quizClosing, quizFeedback, readSavedQuiz, soundCards, startQuizRound, summarizeQuiz } from "./soundQuiz.ts";

test("four sound cards with their own isolated audio", () => {
  assert.deepEqual(soundCards.map(card => card.id), ["kick", "snare", "hihat", "bass"]);
  assert.equal(new Set(soundCards.map(card => card.audioFile)).size, 4);
  for (const card of soundCards) assert.match(card.audioFile, /^\/tracks\/sounds\/[a-z]+\.wav$/);
});

test("the next sound is never the one just heard", () => {
  for (const previous of soundCards.map(card => card.id)) {
    for (const random of [0, 0.33, 0.66, 0.999]) assert.notEqual(pickQuizSound(previous, random), previous);
  }
  assert.equal(pickQuizSound(null, 0), "kick");
  assert.equal(pickQuizSound(null, 0.999), "bass");
});

test("a round has eight questions, counts the first answer only and summarizes confusions", () => {
  const sequence = [0, 0.5, 0.1, 0.9, 0.4, 0.7, 0.2, 0.8, 0.3];
  let cursor = 0;
  const random = () => sequence[cursor++ % sequence.length];
  let round = startQuizRound(random);
  assert.equal(round.questions.length, 1);
  const first = currentQuestion(round)!;
  round = answerQuiz(round, first.sound, random);
  assert.equal(round.questions[0].answer, first.sound);
  assert.equal(round.questions.length, 2);
  round = answerQuiz(round, round.questions[1].sound === "kick" ? "snare" : "kick", random);
  assert.equal(summarizeQuiz(round).confused.length, 1);
  while (!isQuizFinished(round)) round = answerQuiz(round, currentQuestion(round)!.sound, random);
  assert.equal(round.questions.length, QUIZ_LENGTH);
  assert.equal(answerQuiz(round, "bass", random), round);
  const summary = summarizeQuiz(round);
  assert.equal(summary.total, QUIZ_LENGTH);
  assert.equal(summary.correct, QUIZ_LENGTH - 1);
  assert.equal(summary.passed, true);
  assert.match(quizClosing(summary), /Siguiente: Sigue el pulso/);
  for (let index = 1; index < round.questions.length; index++) assert.notEqual(round.questions[index].sound, round.questions[index - 1].sound);
});

test("feedback names the expected sound and a weak round asks to listen again", () => {
  assert.equal(quizFeedback({ sound: "snare", answer: "snare" }), "Sí: era la caja.");
  assert.equal(quizFeedback({ sound: "hihat", answer: "kick" }), "Era el charles. Puedes volver a oírlo.");
  assert.match(quizClosing({ correct: 3, total: QUIZ_LENGTH, confused: [], passed: false }), /Vuelve a oírlos/);
  assert.match(quizClosing({ correct: 3, total: 4, confused: [], passed: false }), /Todavía no/);
});

test("saved quiz results are validated before being shown", () => {
  assert.equal(readSavedQuiz(null), null);
  assert.equal(readSavedQuiz(JSON.stringify({ correct: 9, total: 8 })), null);
  assert.equal(readSavedQuiz(JSON.stringify({ correct: 5, total: 7 })), null);
  assert.deepEqual(readSavedQuiz(JSON.stringify({ correct: 6, total: 8 })), { correct: 6, total: 8 });
});
