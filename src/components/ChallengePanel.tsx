import { CHALLENGE_RULES, challengePercent, challengeReadiness, challengeReference, passesChallenge, type ChallengeRecord } from "@/lib/challenge";
import { getLearningModule, learningModules, type LearningModuleId } from "@/lib/learningModules";
import { speedLabels, type PlaybackSpeed } from "@/lib/playbackSpeed";
import type { TrainingTrack } from "@/lib/tracks";

type Props = {
  track: TrainingTrack;
  tracks: TrainingTrack[];
  moduleId: LearningModuleId;
  speed: PlaybackSpeed;
  records: ChallengeRecord[];
  result: ChallengeRecord | null;
  active: boolean;
  unavailable: boolean;
  invalidReason: string | null;
  storageUnavailable: boolean;
  onStart: (trackId?: string) => void;
  onExit: () => void;
  onAdvance: (moduleId: LearningModuleId) => void;
};

export function ChallengePanel({ track, tracks, moduleId, speed, records, result, active, unavailable, invalidReason, storageUnavailable, onStart, onExit, onAdvance }: Props) {
  const provisional = track.referenceStatus === "pending-listening";
  const best = records.find(record => record.trackId === track.id && record.moduleId === moduleId && record.speed === speed && record.reference === challengeReference(track));
  const readiness = challengeReadiness(records, tracks, moduleId, speed);
  const nextModule = learningModules[learningModules.findIndex(module => module.id === moduleId) + 1];
  const nextTrack = tracks.find(item => item.id !== track.id && item.referenceStatus !== "pending-listening" && !readiness.passedTrackIds.includes(item.id));
  return (
    <section className="challenge-panel" aria-label="Challenge y récord personal">
      <h3>{result ? "Tu Challenge" : "Challenge · ponlo a prueba"}</h3>
      {!active && <p>Primero practica a tu ritmo. Cuando te sientas preparado, este es el siguiente paso.</p>}
      <p>{getLearningModule(moduleId).title} · {speedLabels[speed]} · Train</p>
      {result && <p className="challenge-score"><strong>{challengePercent(result)} %</strong> · {result.perfect} clavados + {result.close} cerca de {result.total}</p>}
      {result && result.extra + result.offTarget > 0 && <p>{result.extra + result.offTarget} toques adicionales reducen el porcentaje: cuenta acertar y no marcar golpes de más.</p>}
      {result && <p>{passesChallenge(result) ? "Objetivo de esta pista conseguido." : "Sigue practicando: cada vuelta te ayuda a escuchar mejor."}</p>}
      <p>{best ? `Mejor ronda: ${challengePercent(best)} % · ${best.perfect} clavados + ${best.close} cerca de ${best.total}.` : "Todavía no hay récord para esta pista, nivel y velocidad."}</p>
      {storageUnavailable && <p role="status">Récords solo en esta sesión: el navegador no permite guardarlos.</p>}
      {invalidReason && <p role="status">{invalidReason}</p>}
      {provisional ? <p>Challenge no disponible: primero hay que validar las referencias de esta pista por oído.</p> : <>
        <p>{readiness.ready ? nextModule ? `Preparado para probar el nivel siguiente a velocidad ${speedLabels[speed]}.` : `Base del nivel 3 consolidada a velocidad ${speedLabels[speed]}. Prueba otra pista sin mirar.` : `${readiness.passedTrackIds.length}/${CHALLENGE_RULES.distinctTracks} pistas con al menos ${CHALLENGE_RULES.successPercent} % a esta velocidad.`} Orientación, no certificado; puedes avanzar libremente.</p>
        <details><summary>Cómo funciona y cuándo avanzar</summary><p>Una pista completa desde el inicio, con la preparación habitual. Después, solo oído: sin onda, contador ni respuesta hasta terminar. El porcentaje divide clavados+cerca entre oportunidades + toques repetidos o lejos del objetivo. Así los fallos, los objetivos sin marcar y tocar de más cuentan. Pausar está permitido; terminar antes, mover la onda o cambiar ejercicio no genera récord. El mínimo son {CHALLENGE_RULES.minimumTargets} oportunidades.</p><p>Consigue al menos {CHALLENGE_RULES.successPercent} % en {CHALLENGE_RULES.distinctTracks} pistas distintas del mismo nivel y velocidad. Despacio no equivale a Original. Umbral inicial orientativo. Los récords se guardan solo en este dispositivo.</p></details>
        <div className="challenge-actions">
          <button type="button" className="next-button" disabled={unavailable} onClick={() => onStart()}>{active ? "Reiniciar Challenge" : "Empezar Challenge"}</button>
          {active && <button type="button" className="previous-button" onClick={onExit}>Volver a práctica libre</button>}
          {result && nextTrack && <button type="button" className="previous-button" disabled={unavailable} onClick={() => onStart(nextTrack.id)}>Challenge en otra pista</button>}
          {result && readiness.ready && nextModule && <button type="button" className="previous-button" onClick={() => onAdvance(nextModule.id)}>Probar nivel {learningModules.indexOf(nextModule) + 1}</button>}
        </div>
      </>}
    </section>
  );
}
