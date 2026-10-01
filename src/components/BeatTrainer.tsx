"use client";

import { useEffect, useRef, useState } from "react";
import { WaveformDisplay } from "./WaveformDisplay";
import { scoreAttempt, type AttemptClassification, type AttemptResult } from "@/lib/scoring";
import { difficultyLabels, tracks, type TrainingMode } from "@/lib/tracks";
import { useWaveformPlayer } from "@/lib/useWaveformPlayer";

type SavedAttempt = { trackId: string; classification: AttemptClassification; errorMs: number | null };
type Progress = { attempts: SavedAttempt[] };
type Feedback = { result: AttemptResult; tapTime: number };

const storageKey = "blueclue-v0.1";
const modeDescriptions: Record<TrainingMode, string> = {
  teach: "Mira cómo el 1 abre cada grupo de cuatro. Escucha el acento y cuenta en voz alta.",
  assist: "Sigue los pulsos, pero encuentra el 1 sin que te lo señalemos.",
  train: "Escucha sin marcas. Cuenta por dentro y pulsa cuando llegue el 1."
};

function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function BeatTrainer() {
  const [trackId, setTrackId] = useState(tracks[0].id);
  const [mode, setMode] = useState<TrainingMode>("teach");
  const [progress, setProgress] = useState<Progress>({ attempts: [] });
  const [hydrated, setHydrated] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayEndRef = useRef<number | null>(null);
  const track = tracks.find((item) => item.id === trackId) ?? tracks[0];
  const player = useWaveformPlayer(track);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { trackId?: string; mode?: TrainingMode; progress?: Progress };
        if (tracks.some((item) => item.id === parsed.trackId)) setTrackId(parsed.trackId!);
        if (parsed.mode === "teach" || parsed.mode === "assist" || parsed.mode === "train") setMode(parsed.mode);
        if (Array.isArray(parsed.progress?.attempts)) setProgress(parsed.progress!);
      }
    } catch {
      setProgress({ attempts: [] });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ trackId, mode, progress })); } catch { return; }
  }, [hydrated, trackId, mode, progress]);

  useEffect(() => {
    setFeedback(null);
    setIsReplaying(false);
    replayEndRef.current = null;
  }, [trackId]);

  useEffect(() => {
    if (replayEndRef.current !== null && player.currentTime >= replayEndRef.current) {
      player.pause();
      replayEndRef.current = null;
      setIsReplaying(false);
    }
  }, [player.currentTime, player.pause]);

  const beatIndex = track.beats.findLastIndex((beat) => beat <= player.currentTime);
  const activeCount = beatIndex < 0 ? null : beatIndex % 4 + 1;
  const trackAttempts = progress.attempts.filter((attempt) => attempt.trackId === track.id);
  const accurateCount = trackAttempts.filter((attempt) => attempt.classification === "clavado" || attempt.classification === "cerca").length;

  function selectTrack(nextTrackId: string) {
    if (nextTrackId !== trackId) setTrackId(nextTrackId);
  }

  function togglePlayback() {
    replayEndRef.current = null;
    setIsReplaying(false);
    setFeedback(null);
    if (player.isPlaying) player.pause();
    else void player.play();
  }

  function tap() {
    if (!player.isReady || !player.isPlaying) return;
    const tapTime = player.getTime();
    player.pause();
    const result = scoreAttempt(tapTime, track.downbeats, player.duration);
    setFeedback({ result, tapTime });
    replayEndRef.current = null;
    setIsReplaying(false);
    setProgress((current) => ({
      attempts: [...current.attempts, { trackId: track.id, classification: result.classification, errorMs: result.errorMs }].slice(-100)
    }));
  }

  function replay() {
    if (!feedback || feedback.result.replayStart === null || feedback.result.target === null) return;
    player.seek(feedback.result.replayStart);
    replayEndRef.current = Math.min(player.duration, feedback.result.target + 1.2);
    setIsReplaying(true);
    void player.play();
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
      <header className="site-header">
        <div className="brand"><span className="brand-mark">B<span>.</span></span><span>BlueClue</span></div>
        <div className="header-tag">ENTRENA TU OÍDO <span>·</span> V0.1</div>
      </header>

      <section className="intro">
        <div className="eyebrow"><span className="eyebrow-line" /> BEAT TRAINER / EJERCICIO 01</div>
        <h1>Encuentra <em>el 1.</em></h1>
        <p>Escucha el pulso. Cuenta cuatro golpes. Marca el inicio del compás.</p>
      </section>

      <div className="trainer-grid">
        <section className="player-card" aria-label="Entrenador de beat">
          <div className="section-topline"><span>01 / ESCUCHA</span><span>ENTRENAMIENTO ACTIVO</span></div>
          <div className="track-heading">
            <div><span className="field-label">PISTA DE ENTRENAMIENTO</span><h2>{track.title}</h2><p>{track.description}</p></div>
            <div className="bpm"><strong>{track.bpm}</strong><span>BPM · 4/4</span></div>
          </div>

          <label className="field-label" htmlFor="track-select">CAMBIAR PISTA</label>
          <select id="track-select" className="track-select" value={trackId} onChange={(event) => selectTrack(event.target.value)}>
            {tracks.map((item, index) => <option key={item.id} value={item.id}>{String(index + 1).padStart(2, "0")} · {item.title} — {difficultyLabels[item.difficulty]}</option>)}
          </select>

          <div className="mode-heading"><span className="field-label">NIVEL DE AYUDA</span><span>De la vista al oído →</span></div>
          <div className="mode-selector" role="group" aria-label="Modo de entrenamiento">
            {(["teach", "assist", "train"] as const).map((item, index) => (
              <button key={item} type="button" className={mode === item ? "mode-button active" : "mode-button"} onClick={() => { setMode(item); setFeedback(null); }} aria-pressed={mode === item}>
                <small>0{index + 1}</small>{item.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="mode-description">{modeDescriptions[mode]}</p>

          <WaveformDisplay
            track={track}
            mode={mode}
            duration={player.duration}
            containerRef={player.containerRef}
            revealedTarget={feedback?.result.target ?? null}
            tapTime={feedback?.tapTime ?? null}
          />
          <div className="transport">
            <button type="button" className="play-button" onClick={togglePlayback} disabled={!player.isReady} aria-label={player.isPlaying ? "Pausar" : "Reproducir"}>
              {player.isPlaying ? "Ⅱ" : "▶"}
            </button>
            <div className="transport-time"><strong>{formatTime(player.currentTime)}</strong><span>/ {formatTime(player.duration)}</span></div>
            <span className="transport-hint">Pulsa la onda para moverte</span>
          </div>
          {player.error && <p className="audio-error" role="alert">{player.error}</p>}
        </section>

        <aside className="practice-card" aria-label="Ejercicio de marcar el 1">
          <div className="section-topline"><span>02 / PRACTICA</span><span>EL DOWNBEAT</span></div>
          <div className="practice-content">
            <span className="field-label">ESCUCHA Y CUENTA</span>
            {mode === "teach" ? (
              <div className="count-row" aria-label={activeCount ? `Golpe ${activeCount} de 4` : "Espera al primer golpe"}>
                {[1, 2, 3, 4].map((count) => <span key={count} className={activeCount === count ? "count active" : "count"}>{count}</span>)}
              </div>
            ) : (
              <div className="count-hidden"><span className={mode === "assist" && beatIndex >= 0 && player.currentTime - track.beats[beatIndex] < 0.13 ? "pulse-dot lit" : "pulse-dot"} />{mode === "assist" ? "Sigue el pulso" : "Cuenta por dentro"}</div>
            )}
            <p className="count-caption">{mode === "teach" && activeCount === 1 ? `Compás ${Math.floor(beatIndex / 4) + 1} · aquí cae el 1` : mode === "teach" ? "El siguiente 1 llega después del 4." : "Busca dónde vuelve a empezar el grupo."}</p>

            <div className="tap-area">
              <button type="button" className="tap-button" onClick={tap} disabled={!player.isPlaying || !player.isReady}>
                <span className="tap-symbol">↘</span><strong>MARCAR EL 1</strong><small>{player.isPlaying ? "PULSA JUSTO CUANDO LO OIGAS" : "REPRODUCE LA PISTA PARA EMPEZAR"}</small>
              </button>
            </div>

            <div className="feedback-panel" aria-live="polite">
              {feedback ? (
                <>
                  <span className={`result-badge ${feedback.result.classification}`}>{feedbackLabel[feedback.result.classification]}</span>
                  <p>{feedback.result.message}</p>
                  {feedback.result.errorMs !== null && <small>{feedback.result.errorMs < 0 ? "−" : "+"}{Math.abs(feedback.result.errorMs)} ms respecto al 1</small>}
                  <button type="button" className="replay-button" onClick={replay} disabled={!player.isReady || isReplaying}>{isReplaying ? "Reproduciendo fragmento…" : "↺  Escuchar otra vez"}</button>
                </>
              ) : (
                <><span className="field-label">TU FEEDBACK APARECERÁ AQUÍ</span><p>Escucha, marca el 1 y descubre si te adelantaste o llegaste tarde.</p></>
              )}
            </div>
          </div>
          <div className="practice-footer"><span>ESTA PISTA</span><strong>{accurateCount} / {trackAttempts.length}</strong><span>CLAVADOS O CERCA</span></div>
        </aside>
      </div>
      <footer className="page-footer"><span>BLUECLUE · APRENDE ESCUCHANDO</span><span>TEACH → ASSIST → TRAIN</span></footer>
    </main>
  );
}
