"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { BeatTrainer } from "./BeatTrainer";
import { BarCountingTrainer } from "./BarCountingTrainer";
import { ListeningTrainer } from "./ListeningTrainer";
import type { ListeningTrack } from "@/lib/listening";
import { LearningMenu } from "./LearningMenu";
import { readAppRoute, type AppRoute } from "@/lib/navigation";
import type { TrainingTrack } from "@/lib/tracks";

export function TrainingApp(props: ComponentProps<typeof BeatTrainer> & { longTracks: TrainingTrack[]; listeningTrack: ListeningTrack; percussionTrack: ListeningTrack; choiceTrack: ListeningTrack }) {
  const [route, setRoute] = useState<AppRoute>({ screen: "home" });
  useEffect(() => {
    function navigate() {
      const next = readAppRoute(window.location.hash);
      setRoute(current => next.screen === "practice" && !next.moduleId && current.screen === "practice" ? current : next);
    }
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [route.screen]);
  if (route.screen === "bass" || route.screen === "percussion" || route.screen === "choice") {
    const track = route.screen === "bass" ? props.listeningTrack : route.screen === "percussion" ? props.percussionTrack : props.choiceTrack;
    return <ListeningTrainer key={track.id} track={track} />;
  }
  if (route.screen === "bars") {
    const bars = route.bars;
    return <BarCountingTrainer key={bars} bars={bars} tracks={bars === 32 ? props.longTracks : props.tracks} catalogKind={bars === 32 ? "demo" : props.catalogKind} />;
  }
  if (route.screen === "practice") return <BeatTrainer {...props} key={route.moduleId ?? "resume"} initialModule={route.moduleId} />;
  return <LearningMenu screen={route.screen} />;
}
