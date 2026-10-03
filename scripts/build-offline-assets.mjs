import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
async function listAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(entry => {
    const location = path.join(directory, entry.name);
    return entry.isDirectory() ? listAssets(location) : [location.replaceAll("\\", "/").replace(/^\.next\//, "/_next/")];
  }));
  return paths.flat();
}

const assets = (await listAssets(".next/static")).filter(asset => !asset.endsWith(".map")).sort();
assets.push("/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png");
await writeFile("public/offline-assets.json", JSON.stringify({ buildId, assets }));
console.log(`Offline: ${assets.length} recursos, versión ${buildId}`);
