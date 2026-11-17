import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  scratchProject,
  write,
} from "../../shared/infrastructure/adapters/testing.ts";

/** Spec: `architecture/linting`, "Files that carry markup are checked like any other source file". */
const CLI = fileURLToPath(new URL("../../main.ts", import.meta.url));

describe("files that carry markup are checked like any other source file", () => {
  it.each([
    ["src/billing/domain/entities/invoice.entity.ts"],
    ["src/billing/domain/entities/invoice.entity.tsx"],
  ])(
    "no-environment broken in %s is reported",
    (file) => {
      const root = scratchProject("markup-");
      write(root, file, "export const at = () => process.cwd();\n");
      const r = spawnSync(
        process.execPath,
        [CLI, "check", "--layer", "domain"],
        { cwd: root, encoding: "utf8" },
      );
      expect(r.status).not.toBe(0);
      expect(`${r.stdout}${r.stderr}`).toContain("no-environment");
      expect(`${r.stdout}${r.stderr}`).toContain(file.split("/").pop());
    },
    120_000,
  );
});
