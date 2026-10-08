"use client";

import { useEffect, useRef, useState } from "react";
import { CLICK_COUNT, CLICK_INTERVAL_SECONDS, buildLatencyReport, describeLatency, scheduleClicks, type LatencyReport } from "@/lib/latencyDiagnostic";
import { handleTapKeyDown } from "@/lib/tapInput";

type Phase = "idle" | "running" | "done";

export function LatencyCheck() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [taps, setTaps] = useState(0);
  const [report, setReport] = useState<LatencyReport | null>(null);
  const [browserLatency, setBrowserLatency] = useState<{ base: number | null; output: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const clicksRef = useRef<number[]>([]);
  const tapsRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void contextRef.current?.close();
  }, []);

  async function start() {
    setError(null);
    setReport(null);
    tapsRef.current = [];
    setTaps(0);
    try {
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();
      const first = context.currentTime + 1;
      const clicks = scheduleClicks(first);
      clicksRef.current = clicks;
      for (const time of clicks) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = 1000;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.5, time + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.05);
      }
      const base = typeof context.baseLatency === "number" ? Math.round(context.baseLatency * 1000) : null;
      const output = typeof context.outputLatency === "number" ? Math.round(context.outputLatency * 1000) : null;
      setBrowserLatency({ base, output });
      setPhase("running");
      timerRef.current = setTimeout(() => finish(), Math.round(((CLICK_COUNT - 1) * CLICK_INTERVAL_SECONDS + 1.6) * 1000));
    } catch {
      setError("Este navegador no permite medir con Web Audio. Prueba en Safari del iPhone o en Chrome.");
    }
  }

  function finish() {
    timerRef.current = null;
    setReport(buildLatencyReport(tapsRef.current, clicksRef.current));
    setPhase("done");
  }

  function tap() {
    const context = contextRef.current;
    if (phase !== "running" || !context) return;
    tapsRef.current = [...tapsRef.current, context.currentTime];
    setTaps(tapsRef.current.length);
  }

  return <main className="learning-menu latency-check" data-level="count">
    <header className="menu-header"><a className="menu-back" href="#inicio" aria-label="Volver al inicio"><span className="menu-back-icon" aria-hidden="true">←</span><span>Inicio</span></a><span className="menu-kicker">Diagnóstico</span></header>
    <p className="menu-eyebrow">Pantalla oculta</p>
    <h1>Medir el retraso del toque</h1>
    <p className="menu-intro">Sonarán {CLICK_COUNT} clics, uno por segundo. Toca el botón grande con cada clic, como si siguieras el pulso. Solo mide: no corrige nada ni cambia tus puntuaciones.</p>
    {phase !== "running" && <button type="button" className="continue-button sounds-replay" onClick={() => void start()}>{phase === "done" ? "Medir otra vez" : "Empezar los clics"}</button>}
    <button type="button" className="tap-button latency-tap" disabled={phase !== "running"} onPointerDown={event => { if (event.isPrimary && event.button === 0) tap(); }} onKeyDown={event => handleTapKeyDown(event, tap)} onClick={event => { if (event.detail === 0) tap(); }}>
      <strong>{phase === "running" ? "TOCA CON EL CLIC" : phase === "done" ? "MEDICIÓN HECHA" : "ESPERA A LOS CLICS"}</strong>
      <small>{phase === "running" ? `${taps} toques` : "ENTER TAMBIÉN VALE"}</small>
    </button>
    {error && <p className="audio-error" role="alert">{error}</p>}
    {report && <section className="phrase-summary" aria-labelledby="latency-result">
      <h2 id="latency-result">{report.medianMs === null ? "Sin medida" : `${report.medianMs > 0 ? "+" : ""}${report.medianMs} ms`}</h2>
      <p>{describeLatency(report)}</p>
      <dl className="round-totals">
        <div><dt>Mediana</dt><dd>{report.medianMs ?? "—"}</dd></div>
        <div><dt>Media</dt><dd>{report.meanMs ?? "—"}</dd></div>
        <div><dt>Dispersión</dt><dd>{report.spreadMs ?? "—"}</dd></div>
        <div><dt>Toques útiles</dt><dd>{report.usedTaps}</dd></div>
      </dl>
      <p>Descartados: {report.discardedTaps} (los dos primeros y los que quedaron a más de 300 ms de un clic). Positivo: tocas después del clic.</p>
      <p>El navegador informa: salida base {browserLatency?.base ?? "—"} ms · salida total {browserLatency?.output ?? "—"} ms. Safari puede no informar.</p>
      <p className="menu-footer">Repite tres veces con los mismos auriculares. Si la mediana se parece en las tres, apunta el número junto al dispositivo.</p>
      <details><summary>Toques uno a uno</summary><p>{report.offsetsMs.join(" · ")}</p></details>
    </section>}
  </main>;
}
