import type { RefObject } from "react";
import type { TrainingMode, TrainingTrack } from "@/lib/tracks";

type Props = {
  track: TrainingTrack;
  mode: TrainingMode;
  duration: number;
  containerRef: RefObject<HTMLDivElement | null>;
  revealedTarget: number | null;
  tapTime: number | null;
};

export function WaveformDisplay({ track, mode, duration, containerRef, revealedTarget, tapTime }: Props) {
  const position = (time: number) => `${(time / duration) * 100}%`;

  return (
    <div className="waveform-frame">
      <div className="waveform-labels"><span>INICIO</span><span>FIN</span></div>
      <div className="waveform-surface">
        <div ref={containerRef} className="waveform" aria-label={`Forma de onda de ${track.title}`} />
        {duration > 0 && (
          <div className="beat-markers" aria-hidden="true">
            {mode !== "train" && track.beats.map((beat, index) => (
              <span
                key={index}
                className={mode === "teach" && index % 4 === 0 ? "beat-marker downbeat-marker" : "beat-marker"}
                style={{ left: position(beat) }}
              />
            ))}
            {revealedTarget !== null && (
              <span className="answer-marker" style={{ left: position(revealedTarget) }}>
                <span>EL 1</span>
              </span>
            )}
            {tapTime !== null && <span className="tap-marker" style={{ left: position(tapTime) }} />}
          </div>
        )}
      </div>
      <div className="marker-legend">
        {revealedTarget !== null ? <span><i className="legend-downbeat" /> Revisión guiada: aquí cae el 1. Sin puntuar.</span> : (
          <>
            {mode === "teach" && <><span><i className="legend-beat" /> Beat</span><span><i className="legend-downbeat" /> El 1</span></>}
            {mode === "assist" && <span><i className="legend-beat" /> Pulso, sin señalar el 1</span>}
            {mode === "train" && <span>Sin marcas: escucha y cuenta por dentro.</span>}
          </>
        )}
      </div>
    </div>
  );
}
