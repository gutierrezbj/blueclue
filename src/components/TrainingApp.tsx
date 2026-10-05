"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { BeatTrainer } from "./BeatTrainer";
import { BarCountingTrainer } from "./BarCountingTrainer";
import type { BarCount } from "@/lib/barCounting";
import type { TrainingTrack } from "@/lib/tracks";

export function TrainingApp(props: ComponentProps<typeof BeatTrainer> & { longTracks: TrainingTrack[] }) {
  const [bars, setBars] = useState<BarCount | null>(null);
  useEffect(() => {
    function navigate() { setBars(window.location.hash === "#compases" ? 8 : window.location.hash === "#compases-16" ? 16 : window.location.hash === "#compases-32" ? 32 : null); }
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [bars]);
  return bars ? <BarCountingTrainer key={bars} bars={bars} tracks={bars === 32 ? props.longTracks : props.tracks} catalogKind={bars === 32 ? "demo" : props.catalogKind} /> : <BeatTrainer {...props} />;
}
