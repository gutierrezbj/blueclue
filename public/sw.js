const CONTROL_CACHE = "blueclue-control-v1";
const PACK_PREFIX = "blueclue-pack-v1-";
const ACTIVE_KEY = new URL("/__blueclue_active__", self.location.origin).href;
let modifyingPack = false;

self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

async function readPack() {
  const response = await (await caches.open(CONTROL_CACHE)).match(ACTIVE_KEY);
  return response ? response.json() : null;
}

async function verifiedPack() {
  const pack = await readPack();
  if (!pack) return null;
  const cache = await caches.open(pack.cacheName);
  for (const resource of pack.resources) {
    if (!await cache.match(resource)) return null;
  }
  return pack;
}

async function fetchFresh(url) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(60000) });
  if (!response.ok || response.status === 206 || response.redirected) throw new Error("No se pudo descargar un archivo completo. Revisa la conexión y vuelve a intentarlo.");
  return response;
}

async function downloadPack(expectedId, report) {
  const specification = await (await fetchFresh("/offline-pack")).json();
  if (!specification || specification.id !== expectedId) throw new Error("La app ha cambiado. Recarga antes de descargar las pistas.");
  const resources = ["/", ...specification.assets, ...specification.audio];
  if (![5, 10, 11, 12, 13].includes(specification.audio.length) || new Set(resources).size !== resources.length || resources.some(resource => typeof resource !== "string" || new URL(resource, self.location.origin).origin !== self.location.origin)) {
    throw new Error("El paquete de práctica no es válido.");
  }
  const cacheName = `${PACK_PREFIX}${crypto.randomUUID()}`;
  const cache = await caches.open(cacheName);
  let bytes = 0;
  let audioBytes = 0;
  try {
    for (const [index, resource] of resources.entries()) {
      const response = await fetchFresh(resource);
      if (resource === "/") {
        const html = await response.clone().text();
        if (!html.includes(`<meta name="blueclue-pack" content="${expectedId}"`)) throw new Error("El catálogo cambió durante la descarga. Recarga y vuelve a intentarlo.");
      }
      const size = (await response.clone().arrayBuffer()).byteLength;
      if (!size) throw new Error("Se recibió un archivo vacío. Vuelve a descargar.");
      bytes += size;
      if (specification.audio.includes(resource)) audioBytes += size;
      await cache.put(resource, response);
      report({ type: "progress", completed: index + 1, total: resources.length });
    }
    if (audioBytes !== specification.audioBytes) throw new Error("La música cambió durante la descarga. Recarga y vuelve a intentarlo.");
    const pack = { id: expectedId, cacheName, resources, bytes };
    await (await caches.open(CONTROL_CACHE)).put(ACTIVE_KEY, Response.json(pack));
  } catch (error) {
    await caches.delete(cacheName);
    throw error;
  }
  for (const name of await caches.keys()) {
    if (name.startsWith(PACK_PREFIX) && name !== cacheName) await caches.delete(name);
  }
  return { id: expectedId, bytes };
}

async function removePack() {
  await (await caches.open(CONTROL_CACHE)).delete(ACTIVE_KEY);
  for (const name of await caches.keys()) {
    if (name.startsWith(PACK_PREFIX)) await caches.delete(name);
  }
}

self.addEventListener("message", event => {
  const port = event.ports[0];
  if (!port || !event.source || new URL(event.source.url).origin !== self.location.origin) return;
  const report = message => port.postMessage(message);
  event.waitUntil((async () => {
    const action = event.data?.type;
    const modifies = action === "download" || action === "remove";
    if (modifies && modifyingPack) {
      report({ type: "error", message: "Hay otra descarga en curso. Espera a que termine." });
      return;
    }
    if (modifies) modifyingPack = true;
    try {
      if (action === "download") report({ type: "done", status: await downloadPack(event.data.id, report) });
      else if (action === "remove") {
        await removePack();
        report({ type: "done", status: null });
      } else if (action === "status") {
        const pack = await verifiedPack();
        report({ type: "done", status: pack ? { id: pack.id, bytes: pack.bytes } : null });
      }
    } catch (error) {
      report({ type: "error", message: error.name === "QuotaExceededError" ? "No queda espacio en el dispositivo. Libera almacenamiento y reintenta; tu progreso no se ha borrado." : error.message || "No se pudo preparar el modo sin conexión." });
    } finally {
      if (modifies) modifyingPack = false;
    }
  })());
});

async function rangeResponse(response, header) {
  const content = await response.arrayBuffer();
  const size = content.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  const invalid = () => new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  if (!match || (!match[1] && !match[2])) return invalid();
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return invalid();
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(content.slice(start, end + 1), { status: 206, headers });
}

async function cachedResponse(request, navigation = false) {
  const pack = await readPack();
  if (!pack) return null;
  const response = await (await caches.open(pack.cacheName)).match(navigation ? "/" : request.url);
  if (!response) return null;
  const range = request.headers.get("Range");
  return range ? rangeResponse(response, range) : response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { signal: AbortSignal.timeout(4000) });
        if (response.ok) return response;
        return await cachedResponse(request, true) ?? response;
      } catch {
        return await cachedResponse(request, true) ?? new Response("Abre BlueClue con conexión y descarga las cinco pistas antes de salir.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/tracks/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith((async () => await cachedResponse(request) ?? fetch(request))());
  }
});
