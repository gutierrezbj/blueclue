"use client";

import { useEffect, useRef, useState } from "react";
import { entryStep, guidedPath, type GuidedPathState, type GuidedStepId } from "@/lib/guidedPath";
import { getLearningOverview, learningOverviews, type OverviewId } from "@/lib/learningOverview";
import { getLearningLevel, learningLevels, type LearningLevelId } from "@/lib/learningLevels";
import { readPathProgress } from "@/lib/pathProgress";

type Progress = { lastOpened: GuidedPathState | null; done: Set<GuidedStepId>; storage: boolean };
type Props = { screen: "home" | "rhythm" | "listening-menu" | "overview" | "level"; overviewId?: OverviewId; levelId?: LearningLevelId };

export function LearningMenu({ screen, overviewId, levelId }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState<Progress>({ lastOpened: null, done: new Set(), storage: true });
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [screen, overviewId, levelId]);
  useEffect(() => { setProgress(readPathProgress()); }, [screen, overviewId, levelId]);

  const lastStep = progress.lastOpened ? entryStep(progress.lastOpened) : null;
  const overview = screen === "listening-menu" ? getLearningOverview("listening") : overviewId ? getLearningOverview(overviewId) : null;
  const isResume = overview && lastStep && overview.steps.includes(lastStep.id);
  const level = overview?.id === "recover" ? "count" : overview && ["pulse", "count", "downbeat"].includes(overview.id) ? overview.id : undefined;
  const cards = screen === "rhythm" ? learningOverviews.filter(item => ["pulse", "count", "downbeat", "recover"].includes(item.id)) : learningOverviews;

  if (screen === "level" && levelId) {
    const selectedLevel = getLearningLevel(levelId);
    const available = selectedLevel.lessons.filter(lesson => lesson.hash).length;
    return <main className="learning-menu" data-course-level={selectedLevel.number}>
      <header className="menu-header"><a className="menu-back" href="#inicio" aria-label="Volver al inicio"><span>Inicio</span></a><span className="menu-kicker">Nivel {selectedLevel.number} de 7</span></header>
      <h1 ref={headingRef} tabIndex={-1}>{selectedLevel.title}</h1>
      <p className="menu-intro">{selectedLevel.goal}</p>
      <h2 className="level-lessons-heading">Lecciones de este nivel</h2>
      <div className="learning-cards">
        {selectedLevel.lessons.map((lesson, index) => {
          const content = <><small className="learning-card-label">Lección {index + 1}</small><strong>{lesson.title}</strong><span>{lesson.description}</span>{lesson.stepId && (lastStep?.id === lesson.stepId ? <small className="learning-card-resume">Tu última práctica</small> : progress.done.has(lesson.stepId) ? <small>Ya practicado · puedes repetir</small> : null)}{!lesson.hash && <small>En preparación</small>}</>;
          return lesson.hash ? <a className="learning-card" key={lesson.title} href={lesson.hash}>{content}</a> : <div className="learning-card learning-card-planned" key={lesson.title}>{content}</div>;
        })}
      </div>
      <p className="menu-footer">{available > 0 ? `${available} ${available === 1 ? "lección tiene" : "lecciones tienen"} práctica. Las demás muestran el recorrido previsto.` : "Este es el recorrido previsto. Sus prácticas todavía están por construir."}</p>
    </main>;
  }

  return <main className="learning-menu" data-level={level}>
    <header className="menu-header">
      {screen === "home" ? <span className="menu-brand"><span className="menu-logo" aria-hidden="true">B</span>BlueClue</span> : <a className="menu-back" href="#inicio" aria-label="Volver al inicio"><span>Inicio</span></a>}
      <span className="menu-kicker">{overview ? overview.label : "Aprende a pinchar"}</span>
    </header>
    <h1 ref={headingRef} tabIndex={-1}>{overview ? overview.title : screen === "rhythm" ? "Elige tu lección de ritmo" : <>Aprende a escuchar.<br />Empieza a pinchar.</>}</h1>
    <p className="menu-intro">{overview ? overview.hint : screen === "rhythm" ? "Del pulso al 1. Empieza despacio y retira las ayudas a tu ritmo." : "Siete niveles para entender lo que oyes y llevarlo a tu equipo."}</p>

    {overview ? <>
      <section className="lesson-purpose" aria-labelledby="purpose-heading">
        <h2 id="purpose-heading">Para qué te sirve al pinchar</h2>
        <p>{overview.purpose}</p>
      </section>
      {overview.id === "listening" ? <nav className="learning-cards" aria-label="Ejercicios de escucha">
        {guidedPath.filter(step => overview.steps.includes(step.id)).map(step => <a key={step.id} className="learning-card" href={step.hash}>
          <strong>{step.title}</strong><span>{step.hint}</span>
          {lastStep?.id === step.id ? <small>Continuar aquí</small> : progress.done.has(step.id) ? <small>Ya practicado · puedes repetir</small> : null}
        </a>)}
      </nav> : <>
        <section className="lesson-method" aria-labelledby="method-heading">
          <h2 id="method-heading">Así lo practicas</h2>
          <ol>{overview.instructions.map(instruction => <li key={instruction}>{instruction}</li>)}</ol>
        </section>
        <a className="next-button lesson-start" href={overview.practiceHash}>{isResume ? "Continuar práctica" : "Ir a practicar"}</a>
        <p className="lesson-entry-note">{isResume && level ? "Conservamos tu pista, ayudas, velocidad y posición. La música espera a que pulses Play." : "Sin prisas: entrar no arranca la música."}</p>
      </>}
      <p className="lesson-result">{overview.result}</p>
      {overview.steps.some(step => progress.done.has(step)) && <p className="lesson-entry-note">Ya has practicado aquí. Eso no significa que esté dominado: puedes repetir o elegir otro ejercicio.</p>}
    </> : screen === "rhythm" ? <nav className="learning-cards" aria-label="Lecciones de ritmo">
      {cards.map(card => <a className="learning-card" data-card={card.id} key={card.id} href={card.hash}>
        <small className="learning-card-label">{card.label}</small>
        <strong>{card.title}</strong><span>{card.hint}</span>
      </a>)}
    </nav> : <nav className="learning-cards" aria-label="Siete niveles de aprendizaje">
      {learningLevels.map(item => <a className="learning-card" data-card={item.id} key={item.id} href={item.hash}>
        <small className="learning-card-label">Nivel {item.number} de 7</small>
        <strong>{item.title}</strong><span>{item.summary}</span>
        {!item.lessons.some(lesson => lesson.hash) && <small>Programa previsto · prácticas en preparación</small>}
        {lastStep && item.lessons.some(lesson => lesson.stepId === lastStep.id) && <small className="learning-card-resume">Tu última práctica</small>}
      </a>)}
    </nav>}

    <p className="menu-footer">{progress.storage ? "Sin bloqueos. Puedes volver a cualquier ejercicio." : "No se puede guardar en este navegador. Puedes seguir practicando."}</p>
  </main>;
}
