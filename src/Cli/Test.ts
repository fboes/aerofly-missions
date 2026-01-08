import { strict as assert } from "node:assert";

export const assertEqualsRounded = (a: number, b: number, precision: number, message: string = "") => {
  assert.equal(Number(a.toFixed(precision)), Number(b.toFixed(precision)), message);
};
