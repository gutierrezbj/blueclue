import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const palettes = [...css.matchAll(/:root(?:\:has\(\[data-level="(count|downbeat)"\]\))?\s*\{([^}]+)\}/g)]
  .map((match) => ({ id: match[1] ?? "pulse", tokens: Object.fromEntries([...match[2].matchAll(/--level-([\w-]+):\s*(#[\da-f]+);/g)].map((token) => [token[1], token[2]])) }))
  .filter((palette) => palette.tokens.accent);

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("level palettes provide complete tokens and the approved three identities", () => {
  assert.deepEqual(palettes.map(({ id, tokens }) => [id, tokens.accent]), [["pulse", "#68e0c4"], ["count", "#75baff"], ["downbeat", "#ffdb00"]]);
  for (const { tokens } of palettes) assert.deepEqual(Object.keys(tokens).sort(), Object.keys(palettes[0].tokens).sort());
  assert.equal(palettes[2].tokens.background, "#090909");
  const references = [...css.matchAll(/var\(--level-([\w-]+)\)/g)].map((match) => match[1]);
  for (const name of references) assert.ok(name in palettes[0].tokens, `Missing token ${name}`);
});

test("level accents and TAP text retain AA contrast without recoloring feedback", () => {
  for (const { id, tokens } of palettes) {
    for (const surface of ["background", "surface", "field", "soft"]) {
      assert.ok(contrast(tokens.accent, tokens[surface]) >= 4.5, `${id}: accent on ${surface}`);
    }
    for (const fill of ["accent", "accent-end", "hover"]) {
      assert.ok(contrast(tokens.ink, tokens[fill]) >= 4.5, `${id}: TAP text on ${fill}`);
    }
  }
  assert.match(css, /\.result-badge\.clavado\s*\{\s*color: #77edc6;/);
  assert.match(css, /\.result-badge\.cerca\s*\{\s*color: #efce88;/);
  assert.match(css, /\.result-badge\.tarde\s*\{\s*color: #ffac91;/);
});
