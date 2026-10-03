import assert from "node:assert/strict";
import test from "node:test";
import { getCountIn } from "./countIn.ts";

test("flat preparation becomes 4 3 2 then lands once on musical 1", () => {
  assert.deepEqual(getCountIn(0, 3.5, 120), { phase: "settle", count: null });
  assert.equal(getCountIn(2, 3.5, 120)?.count, 4);
  assert.equal(getCountIn(2.5, 3.5, 120)?.count, 3);
  assert.equal(getCountIn(3, 3.5, 120)?.count, 2);
  assert.deepEqual(getCountIn(3.5, 3.5, 120), { phase: "landing", count: 1 });
  assert.equal(getCountIn(4, 3.5, 120), null);
  assert.equal(getCountIn(NaN, 3.5, 120), null);
});

test("count-in spacing matches music at all practice rates and tempos", () => {
  for (const bpm of [90, 122, 128]) for (const speed of [0.65, 0.8, 1]) {
    const beat = 60 / bpm;
    for (const count of [4, 3, 2, 1]) {
      const realTime = (3.5 - (count - 1) * beat) / speed;
      assert.equal(getCountIn(realTime * speed + 1e-8, 3.5, bpm)?.count, count);
    }
  }
});
