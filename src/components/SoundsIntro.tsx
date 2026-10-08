"use client";

import { useEffect, useRef, useState } from "react";
import { nextGuidedStep } from "@/lib/guidedPath";
import { QUIZ_LENGTH, SOUNDS_STORAGE_KEY, answerQuiz, currentQuestion, getSoundCard, isQuizFinished, quizClosing, quizFeedback, readSavedQuiz, soundCards, startQuizRound, summarizeQuiz, type QuizRound, type SoundId } from "@/lib/soundQuiz";

type Stage = "meet" | "quiz";

export function SoundsIntro({ audioVersion }: { audioVersion: string }) {
  const [stage, setStage] = useState<Stage>("meet");
  const [playing, setPlaying] = useState<SoundId | null>(null);
  const [heard, setHeard] = useState<Set<SoundId>>(new Set());
  const [round, setRound] = useState<QuizRound | null>(null);
  const [lastRound, setLastRound] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [awaitingPlay, setAwaitingPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    try {
      const saved = readSavedQuiz(localStorage.getItem(SOUNDS_STORAGE_KEY));
      if (saved) setLastRound(`Última vez: ${saved.correct} de ${saved.total}.`);
    } catch { setStorageError(true); }
  }, []);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [stage]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function play(id: SoundId) {
    audioRef.current?.pause();
    const audio = new Audio(`${getSoundCard(id).audioFile}?v=${audioVersion}`);
    audioRef.current = audio;
    setAudioError(null);
    setPlaying(id);
    audio.onended = () => setPlaying(current => current === id ? null : current);
    audio.play().then(() => setHeard(current => current.has(id) ? current : new Set(current).add(id))).catch(() => {
      setPlaying(null);
      setAudioError("No se pudo reproducir el sonido. Sube el volumen o quita el modo silencio y vuelve a tocar.");
    });
  }

  function startQuiz() {
    const next = startQuizRound(Math.random);
    savedRef.current = false;
    setAwaitingPlay(false);
    setRound(next);
    setStage("quiz");
    play(currentQuestion(next)!.sound);
  }

  function answer(choice: SoundId) {
    if (!round || !currentQuestion(round) || awaitingPlay) return;
    const next = answerQuiz(round, choice, Math.random);
    setRound(next);
    if (isQuizFinished(next)) {
      const summary = summarizeQuiz(next);
      if (!savedRef.current) {
        savedRef.current = true;
        try { localStorage.setItem(SOUNDS_STORAGE_KEY, JSON.stringify({ correct: summary.correct, total: summary.total })); }
        catch { setStorageError(true); }
      }
    } else setAwaitingPlay(true);
  }

  function playQuestion() {
    const open = round ? currentQuestion(round) : null;
    if (!open) return;
    setAwaitingPlay(false);
    play(open.sound);
  }

  const question = round ? currentQuestion(round) : null;
  const lastAnswered = round ? [...round.questions].reverse().find(item => item.answer !== null) ?? null : null;
  const finished = round ? isQuizFinished(round) : false;
  const summary = round ? summarizeQuiz(round) : null;
  const answeredCount = round ? round.questions.filter(item => item.answer !== null).length : 0;
  const nextStep = nextGuidedStep("sounds")!;

  return <main className="learning-menu sounds-intro" data-level="pulse">
    <header className="menu-header"><a className="menu-back" href="#inicio" aria-label="Volver al inicio"><span className="menu-back-icon" aria-hidden="true">←</span><span>Inicio</span></a><span className="menu-kicker">Paso 0</span></header>
    {stage === "meet" ? <>
      <p className="menu-eyebrow">Conoce los sonidos</p>
      <h1 ref={headingRef} tabIndex={-1}>Cuatro sonidos. Escúchalos.</h1>
      <p className="menu-intro">Todo lo que viene después se hace con estos cuatro. Toca cada uno las veces que quieras. Nada se puntúa.</p>
      <div className="sound-cards">
        {soundCards.map(card => <button key={card.id} type="button" className={`sound-card${playing === card.id ? " playing" : ""}${heard.has(card.id) ? " heard" : ""}`} onClick={() => play(card.id)} aria-pressed={playing === card.id}>
          <span className="sound-card-top"><strong>{card.name}</strong><span className="sound-card-state">{playing === card.id ? "Sonando" : "Oír"}</span></span>
          <span>{card.hint}</span>
          <small>{heard.has(card.id) ? "Escuchado · toca para repetir" : "Toca para oírlo"}</small>
        </button>)}
      </div>
      {audioError && <p className="audio-error" role="alert">{audioError}</p>}
      <button type="button" className="next-button sounds-next" onClick={startQuiz} disabled={heard.size < soundCards.length}>{heard.size < soundCards.length ? `Escucha los ${soundCards.length - heard.size} que faltan` : "¿Cuál suena? · 8 preguntas"}</button>
      {lastRound && <p className="menu-footer">{lastRound}</p>}
    </> : <>
      <p className="menu-eyebrow">¿Cuál suena?</p>
      <h1 ref={headingRef} tabIndex={-1}>{finished ? `${summary!.correct} de ${QUIZ_LENGTH}` : `Pregunta ${Math.min(QUIZ_LENGTH, answeredCount + 1)} de ${QUIZ_LENGTH}`}</h1>
      {finished && summary ? <section className="phrase-summary" aria-labelledby="sounds-result">
        <p id="sounds-result" className="sounds-closing">{quizClosing(summary)}</p>
        {summary.confused.length > 0 && <p className="menu-intro">Confundiste: {summary.confused.map(item => `${getSoundCard(item.sound).name} con ${getSoundCard(item.answer).name}`).join(" · ")}.</p>}
        <div className="sound-cards compact">
          {soundCards.map(card => <button key={card.id} type="button" className="sound-card" onClick={() => play(card.id)}><span className="sound-card-top"><strong>{card.name}</strong><span className="sound-card-state">Oír</span></span></button>)}
        </div>
        {summary.passed ? <a className="next-button sounds-next" href={nextStep.hash}>Siguiente · {nextStep.title}</a> : <button type="button" className="next-button sounds-next" onClick={startQuiz}>Otra vez · 8 preguntas</button>}
        <button type="button" className="previous-button sounds-secondary" onClick={() => { setStage("meet"); setRound(null); }}>Volver a conocer los sonidos</button>
        {summary.passed && <button type="button" className="previous-button sounds-secondary" onClick={startQuiz}>Repetir el juego</button>}
      </section> : <>
        <p className="menu-intro">{awaitingPlay ? "Cuando quieras, escucha el siguiente." : "Escucha y elige qué suena."}</p>
        <button type="button" className="continue-button sounds-replay" onClick={playQuestion} disabled={playing !== null}>{playing !== null ? "Sonando…" : awaitingPlay ? "Siguiente sonido" : "Volver a oírlo"}</button>
        <div className="sound-choices" role="group" aria-label="Qué sonido es">
          {soundCards.map(card => <button key={card.id} type="button" className="tap-button sound-choice" disabled={!question || awaitingPlay} onClick={() => answer(card.id)}><strong>{card.name.toUpperCase()}</strong></button>)}
        </div>
        {lastAnswered && <div className={`phrase-feedback sounds-feedback ${lastAnswered.answer === lastAnswered.sound ? "right" : "wrong"}`} role="status">{quizFeedback(lastAnswered)}{lastAnswered.answer !== lastAnswered.sound && <button type="button" className="previous-button" onClick={() => play(lastAnswered.sound)}>Oír {getSoundCard(lastAnswered.sound).name.toLowerCase()}</button>}</div>}
        {audioError && <p className="audio-error" role="alert">{audioError}</p>}
      </>}
    </>}
    {storageError && <p role="status" className="menu-footer">No se puede guardar en este navegador. Puedes seguir practicando.</p>}
  </main>;
}
