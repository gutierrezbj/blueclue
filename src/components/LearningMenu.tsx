"use client";

import { useEffect, useRef, useState } from "react";
import { REAL_SONG_STEP_TITLE, futureStages, getStage, guidedPath, homeState, stageStatus, stages, stepNumber, type GuidedPathState, type GuidedStepId, type StageId } from "@/lib/guidedPath";
import { readPathProgress } from "@/lib/pathProgress";

type Progress = { lastOpened: GuidedPathState | null; done: Set<GuidedStepId>; storage: boolean };

function StepRows({ stage, done, target }: { stage: StageId; done: ReadonlySet<GuidedStepId>; target: GuidedStepId | null }) {
  return <ul className="path-steps">
    {guidedPath.filter(step => step.stage === stage).map(step => <li key={step.id}>
      <a className="path-step" href={step.hash}>
        <span><small>Paso {stepNumber(step.id)} de {guidedPath.length}</small>{step.title}</span>
        {done.has(step.id) ? <span className="path-badge done">Hecho</span> : step.id === target ? <span className="path-badge here">Aquí</span> : null}
      </a>
    </li>)}
    <li><span className="path-step future"><span><small>Al final de la etapa</small>{REAL_SONG_STEP_TITLE}</span><span className="path-badge soon">Próximamente</span></span></li>
  </ul>;
}

function PathList({ done, target }: { done: ReadonlySet<GuidedStepId>; target: GuidedStepId | null }) {
  const count = (stage: StageId) => guidedPath.filter(step => step.stage === stage).length;
  return <section className="path-list" aria-labelledby="path-heading">
    <h2 id="path-heading" className="menu-eyebrow">Tu recorrido</h2>
    {stages.map(stage => {
      const status = stageStatus(stage.id, done, target);
      return <details key={stage.id} className="path-stage" open={status === "here"}>
        <summary>
          <span>Etapa {stage.number} · {stage.title}</span>
          <span className={`path-badge ${status === "done" ? "done" : status === "here" ? "here" : "count"}`}>{status === "done" ? "Hecho" : status === "here" ? "Aquí" : `${count(stage.id)} ${count(stage.id) === 1 ? "paso" : "pasos"}`}</span>
        </summary>
        <StepRows stage={stage.id} done={done} target={target} />
      </details>;
    })}
    {futureStages.map(stage => <div key={stage.number} className="path-stage future" aria-disabled="true">
      <span>Etapa {stage.number} · {stage.title}</span><span className="path-badge soon">Próximamente</span>
    </div>)}
  </section>;
}

export function LearningMenu({ screen }: { screen: "home" | "rhythm" | "listening-menu" }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState<Progress>({ lastOpened: null, done: new Set(), storage: true });
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [screen]);
  useEffect(() => { setProgress(readPathProgress()); }, [screen]);

  const state = homeState(progress.lastOpened, progress.done);
  const target = state.kind === "complete" ? null : state.target;
  const total = guidedPath.length;

  if (screen !== "home") {
    const stage: StageId = screen === "rhythm" ? "rhythm" : "listen";
    return <main className="learning-menu">
      <header className="menu-header"><a className="menu-back" href="#inicio" aria-label="Volver al inicio"><span>Inicio</span></a><span className="menu-kicker">Etapa {getStage(stage).number} de 3</span></header>
      <h1 ref={headingRef} tabIndex={-1}>{getStage(stage).title}</h1>
      <p className="menu-intro">{stage === "rhythm" ? "Del pulso al 1. Empieza por el primer paso si es tu primera vez." : "Sin contar. Fíjate en lo que entra en la música."}</p>
      <StepRows stage={stage} done={progress.done} target={target?.id ?? null} />
      {stage === "rhythm" && <p className="menu-footer">Cada paso se practica despacio, intermedio y original, con Teach, Assist y Train.</p>}
    </main>;
  }

  return <main className="learning-menu">
    <header className="menu-header"><span className="menu-brand"><span className="menu-logo" aria-hidden="true">B</span>BlueClue</span><span className="menu-kicker">Aprende a pinchar</span></header>
    <h1 ref={headingRef} tabIndex={-1}>{state.kind === "first" ? "Empezamos desde cero." : state.kind === "progress" ? "Seguimos." : `${total} de ${total}.`}</h1>
    <p className="menu-intro">{state.kind === "first" ? "No hace falta saber nada. Primero escuchas, luego tocas." : state.kind === "progress" ? `Llevas ${state.doneCount} de ${total} pasos. Sin prisa.` : "Has hecho todos los pasos que hay. Lo siguiente está en camino."}</p>
    {state.kind === "complete" ? <>
      <a className="menu-start" href="#nivel-3" data-step="challenge">
        <span className="menu-start-top"><span>Siguiente reto</span></span>
        <strong>Challenge</strong>
        <small>Encuentra el 1 sin ayudas, de principio a fin. Está al final del paso 7.</small>
      </a>
      <a className="menu-restart" href="#path-heading">Repasar cualquier paso</a>
    </> : <>
      <a className="menu-start" href={state.target.hash} data-step={state.target.id}>
        <span className="menu-start-top"><span>{state.kind === "first" ? "Empieza aquí" : "Sigue"}</span></span>
        <strong>Paso {stepNumber(state.target.id)} de {total}</strong>
        <small><b>{state.target.title}.</b> {state.target.hint}</small>
      </a>
      {state.kind === "progress" && state.canRestart && <a className="menu-restart" href={guidedPath[0].hash}>Volver al principio</a>}
    </>}
    <PathList done={progress.done} target={target?.id ?? null} />
    <p className="menu-footer">{progress.storage ? "Tu avance se guarda en este dispositivo. Nada se bloquea." : "Este navegador no guarda el avance: siempre empezarás desde el principio."}</p>
  </main>;
}
