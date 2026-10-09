"use client";

import { useEffect, useRef, useState } from "react";
import { WaveformDisplay } from "./WaveformDisplay";
import { evaluateBarCountingTap, getBarCountingGuide, getBarCountingPlan, getBarLesson, getVisibleBars, summarizeBarCounting, type BarCount } from "@/lib/barCounting";
import { getCountIn } from "@/lib/countIn";
import type { ExerciseRound, RoundTap } from "@/lib/exerciseRound";
import { handleTapKeyDown } from "@/lib/tapInput";
import { isPlaybackSpeed, playbackSpeeds, speedLabels, type PlaybackSpeed } from "@/lib/playbackSpeed";
import { modeLabels, practiceModes } from "@/lib/practice";
import type { TrainingMode, TrainingTrack } from "@/lib/tracks";
import { useWaveformPlayer } from "@/lib/useWaveformPlayer";

export function BarCountingTrainer({ tracks, catalogKind, bars }: { tracks: TrainingTrack[]; catalogKind: "local" | "demo"; bars: BarCount }) {
  const lesson = getBarLesson(bars);
  const storageKey = `${lesson.storagePrefix}-${catalogKind}`;
  const [trackId, setTrackId] = useState(tracks[0].id);
  const [mode, setMode] = useState<TrainingMode>("teach");
  const [speed, setSpeed] = useState<PlaybackSpeed>(0.65);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [lastRound, setLastRound] = useState<string | null>(null);
  const [round, setRound] = useState<ExerciseRound>({ start: 0, end: 0, taps: [] });
  const roundRef = useRef(round);
  const [feedback, setFeedback] = useState<RoundTap | null>(null);
  const [repeated, setRepeated] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const tapRef = useRef<HTMLButtonElement>(null);
  const focusTap = useRef(false);
  const track = tracks.find(item => item.id === trackId) ?? tracks[0];
  const provisional = track.referenceStatus === "pending-listening";
  const player = useWaveformPlayer(track, ready, speed, "downbeat", false);
  const plan = getBarCountingPlan(track, player.duration, speed, bars);
  const countIn = getCountIn(player.currentTime, track.downbeats[0], track.bpm);
  const guide = getBarCountingGuide(player.currentTime, track, reviewTarget !== null ? "teach" : mode, bars);
  const visibleBars = getVisibleBars(guide.bar);
  const preparing = !plan || player.currentTime < plan.start;
  const canTap = player.isReady && player.isPlaying && !preparing && !finished && reviewTarget === null && !!plan && player.currentTime <= plan.end;
  const summary = summarizeBarCounting(round, track, player.duration, speed, bars);
  const status = preparing ? countIn && countIn.phase !== "landing" ? countIn.count ? `${countIn.count}…` : "Acomódate…" : `Escucha dos compases. Aún no cuentes ${lesson.word}.` : guide.starting ? `Desde aquí: compás 1. Cuenta ${bars} y vuelve al 1.` : bars === 32 ? "Cuatro grupos de ocho. Pulsa después del 32." : bars === 16 ? "Cuenta 8 + 8. Pulsa solo después del compás 16." : "Cuenta ocho compases. Pulsa al volver al primero.";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved === "object") {
        if (tracks.some(item => item.id === saved.trackId)) setTrackId(saved.trackId);
        if (practiceModes.includes(saved.mode)) setMode(saved.mode);
        if (isPlaybackSpeed(saved.speed)) setSpeed(saved.speed);
        const lastRoundPattern = bars === 8 ? /^Última ronda: [0-2] de 2 vueltas clavadas o cerca\.$/ : /^Última ronda: [0-1] de 1 vuelta clavada o cerca\.$/;
        if (typeof saved.lastRound === "string" && lastRoundPattern.test(saved.lastRound)) setLastRound(saved.lastRound);
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, [storageKey, tracks, bars]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ trackId, mode, speed, lastRound })); }
    catch { setStorageError(true); }
  }, [storageKey, ready, trackId, mode, speed, lastRound]);

  useEffect(() => {
    if (canTap && focusTap.current) {
      tapRef.current?.focus({ preventScroll: true });
      focusTap.current = false;
    }
  }, [canTap]);

  useEffect(() => {
    if (!plan || !player.isPlaying) return;
    if (reviewTarget !== null) {
      if (player.currentTime >= reviewTarget + 0.5 * speed) player.pause();
      return;
    }
    if (finished || player.currentTime < plan.end) return;
    player.pause();
    const completed = { ...roundRef.current, end: plan.end };
    roundRef.current = completed;
    setRound(completed);
    setFinished(true);
    if (!provisional) {
      const result = summarizeBarCounting(completed, track, player.duration, speed, bars);
      setLastRound(`Última ronda: ${result.perfect + result.close} de ${lesson.turns} ${bars === 8 ? "vueltas clavadas" : "vuelta clavada"} o cerca.`);
    }
  }, [plan, player.currentTime, player.isPlaying, player.pause, player.duration, reviewTarget, finished, provisional, track, speed, bars, lesson.turns]);

  useEffect(() => {
    function handleSpace(event: KeyboardEvent) {
      if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || settings) return;
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
    const empty = { start: 0, end: 0, taps: [] };
    roundRef.current = empty;
    setRound(empty);
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
    const evaluation = evaluateBarCountingTap(roundRef.current, player.getTime(), track, player.duration, speed, bars);
    if (!evaluation) return;
    roundRef.current = evaluation.round;
    setRound(evaluation.round);
    setFeedback(evaluation.feedback);
    setRepeated(evaluation.repeated);
  }

  function review(target: number) {
    if (!plan) return;
    player.pause();
    player.seek(target === plan.targets[0] ? plan.start : plan.targets[0]);
    setReviewTarget(target);
    focusTap.current = false;
    void player.play();
  }

  return <main className="phrase-shell" data-level="downbeat">
    <header className="phrase-header"><a href="#practice-controls">Volver al Beat Trainer</a><button type="button" onClick={() => { player.pause(); setSettings(!settings); }}>{settings ? "Practicar" : "Ajustes"}</button></header>
    <div className="level-label">Conteo opcional · Fuera del recorrido</div>
    <h1>Cuenta {bars} compases</h1>
    <p className="phrase-context">{track.title} · {mode.toUpperCase()} · {speedLabels[speed]}</p>
    {settings ? <section className="phrase-settings" aria-label={`Preparar ${lesson.word} compases`}>
      <nav className="phrase-steps" aria-label="Pasos de conteo">{([8, 16, 32] as const).map(count => <a key={count} href={getBarLesson(count).hash} aria-current={count === bars ? "step" : undefined} onClick={() => player.pause()}>{count} compases</a>)}</nav>
      <p>Cada compás tiene cuatro golpes. Cuenta «1-2-3-4, 2-2-3-4… {bars}-2-3-4» y pulsa en el siguiente 1. {bars === 8 ? "Lo repetimos dos veces." : bars === 16 ? "Una vuelta larga por ronda. El compás 9 es la mitad: sigue contando, todavía no pulses." : "Una vuelta larga por ronda: 1–8, 9–16, 17–24 y 25–32. No pulses al cambiar de grupo; solo al terminar los cuatro."}</p>
      {bars === 32 && <p>Cinco patrones sintéticos largos, exclusivos de este ejercicio. Las pistas y récords anteriores no cambian.</p>}
      <label htmlFor="phrase-track">Pista</label>
      <select id="phrase-track" className="track-select" value={trackId} disabled={!ready} onChange={event => { reset(); setTrackId(event.target.value); }}>{tracks.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <fieldset className="speed-control"><legend>Velocidad para aprender</legend><div>{playbackSpeeds.map(item => <button type="button" key={item} aria-pressed={speed === item} onClick={() => { if (item !== speed) { reset(); setSpeed(item); } }}>{speedLabels[item]}</button>)}</div></fieldset>
      <div className="mode-selector" role="group" aria-label="Ayudas">{practiceModes.map(item => <button className={mode === item ? "mode-button active" : "mode-button"} type="button" key={item} aria-pressed={mode === item} onClick={() => { if (item !== mode) { reset(); setMode(item); } }}>{modeLabels[item]}</button>)}</div>
      <p>Teach muestra {bars === 8 ? "los ocho compases" : bars === 16 ? "1–8 y después 9–16" : "1–8, 9–16, 17–24 y 25–32, ocho casillas cada vez"}. Assist deja solo el pulso tras la salida. Train retira todas las ayudas tras indicar dónde empezar.</p>
      <p>Entrenamos el conteo, no detectamos frases reales: no todas las canciones cambian cada {lesson.word} compases.</p>
      <p>Cambiar pista, velocidad o ayuda prepara una ronda nueva. Al reabrir conservamos tus ajustes, pero empezamos con la entrada para que te sitúes.</p>
      {lastRound && <p>{lastRound} Es práctica, no una certificación.</p>}
      <button type="button" className="next-button" onClick={() => setSettings(false)}>Listo · practicar</button>
    </section> : null}
    <section className="phrase-workspace" hidden={settings} aria-label={`Práctica de ${lesson.word} compases`}>
      <div className={mode === "train" && !preparing && !guide.starting && reviewTarget === null ? "challenge-wave-hidden" : undefined}>
        <WaveformDisplay track={track} mode={reviewTarget !== null ? "teach" : mode} targetLabel="VUELTA AL 1" duration={player.duration} currentTime={player.currentTime} viewport={player.viewport} containerRef={player.containerRef} revealedTarget={reviewTarget} tapTime={null} outcomes={finished ? summary.outcomes : []} />
        {mode === "train" && !preparing && !guide.starting && reviewTarget === null && <p className="challenge-listening">Ahora tú · {lesson.word} compases por oído</p>}
      </div>
      <div className="phrase-transport"><button type="button" className="continue-button" disabled={!player.isReady || !plan} onClick={toggle}>{player.isPlaying ? "Pausar" : finished || reviewTarget !== null ? "Nueva ronda" : player.currentTime === 0 ? "Empezar" : "Continuar"}</button><button type="button" className="restart-button" disabled={!player.isReady || !plan} onClick={restart}>Reiniciar</button></div>
      {player.error && <p className="audio-error" role="alert">{player.error}</p>}
      {player.isReady && !plan && <p role="alert">Esta pista no tiene suficientes compases de referencia para este ejercicio. Elige otra en Ajustes.</p>}
      {provisional && <p className="phrase-notice">Referencia pendiente de escucha · sin nota guardada</p>}
      {!finished || reviewTarget !== null ? <>
        <div className="phrase-guide" aria-label={guide.bar !== null ? `Compás ${guide.bar} de ${bars}, golpe ${guide.beat}` : "Cuenta por oído"}>
          {!preparing && guide.bar !== null && <small>Compás {guide.bar} de {bars} · Golpe {guide.beat} de 4</small>}
          {!preparing && guide.bar !== null ? <><div className="phrase-bars" aria-hidden="true">{visibleBars.map(bar => <span key={bar} className={guide.bar === bar ? "active" : ""}>{bar}</span>)}</div><div className="phrase-beats" aria-hidden="true">{[1, 2, 3, 4].map(beat => <span key={beat} className={guide.beat === beat ? "active" : ""}>{beat}</span>)}</div></> : <strong>{preparing ? status : <><span className={guide.pulse ? "pulse-dot lit" : "pulse-dot"} /> Sigue contando por dentro</>}</strong>}
        </div>
        <p className="phrase-instruction">{reviewTarget !== null ? `Revisión guiada de ${lesson.word} compases · sin puntuar.` : !player.isPlaying ? preparing ? "Pulsa Play. Tienes tiempo para prepararte." : "Pulsa Empezar y retoma la cuenta donde la dejaste." : status}</p>
        <button ref={tapRef} type="button" className="tap-button" disabled={!canTap} onPointerDown={event => { if (event.isPrimary && event.button === 0) tap(); }} onKeyDown={event => handleTapKeyDown(event, tap)} onClick={event => { if (event.detail === 0) tap(); }}><strong>{preparing ? "PRIMERO ESCUCHA" : "VUELTA AL 1"}</strong><small>SOLO DESPUÉS DE {lesson.word.toUpperCase()} COMPASES</small></button>
        <div className="phrase-feedback" role="status">{reviewTarget !== null ? "Escucha el bloque entero. Nueva ronda te devuelve a la entrada." : feedback ? <><strong>{repeated ? "REPETIDA · " : ""}{feedback.result.classification === "otra-vez" ? "FUERA DE LA VUELTA" : feedback.result.classification.toUpperCase()}</strong><span>{feedback.result.message}</span></> : `No marques cada compás: espera a completar ${lesson.word}.`}</div>
      </> : <section className="phrase-summary" aria-labelledby="phrase-result">
        <h2 id="phrase-result">{bars === 8 ? "Dos vueltas, sin perder el 1" : `${bars} compases, una vuelta al 1`}</h2>
        <p>{provisional ? "Orientación provisional" : "Tu ronda"}: {summary.perfect} clavadas · {summary.close} cerca · {summary.outside} fuera de tiempo · {summary.missed} sin marcar.</p>
        <p>{summary.extra} toques adicionales o fuera de la vuelta. Cada objetivo cuenta una sola vez.</p>
        {summary.outcomes.map((outcome, index) => <button type="button" key={outcome.target} className="previous-button" onClick={() => review(outcome.target)}>Escuchar vuelta {index + 1} · {outcome.result?.classification ?? "sin marcar"}</button>)}
        <button type="button" className="next-button" onClick={restart}>Repetir con la misma ayuda</button>
        {mode !== "train" && <button type="button" className="previous-button" onClick={() => { reset(); setMode(mode === "teach" ? "assist" : "train"); }}>Probar {mode === "teach" ? "Assist" : "Train"} →</button>}
        <p>Este conteo no forma parte del recorrido recomendado. No necesitas completarlo para avanzar.</p>
        <a className="phrase-entry" href="#practice-controls">Volver al Beat Trainer</a>
      </section>}
      {reviewTarget !== null && <button type="button" className="previous-button" onClick={() => { player.pause(); setReviewTarget(null); }}>Volver al resumen</button>}
      <p className="keyboard-hint">Espacio inicia o pausa · Enter sobre el botón grande marca la vuelta.</p>
    </section>
    {storageError && <p role="status">No se pueden guardar los ajustes en este navegador.</p>}
  </main>;
}
