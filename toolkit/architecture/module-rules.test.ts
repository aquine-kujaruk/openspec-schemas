import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { architecture } from "./project.ts";
import { ownRuleIds } from "./rules.ts";

/** Spec: `implementer`, "Module rules hold whatever the module root contains". */
describe("module rules hold whatever the module root contains", () => {
  it.each([[0], [1], [3]])("the module rules exist with %i modules", (modules) => {
    const cwd = mkdtempSync(join(tmpdir(), "modules-"));
    mkdirSync(join(cwd, "src"));
    for (let i = 0; i < modules; i++) mkdirSync(join(cwd, `src/module${i}`));
    const back = process.cwd();
    process.chdir(cwd);
    try {
      const ids = ownRuleIds(architecture, "clean-architecture");
      expect([...ids]).toEqual(
        expect.arrayContaining(["modules-are-isolated", "shared-imports-no-module"]),
      );
    } finally {
      process.chdir(back);
    }
  });
});
