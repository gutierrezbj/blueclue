import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#09141c"/><rect x="104" y="104" width="304" height="304" rx="80" fill="#67e0c3"/><path fill="#09272c" d="M175 159h75c48 0 72 20 72 53 0 22-12 37-31 44 25 6 40 23 40 49 0 35-28 53-76 53h-80zm42 36v45h31c22 0 32-8 32-23s-11-22-33-22zm0 77v50h36c25 0 36-8 36-25s-12-25-37-25z"/><circle cx="354" cy="344" r="14" fill="#0d7b71"/></svg>`;
await mkdir("public/icons", { recursive: true });
for (const [name, size] of [["icon-192", 192], ["icon-512", 512], ["apple-touch-icon", 180]]) {
  await writeFile(`public/icons/${name}.png`, await sharp(Buffer.from(artwork)).resize(size, size).png().toBuffer());
}
