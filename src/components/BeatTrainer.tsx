"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WaveformDisplay } from "./WaveformDisplay";
import { RoundSummary } from "./RoundSummary";
import { PocketMode } from "./PocketMode";
import type { OfflinePack } from "@/lib/offlineTypes";
import { type AttemptClassification, type AttemptResult } from "@/lib/scoring";
import { difficultyLabels, type TrainingMode, type TrainingTrack } from "@/lib/tracks";
import { useWaveformPlayer } from "@/lib/useWaveformPlayer";
import { getPracticeNeighbor, getResumePosition, modeLabels, practiceModes, readPracticeSession, type PracticeLocation, type PracticeSession } from "@/lib/practice";
import { getBeatPosition } from "@/lib/beatGrid";
import { getCountIn } from "@/lib/countIn";
import { recordRoundTap, reviewOutcome, summarizeRound, type ExerciseRound, type RoundOutcome } from "@/lib/exerciseRound";
import { getPracticeEntry } from "@/lib/practiceEntry";
import { getLearningModule, learningModules, scoreExerciseAttempt, type LearningModuleId } from "@/lib/learningModules";
import { listeningSeconds, playbackSpeeds, speedLabels, suggestedSpeed, type PlaybackSpeed } from "@/lib/playbackSpeed";

type Progress = PracticeSession["progress"];
type Feedback = { result: AttemptResult; tapTime: number | null };

const modeDescriptions: Record<TrainingMode, string> = {
  teach: "Mira cómo el 1 abre cada grupo de cuatro. Cuenta en voz alta: el golpe más fuerte no siempre es el 1.",
  assist: "Sigue los pulsos, pero encuentra el 1 sin que te lo señalemos.",
  train: "Escucha sin marcas. Cuenta por dentro y pulsa cuando llegue el 1."
};

function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

type Props = { tracks: TrainingTrack[]; catalogKind: "local" | "demo"; catalogNotice: string | null; offlinePack: OfflinePack | null };

export function BeatTrainer({ tracks, catalogKind, catalogNotice, offlinePack }: Props) {
  const trackIds = useMemo(() => tracks.map((track) => track.id), [tracks]);
  const storageKey = catalogKind === "local" ? "blueclue-v0.1-local-pilot" : "blueclue-v0.1";
  const [trackId, setTrackId] = useState(tracks[0].id);
  const [mode, setMode] = useState<TrainingMode>("teach");
  const [moduleId, setModuleId] = useState<LearningModuleId>("pulse");
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(suggestedSpeed(tracks[0].difficulty));
  const [progress, setProgress] = useState<Progress>({ attempts: [] });
  const [hydrated, setHydrated] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [round, setRound] = useState<ExerciseRound | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<"practice" | "settings" | "summary">("practice");
  const mobileHeadingRef = useRef<HTMLHeadingElement>(null);
  const tapButtonRef = useRef<HTMLButtonElement>(null);
  const focusTapRef = useRef(false);
  const replayEndRef = useRef<number | null>(null);
  const resumePositionRef = useRef<number | null>(null);
  const journeyHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusJourneyRef = useRef(false);
  const track = tracks.find((item) => item.id === trackId) ?? tracks[0];
  const isReferencePending = track.referenceStatus === "pending-listening";
  const lesson = getLearningModule(moduleId);
  const isPulseExercise = moduleId === "pulse";
  const visualMode = isPulseExercise && mode === "teach" ? "assist" : mode;
  const practiceBpm = (track.bpm * playbackSpeed).toLocaleString("es-ES", { maximumFractionDigits: 1 });
  const player = useWaveformPlayer(track, hydrated, playbackSpeed);
  const countIn = getCountIn(player.currentTime, track.downbeats[0], track.bpm);
  const isPreparing = countIn !== null && countIn.phase !== "landing";
  const practiceEntry = getPracticeEntry(track.downbeats, player.duration, playbackSpeed);
  const isListening = practiceEntry !== null && player.currentTime < practiceEntry.opensAt;
  const canTap = player.isPlaying && player.isReady && !isReviewing && !isPreparing && practiceEntry !== null && !isListening;

  useEffect(() => {
    if (!player.interaction) return;
    setRound(null);
    setSummaryOpen(false);
    setFeedback(null);
    setIsReviewing(false);
    replayEndRef.current = null;
  }, [player.interaction]);

  useEffect(() => {
    if (!player.isReady || isReviewing || summaryOpen) return;
    if (player.isPlaying) setRound(current => current ? { ...current, end: Math.max(current.end, player.currentTime) } : { start: player.currentTime, end: player.currentTime, taps: [] });
    else if (player.currentTime >= player.duration) setRound(current => current ? { ...current, end: player.duration } : null);
  }, [player.currentTime, player.isPlaying, player.isReady, player.duration, isReviewing, summaryOpen]);

  useEffect(() => {
    function handleSpace(event: KeyboardEvent) {
      if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (window.matchMedia("(max-width: 900px)").matches && mobileScreen !== "practice") return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.isContentEditable || target.closest("input, select, textarea")) return;
        if (target.closest("button, a, summary") && target !== tapButtonRef.current) return;
      }
      event.preventDefault();
      if (!event.repeat && player.isReady) togglePlayback();
    }
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  });

  useEffect(() => {
    if (canTap && focusTapRef.current) {
      tapButtonRef.current?.focus({ preventScroll: true });
      focusTapRef.current = false;
    }
  }, [canTap]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = readPracticeSession(saved, trackIds);
        setTrackId(parsed.trackId);
        setMode(parsed.mode);
        setModuleId(parsed.moduleId);
        setPlaybackSpeed(parsed.playbackSpeed ?? suggestedSpeed((tracks.find((item) => item.id === parsed.trackId) ?? tracks[0]).difficulty));
        setProgress(parsed.progress);
        resumePositionRef.current = parsed.position;
        setResumed(true);
      }
    } catch {
      setStorageUnavailable(true);
    }
    setHydrated(true);
  }, [trackIds, storageKey, tracks]);

  useEffect(() => {
    if (!player.isReady || resumePositionRef.current === null) return;
    player.seek(getResumePosition(resumePositionRef.current, player.duration));
    resumePositionRef.current = null;
  }, [player.isReady, player.duration, player.seek]);

  const positionBucket = Math.floor(player.currentTime / 2);
  useEffect(() => {
    if (!hydrated || !player.isReady) return;
    function saveSession() {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ trackId, moduleId, mode, playbackSpeed, progress, position: player.getTime() }));
      } catch {
        setStorageUnavailable(true);
      }
    }
    saveSession();
    window.addEventListener("pagehide", saveSession);
    document.addEventListener("visibilitychange", saveSession);
    return () => {
      window.removeEventListener("pagehide", saveSession);
      document.removeEventListener("visibilitychange", saveSession);
    };
  }, [hydrated, trackId, moduleId, mode, playbackSpeed, progress, positionBucket, player.isReady, player.isPlaying, player.getTime, storageKey]);

  useEffect(() => {
    if (!focusJourneyRef.current) return;
    journeyHeadingRef.current?.focus();
    focusJourneyRef.current = false;
  }, [trackId, moduleId, mode]);

  useEffect(() => {
    if (replayEndRef.current !== null && player.currentTime >= replayEndRef.current) {
      player.pause();
      replayEndRef.current = null;
    }
  }, [player.currentTime, player.pause]);

  const { beatIndex, count: activeCount, bar: activeBar } = getBeatPosition(player.currentTime, track.beats, track.downbeats);
  const trackAttempts = progress.attempts.filter((attempt) => attempt.trackId === track.id && (attempt.moduleId ?? "downbeat") === moduleId && (attempt.playbackSpeed ?? 1) === playbackSpeed);
  const accurateCount = trackAttempts.filter((attempt) => attempt.classification === "clavado" || attempt.classification === "cerca").length;
  const trackIndex = trackIds.indexOf(trackId);
  const previousStep = getPracticeNeighbor(trackIds, { trackId, moduleId, mode, playbackSpeed }, -1);
  const nextStep = getPracticeNeighbor(trackIds, { trackId, moduleId, mode, playbackSpeed }, 1);
  const hasEnded = player.isReady && player.currentTime >= player.duration - 0.05;
  const roundSummary = summarizeRound(round ?? { start: 0, end: 0, taps: [] }, track, moduleId, playbackSpeed, player.duration);
  const showSummary = summaryOpen || hasEnded;
  const playbackLabel = isReviewing ? "Volver a practicar" : player.isPlaying ? "Pausar práctica" : hasEnded ? "Repetir esta pista" : "Continuar práctica";

  useEffect(() => {
    if (hasEnded && !isReviewing) setMobileScreen("summary");
  }, [hasEnded, isReviewing]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      mobileHeadingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [mobileScreen]);

  function openMobileSettings() {
    player.pause();
    focusTapRef.current = false;
    setMobileScreen("settings");
  }

  function startPracticePlayback() {
    if (!player.isReady) return;
    const time = player.getTime() >= player.duration - 0.05 ? 0 : player.getTime();
    setRound(current => time === 0 || !current ? { start: time, end: time, taps: [] } : current);
    setSummaryOpen(false);
    setMobileScreen("practice");
    focusTapRef.current = true;
    void player.play();
  }

  function selectTrack(nextTrackId: string) {
    if (nextTrackId !== trackId) navigatePractice({ trackId: nextTrackId, moduleId: "pulse", mode: "teach" });
  }

  function navigatePractice(location: PracticeLocation & { playbackSpeed?: PlaybackSpeed }, fromBeginning = false) {
    if (location.trackId === trackId && location.moduleId === moduleId && location.mode === mode && (location.playbackSpeed === undefined || location.playbackSpeed === playbackSpeed)) return;
    focusTapRef.current = false;
    setRound(null);
    setSummaryOpen(false);
    player.pause();
    replayEndRef.current = null;
    resumePositionRef.current = null;
    setIsReviewing(false);
    setFeedback(null);
    setResumed(false);
    focusJourneyRef.current = true;
    if ((fromBeginning || location.moduleId !== moduleId) && location.trackId === trackId) player.seek(0);
    if (location.playbackSpeed !== undefined) setPlaybackSpeed(location.playbackSpeed);
    else if (location.trackId !== trackId) setPlaybackSpeed(suggestedSpeed((tracks.find((item) => item.id === location.trackId) ?? tracks[0]).difficulty));
    setTrackId(location.trackId);
    setModuleId(location.moduleId);
    setMode(location.mode);
  }

  function changeSpeed(speed: PlaybackSpeed) {
    if (speed === playbackSpeed) return;
    player.pause();
    setRound(null);
    setSummaryOpen(false);
    focusTapRef.current = false;
    replayEndRef.current = null;
    setIsReviewing(false);
    setFeedback(null);
    setPlaybackSpeed(speed);
    setResumed(false);
  }

  function togglePlayback() {
    replayEndRef.current = null;
    if (isReviewing && feedback?.result.replayStart !== null && feedback?.result.replayStart !== undefined) {
      player.seek(feedback.result.replayStart);
      setRound(null);
    }
    setIsReviewing(false);
    setFeedback(null);
    setResumed(false);
    if (player.isPlaying && !isReviewing) player.pause();
    else startPracticePlayback();
  }

  function tap() {
    if (!canTap) return;
    const tapTime = player.getTime();
    const result = scoreExerciseAttempt(tapTime, track, player.duration, moduleId, playbackSpeed);
    if (!result) return;
    setFeedback({ result, tapTime });
    setRound(current => recordRoundTap(current ?? { start: tapTime, end: tapTime, taps: [] }, tapTime, track, moduleId, playbackSpeed, player.duration));
    replayEndRef.current = null;
    if (isReferencePending) return;
    setProgress((current) => ({
      attempts: [...current.attempts, { trackId: track.id, moduleId, playbackSpeed, classification: result.classification, errorMs: result.errorMs }].slice(-100)
    }));
  }

  function replay() {
    if (!feedback || feedback.result.replayStart === null || feedback.result.target === null) return;
    focusTapRef.current = false;
    player.seek(feedback.result.replayStart);
    replayEndRef.current = Math.min(player.duration, feedback.result.target + 1.2);
    setIsReviewing(true);
    setMobileScreen("practice");
    void player.play();
  }

  function restartPractice() {
    if (!player.isReady) return;
    player.pause();
    replayEndRef.current = null;
    setIsReviewing(false);
    setFeedback(null);
    setRound(null);
    setSummaryOpen(false);
    setResumed(false);
    player.seek(0);
    startPracticePlayback();
  }

  const listeningInstruction = isPulseExercise ? "Primero escucha el pulso regular. Todavía no pulses: deja que el ritmo se te haga familiar." : "Primero escucha dos veces 1-2-3-4. Estos primeros compases no se puntúan.";
  function finishRound() {
    player.pause();
    replayEndRef.current = null;
    focusTapRef.current = false;
    if (!isReviewing) setRound(current => current ? { ...current, end: player.getTime() } : null);
    setSummaryOpen(true);
    setMobileScreen("summary");
  }

  function replayOutcome(outcome: RoundOutcome) {
    const result = reviewOutcome(outcome);
    setFeedback({ result, tapTime: outcome.tapTime });
    player.seek(result.replayStart ?? 0);
    replayEndRef.current = Math.min(player.duration, outcome.target + 1.2);
    focusTapRef.current = false;
    setIsReviewing(true);
    setSummaryOpen(true);
    setMobileScreen("practice");
    document.getElementById("listening")?.focus();
    void player.play();
  }

  const preparationNotice = isReviewing ? "Escucha la referencia sin marcar." : isPreparing ? countIn?.phase === "settle" ? "Acomódate. La bolita avanza por la línea plana; después cuenta al ritmo de la música." : "4… 3… 2… ¡1! Ese 1 coincide con el comienzo del compás. Primero solo escucha." : player.isPlaying && isListening ? listeningInstruction : player.isPlaying ? isPulseExercise ? "Acompaña cada pulso. Si te pierdes, escucha y vuelve a entrar sin prisa." : "Marca los siguientes 1 cuando los reconozcas. No tienes que acertar el primero." : "Continúa donde lo dejaste o reinicia el ejercicio para preparar otra entrada.";
  const mobileInstruction = isReviewing ? "Revisión · escucha, no se puntúa." : !player.isPlaying ? hasEnded ? "Repite cuando quieras, sin prisa." : isPreparing || isListening ? "Pulsa ▶. Primero solo escucharás." : "Pulsa ▶ para continuar marcando." : isPreparing ? "Acomódate. Sigue la cuenta de entrada." : isListening ? "Solo escucha. Tu turno llega después." : isPulseExercise ? "Toca el botón en cada pulso." : "Toca el botón al pasar del 4 al 1.";

  const feedbackLabel: Record<AttemptClassification, string> = {
    clavado: "CLAVADO",
    cerca: "CERCA",
    temprano: "TEMPRANO",
    tarde: "TARDE",
    "otra-vez": "OTRA VEZ"
  };

  return (
    <main className="app-shell" data-mobile-screen={mobileScreen}>
      <a className="skip-link" href="#practice-controls">Ir a los controles de práctica</a>
      <header className="site-header">
        <div className="brand"><span className="brand-mark">B<span>.</span></span><span>BlueClue</span></div>
        <div className="header-tag">ENTRENA TU OÍDO <span>·</span> V0.1</div>
        <button type="button" className="mobile-only mobile-settings-button" onClick={() => mobileScreen === "practice" ? openMobileSettings() : setMobileScreen("practice")}>{mobileScreen === "practice" ? "Ajustes" : "← Practicar"}</button>
      </header>

      <section className="mobile-only mobile-context" aria-label="Ejercicio actual">
        <h1 ref={mobileHeadingRef} tabIndex={-1}>{mobileScreen === "settings" ? "Tu ejercicio" : mobileScreen === "summary" ? "Tu ronda" : lesson.title}</h1>
        <p>Pista {trackIndex + 1}/{tracks.length} · {track.title}</p>
        <span>{mode.toUpperCase()} · {speedLabels[playbackSpeed]} · {practiceBpm} BPM</span>
        {isReferencePending && <small>Referencia provisional · sin nota</small>}
        {storageUnavailable && <small role="status">No se puede guardar el progreso en este navegador.</small>}
      </section>

      <PocketMode pack={offlinePack} />

      <section className="intro">
        <div className="eyebrow"><span className="eyebrow-line" /> BEAT TRAINER / TU RECORRIDO</div>
        <h1>Encuentra <em>el 1.</em></h1>
        <p>Escucha el pulso. Cuenta cuatro golpes. Marca el inicio del compás.</p>
      </section>

      <p className="catalog-notice">{catalogKind === "local" ? "TU MÚSICA · 5 FRAGMENTOS DEL PACK DE CURSO · COPIAS LOCALES" : "DEMOSTRACIÓN · 5 PATRONES SINTÉTICOS"}</p>
      {catalogNotice && <p className="audio-error" role="status">{catalogNotice}</p>}

      <section className="journey-card" aria-labelledby="journey-heading">
        <div className="journey-overview">
          <span className="field-label">PISTA {trackIndex + 1} DE {tracks.length} · MÓDULO {learningModules.findIndex((item) => item.id === moduleId) + 1} DE 3</span>
          <h2 id="journey-heading" ref={journeyHeadingRef} tabIndex={-1}>{lesson.title}</h2>
          <p>{lesson.instruction}</p>
          {resumed && <p>Retomamos tu ejercicio y su velocidad, sin arrancar la música.</p>}
          <nav className="section-links" aria-label="Secciones del ejercicio"><a href="#listening">Escuchar y ver la guía</a><a href="#practice-controls">Ir a practicar ↓</a></nav>
        </div>
        <div className="journey-track">
          <label className="field-label" htmlFor="track-select">ELEGIR PISTA</label>
          <select id="track-select" className="track-select" value={trackId} disabled={!hydrated} onChange={(event) => selectTrack(event.target.value)}>
            {tracks.map((item, index) => <option key={item.id} value={item.id}>{String(index + 1).padStart(2, "0")} · {item.title} — {difficultyLabels[item.difficulty]}</option>)}
          </select>
          <p className="save-notice" role="status">{storageUnavailable ? "No podemos guardar en este navegador. Puedes practicar, pero la sesión no se conservará al cerrar." : "Tu punto de práctica se guarda en este navegador."}</p>
        </div>
        <nav className="module-selector" aria-label="Módulos de aprendizaje">
          {learningModules.map((item, index) => <button key={item.id} type="button" className={moduleId === item.id ? "module-button active" : "module-button"} aria-current={moduleId === item.id ? "step" : undefined} disabled={!hydrated} onClick={() => navigatePractice({ trackId, moduleId: item.id, mode: item.defaultMode })}><small>MÓDULO {index + 1}</small>{item.title}</button>)}
        </nav>
      </section>

      <div className="trainer-grid">
        <section id="listening" className="player-card" aria-label="Entrenador de beat" tabIndex={-1}>
          <div className="section-topline"><span>01 / ESCUCHA</span><span>ENTRENAMIENTO ACTIVO</span></div>
          <div className="player-settings">
          <div className="track-heading">
            <div><span className="field-label">PISTA DE ENTRENAMIENTO</span><h2>{track.title}</h2>{track.sourceTitle && <p className="source-title">{track.sourceTitle}</p>}<p>{isPulseExercise ? "Acompaña el pulso regular de esta pista. En este módulo todos los beats cuentan, no solo el 1." : track.description}</p></div>
            <div className="bpm"><strong>{practiceBpm}</strong><span>BPM DE PRÁCTICA</span><span>Original: {track.bpm} · 4/4</span></div>
          </div>

          {isReferencePending && <p className="reference-notice">Marcas de Serato del archivo original. Falta validar el 1 por oído: el feedback es provisional y no suma aciertos.</p>}

          <fieldset className="speed-control" disabled={!player.isReady}>
            <legend>VELOCIDAD PARA APRENDER</legend>
            <div>{playbackSpeeds.map((speed) => <button key={speed} type="button" aria-pressed={playbackSpeed === speed} onClick={() => changeSpeed(speed)}>{speedLabels[speed]}<small>{Math.round(speed * 100)} %</small></button>)}</div>
            <p>{speedLabels[playbackSpeed]} · {practiceBpm} BPM. Puedes bajar el ritmo en cualquier módulo. Cambiarlo pausa sin perder tu sitio.</p>
          </fieldset>

          <div className="mode-heading"><span className="field-label">NIVEL DE AYUDA</span><span>De la vista al oído →</span></div>
          <div className="mode-selector" role="group" aria-label="Modo de entrenamiento">
            {practiceModes.map((item, index) => (
              <button key={item} type="button" className={mode === item ? "mode-button active" : "mode-button"} disabled={!hydrated} onClick={() => navigatePractice({ trackId, moduleId, mode: item })} aria-pressed={mode === item} aria-label={modeLabels[item]}>
                <small>0{index + 1}</small>{item.toUpperCase()}<span className="mode-caption">{modeLabels[item].split(" · ")[1]}</span>
              </button>
            ))}
          </div>
          <p className="mode-description">{isPulseExercise ? mode === "train" ? "Sin marcas: acompaña el pulso regular con cada toque." : mode === "assist" ? "Sigue el destello del pulso; la onda ya no muestra las marcas." : "Cada marca es un pulso. Acompaña todos por igual; todavía no necesitas contar." : modeDescriptions[mode]}</p>
          </div>

          <WaveformDisplay
            track={track}
            mode={isPulseExercise && mode === "assist" ? "train" : visualMode}
            targetLabel={lesson.targetLabel}
            duration={player.duration}
            currentTime={player.currentTime}
            viewport={player.viewport}
            containerRef={player.containerRef}
            revealedTarget={isReviewing ? feedback?.result.target ?? null : null}
            tapTime={isReviewing ? feedback?.tapTime ?? null : null}
            outcomes={mode !== "train" || showSummary || isReviewing ? roundSummary.outcomes : []}
          />
          <div className="transport">
            <button type="button" className="play-button" onClick={togglePlayback} disabled={!player.isReady} aria-label={playbackLabel}>
              {isReviewing ? "↺" : player.isPlaying ? "Ⅱ" : "▶"}
              <span className="mobile-only">{isReviewing ? "Practicar" : player.isPlaying ? "Pausa" : hasEnded ? "Repetir" : player.currentTime > 0 ? "Seguir" : "Play"}</span>
            </button>
            <div className="transport-time"><strong>{formatTime(listeningSeconds(player.currentTime, playbackSpeed))}</strong><span>/ {formatTime(listeningSeconds(player.duration, playbackSpeed))}</span></div>
            <button type="button" className="restart-button" onClick={restartPractice} disabled={!player.isReady}>↺ Reiniciar<span className="desktop-only"> ejercicio</span></button>
          </div>
          {countIn && <p className="entry-guide"><strong>{countIn.count ?? "Prepárate"}</strong><span>{!player.isPlaying ? "Pulsa Play para avanzar: tramo plano → 4 · 3 · 2 · ¡1!" : countIn.phase === "landing" ? "¡Aquí empieza! Ahora sigue 2 · 3 · 4, sin repetir el 1." : "La cuenta sigue el tempo del ejercicio, no los segundos del reloj."}</span></p>}
          {!player.isReady && !player.error && <p className="save-notice" role="status">Preparando audio y waveform…</p>}
          {player.error && <p className="audio-error" role="alert">{player.error}</p>}
        </section>

        <aside id="practice-controls" className="practice-card" aria-label="Ejercicio de ritmo" tabIndex={-1}>
          <div className="section-topline"><span>02 / PRACTICA</span><span>{lesson.targetLabel}</span></div>
          <div className="practice-content">
            <div className="practice-transport">
              <button type="button" className="continue-button" onClick={togglePlayback} disabled={!player.isReady}>{playbackLabel}</button>
              <button type="button" className="restart-button" onClick={restartPractice} disabled={!player.isReady}>↺ Reiniciar ejercicio</button>
            </div>
            <span className="field-label">{isPulseExercise ? "ESCUCHA Y ACOMPAÑA" : "ESCUCHA Y CUENTA"}</span>
            {countIn && !isReviewing ? <div className="count-in" aria-label={countIn.count ? `Entrada ${countIn.count}` : "Prepárate"}><strong>{countIn.count ?? "Prepárate"}</strong><span>{countIn.phase === "landing" ? "¡Aquí cae el 1! Sigue 2 · 3 · 4" : countIn.phase === "settle" ? "Acomódate · el ritmo viene después" : "Al ritmo de la música · todavía no pulses"}</span></div> : mode === "teach" && !isPulseExercise ? (
              <div className="count-row" aria-label={activeCount ? `Golpe ${activeCount} de 4` : "Espera al primer golpe"}>
                {[1, 2, 3, 4].map((count) => <span key={count} className={activeCount === count ? "count active" : "count"}>{count}</span>)}
              </div>
            ) : (
              <div className="count-hidden"><span className={visualMode === "assist" && beatIndex >= 0 && player.currentTime - track.beats[beatIndex] < 0.13 * playbackSpeed ? "pulse-dot lit" : "pulse-dot"} />{isPulseExercise ? "Acompaña cada pulso" : mode === "assist" ? "Sigue el pulso" : "Cuenta por dentro"}</div>
            )}
            <p className="count-caption">{isPulseExercise ? "Pulsa el botón grande en cada beat, no en los números ni en la onda." : mode === "teach" && activeCount === 1 ? `Compás ${activeBar} · ${isReferencePending ? "1 de la referencia" : "aquí cae el 1"}` : mode === "teach" ? "Pulsa el botón grande al pasar del 4 al 1." : "Busca dónde vuelve a empezar el grupo."}</p>

            <div className="tap-area">
              <p className="mobile-only mobile-instruction" role="status">{mobileInstruction}</p>
              <p className="preparation-notice" role="status">{preparationNotice}</p>
              <p className="keyboard-hint"><kbd>Espacio</kbd> inicia o pausa · clic o <kbd>Enter</kbd> sobre el botón grande responde.</p>
              <button ref={tapButtonRef} type="button" className="tap-button" onPointerDown={event => { if (event.isPrimary && event.button === 0) tap(); }} onClick={event => { if (event.detail === 0) tap(); }} disabled={!canTap}>
                <span className="tap-symbol">↘</span><strong>{isPreparing && player.isPlaying && !isReviewing ? countIn?.count ? `${countIn.count}…` : "PREPÁRATE" : player.isPlaying && isListening && !isReviewing ? "SOLO ESCUCHA" : lesson.tapLabel}</strong><small>{isReviewing ? "REVISIÓN GUIADA · SIN PUNTUAR" : isPreparing && player.isPlaying ? "PREPARA TU MANO AQUÍ · LA BARRA YA AVANZA" : player.isPlaying && isListening ? "COGE EL RITMO · TODAVÍA NO PULSES" : player.isPlaying ? "SIGUE MARCANDO: LA MÚSICA NO SE PARA" : "INICIA O REANUDA CON ▶"}</small>
              </button>
            </div>

            <div className={`feedback-panel${feedback ? " has-feedback" : ""}`} aria-live="polite">
              {feedback ? (
                <>
                  <span className={`result-badge ${feedback.result.classification}`}>{feedbackLabel[feedback.result.classification]}{isReferencePending ? " · PROVISIONAL" : ""}</span>
                  <p className="feedback-explanation">{isReferencePending ? "Comparado con la marca del archivo, pendiente de revisión por oído. Es una orientación, no una nota." : feedback.result.message}</p>
                  {feedback.result.errorMs !== null && <small>{Math.abs(feedback.result.errorMs)} ms · {feedback.result.errorMs < 0 ? "temprano" : feedback.result.errorMs > 0 ? "tarde" : "exacto"} respecto {isPulseExercise ? "al pulso" : "al 1"}</small>}
                  <button type="button" className="replay-button" onClick={replay} disabled={!player.isReady || (isReviewing && player.isPlaying)}>{isReviewing && player.isPlaying ? "Reproduciendo fragmento…" : "↺  Escuchar otra vez"}</button>
                  {isReviewing && <small className="feedback-explanation">Observa la marca {isPulseExercise ? "del pulso" : "del 1"}. «Volver a practicar» repite el fragmento sin mostrar la respuesta.</small>}
                </>
              ) : (
                <><span className="field-label">{hasEnded ? "FIN DEL FRAGMENTO" : "ESCUCHA → MARCA → REPITE"}</span><p className="feedback-explanation">{hasEnded ? "Repite este ejercicio o continúa al siguiente módulo cuando te sientas cómodo." : !practiceEntry && player.isReady ? "Este fragmento es demasiado corto para preparar la escucha. Elige otra pista." : isListening ? listeningInstruction : lesson.instruction}</p></>
              )}
            </div>
            <button type="button" className="replay-button desktop-only" disabled={!round || isReviewing} onClick={finishRound}>Ver resumen de esta ronda</button>
            {showSummary && <RoundSummary summary={roundSummary} provisional={isReferencePending} onReview={replayOutcome} />}
            <div className="mobile-only mobile-summary-actions"><button type="button" className="continue-button" onClick={restartPractice} disabled={!player.isReady}>↺ Repetir ejercicio</button><button type="button" className="previous-button" onClick={() => setMobileScreen("practice")}>Volver a practicar</button></div>
            <nav className="journey-actions" aria-label="Navegar entre pasos de práctica">
              <button type="button" className="previous-button" disabled={!hydrated || !previousStep} onClick={() => { if (previousStep) { navigatePractice(previousStep, true); setMobileScreen("practice"); } }}>← Anterior</button>
              {nextStep ? <button type="button" className="next-button" disabled={!hydrated} onClick={() => { navigatePractice(nextStep, true); setMobileScreen("practice"); }}>{nextStep.trackId !== trackId ? "Siguiente pista · Teach / Despacio →" : nextStep.moduleId !== moduleId ? `${getLearningModule(nextStep.moduleId).title} · Despacio →` : `Continuar: ${nextStep.mode.toUpperCase()} · ${speedLabels[nextStep.playbackSpeed]} →`}</button> : <a className="next-button" href="#track-select" onClick={() => setMobileScreen("settings")}>Volver a elegir pista ↑</a>}
            </nav>
            <p className="journey-hint">{lesson.readiness} Avanzar es voluntario, no una certificación.</p>
          </div>
          <div className="practice-footer">{isReferencePending ? <p className="provisional-summary">PRÁCTICA SIN NOTA<br />Las referencias están por validar. No significa que tengas cero aciertos.</p> : <><span>ESTE MÓDULO · {Math.round(playbackSpeed * 100)} %</span><strong>{accurateCount} / {trackAttempts.length}</strong><span>CLAVADOS O CERCA</span></>}</div>
        </aside>
      </div>
      <nav className="mobile-only mobile-actions" aria-label="Acciones del ejercicio">
        {mobileScreen === "settings" ? <button type="button" className="next-button" onClick={() => setMobileScreen("practice")}>Listo · volver a practicar</button> : mobileScreen === "practice" ? <><button type="button" onClick={openMobileSettings}>Cambiar ejercicio</button><button type="button" disabled={!round} onClick={finishRound}>{isReviewing ? "Volver a mi ronda" : "Ver mi ronda"}</button></> : null}
      </nav>
      <footer className="page-footer"><span>BLUECLUE · APRENDE ESCUCHANDO</span><span>TEACH → ASSIST → TRAIN</span></footer>
    </main>
  );
}
