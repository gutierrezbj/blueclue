"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { TrainingTrack } from "./tracks";
import { WAVEFORM_SECONDS, type WaveformWindow } from "./waveformWindow";
import type { PlaybackSpeed } from "./playbackSpeed";

export function useWaveformPlayer(track: TrainingTrack, enabled = true, playbackSpeed: PlaybackSpeed = 1, appearanceKey = "pulse") {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<WaveSurfer | null>(null);
  const speedRef = useRef(playbackSpeed);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadedTrackId, setLoadedTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<{ time: number } | null>(null);
  const [viewport, setViewport] = useState<WaveformWindow>({ start: 0, end: WAVEFORM_SECONDS });

  useEffect(() => {
    speedRef.current = playbackSpeed;
    const player = playerRef.current;
    if (player) player.setPlaybackRate(playbackSpeed, true);
  }, [playbackSpeed]);

  useEffect(() => {
    if (!containerRef.current || !enabled) return;

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsReady(false);
    setLoadedTrackId(null);
    setError(null);
    setViewport({ start: 0, end: WAVEFORM_SECONDS });
    let pixelsPerSecond = Math.max(1, containerRef.current.clientWidth / WAVEFORM_SECONDS);

    const player = WaveSurfer.create({
      container: containerRef.current,
      url: track.audioFile,
      waveColor: "#6a88a2",
      progressColor: "#68e0c4",
      cursorColor: "#f7fcf9",
      cursorWidth: 2,
      height: "auto",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: true,
      minPxPerSec: pixelsPerSecond,
      autoScroll: true,
      autoCenter: true,
      hideScrollbar: true,
      backend: "MediaElement"
    });
    playerRef.current = player;
    function pauseWhenHidden() {
      if (document.visibilityState === "hidden") player.pause();
    }
    const pauseOnPageHide = () => player.pause();
    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("pagehide", pauseOnPageHide);
    player.setPlaybackRate(speedRef.current, true);
    player.on("interaction", (time) => setInteraction({ time }));
    function syncViewport() {
      if (player.getWidth() === 0) return;
      const width = player.getWrapper().scrollWidth;
      const secondsPerPixel = width > 0 ? player.getDuration() / width : 0;
      if (secondsPerPixel > 0) {
        setViewport({ start: player.getScroll() * secondsPerPixel, end: (player.getScroll() + player.getWidth()) * secondsPerPixel });
      }
    }
    function resizeViewport() {
      if (player.getWidth() === 0) return;
      const nextPixelsPerSecond = Math.max(1, player.getWidth() / WAVEFORM_SECONDS);
      if (Math.abs(pixelsPerSecond - nextPixelsPerSecond) > 0.01 && player.getDecodedData()) {
        pixelsPerSecond = nextPixelsPerSecond;
        player.zoom(pixelsPerSecond);
      }
      player.setScrollTime(Math.max(0, player.getCurrentTime() - WAVEFORM_SECONDS / 2));
      syncViewport();
    }
    player.on("ready", (loadedDuration) => {
      player.setPlaybackRate(speedRef.current, true);
      setDuration(loadedDuration);
      setLoadedTrackId(track.id);
      setIsReady(true);
      resizeViewport();
    });
    player.on("scroll", (start, end) => { if (end > start) setViewport({ start, end }); });
    player.on("redrawcomplete", syncViewport);
    player.on("resize", resizeViewport);
    player.on("timeupdate", (time) => {
      setCurrentTime(time);
    });
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("finish", () => setIsPlaying(false));
    player.on("error", () => {
      setError("No se pudo cargar esta pista. Prueba con otra.");
      setIsReady(false);
    });

    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("pagehide", pauseOnPageHide);
      playerRef.current = null;
      player.destroy();
    };
  }, [track, enabled]);

  useEffect(() => {
    if (!containerRef.current || !playerRef.current) return;
    const styles = getComputedStyle(containerRef.current);
    playerRef.current.setOptions({
      progressColor: styles.getPropertyValue("--level-accent").trim(),
      waveColor: styles.getPropertyValue("--level-wave").trim()
    });
  }, [appearanceKey, track, enabled]);

  const play = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (player.getCurrentTime() >= player.getDuration() - 0.05) {
        player.setTime(0);
        player.setScroll(0);
      }
      await player.play();
      setError(null);
    } catch {
      setError("El navegador no pudo iniciar el audio. Pulsa Play otra vez.");
    }
  }, []);

  const pause = useCallback(() => playerRef.current?.pause(), []);
  const seek = useCallback((time: number) => {
    playerRef.current?.setTime(time);
    if (time === 0) playerRef.current?.setScroll(0);
  }, []);
  const getTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);

  const isCurrentTrack = loadedTrackId === track.id;
  return { containerRef, currentTime, duration, viewport, interaction, isPlaying: isPlaying && isCurrentTrack, isReady: isReady && isCurrentTrack, error, play, pause, seek, getTime };
}
