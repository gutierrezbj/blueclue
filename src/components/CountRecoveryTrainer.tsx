"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WaveformDisplay } from "./WaveformDisplay";
import { getBeatPosition } from "@/lib/beatGrid";
import { getCountIn } from "@/lib/countIn";
import { evaluateRecoveryTap, getRecoveryPhase, getRecoveryPlan, getRecoveryReplayStart, summarizeRecoveryRound } from "@/lib/countRecovery";
import type { ExerciseRound, RoundTap } from "@/lib/exerciseRound";
import { markStepDone } from "@/lib/pathProgress";
import { isPlaybackSpeed, playbackSpeeds, speedLabels, type PlaybackSpeed } from "@/lib/playbackSpeed";
import { handleTapKeyDown } from "@/lib/tapInput";
import type { TrainingTrack } from "@/lib/tracks";
import { useWaveformPlayer } from "@/lib/useWaveformPlayer";

const emptyRound = (): ExerciseRound => ({ start: 0, end: 0, taps: [] });

export function CountRecoveryTrainer({ tracks, catalogKind }: { tracks: TrainingTrack[]; catalogKind: "local" | "demo" }) {
  const storageKey = `blueclue-recovery-${catalogKind}-v1`;
  const [trackId, setTrackId] = useState(tracks[0].id);
  const [speed, setSpeed] = useState<PlaybackSpeed>(0.65);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [lastRound, setLastRound] = useState<string | null>(null);
  const [round, setRound] = useState<ExerciseRound>(emptyRound);
  const roundRef = useRef(round);
  const [feedback, setFeedback] = useState<RoundTap | null>(null);
  const [repeated, setRepeated] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const tapRef = useRef<HTMLButtonElement>(null);
  const focusTap = useRef(false);
  const track = tracks.find(item => item.id === trackId) ?? tracks[0];
  const provisional = track.referenceStatus === "pending-listening";
  const player = useWaveformPlayer(track, ready, speed, "count", false);
  const plan = useMemo(() => getRecoveryPlan(track.downbeats, player.duration, speed), [track.downbeats, player.duration, speed]);
  const phase = getRecoveryPhase(player.currentTime, plan, speed);
  const countIn = getCountIn(player.currentTime, track.downbeats[0], track.bpm);
  const position = getBeatPosition(player.currentTime, track.beats, track.downbeats);
  const hidden = (phase === "listen" || phase === "mark") && reviewTarget === null;
  const canTap = player.isReady && player.isPlaying && hidden && !finished;
  const summary = plan ? summarizeRecoveryRound(round, plan) : null;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved === "object") {
        if (tracks.some(item => item.id === saved.trackId)) setTrackId(saved.trackId);
        if (isPlaybackSpeed(saved.speed)) setSpeed(saved.speed);
        if (typeof saved.lastRound === "string" && /^Última ronda: [0-5] de 5 marcas clavadas o cerca\.$/.test(saved.lastRound)) setLastRound(saved.lastRound);
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, [storageKey, tracks]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ trackId, speed, lastRound })); }
    catch { setStorageError(true); }
  }, [storageKey, ready, trackId, speed, lastRound]);

  useEffect(() => {
    if (canTap && focusTap.current) {
      tapRef.current?.focus({ preventScroll: true });
      focusTap.current = false;
    }
  }, [canTap]);

  useEffect(() => {
    if (!plan || !player.isPlaying) return;
    if (reviewTarget !== null) {
      if (player.currentTime >= reviewTarget + 60 / track.bpm) player.pause();
      return;
    }
    if (finished || player.currentTime < plan.end) return;
    player.pause();
    const completed = { ...roundRef.current, end: plan.end };
    roundRef.current = completed;
    setRound(completed);
    setFinished(true);
    markStepDone("recover");
    if (!provisional) {
      const result = summarizeRecoveryRound(completed, plan);
      setLastRound(`Última ronda: ${result.perfect + result.close} de ${result.total} marcas clavadas o cerca.`);
    }
  }, [plan, player.currentTime, player.isPlaying, player.pause, reviewTarget, finished, provisional, track.bpm]);

  useEffect(() => {
    function handleSpace(event: KeyboardEvent) {
      if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || (target.closest("button, a, select, input, textarea, summary") && target !== tapRef.current))) return;
      event.preventDefault();
      if (!event.repeat) toggle();
    }
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  });

  function reset() {
    player.pause();
    player.seek(0);
    const next = emptyRound();
    roundRef.current = next;
    setRound(next);
    setFeedback(null);
    setRepeated(false);
    setReviewTarget(null);
    setFinished(false);
  }

  function restart() {
    if (!player.isReady || !plan) return;
    reset();
    focusTap.current = true;
    void player.play();
  }

  function toggle() {
    if (!player.isReady || !plan) return;
    if (player.isPlaying) player.pause();
    else if (finished || reviewTarget !== null) restart();
    else { focusTap.current = true; void player.play(); }
  }

  function tap() {
    if (!canTap) return;
    const evaluation = evaluateRecoveryTap(roundRef.current, player.getTime(), plan, player.duration, speed);
    if (!evaluation) return;
    roundRef.current = evaluation.round;
    setRound(evaluation.round);
    setFeedback(evaluation.feedback);
    setRepeated(evaluation.repeated);
  }

  function review(target: number) {
    if (!plan) return;
    player.pause();
    player.seek(getRecoveryReplayStart(plan, target));
    setReviewTarget(target);
    focusTap.current = false;
    void player.play();
  }

  return <main className="phrase-shell recovery-shell" data-level="count">
    <header className="phrase-header"><a className="menu-back" href="#aprende-nivel-2">Nivel 2</a><span>Lección 4 de 4</span></header>
    <h1>Recupera la cuenta</h1>
    <p className="phrase-context">{track.title} · {speedLabels[speed]}</p>
    <details className="recovery-settings">
      <summary onClick={() => player.pause()}>Cambiar pista o velocidad</summary>
      <p>Dos compases con guía; dos sin ella. Sigue contando por dentro y marca el siguiente 1. Si te pierdes, busca de nuevo el bombo que inicia el grupo.</p>
      <label htmlFor="recovery-track">Pista</label>
      <select id="recovery-track" className="track-select" value={trackId} disabled={!ready} onChange={event => { reset(); setLastRound(null); setTrackId(event.target.value); }}>{tracks.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <fieldset className="speed-control"><legend>Velocidad para aprender</legend><div>{playbackSpeeds.map(item => <button type="button" key={item} aria-pressed={speed === item} onClick={() => { if (item !== speed) { reset(); setLastRound(null); setSpeed(item); } }}>{speedLabels[item]}</button>)}</div></fieldset>
      {lastRound && !provisional && <p>{lastRound}</p>}
    </details>
    <section className="phrase-workspace" aria-label="Práctica: recupera la cuenta">
      <div className={hidden ? "challenge-wave-hidden" : undefined}>
        <WaveformDisplay track={track} mode="teach" targetLabel="EL 1" duration={player.duration} currentTime={player.currentTime} viewport={player.viewport} containerRef={player.containerRef} revealedTarget={reviewTarget} tapTime={null} outcomes={finished && reviewTarget === null ? summary?.outcomes ?? [] : []} />
        {hidden && <p className="challenge-listening">Sin guía · sigue contando por dentro</p>}
      </div>
      <div className="phrase-transport"><button type="button" className="continue-button" disabled={!player.isReady || !plan} onClick={toggle}>{player.isPlaying ? "Pausar" : finished || reviewTarget !== null ? "Nueva ronda" : player.currentTime === 0 ? "Empezar" : "Continuar"}</button><button type="button" className="restart-button" disabled={!player.isReady || !plan} onClick={restart}>Reiniciar</button></div>
      {player.error && <p className="audio-error" role="alert">{player.error}</p>}
      {player.isReady && !plan && <p role="alert">Esta pista no tiene suficientes compases para esta práctica. Elige otra.</p>}
      {provisional && <p className="phrase-notice">Referencia pendiente de escucha · resultado orientativo</p>}
      {!finished || reviewTarget !== null ? <>
        <div className="phrase-guide" aria-label={hidden ? "Cuenta por oído sin guía" : position.count ? `Golpe ${position.count} de 4` : "Preparación"}>
          {phase === "prepare" ? <strong>{countIn?.count && countIn.phase !== "landing" ? `${countIn.count}…` : "Acomódate…"}</strong> : hidden ? <strong>Sigue tú · ¿dónde vuelve el 1?</strong> : <><small>Escucha y cuenta con la guía</small><div className="phrase-beats" aria-hidden="true">{[1, 2, 3, 4].map(beat => <span key={beat} className={position.count === beat ? "active" : ""}>{beat}</span>)}</div></>}
        </div>
        <p className="phrase-instruction">{reviewTarget !== null ? "Revisión guiada, sin puntuar." : !player.isPlaying ? "Pulsa Empezar. La música espera mientras te preparas." : phase === "prepare" ? "Espera la entrada y escucha el ritmo." : hidden ? "Marca el 1 cuando lo oigas; no pulses cada golpe." : "Dos compases con guía; después sigues tú."}</p>
        <button ref={tapRef} type="button" className="tap-button" disabled={!canTap} onPointerDown={event => { if (event.isPrimary && event.button === 0) tap(); }} onKeyDown={event => handleTapKeyDown(event, tap)} onClick={event => { if (event.detail === 0) tap(); }}><strong>MARCAR EL 1</strong><small>{canTap ? "CUANDO VUELVA EL COMPÁS" : "PRIMERO ESCUCHA"}</small></button>
        <div className="phrase-feedback" role="status">{reviewTarget !== null ? "Escucha dónde vuelve el 1. Nueva ronda te devuelve a la entrada." : feedback ? <><strong>{repeated ? "REPETIDA · " : ""}{feedback.result.classification.toUpperCase()}</strong><span>{feedback.result.message}</span></> : "No necesitas acertar a la primera. Escucha, cuenta y vuelve a intentarlo."}</div>
      </> : summary && <section className="phrase-summary" aria-labelledby="recovery-result">
        <h2 id="recovery-result">Tu ronda</h2>
        <p>{provisional ? "Resultado orientativo: " : ""}{summary.perfect} clavadas · {summary.close} cerca · {summary.early} temprano · {summary.late} tarde · {summary.missed} sin marcar.</p>
        {summary.extra > 0 && <p>{summary.extra} toques adicionales. Cada 1 cuenta una sola vez.</p>}
        {summary.outcomes.map((outcome, index) => <button type="button" key={outcome.target} className="previous-button" onClick={() => review(outcome.target)}>Escuchar 1 nº {index + 1} · {outcome.result?.classification ?? "sin marcar"}</button>)}
        <button type="button" className="next-button" onClick={restart}>Repetir esta ronda</button>
        <a className="phrase-entry" href="#aprende-nivel-2">Volver al nivel 2</a>
      </section>}
      {reviewTarget !== null && <button type="button" className="previous-button" onClick={() => { player.pause(); setReviewTarget(null); }}>Volver al resumen</button>}
      <p className="keyboard-hint">Espacio inicia o pausa · Enter sobre MARCAR EL 1.</p>
    </section>
    {storageError && <p role="status">No se pueden guardar los ajustes en este navegador.</p>}
  </main>;
}
