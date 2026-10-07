"use client";

import { useEffect, useRef } from "react";
import { learningModules } from "@/lib/learningModules";

export function LearningMenu({ screen }: { screen: "home" | "rhythm" | "listening-menu" }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [screen]);

  return <main className="learning-menu">
    <header className="menu-header"><span className="menu-brand"><span className="menu-logo" aria-hidden="true">B</span>BlueClue</span><span className="menu-kicker">Tu recorrido</span></header>
    {screen === "home" ? <>
      <h1 ref={headingRef} tabIndex={-1}>¿Qué practicamos?</h1>
      <p className="menu-intro">Elige dónde quieres entrar.</p>
      <nav className="menu-options" aria-label="Bloques de aprendizaje">
        <a className="menu-block" href="#marca-el-1"><span className="menu-block-top" aria-hidden="true"><span>01</span><span>↗</span></span><strong>Marca el 1</strong><span>Sigue el pulso. Cuenta. Encuentra el 1.</span><small>3 niveles · de la guía al oído</small></a>
        <a className="menu-block" href="#escucha-el-cambio"><span className="menu-block-top" aria-hidden="true"><span>02</span><span>↗</span></span><strong>Escucha el cambio</strong><span>Reconoce lo que entra en la música.</span><small>Empieza con el bajo</small></a>
      </nav>
      <p className="menu-footer">Empieza por el primero. Avanza a tu ritmo.</p>
    </> : <>
      <a className="menu-back" href="#inicio" aria-label="Volver al inicio"><span className="menu-back-icon" aria-hidden="true">←</span><span>Inicio</span></a>
      <p className="menu-eyebrow">{screen === "rhythm" ? "01 · Marca el 1" : "02 · Escucha el cambio"}</p>
      <h1 ref={headingRef} tabIndex={-1}>{screen === "rhythm" ? "Elige tu nivel" : "Entrena la escucha"}</h1>
      <p className="menu-intro">{screen === "rhythm" ? "Los tres pasos que ya conoces." : "Sin contar. Fíjate en el sonido."}</p>
      {screen === "rhythm" ? <>
        <nav className="menu-options" aria-label="Niveles de Marca el 1">
          {learningModules.map((lesson, index) => <a key={lesson.id} className="menu-level" data-menu-level={lesson.id} href={`#nivel-${index + 1}`}><span className="menu-digit" aria-hidden="true">{index + 1}</span><span><small>Nivel {index + 1} · {["Inicial", "Intermedio", "Avanzado"][index]}</small><strong>{lesson.title}</strong></span><span aria-hidden="true">›</span></a>)}
        </nav>
        <p className="menu-footer">Despacio → Intermedio → Original<br />Teach → Assist → Train en cada velocidad.</p>
      </> : <a className="menu-block" href="#escucha-el-bajo"><span className="menu-block-top" aria-hidden="true"><span>♪</span><span>↗</span></span><strong>Escucha el bajo</strong><span>Oye cómo entra, sale y vuelve.</span><small>Escuchar → Reconocer · 23 segundos</small></a>}
    </>}
  </main>;
}
