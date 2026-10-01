"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { TrainingTrack } from "./tracks";

export function useWaveformPlayer(track: TrainingTrack) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<WaveSurfer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsReady(false);
    setError(null);

    const player = WaveSurfer.create({
      container: containerRef.current,
      url: track.audioFile,
      waveColor: "#6a88a2",
      progressColor: "#68e0c4",
      cursorColor: "#f7fcf9",
      cursorWidth: 2,
      height: 144,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: true,
      autoScroll: false,
      backend: "MediaElement"
    });
    playerRef.current = player;
    player.on("ready", (loadedDuration) => {
      setDuration(loadedDuration);
      setIsReady(true);
    });
    player.on("timeupdate", setCurrentTime);
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("finish", () => setIsPlaying(false));
    player.on("error", () => {
      setError("No se pudo cargar esta pista. Prueba con otra.");
      setIsReady(false);
    });

    return () => {
      playerRef.current = null;
      player.destroy();
    };
  }, [track]);

  const play = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (player.getCurrentTime() >= player.getDuration() - 0.05) player.setTime(0);
      await player.play();
      setError(null);
    } catch {
      setError("El navegador no pudo iniciar el audio. Pulsa Play otra vez.");
    }
  }, []);

  const pause = useCallback(() => playerRef.current?.pause(), []);
  const seek = useCallback((time: number) => playerRef.current?.setTime(time), []);
  const getTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);

  return { containerRef, currentTime, duration, isPlaying, isReady, error, play, pause, seek, getTime };
}
