"use client";

import { useEffect, useRef, useState } from "react";
import { evaluateListeningTap, getListeningFeedback, getListeningGuide, getListeningReview, listeningStorageKey, summarizeListening, type ListeningTap, type ListeningTrack } from "@/lib/listening";
import { listeningLessons, type ListeningInstrument } from "@/lib/listeningLessons";
import { handleTapKeyDown } from "@/lib/tapInput";
import { useWaveformPlayer } from "@/lib/useWaveformPlayer";

export function ListeningTrainer({ track }: { track: ListeningTrack }) {
  const lesson = listeningLessons[track.instrument ?? "bass"];
  const isChoice = track.instrument === "choice";
  const [stage, setStage] = useState<"listen" | "detect">("listen");
  const [taps, setTaps] = useState<ListeningTap[]>([]);
  const tapsRef = useRef<ListeningTap[]>([]);
  const [finished, setFinished] = useState(false);
  const completedRef = useRef(false);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const [lastRound, setLastRound] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const tapRef = useRef<HTMLButtonElement>(null);
  const percussionRef = useRef<HTMLButtonElement>(null);
  const focusTap = useRef(false);
  const player = useWaveformPlayer(track, true, 1, "downbeat", false);
  const summary = summarizeListening(track, taps);
  const feedback = taps.at(-1);
  const totalEntries = summary.entries.length;
  const storageKey = listeningStorageKey(track);
  const canTap = stage === "detect" && player.isReady && player.isPlaying && !finished && reviewTarget === null;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && Number.isInteger(saved.recognized) && saved.recognized >= 0 && saved.recognized <= totalEntries && Number.isInteger(saved.extra) && saved.extra >= 0) {
        if (isChoice && (!Number.isInteger(saved.wrong) || saved.wrong < 0 || saved.wrong > totalEntries - saved.recognized)) return;
        setLastRound(`Última práctica: ${saved.recognized} de ${totalEntries} entradas reconocidas.${isChoice ? ` Confusiones: ${saved.wrong}.` : ""} Toques adicionales: ${saved.extra}.`);
      }
    } catch { setStorageError(true); }
  }, [isChoice, storageKey, totalEntries]);

  useEffect(() => {
    if (canTap && focusTap.current) {
      tapRef.current?.focus({ preventScroll: true });
      focusTap.current = false;
    }
  }, [canTap]);

  useEffect(() => {
    if (reviewTarget !== null) {
      if (player.currentTime >= getListeningReview(track, reviewTarget).end) player.pause();
      return;
    }
    if (!player.isReady || completedRef.current || player.currentTime < track.duration - 0.03) return;
    completedRef.current = true;
    setFinished(true);
    if (stage === "detect") {
      const result = summarizeListening(track, tapsRef.current);
      setLastRound(`Última práctica: ${result.recognized} de ${result.entries.length} entradas reconocidas.${isChoice ? ` Confusiones: ${result.wrong}.` : ""} Toques adicionales: ${result.extra}.`);
      try { localStorage.setItem(storageKey, JSON.stringify({ recognized: result.recognized, wrong: result.wrong, extra: result.extra })); }
      catch { setStorageError(true); }
    }
  }, [isChoice, player.currentTime, player.isReady, player.pause, reviewTarget, stage, storageKey, track]);

  useEffect(() => {
    function handleSpace(event: KeyboardEvent) {
      if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || (target.closest("button, a, select, input, textarea, summary") && target !== tapRef.current && target !== percussionRef.current))) return;
      event.preventDefault();
      if (!event.repeat) toggle();
    }
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  });

  function reset() {
    player.pause();
    player.seek(0);
    tapsRef.current = [];
    completedRef.current = false;
    setTaps([]);
    setFinished(false);
    setReviewTarget(null);
  }

  function restart() {
    if (!player.isReady) return;
    reset();
    focusTap.current = stage === "detect";
    void player.play();
  }

  function changeStage(next: "listen" | "detect") {
    reset();
    setStage(next);
  }

  function toggle() {
    if (!player.isReady) return;
    if (player.isPlaying) player.pause();
    else if (reviewTarget !== null) {
      if (player.getTime() >= getListeningReview(track, reviewTarget).end) player.seek(getListeningReview(track, reviewTarget).start);
      void player.play();
    } else if (finished) restart();
    else { focusTap.current = stage === "detect"; void player.play(); }
  }

  function tap(choice?: ListeningInstrument) {
    if (!canTap) return;
    const result = evaluateListeningTap(track, tapsRef.current, player.getTime(), choice);
    if (!result) return;
    tapsRef.current = [...tapsRef.current, result];
    setTaps(tapsRef.current);
  }

  function review(target: number) {
    player.pause();
    setReviewTarget(target);
    player.seek(getListeningReview(track, target).start);
    void player.play();
  }

  return <main className="phrase-shell bass-shell" data-level="downbeat">
    <header className="phrase-header"><a href="#escucha-el-cambio" onClick={() => player.pause()}>← Escucha el cambio</a><span>Práctica</span></header>
    <div className="level-label">Práctica corta · {track.duration} segundos</div>
    <h1>{track.title}</h1>
    <p className="phrase-context">{lesson.context}</p>
    <div className="mode-selector" role="group" aria-label="Pasos de escucha">
      <button type="button" className={stage === "listen" ? "mode-button active" : "mode-button"} aria-pressed={stage === "listen"} onClick={() => changeStage("listen")}>1 · Escuchar</button>
      <button type="button" className={stage === "detect" ? "mode-button active" : "mode-button"} aria-pressed={stage === "detect"} onClick={() => changeStage("detect")}>2 · Reconocer</button>
    </div>
    <div className="bass-audio" ref={player.containerRef} aria-hidden="true" />
    <div className="phrase-transport">
      <button type="button" className="continue-button" disabled={!player.isReady} onClick={toggle}>{player.isPlaying ? "Ⅱ Pausar" : reviewTarget !== null ? "▶ Escuchar revisión" : finished ? "▶ Repetir" : player.currentTime === 0 ? "▶ Empezar" : "▶ Continuar"}</button>
      <button type="button" className="restart-button" disabled={!player.isReady} onClick={restart}>↺ Reiniciar</button>
    </div>
    {player.error && <p className="audio-error" role="alert">{player.error}</p>}
    {!player.isReady && !player.error && <p role="status">Preparando audio…</p>}
    {reviewTarget !== null ? <>
      <p className="phrase-instruction">Revisión guiada · no cambia tu resultado.</p>
      <div className="phrase-guide" role="status"><strong>{getListeningGuide(track, player.currentTime)}</strong></div>
      <button type="button" className="previous-button" onClick={() => { player.pause(); setReviewTarget(null); }}>Volver al resumen</button>
    </> : finished ? <section className="phrase-summary" aria-labelledby="listening-result">
      <h2 id="listening-result">{stage === "listen" ? "Ahora, reconócelo por oído" : `${summary.recognized} de ${totalEntries} entradas reconocidas`}</h2>
      {stage === "listen" ? <>
        <p>{lesson.listened}</p>
        <button type="button" className="next-button" onClick={() => changeStage("detect")}>Probar sin guía →</button>
      </> : <>
        <p>{isChoice && <>Instrumento confundido: {summary.wrong} · </>}Sin reconocer: {summary.missed} · Toques adicionales: {summary.extra}. Cada entrada cuenta una sola vez.</p>
        <p>No medimos precisión al milisegundo: tienes un margen para reconocer el cambio después de oírlo.</p>
        {summary.entries.map((entry, index) => <button type="button" className="previous-button" key={entry.time} onClick={() => review(entry.time)}>{isChoice ? `${index + 1} · ${track.changes.find(change => change.time === entry.time)?.action === "bass-in" ? "Bajo" : "Batería"}` : index === 0 ? "Primera entrada" : lesson.returnLabel} · {entry.recognized ? "Reconocida" : entry.wrong ? "Confundida" : "Sin reconocer"} · Escuchar</button>)}
        <button type="button" className="next-button" onClick={restart}>Practicar otra vez</button>
        {(track.instrument ?? "bass") === "bass" && <a className="previous-button" href="#escucha-la-percusion">Siguiente práctica · La percusión →</a>}
        {track.instrument === "percussion" && <a className="previous-button" href="#bajo-o-bateria">Siguiente práctica · ¿Bajo o batería? →</a>}
        {isChoice && <a className="previous-button" href="#escucha-el-cambio">Volver a las prácticas de escucha</a>}
      </>}
    </section> : stage === "listen" ? <>
      <div className="phrase-guide" role="status"><strong>{getListeningGuide(track, player.currentTime)}</strong></div>
      <p className="phrase-instruction">{lesson.listen}</p>
    </> : <>
      <p className="phrase-instruction">{lesson.instruction}</p>
      {isChoice ? <div className="listening-choices" role="group" aria-label="Qué instrumento entra">
        {(["bass", "percussion"] as const).map(instrument => <button key={instrument} ref={instrument === "bass" ? tapRef : percussionRef} type="button" className="tap-button" disabled={!canTap} onPointerDown={event => { if (event.isPrimary && event.button === 0) tap(instrument); }} onKeyDown={event => handleTapKeyDown(event, () => tap(instrument))} onClick={event => { if (event.detail === 0) tap(instrument); }}><strong>{instrument === "bass" ? "BAJO" : "BATERÍA"}</strong></button>)}
      </div> : <button ref={tapRef} type="button" className="tap-button" disabled={!canTap} onPointerDown={event => { if (event.isPrimary && event.button === 0) tap(); }} onKeyDown={event => handleTapKeyDown(event, tap)} onClick={event => { if (event.detail === 0) tap(); }}><strong>{lesson.button}</strong><small>{!player.isPlaying ? "PULSA ▶ PARA EMPEZAR O CONTINUAR" : "PULSA CUANDO LO OIGAS"}</small></button>}
      <div className="phrase-feedback" role="status">{getListeningFeedback(track, feedback)}</div>
    </>}
    <p className="keyboard-hint">Espacio inicia o pausa · Enter sobre el botón grande marca la entrada.</p>
    {lastRound && !finished && <p className="phrase-context">{lastRound}</p>}
    {storageError && <p role="status">No se puede guardar esta práctica en el navegador. Puedes seguir escuchando.</p>}
  </main>;
}
