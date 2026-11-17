import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prepareRoots as prepare } from "../../factory/engineering/infrastructure/adapters/plant.adapter.ts";

/** Spec: `implementer`, "The implementer prepares the configured roots before any workstream" and "Prepare lays the agreed base and touches nothing that exists". */
const roots = {
  modules: "src/*",
  acceptance: "test/acceptance",
  integration: "test/integration",
  unit: "test/unit",
};
const temp = () => mkdtempSync(join(tmpdir(), "prepare-"));
const exists = (cwd: string, dir: string) => {
  try {
    readdirSync(join(cwd, dir));
    return true;
  } catch {
    return false;
  }
};

describe("the implementer prepares the configured roots", () => {
  it.each([
    ["modules", "src/*", "src"],
    ["modules", "packages/*", "packages"],
    ["acceptance", "test/acceptance", "test/acceptance"],
    ["integration", "test/integration", "test/integration"],
    ["unit", "test/unit", "test/unit"],
    ["unit", "tests/core", "tests/core"],
  ])(
    "the missing root from %s = %s is created as %s",
    (setting, value, root) => {
      const cwd = temp();
      prepare(cwd, { ...roots, [setting]: value });
      expect(exists(cwd, root)).toBe(true);
    },
  );
});

describe("prepare lays the agreed base and touches nothing that exists", () => {
  it.each([
    [
      "src/*",
      undefined,
      "src",
      ["shared/domain", "shared/application", "shared/infrastructure"],
    ],
    [
      "modules/*",
      ["shared/domain", "core/lib"],
      "modules",
      ["shared/domain", "core/lib"],
    ],
  ])("modules %s with base %j lays %s/%j", (value, base, root, created) => {
    const cwd = temp();
    prepare(cwd, { ...roots, modules: value, base });
    for (const dir of created)
      expect(exists(cwd, `${root}/${dir}`), dir).toBe(true);
  });

  it("an existing root src holding src/main.ts is left as it is", () => {
    const cwd = temp();
    mkdirSync(join(cwd, "src"));
    writeFileSync(join(cwd, "src/main.ts"), "");
    prepare(cwd, roots);
    expect(readdirSync(join(cwd, "src"))).toEqual(["main.ts"]);
  });

  it("running it twice changes nothing the second time", () => {
    const cwd = temp();
    expect(prepare(cwd, roots).length).toBeGreaterThan(0);
    expect(prepare(cwd, roots)).toEqual([]);
  });
});
