"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WaveformDisplay } from "./WaveformDisplay";
import { type AttemptClassification, type AttemptResult } from "@/lib/scoring";
import { difficultyLabels, type TrainingMode, type TrainingTrack } from "@/lib/tracks";
import { useWaveformPlayer } from "@/lib/useWaveformPlayer";
import { getPracticeNeighbor, getResumePosition, modeLabels, practiceModes, readPracticeSession, type PracticeLocation, type PracticeSession } from "@/lib/practice";
import { getBeatPosition } from "@/lib/beatGrid";
import { PREPARATION_SECONDS, preparePlayback } from "@/lib/playbackPreparation";
import { getPracticeEntry, scorePracticeAttempt } from "@/lib/practiceEntry";

type Progress = PracticeSession["progress"];
type Feedback = { result: AttemptResult; tapTime: number };

const modeDescriptions: Record<TrainingMode, string> = {
  teach: "Mira cómo el 1 abre cada grupo de cuatro. Cuenta en voz alta: el golpe más fuerte no siempre es el 1.",
  assist: "Sigue los pulsos, pero encuentra el 1 sin que te lo señalemos.",
  train: "Escucha sin marcas. Cuenta por dentro y pulsa cuando llegue el 1."
};

function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

type Props = { tracks: TrainingTrack[]; catalogKind: "local" | "demo"; catalogNotice: string | null };

export function BeatTrainer({ tracks, catalogKind, catalogNotice }: Props) {
  const trackIds = useMemo(() => tracks.map((track) => track.id), [tracks]);
  const storageKey = catalogKind === "local" ? "blueclue-v0.1-local-pilot" : "blueclue-v0.1";
  const [trackId, setTrackId] = useState(tracks[0].id);
  const [mode, setMode] = useState<TrainingMode>("teach");
  const [progress, setProgress] = useState<Progress>({ attempts: [] });
  const [hydrated, setHydrated] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [preparationSeconds, setPreparationSeconds] = useState<number | null>(null);
  const cancelPreparationRef = useRef<(() => void) | null>(null);
  const tapButtonRef = useRef<HTMLButtonElement>(null);
  const focusTapRef = useRef(false);
  const replayEndRef = useRef<number | null>(null);
  const resumePositionRef = useRef<number | null>(null);
  const journeyHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusJourneyRef = useRef(false);
  const track = tracks.find((item) => item.id === trackId) ?? tracks[0];
  const isReferencePending = track.referenceStatus === "pending-listening";
  const player = useWaveformPlayer(track, hydrated);
  const practiceEntry = getPracticeEntry(track.downbeats, player.duration);
  const isListening = practiceEntry !== null && player.currentTime < practiceEntry.opensAt;
  const canTap = player.isPlaying && player.isReady && !isReviewing && preparationSeconds === null && practiceEntry !== null && !isListening;

  useEffect(() => () => cancelPreparationRef.current?.(), []);

  useEffect(() => {
    function handleSpace(event: KeyboardEvent) {
      if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
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
        setProgress(parsed.progress);
        resumePositionRef.current = parsed.position;
        setResumed(true);
      }
    } catch {
      setStorageUnavailable(true);
    }
    setHydrated(true);
  }, [trackIds, storageKey]);

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
        localStorage.setItem(storageKey, JSON.stringify({ trackId, mode, progress, position: player.getTime() }));
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
  }, [hydrated, trackId, mode, progress, positionBucket, player.isReady, player.isPlaying, player.getTime, storageKey]);

  useEffect(() => {
    if (!focusJourneyRef.current) return;
    journeyHeadingRef.current?.focus();
    focusJourneyRef.current = false;
  }, [trackId, mode]);

  useEffect(() => {
    if (replayEndRef.current !== null && player.currentTime >= replayEndRef.current) {
      player.pause();
      replayEndRef.current = null;
    }
  }, [player.currentTime, player.pause]);

  const { beatIndex, count: activeCount, bar: activeBar } = getBeatPosition(player.currentTime, track.beats, track.downbeats);
  const trackAttempts = progress.attempts.filter((attempt) => attempt.trackId === track.id);
  const accurateCount = trackAttempts.filter((attempt) => attempt.classification === "clavado" || attempt.classification === "cerca").length;
  const trackIndex = trackIds.indexOf(trackId);
  const previousStep = getPracticeNeighbor(trackIds, { trackId, mode }, -1);
  const nextStep = getPracticeNeighbor(trackIds, { trackId, mode }, 1);
  const hasEnded = player.isReady && player.currentTime >= player.duration - 0.05;
  const playbackLabel = preparationSeconds !== null ? "Cancelar preparación" : isReviewing ? "Volver a practicar" : player.isPlaying ? "Pausar práctica" : hasEnded ? "Repetir esta pista" : "Continuar práctica";

  function cancelPreparation() {
    cancelPreparationRef.current?.();
    cancelPreparationRef.current = null;
    setPreparationSeconds(null);
    focusTapRef.current = false;
  }

  function startPracticePlayback() {
    cancelPreparation();
    if (!player.isReady) return;
    player.pause();
    cancelPreparationRef.current = preparePlayback(setPreparationSeconds, () => {
      cancelPreparationRef.current = null;
      focusTapRef.current = true;
      void player.play();
    });
  }

  function selectTrack(nextTrackId: string) {
    if (nextTrackId !== trackId) navigatePractice({ trackId: nextTrackId, mode: "teach" });
  }

  function navigatePractice(location: PracticeLocation) {
    if (location.trackId === trackId && location.mode === mode) return;
    cancelPreparation();
    player.pause();
    replayEndRef.current = null;
    resumePositionRef.current = null;
    setIsReviewing(false);
    setFeedback(null);
    setResumed(false);
    focusJourneyRef.current = true;
    setTrackId(location.trackId);
    setMode(location.mode);
  }

  function togglePlayback() {
    if (preparationSeconds !== null) {
      cancelPreparation();
      return;
    }
    replayEndRef.current = null;
    if (isReviewing && feedback?.result.replayStart !== null && feedback?.result.replayStart !== undefined) {
      player.seek(feedback.result.replayStart);
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
    const result = scorePracticeAttempt(tapTime, track.downbeats, player.duration, practiceEntry);
    if (!result) return;
    setFeedback({ result, tapTime });
    replayEndRef.current = null;
    if (isReferencePending) return;
    setProgress((current) => ({
      attempts: [...current.attempts, { trackId: track.id, classification: result.classification, errorMs: result.errorMs }].slice(-100)
    }));
  }

  function replay() {
    if (!feedback || feedback.result.replayStart === null || feedback.result.target === null) return;
    cancelPreparation();
    player.seek(feedback.result.replayStart);
    replayEndRef.current = Math.min(player.duration, feedback.result.target + 1.2);
    setIsReviewing(true);
    void player.play();
  }

  function restartPractice() {
    replayEndRef.current = null;
    setIsReviewing(false);
    setFeedback(null);
    setResumed(false);
    player.seek(0);
    startPracticePlayback();
  }

  const feedbackLabel: Record<AttemptClassification, string> = {
    clavado: "CLAVADO",
    cerca: "CERCA",
    temprano: "TEMPRANO",
    tarde: "TARDE",
    "otra-vez": "OTRA VEZ"
  };

  return (
    <main className="app-shell">
      <a className="skip-link" href="#practice-controls">Ir a los controles de práctica</a>
      <header className="site-header">
        <div className="brand"><span className="brand-mark">B<span>.</span></span><span>BlueClue</span></div>
        <div className="header-tag">ENTRENA TU OÍDO <span>·</span> V0.1</div>
      </header>

      <section className="intro">
        <div className="eyebrow"><span className="eyebrow-line" /> BEAT TRAINER / TU RECORRIDO</div>
        <h1>Encuentra <em>el 1.</em></h1>
        <p>Escucha el pulso. Cuenta cuatro golpes. Marca el inicio del compás.</p>
      </section>

      <p className="catalog-notice">{catalogKind === "local" ? "TU MÚSICA · 5 FRAGMENTOS DEL PACK DE CURSO · COPIAS LOCALES" : "DEMOSTRACIÓN · 5 PATRONES SINTÉTICOS"}</p>
      {catalogNotice && <p className="audio-error" role="status">{catalogNotice}</p>}

      <section className="journey-card" aria-labelledby="journey-heading">
        <div className="journey-overview">
          <span className="field-label">PISTA {trackIndex + 1} DE {tracks.length} · PASO {practiceModes.indexOf(mode) + 1} DE 3</span>
          <h2 id="journey-heading" ref={journeyHeadingRef} tabIndex={-1}>{modeLabels[mode]}</h2>
          <p>{resumed ? "Retomamos tu pista, tus ayudas y el punto donde lo dejaste. Pulsa Continuar práctica." : "Practica a tu ritmo. Puedes volver atrás o cambiar de pista cuando quieras."}</p>
          <nav className="section-links" aria-label="Secciones del ejercicio"><a href="#listening">Escuchar y ver la guía</a><a href="#practice-controls">Ir a practicar ↓</a></nav>
        </div>
        <div className="journey-track">
          <label className="field-label" htmlFor="track-select">ELEGIR PISTA</label>
          <select id="track-select" className="track-select" value={trackId} disabled={!hydrated} onChange={(event) => selectTrack(event.target.value)}>
            {tracks.map((item, index) => <option key={item.id} value={item.id}>{String(index + 1).padStart(2, "0")} · {item.title} — {difficultyLabels[item.difficulty]}</option>)}
          </select>
          <p className="save-notice" role="status">{storageUnavailable ? "No podemos guardar en este navegador. Puedes practicar, pero la sesión no se conservará al cerrar." : "Tu punto de práctica se guarda en este navegador."}</p>
        </div>
      </section>

      <div className="trainer-grid">
        <section id="listening" className="player-card" aria-label="Entrenador de beat" tabIndex={-1}>
          <div className="section-topline"><span>01 / ESCUCHA</span><span>ENTRENAMIENTO ACTIVO</span></div>
          <div className="track-heading">
            <div><span className="field-label">PISTA DE ENTRENAMIENTO</span><h2>{track.title}</h2>{track.sourceTitle && <p className="source-title">{track.sourceTitle}</p>}<p>{track.description}</p></div>
            <div className="bpm"><strong>{track.bpm}</strong><span>BPM · 4/4</span></div>
          </div>

          {isReferencePending && <p className="reference-notice">Marcas de Serato del archivo original. Falta validar el 1 por oído: el feedback es provisional y no suma aciertos.</p>}

          <div className="mode-heading"><span className="field-label">NIVEL DE AYUDA</span><span>De la vista al oído →</span></div>
          <div className="mode-selector" role="group" aria-label="Modo de entrenamiento">
            {practiceModes.map((item, index) => (
              <button key={item} type="button" className={mode === item ? "mode-button active" : "mode-button"} disabled={!hydrated} onClick={() => navigatePractice({ trackId, mode: item })} aria-pressed={mode === item} aria-label={modeLabels[item]}>
                <small>0{index + 1}</small>{item.toUpperCase()}<span className="mode-caption">{modeLabels[item].split(" · ")[1]}</span>
              </button>
            ))}
          </div>
          <p className="mode-description">{modeDescriptions[mode]}</p>

          <WaveformDisplay
            track={track}
            mode={mode}
            duration={player.duration}
            containerRef={player.containerRef}
            revealedTarget={isReviewing ? feedback?.result.target ?? null : null}
            tapTime={isReviewing ? feedback?.tapTime ?? null : null}
          />
          <div className="transport">
            <button type="button" className="play-button" onClick={togglePlayback} disabled={!player.isReady} aria-label={playbackLabel}>
              {isReviewing ? "↺" : player.isPlaying ? "Ⅱ" : "▶"}
            </button>
            <div className="transport-time"><strong>{formatTime(player.currentTime)}</strong><span>/ {formatTime(player.duration)}</span></div>
            <span className="transport-hint">Pulsa la onda para moverte</span>
          </div>
          {!player.isReady && !player.error && <p className="save-notice" role="status">Preparando audio y waveform…</p>}
          {player.error && <p className="audio-error" role="alert">{player.error}</p>}
        </section>

        <aside id="practice-controls" className="practice-card" aria-label="Ejercicio de marcar el 1" tabIndex={-1}>
          <div className="section-topline"><span>02 / PRACTICA</span><span>EL DOWNBEAT</span></div>
          <div className="practice-content">
            <div className="practice-transport">
              <button type="button" className="continue-button" onClick={togglePlayback} disabled={!player.isReady}>{playbackLabel}</button>
              <button type="button" className="text-button" onClick={restartPractice} disabled={!player.isReady}>Desde el principio</button>
            </div>
            <span className="field-label">ESCUCHA Y CUENTA</span>
            {mode === "teach" ? (
              <div className="count-row" aria-label={activeCount ? `Golpe ${activeCount} de 4` : "Espera al primer golpe"}>
                {[1, 2, 3, 4].map((count) => <span key={count} className={activeCount === count ? "count active" : "count"}>{count}</span>)}
              </div>
            ) : (
              <div className="count-hidden"><span className={mode === "assist" && beatIndex >= 0 && player.currentTime - track.beats[beatIndex] < 0.13 ? "pulse-dot lit" : "pulse-dot"} />{mode === "assist" ? "Sigue el pulso" : "Cuenta por dentro"}</div>
            )}
            <p className="count-caption">{mode === "teach" && activeCount === 1 ? `Compás ${activeBar} · ${isReferencePending ? "1 de la referencia" : "aquí cae el 1"}` : mode === "teach" ? "El siguiente 1 llega después del 4." : "Busca dónde vuelve a empezar el grupo."}</p>

            <div className="tap-area">
              <p className="preparation-notice" role="status">{preparationSeconds !== null ? `Prepara el dedo: empezamos en ${preparationSeconds}… Después, escucha dos compases sin pulsar.` : isReviewing ? "Escucha la referencia sin marcar. Vuelve a practicar cuando quieras." : player.isPlaying && isListening ? "Primero escucha dos veces 1-2-3-4. Estos primeros compases no se puntúan." : player.isPlaying ? "Marca los siguientes 1 cuando los reconozcas. No tienes que acertar el primero." : `Tienes ${PREPARATION_SECONDS} segundos para prepararte; después, dos compases solo para escuchar.`}</p>
              <p className="keyboard-hint"><kbd>Espacio</kbd> inicia o pausa · clic o <kbd>Enter</kbd> sobre TAP marca el 1.</p>
              <button ref={tapButtonRef} type="button" className="tap-button" onClick={tap} disabled={!canTap}>
                <span className="tap-symbol">↘</span><strong>{preparationSeconds !== null ? `LISTO EN ${preparationSeconds}…` : player.isPlaying && isListening && !isReviewing ? "SOLO ESCUCHA" : "MARCAR EL 1"}</strong><small>{preparationSeconds !== null ? "COLOCA EL RATÓN AQUÍ · EL AUDIO SIGUE PARADO" : isReviewing ? "REVISIÓN GUIADA · SIN PUNTUAR" : player.isPlaying && isListening ? "COGE EL RITMO · TODAVÍA NO PULSES" : player.isPlaying ? "SIGUE MARCANDO: LA MÚSICA NO SE PARA" : "PULSA CONTINUAR PRÁCTICA PARA EMPEZAR"}</small>
              </button>
            </div>

            <div className="feedback-panel" aria-live="polite">
              {feedback ? (
                <>
                  <span className={`result-badge ${feedback.result.classification}`}>{feedbackLabel[feedback.result.classification]}{isReferencePending ? " · PROVISIONAL" : ""}</span>
                  <p>{isReferencePending ? "Comparado con la marca del archivo. La posición musical del 1 todavía necesita revisión auditiva." : feedback.result.message}</p>
                  {feedback.result.errorMs !== null && <small>{feedback.result.errorMs < 0 ? "−" : "+"}{Math.abs(feedback.result.errorMs)} ms respecto al 1</small>}
                  <button type="button" className="replay-button" onClick={replay} disabled={!player.isReady || (isReviewing && player.isPlaying)}>{isReviewing && player.isPlaying ? "Reproduciendo fragmento…" : "↺  Escuchar otra vez"}</button>
                  {isReviewing && <small>Observa dónde cae el 1. «Volver a practicar» repite el fragmento sin mostrar la respuesta.</small>}
                </>
              ) : (
                <><span className="field-label">{hasEnded ? "FIN DEL FRAGMENTO" : "ESCUCHA → MARCA → REPITE"}</span><p>{hasEnded ? "Repite esta pista o continúa al siguiente paso. Tú decides cuándo retirar ayudas." : !practiceEntry && player.isReady ? "Este fragmento es demasiado corto para preparar la escucha. Elige otra pista." : isListening ? "Deja pasar los primeros dos compases. Escucha y cuenta; después marca los 1 que reconozcas, sin prisa." : "Marca el 1 de varios compases seguidos. El feedback cambia con cada intento, sin cortar la música."}</p></>
              )}
            </div>
            <nav className="journey-actions" aria-label="Navegar entre pasos de práctica">
              <button type="button" className="previous-button" disabled={!hydrated || !previousStep} onClick={() => previousStep && navigatePractice(previousStep)}>← Anterior</button>
              {nextStep ? <button type="button" className="next-button" disabled={!hydrated} onClick={() => navigatePractice(nextStep)}>{nextStep.trackId === trackId ? `Continuar con ${nextStep.mode === "assist" ? "Assist" : "Train"} →` : "Siguiente pista →"}</button> : <a className="next-button" href="#track-select">Volver a elegir pista ↑</a>}
            </nav>
            <p className="journey-hint">{nextStep ? "Avanza cuando puedas reconocer el 1 con estas ayudas." : "Último paso del piloto. Practica otra pista para comprobar lo aprendido; llegar aquí no certifica dominio."}</p>
          </div>
          <div className="practice-footer"><span>{isReferencePending ? "REFERENCIA POR REVISAR" : "ESTA PISTA"}</span><strong>{isReferencePending ? "—" : `${accurateCount} / ${trackAttempts.length}`}</strong><span>{isReferencePending ? "SIN SUMAR ACIERTOS" : "CLAVADOS O CERCA"}</span></div>
        </aside>
      </div>
      <footer className="page-footer"><span>BLUECLUE · APRENDE ESCUCHANDO</span><span>TEACH → ASSIST → TRAIN</span></footer>
    </main>
  );
}
