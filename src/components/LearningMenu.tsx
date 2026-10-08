"use client";

import { useEffect, useRef, useState } from "react";
import { learningModules } from "@/lib/learningModules";
import { GUIDED_PATH_STORAGE_KEY, entryStep, guidedPath, readGuidedPathState, type GuidedPathState } from "@/lib/guidedPath";

export function LearningMenu({ screen }: { screen: "home" | "rhythm" | "listening-menu" }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [pathState, setPathState] = useState<GuidedPathState | null>(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [screen]);
  useEffect(() => {
    try { setPathState(readGuidedPathState(localStorage.getItem(GUIDED_PATH_STORAGE_KEY))); } catch { setPathState(null); }
  }, [screen]);

  const entry = entryStep(pathState);
  const entryIndex = guidedPath.findIndex(step => step.id === entry.id);

  return <main className="learning-menu">
    <header className="menu-header"><span className="menu-brand"><span className="menu-logo" aria-hidden="true">B</span>BlueClue</span><span className="menu-kicker">{screen === "home" ? "Aprende a pinchar" : "Tu recorrido"}</span></header>
    {screen === "home" ? <>
      <h1 ref={headingRef} tabIndex={-1}>{pathState ? "Seguimos." : "Empezamos desde cero."}</h1>
      <p className="menu-intro">{pathState ? "Retomas donde lo dejaste. Sin prisa." : "No hace falta saber nada. Primero escuchas, luego tocas."}</p>
      <a className="menu-start" href={entry.hash} data-step={entry.id}>
        <span className="menu-start-top"><span>{pathState ? "Seguir donde lo dejé" : "Empieza aquí"}</span><span aria-hidden="true">→</span></span>
        <strong>{pathState ? `Paso ${entryIndex} · ${entry.title}` : `Paso 0 · ${entry.title}`}</strong>
        <small>{entry.hint}</small>
      </a>
      {pathState && <a className="menu-restart" href={guidedPath[0].hash}>Empezar desde el principio</a>}
      <p className="menu-eyebrow menu-map-label">O elige en el mapa</p>
      <nav className="menu-options menu-map" aria-label="Bloques de aprendizaje">
        <a className="menu-block compact" href="#marca-el-1"><span className="menu-block-top" aria-hidden="true"><span>01</span><span>↗</span></span><strong>Marca el 1</strong><span>Sigue el pulso. Cuenta. Encuentra el 1.</span><small>3 niveles · de la guía al oído</small></a>
        <a className="menu-block compact" href="#escucha-el-cambio"><span className="menu-block-top" aria-hidden="true"><span>02</span><span>↗</span></span><strong>Escucha el cambio</strong><span>Reconoce lo que entra en la música.</span><small>Bajo → Percusión → Distinguir ambos</small></a>
      </nav>
      <p className="menu-footer">Todo se guarda en este dispositivo. Nada se bloquea.</p>
    </> : <>
      <a className="menu-back" href="#inicio" aria-label="Volver al inicio"><span className="menu-back-icon" aria-hidden="true">←</span><span>Inicio</span></a>
      <p className="menu-eyebrow">{screen === "rhythm" ? "01 · Marca el 1" : "02 · Escucha el cambio"}</p>
      <h1 ref={headingRef} tabIndex={-1}>{screen === "rhythm" ? "Elige tu nivel" : "Entrena la escucha"}</h1>
      <p className="menu-intro">{screen === "rhythm" ? "Si es tu primera vez, empieza por el Nivel 1." : "Sin contar. Fíjate en el sonido."}</p>
      {screen === "rhythm" ? <>
        <nav className="menu-options" aria-label="Niveles de Marca el 1">
          <a className="menu-level" data-menu-level="sounds" href="#sonidos"><span className="menu-digit" aria-hidden="true">0</span><span><small>Paso 0 · Antes de empezar</small><strong>Conoce los sonidos</strong></span><span aria-hidden="true">›</span></a>
          {learningModules.map((lesson, index) => <a key={lesson.id} className="menu-level" data-menu-level={lesson.id} href={`#nivel-${index + 1}`}><span className="menu-digit" aria-hidden="true">{index + 1}</span><span><small>Nivel {index + 1} · {["Inicial", "Intermedio", "Avanzado"][index]}</small><strong>{lesson.title}</strong></span><span aria-hidden="true">›</span></a>)}
        </nav>
        <p className="menu-footer">Despacio → Intermedio → Original<br />Teach → Assist → Train en cada velocidad.</p>
      </> : <nav className="menu-options menu-listening" aria-label="Prácticas de escucha">
        <a className="menu-listening-card" href="#escucha-el-bajo"><span className="menu-digit" aria-hidden="true">1</span><span><strong>Escucha el bajo</strong><small>Notas graves · 23 segundos</small></span><span aria-hidden="true">›</span></a>
        <a className="menu-listening-card" href="#escucha-la-percusion"><span className="menu-digit" aria-hidden="true">2</span><span><strong>Escucha la percusión</strong><small>La batería · 24 segundos</small></span><span aria-hidden="true">›</span></a>
        <a className="menu-listening-card" href="#bajo-o-bateria"><span className="menu-digit" aria-hidden="true">3</span><span><strong>¿Bajo o batería?</strong><small>Distingue ambos · 32 segundos</small></span><span aria-hidden="true">›</span></a>
      </nav>}
    </>}
  </main>;
}
