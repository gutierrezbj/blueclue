import type { RefObject } from "react";
import type { TrainingMode, TrainingTrack } from "@/lib/tracks";
import { isDownbeat } from "@/lib/beatGrid";
import { WAVEFORM_SECONDS, waveformPosition, type WaveformWindow } from "@/lib/waveformWindow";

type Props = {
  track: TrainingTrack;
  mode: TrainingMode;
  targetLabel: string;
  duration: number;
  currentTime: number;
  viewport: WaveformWindow;
  containerRef: RefObject<HTMLDivElement | null>;
  revealedTarget: number | null;
  tapTime: number | null;
};

export function WaveformDisplay({ track, mode, targetLabel, duration, currentTime, viewport, containerRef, revealedTarget, tapTime }: Props) {
  const position = (time: number) => waveformPosition(time, viewport);
  const playheadPosition = position(currentTime);
  const answerPosition = revealedTarget === null ? null : position(revealedTarget);
  const tapPosition = tapTime === null ? null : position(tapTime);
  const silentWidth = position(Math.min(track.leadInSeconds ?? 0, viewport.end)) ?? 0;

  return (
    <div className="waveform-frame">
      <div className="waveform-labels"><span>VISTA AMPLIADA · {WAVEFORM_SECONDS} S DE PISTA</span><span>{Math.floor(viewport.start)}–{Math.round(Math.min(duration, viewport.end))} S</span></div>
      <div className="waveform-surface">
        <div ref={containerRef} className="waveform" aria-label={`Forma de onda de ${track.title}`} />
        {duration > 0 && (
          <div className="beat-markers" aria-hidden="true">
            {silentWidth > 0 && <span className="lead-in-line" style={{ width: `${silentWidth}%` }} />}
            {mode !== "train" && track.beats.map((beat, index) => position(beat) !== null && (
              <span
                key={index}
                className={mode === "teach" && isDownbeat(beat, track.downbeats) ? "beat-marker downbeat-marker" : "beat-marker"}
                style={{ left: `${position(beat)}%` }}
              />
            ))}
            {answerPosition !== null && (
              <span className="answer-marker" style={{ left: `${answerPosition}%` }}>
                <span>{targetLabel}</span>
              </span>
            )}
            {tapPosition !== null && <span className="tap-marker" style={{ left: `${tapPosition}%` }} />}
          </div>
        )}
        {duration > 0 && playheadPosition !== null && <span className="playhead-dot" aria-hidden="true" style={{ left: `${playheadPosition}%` }} />}
      </div>
      <div className="marker-legend">
        {revealedTarget !== null ? <span><i className="legend-downbeat" /> Revisión guiada: {targetLabel.toLowerCase()}. Sin puntuar.</span> : (
          <>
            {mode === "teach" && <><span><i className="legend-beat" /> Beat</span><span><i className="legend-downbeat" /> El 1</span></>}
            {mode === "assist" && <span><i className="legend-beat" /> Pulso, sin señalar el 1</span>}
            {mode === "train" && <span>Sin marcas: escucha el ritmo.</span>}
          </>
        )}
      </div>
    </div>
  );
}
