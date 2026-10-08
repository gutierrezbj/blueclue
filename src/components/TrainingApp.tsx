"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { BeatTrainer } from "./BeatTrainer";
import { BarCountingTrainer } from "./BarCountingTrainer";
import { ListeningPractice } from "./ListeningPractice";
import { SoundsIntro } from "./SoundsIntro";
import { LatencyCheck } from "./LatencyCheck";
import type { ListeningTrack } from "@/lib/listening";
import { variantsFor } from "@/lib/listeningVariants";
import { LearningMenu } from "./LearningMenu";
import { readAppRoute, type AppRoute } from "@/lib/navigation";
import { GUIDED_PATH_STORAGE_KEY, serializeGuidedPathState, stepForHash } from "@/lib/guidedPath";
import type { TrainingTrack } from "@/lib/tracks";

type Props = ComponentProps<typeof BeatTrainer> & {
  longTracks: TrainingTrack[];
  listeningTrack: ListeningTrack;
  percussionTrack: ListeningTrack;
  choiceTrack: ListeningTrack;
  listeningVariants: ListeningTrack[];
  audioVersion: string;
};

export function TrainingApp(props: Props) {
  const [route, setRoute] = useState<AppRoute>({ screen: "home" });
  useEffect(() => {
    function navigate() {
      const hash = window.location.hash;
      const next = readAppRoute(hash);
      const step = stepForHash(hash);
      if (step) {
        try { localStorage.setItem(GUIDED_PATH_STORAGE_KEY, serializeGuidedPathState(step.id)); } catch { /* sin almacenamiento: el camino sigue funcionando */ }
      }
      setRoute(current => next.screen === "practice" && !next.moduleId && current.screen === "practice" ? current : next);
    }
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [route.screen]);
  if (route.screen === "sounds") return <SoundsIntro audioVersion={props.audioVersion} />;
  if (route.screen === "latency") return <LatencyCheck />;
  if (route.screen === "bass" || route.screen === "percussion" || route.screen === "choice") {
    const base = route.screen === "bass" ? props.listeningTrack : route.screen === "percussion" ? props.percussionTrack : props.choiceTrack;
    return <ListeningPractice key={base.id} variants={variantsFor(base, props.listeningVariants)} />;
  }
  if (route.screen === "bars") {
    const bars = route.bars;
    return <BarCountingTrainer key={bars} bars={bars} tracks={bars === 32 ? props.longTracks : props.tracks} catalogKind={bars === 32 ? "demo" : props.catalogKind} />;
  }
  if (route.screen === "practice") return <BeatTrainer {...props} key={route.moduleId ?? "resume"} initialModule={route.moduleId} />;
  return <LearningMenu screen={route.screen} />;
}
