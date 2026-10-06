import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://blueclue.test";

function createWorker() {
  const stores = new Map();
  const listeners = new Map();
  const failures = new Set();
  const specification = { id: "build-demo", assets: ["/_next/static/app.js", "/manifest.webmanifest"], audio: Array.from({ length: 5 }, (_, index) => `/tracks/${index}.wav?v=demo`), audioBytes: 20 };
  let offline = false;
  let networkCalls = 0;
  const keyOf = resource => new URL(typeof resource === "string" ? resource : resource.url, origin).href;
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async put(resource, response) { entries.set(keyOf(resource), response.clone()); },
        async match(resource) { return entries.get(keyOf(resource))?.clone(); },
        async delete(resource) { return entries.delete(keyOf(resource)); }
      };
    }
  };
  const context = vm.createContext({
    URL, Headers, Response, AbortSignal, caches, crypto,
    self: { location: { origin }, clients: { claim: async () => {} }, skipWaiting: async () => {}, addEventListener: (type, handler) => listeners.set(type, handler) },
    fetch: async resource => {
      networkCalls++;
      const url = new URL(typeof resource === "string" ? resource : resource.url, origin);
      if (offline || failures.has(url.pathname)) throw new Error("Network unavailable");
      if (url.pathname === "/offline-pack") return Response.json(specification);
      if (url.pathname === "/") return new Response(`<html><head><meta name="blueclue-pack" content="${specification.id}"/></head><body>Beat Trainer</body></html>`);
      return new Response(new Uint8Array([1, 2, 3, 4]), { headers: { "Content-Type": url.pathname.endsWith(".wav") ? "audio/wav" : "text/javascript" } });
    }
  });
  vm.runInContext(source, context);
  return { context, caches, listeners, failures, specification, setOffline: value => { offline = value; }, networkCalls: () => networkCalls };
}

test("audio offline: rango Safari 0-1, abierto, sufijo y límite final", async () => {
  const { context } = createWorker();
  for (const [range, expected, contentRange] of [["bytes=0-1", [1, 2], "bytes 0-1/4"], ["bytes=2-", [3, 4], "bytes 2-3/4"], ["bytes=-1", [4], "bytes 3-3/4"], ["bytes=1-99", [2, 3, 4], "bytes 1-3/4"]]) {
    const response = await context.rangeResponse(new Response(new Uint8Array([1, 2, 3, 4])), range);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("Content-Range"), contentRange);
    assert.equal(response.headers.get("Content-Length"), String(expected.length));
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], expected);
  }
});

test("audio offline: rangos inválidos devuelven 416", async () => {
  const { context } = createWorker();
  for (const range of ["bytes=9-", "bytes=3-2", "bytes=-0", "bytes=-", "bytes=0-1,3-4", "garbage", "bytes=9007199254740992-"]) {
    const response = await context.rangeResponse(new Response(new Uint8Array(4)), range);
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get("Content-Range"), "bytes */4");
  }
});

test("solo declara listo un paquete completo de app y cinco pistas", async () => {
  const { context, specification } = createWorker();
  assert.equal(await context.verifiedPack(), null);
  const reports = [];
  const result = await context.downloadPack(specification.id, report => reports.push(report));
  assert.equal(result.id, specification.id);
  assert.ok(result.bytes > 20);
  const pack = await context.verifiedPack();
  assert.equal(pack.resources.length, 8);
  assert.equal(reports.at(-1).completed, reports.at(-1).total);
});

test("descarga interrumpida no deja un paquete listo ni caché parcial", async () => {
  const worker = createWorker();
  worker.failures.add("/tracks/3.wav");
  await assert.rejects(worker.context.downloadPack(worker.specification.id, () => {}));
  assert.equal(await worker.context.verifiedPack(), null);
  assert.deepEqual((await worker.caches.keys()).filter(name => name.startsWith("blueclue-pack")), []);
});

test("long practice downloads all ten audios and serves the long version offline", async () => {
  const worker = createWorker();
  worker.specification.audio.push(...Array.from({ length: 5 }, (_, index) => `/tracks/count-32/${index}.wav?v=demo`));
  worker.specification.audioBytes = 40;
  await worker.context.downloadPack(worker.specification.id, () => {});
  assert.equal((await worker.context.verifiedPack()).resources.length, 13);
  worker.setOffline(true);
  let response;
  worker.listeners.get("fetch")({ request: new Request(origin + worker.specification.audio[9], { headers: { Range: "bytes=0-1" } }), respondWith: promise => { response = promise; } });
  assert.equal((await response).status, 206);
});

test("a failed long-audio upgrade preserves the old five-track package", async () => {
  const worker = createWorker();
  await worker.context.downloadPack(worker.specification.id, () => {});
  worker.specification.id = "long-build";
  worker.specification.audio.push(...Array.from({ length: 5 }, (_, index) => `/tracks/count-32/${index}.wav?v=demo`));
  worker.specification.audioBytes = 40;
  worker.failures.add("/tracks/count-32/4.wav");
  await assert.rejects(worker.context.downloadPack(worker.specification.id, () => {}));
  assert.equal((await worker.context.verifiedPack()).id, "build-demo");
});

test("listening sample upgrades ten audios atomically and plays offline with Safari ranges", async () => {
  const worker = createWorker();
  worker.specification.audio.push(...Array.from({ length: 5 }, (_, index) => `/tracks/count-32/${index}.wav?v=demo`));
  worker.specification.audioBytes = 40;
  await worker.context.downloadPack(worker.specification.id, () => {});
  worker.specification.id = "listening-build";
  worker.specification.audio.push("/tracks/listening/bass.wav?v=demo");
  worker.specification.audioBytes = 44;
  worker.failures.add("/tracks/listening/bass.wav");
  await assert.rejects(worker.context.downloadPack(worker.specification.id, () => {}));
  assert.equal((await worker.context.verifiedPack()).id, "build-demo");
  worker.failures.clear();
  await worker.context.downloadPack(worker.specification.id, () => {});
  assert.equal((await worker.context.verifiedPack()).resources.length, 14);
  worker.setOffline(true);
  let response;
  worker.listeners.get("fetch")({ request: new Request(origin + worker.specification.audio[10], { headers: { Range: "bytes=0-1" } }), respondWith: promise => { response = promise; } });
  assert.equal((await response).status, 206);
});

test("offline packs reject foreign URLs, duplicate resources and incomplete audio sets", async () => {
  for (const invalid of ["foreign", "duplicate", "missing"]) {
    const worker = createWorker();
    if (invalid === "foreign") worker.specification.audio[0] = "https://external.test/track.wav";
    if (invalid === "duplicate") worker.specification.audio[0] = worker.specification.audio[1];
    if (invalid === "missing") worker.specification.audio.pop();
    await assert.rejects(worker.context.downloadPack(worker.specification.id, () => {}), /no es válido/);
    assert.equal(await worker.context.verifiedPack(), null);
  }
});

test("una actualización fallida conserva el paquete anterior", async () => {
  const worker = createWorker();
  await worker.context.downloadPack(worker.specification.id, () => {});
  const original = await worker.context.verifiedPack();
  worker.specification.id = "next-build";
  worker.failures.add("/tracks/2.wav");
  await worker.context.downloadPack(worker.specification.id, () => {}).catch(() => {});
  assert.equal((await worker.context.verifiedPack())?.id, original.id);
});

test("no combina el catálogo de una pestaña vieja con una versión nueva", async () => {
  const worker = createWorker();
  await assert.rejects(worker.context.downloadPack("old-catalog", () => {}), /ha cambiado/);
  assert.equal(await worker.context.verifiedPack(), null);
});

test("si iOS elimina un recurso, deja de anunciar descarga completa", async () => {
  const worker = createWorker();
  await worker.context.downloadPack(worker.specification.id, () => {});
  const pack = await worker.context.readPack();
  await (await worker.caches.open(pack.cacheName)).delete(worker.specification.audio[0]);
  assert.equal(await worker.context.verifiedPack(), null);
});

test("sin servidor: navegación, recursos y audio parcial salen de caché", async () => {
  const worker = createWorker();
  await worker.context.downloadPack(worker.specification.id, () => {});
  worker.setOffline(true);
  let response;
  worker.listeners.get("fetch")({ request: { method: "GET", mode: "navigate", url: origin + "/", headers: new Headers() }, respondWith: promise => { response = promise; } });
  assert.match(await (await response).text(), /Beat Trainer/);
  worker.listeners.get("fetch")({ request: new Request(origin + worker.specification.audio[0], { headers: { Range: "bytes=0-1" } }), respondWith: promise => { response = promise; } });
  assert.equal((await response).status, 206);
  const calls = worker.networkCalls();
  worker.listeners.get("fetch")({ request: new Request(origin + "/_next/static/app.js"), respondWith: promise => { response = promise; } });
  assert.equal((await response).status, 200);
  assert.equal(worker.networkCalls(), calls);
});

test("no sirve HTML a peticiones RSC ni intercepta recursos externos", () => {
  const worker = createWorker();
  for (const url of [origin + "/?_rsc=test", "https://external.test/tracks/1.wav", origin + "/health"]) {
    worker.listeners.get("fetch")({ request: new Request(url), respondWith: () => assert.fail("Unexpected interception") });
  }
});

test("eliminar descarga conserva los almacenamientos ajenos al paquete", async () => {
  const worker = createWorker();
  await worker.caches.open("another-app");
  await worker.context.downloadPack(worker.specification.id, () => {});
  await worker.context.removePack();
  assert.equal(await worker.context.verifiedPack(), null);
  assert.ok((await worker.caches.keys()).includes("another-app"));
});
