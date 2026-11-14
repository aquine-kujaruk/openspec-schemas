import { describe, expect, it } from "vitest";
import { DEFAULTS } from "./project.ts";
import { resolveConfig } from "./config.ts";

/** Spec: `implementer`, "Project configuration overrides the implementer's defaults". */
const at = (o: object, path: string): unknown => path.split(".").reduce<any>((v, k) => v?.[k], o);
const set = (path: string, value: unknown): object =>
  path
    .split(".")
    .reverse()
    .reduce<unknown>((v, k) => ({ [k]: v }), value) as object;

describe("project configuration overrides the implementer's defaults", () => {
  it.each([
    ["modules", "src/*", "src/v3/*", "src/v3/*"],
    ["review.threshold", 0.85, 0.9, 0.9],
  ])("the project sets %s from %s to %s", (setting, byDefault, override, resolved) => {
    expect(at(DEFAULTS, setting)).toBe(byDefault);
    expect(at(resolveConfig(DEFAULTS, set(setting, override)), setting)).toBe(resolved);
  });
  it.each([["review.spanLines", 40, "review.threshold", 0.9]])(
    "%s keeps its default %s when the project sets only %s",
    (setting, byDefault, changed, override) => {
      expect(at(resolveConfig(DEFAULTS, set(changed, override)), setting)).toBe(byDefault);
    },
  );
  it.each([["modules", "src/*"]])(
    "without a project configuration %s is %s",
    (setting, byDefault) => {
      expect(at(resolveConfig(DEFAULTS, undefined), setting)).toBe(byDefault);
    },
  );
  it("an array the project sets replaces the default", () => {
    const resolved = resolveConfig(DEFAULTS, { allowUnmatched: ["only/**"] });
    expect(resolved.allowUnmatched).toEqual(["only/**"]);
  });
});
