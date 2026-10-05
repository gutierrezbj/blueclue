"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { BeatTrainer } from "./BeatTrainer";
import { EightBarTrainer } from "./EightBarTrainer";

export function TrainingApp(props: ComponentProps<typeof BeatTrainer>) {
  const [eightBars, setEightBars] = useState(false);
  useEffect(() => {
    function navigate() { setEightBars(window.location.hash === "#compases"); }
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [eightBars]);
  return eightBars ? <EightBarTrainer tracks={props.tracks} catalogKind={props.catalogKind} /> : <BeatTrainer {...props} />;
}
