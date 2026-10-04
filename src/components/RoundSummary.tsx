import type { RoundOutcome } from "@/lib/exerciseRound";
import type { LearningModuleId } from "@/lib/learningModules";

type Props = {
  summary: { outcomes: RoundOutcome[]; total: number; perfect: number; close: number; outside: number; missed: number; extra: number; offTarget: number };
  provisional: boolean;
  moduleId: LearningModuleId;
  onReview: (outcome: RoundOutcome) => void;
};

export function RoundSummary({ summary, moduleId, provisional, onReview }: Props) {
  return (
    <section className="round-summary" aria-label="Resumen de esta ronda">
      <h3>{provisional ? "Resumen provisional" : "Resumen de esta ronda"}</h3>
      <p>{summary.total} oportunidades escuchadas · cada una cuenta una sola vez.</p>
      {provisional && <p>Comparación con marcas pendientes de validar por oído. No es una nota ni se guarda como aciertos.</p>}
      <dl className="round-totals">
        <div><dt>Clavadas</dt><dd>{summary.perfect}</dd></div>
        <div><dt>Cerca</dt><dd>{summary.close}</dd></div>
        <div><dt>Fuera de tiempo</dt><dd>{summary.outside}</dd></div>
        <div><dt>Sin marcar</dt><dd>{summary.missed}</dd></div>
      </dl>
      {summary.extra > 0 && <p>{summary.extra} pulsaciones repetidas: se conserva la primera, sin sumar aciertos extra.</p>}
      {summary.offTarget > 0 && <p>{summary.offTarget} toques lejos del objetivo: no ocupan ni bloquean el siguiente. No se cuentan como repetidos.</p>}
      {(summary.extra > summary.total || summary.offTarget > summary.total) && <p>{moduleId === "pulse" ? "En este nivel acompaña cada pulso con un solo toque. Escucha el espacio entre golpes y evita tocar varias veces en el mismo." : "Si buscas el 1, pulsa una vez por grupo: 1, deja pasar 2-3-4. Para tocar todos los golpes, elige Nivel 1 · Sigue el pulso."}</p>}
      {summary.total === 0 ? <p>Todavía no has escuchado una oportunidad completa. Continúa después de la preparación.</p> : (
        <details>
          <summary>Ver dónde acertaste o te costó · pulsa para escuchar</summary>
          <div className="round-outcomes">{summary.outcomes.map((outcome, index) => (
            <button key={outcome.target} type="button" onClick={() => onReview(outcome)}>
              <strong>{index + 1}. {outcome.result?.classification === "clavado" ? "Clavado" : outcome.result?.classification === "cerca" ? "Cerca" : outcome.result ? "Fuera de tiempo" : "Sin marcar"}</strong>
              <span>{outcome.target.toFixed(2)} s de pista{outcome.result?.errorMs != null ? ` · ${Math.abs(outcome.result.errorMs)} ms ${outcome.result.errorMs < 0 ? "temprano" : outcome.result.errorMs > 0 ? "tarde" : "exacto"}` : ""} · ↺ Escuchar</span>
            </button>
          ))}</div>
        </details>
      )}
      <p>El resumen cubre esta ronda. Reiniciar, cambiar ejercicio o mover la onda empieza otra; pausar no la borra.</p>
    </section>
  );
}
