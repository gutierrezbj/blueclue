"use client";

import { useState } from "react";
import { ListeningTrainer } from "./ListeningTrainer";
import type { ListeningTrack } from "@/lib/listening";
import { pickAnotherVariant } from "@/lib/listeningVariants";

/** One listening practice: the approved sample plus any published variants. «Practicar otra vez» changes the sample; «Repetir» keeps it. */
export function ListeningPractice({ variants }: { variants: ListeningTrack[] }) {
  const [current, setCurrent] = useState(variants[0]);
  const track = variants.find(item => item.id === current.id) ?? variants[0];
  return <ListeningTrainer key={track.id} track={track} variantCount={variants.length}
    onAnother={variants.length > 1 ? () => setCurrent(pickAnotherVariant(variants, track.id, Math.random())) : undefined} />;
}
