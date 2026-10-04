import assert from "node:assert/strict";
import test from "node:test";
import { handleTapKeyDown } from "./tapInput.ts";

test("Enter records on key down and prevents a second native click", () => {
  let taps = 0;
  let prevented = 0;
  handleTapKeyDown({ key: "Enter", repeat: false, preventDefault: () => { prevented++; } }, () => { taps++; });
  assert.equal(taps, 1);
  assert.equal(prevented, 1);
});

test("holding Enter cannot generate a stream of scored attempts", () => {
  let taps = 0;
  let prevented = 0;
  const onTap = () => { taps++; };
  const preventDefault = () => { prevented++; };
  handleTapKeyDown({ key: "Enter", repeat: false, preventDefault }, onTap);
  for (let repeat = 0; repeat < 20; repeat++) handleTapKeyDown({ key: "Enter", repeat: true, preventDefault }, onTap);
  assert.equal(taps, 1);
  assert.equal(prevented, 21);
  handleTapKeyDown({ key: "Enter", repeat: false, preventDefault }, onTap);
  assert.equal(taps, 2);
});

test("Space and navigation keys remain available without scoring", () => {
  for (const key of [" ", "Tab", "Escape", "ArrowDown"]) {
    handleTapKeyDown({ key, repeat: false, preventDefault: () => assert.fail("Unrelated key intercepted") }, () => assert.fail("Unexpected tap"));
  }
});
