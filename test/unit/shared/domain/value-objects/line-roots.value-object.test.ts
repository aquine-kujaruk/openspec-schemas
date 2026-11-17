import { describe, expect, it } from "vitest";
import { LineRoots } from "../../../../../factory/shared/domain/value-objects/line-roots.value-object.ts";
import { ValidationException } from "../../../../../factory/shared/domain/exceptions/validation.exceptions.ts";

const roots = {
  modules: "packages/api/src/*",
  productSpecs: "openspec/specs/api/*/*/spec.md",
  entry: ["packages/api/src/main.ts", "packages/api/src/*.ts"],
  acceptance: "packages/api/suite/acceptance",
  unit: "packages/api/suite/unit",
  integration: "packages/api/suite/integration",
  e2e: "packages/api/suite/e2e",
  ignore: ["other/**", "!other/kept.ts"],
  base: ["shared/domain"],
  allowUnmatched: [".git/**"],
};

describe("LineRoots", () => {
  it("retains the resolved paths and ordered patterns exactly as configured", () => {
    expect(new LineRoots(roots)).toEqual(expect.objectContaining(roots));
  });

  it("keeps its own copy of configured lists", () => {
    const entries = ["src/main.ts"];
    const lineRoots = new LineRoots({ ...roots, entry: entries });

    entries.push("src/worker.ts");
    expect(lineRoots.entry).toEqual(["src/main.ts"]);
  });

  it("preserves default preparation when the optional base is absent", () => {
    const { base: _base, ...configured } = roots;
    expect(new LineRoots(configured).base).toBeUndefined();
  });

  it("reports invalid path shapes at construction", () => {
    const invalid = () => Reflect.construct(LineRoots, [{ ...roots, entry: [null] }]);
    expect(invalid).toThrow(ValidationException);
    expect(invalid).toThrow("LineRoots rejected its props");
  });
});
