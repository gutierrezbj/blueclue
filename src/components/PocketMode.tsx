"use client";

import { useEffect, useRef, useState } from "react";
import type { OfflinePack, OfflineStatus } from "@/lib/offlineTypes";

export function PocketMode({ pack }: { pack: OfflinePack | null }) {
  const [available, setAvailable] = useState(false);
  const [online, setOnline] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [status, setStatus] = useState<OfflineStatus>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Comprobando el modo bolsillo…");
  const workerRef = useRef<ServiceWorker | null>(null);
  const aliveRef = useRef(true);

  function request(type: "status" | "download" | "remove", worker = workerRef.current): Promise<OfflineStatus> {
    return new Promise((resolve, reject) => {
      if (!worker) return reject(new Error("El modo sin conexión aún no está preparado. Recarga e inténtalo de nuevo."));
      const channel = new MessageChannel();
      let timeout: ReturnType<typeof setTimeout>;
      function close() { clearTimeout(timeout); channel.port1.close(); }
      function renewTimeout() {
        clearTimeout(timeout);
        timeout = setTimeout(() => { close(); reject(new Error("La descarga se ha interrumpido. Mantén la app abierta y vuelve a intentarlo.")); }, 90000);
      }
      channel.port1.onmessage = event => {
        if (event.data.type === "progress") {
          renewTimeout();
          if (aliveRef.current) setProgress(Math.round(event.data.completed * 100 / event.data.total));
        } else {
          close();
          if (event.data.type === "error") reject(new Error(event.data.message));
          else resolve(event.data.status);
        }
      };
      renewTimeout();
      worker.postMessage({ type, id: pack?.id }, [channel.port2]);
    });
  }

  useEffect(() => {
    aliveRef.current = true;
    function connectionChanged() { setOnline(navigator.onLine); }
    function refreshStatus() {
      if (document.visibilityState !== "visible" || !workerRef.current) return;
      void request("status").then(value => { if (aliveRef.current) setStatus(value); }).catch(() => {});
    }
    connectionChanged();
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    window.addEventListener("online", connectionChanged);
    window.addEventListener("offline", connectionChanged);
    document.addEventListener("visibilitychange", refreshStatus);
    if (!pack) setMessage("La descarga está disponible en la versión de producción, no en desarrollo.");
    else if (!window.isSecureContext || !("serviceWorker" in navigator)) setMessage("Para instalar y descargar necesitas HTTPS y un navegador compatible.");
    else {
      void (async () => {
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const registration = await navigator.serviceWorker.ready;
        if (!aliveRef.current) return;
        workerRef.current = registration.active;
        setAvailable(true);
        setStatus(await request("status", registration.active));
        setMessage("");
      })().catch(() => { if (aliveRef.current) setMessage("No se pudo preparar el modo bolsillo. Recarga con conexión para reintentarlo."); });
    }
    return () => {
      aliveRef.current = false;
      window.removeEventListener("online", connectionChanged);
      window.removeEventListener("offline", connectionChanged);
      document.removeEventListener("visibilitychange", refreshStatus);
    };
  }, [pack?.id]);

  async function download() {
    setBusy(true);
    setProgress(0);
    setMessage("");
    try {
      if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
      setStatus(await request("download"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo descargar. Vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      setStatus(await request("remove"));
      setMessage("Descarga eliminada. Tu progreso sigue guardado en este dispositivo.");
    } catch {
      setMessage("No se pudo eliminar la descarga. Vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(pack && status?.id === pack.id);
  return <details className="pocket-card" id="pocket-mode">
    <summary><span>BlueClue en tu bolsillo</span><span>{busy ? `Descargando · ${progress} %` : ready ? "5 pistas disponibles sin conexión" : "iPhone · instalar y descargar"}</span></summary>
    <div className="pocket-content">
      <p>{installed ? "Estás en la app instalada. Descarga aquí antes de salir." : "En iPhone: abre en Safari → Compartir → Añadir a pantalla de inicio → Abrir como app (si aparece). Después abre BlueClue desde su icono y descarga allí."}</p>
      <p>Primero instala, después descarga. Safari y la app instalada pueden guardar datos por separado. El progreso no se sincroniza con el ordenador.</p>
      <p>{pack ? `Las cinco pistas de este catálogo ocupan ${(pack.audioBytes / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB, más la app. Usa Wi-Fi y mantén la app abierta durante la descarga.` : "Puedes seguir practicando online."}</p>
      <p role="status">{busy ? `Preparando app y cinco pistas: ${progress} %.` : message || (ready ? `Descarga completa · ${((status?.bytes ?? 0) / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB. Compruébala en modo avión antes de salir.` : status ? "Tienes una descarga anterior. Actualízala con conexión para guardar esta versión." : "Aún no hay un paquete completo sin conexión.")}</p>
      {!online && <p>Sin conexión detectada. {ready ? "Puedes practicar las cinco pistas descargadas." : "Necesitas conexión para completar la descarga."}</p>}
      {busy && <progress aria-label="Descarga del paquete" value={progress} max={100} />}
      <div className="pocket-actions">
        <button type="button" className="continue-button" disabled={!available || busy || !online} onClick={download}>{ready ? "Volver a descargar las 5 pistas" : status ? "Actualizar descarga" : "Descargar las 5 pistas"}</button>
        {status && <button type="button" className="previous-button" disabled={busy || !online} onClick={remove}>Eliminar descarga, conservar progreso</button>}
      </div>
      <p className="save-notice">iOS puede liberar almacenamiento. Revisa este estado antes de viajar. Al cambiar de app o bloquear la pantalla, la práctica se pausa; vuelve con Continuar. Para precisión, usa el altavoz o auriculares con cable: Bluetooth puede añadir retardo.</p>
    </div>
  </details>;
}
