import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("menu return remains a labeled native home link with a decorative arrow", async () => {
  const source = await readFile(new URL("../src/components/LearningMenu.tsx", import.meta.url), "utf8");
  assert.match(source, /<a className="menu-back" href="#inicio" aria-label="Volver al inicio">/);
  assert.match(source, /className="menu-back-icon" aria-hidden="true">←<\/span><span>Inicio<\/span>/);
});

test("menu return preserves a 44px touch target and visible keyboard focus", async () => {
  const source = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(source, /\.menu-back, \.practice-menu-back\s*\{[^}]*min-height: 44px/);
  assert.match(source, /a:focus-visible[^}]*outline: 2px solid var\(--level-accent\)/);
  assert.match(source, /\.menu-back\s*\{[^}]*border-radius: 999px/);
});
