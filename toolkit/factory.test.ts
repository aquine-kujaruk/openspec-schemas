import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT, WORKSTREAMS_DIR } from "./paths.ts";
import { architecture } from "./project.ts";

/**
 * Spec: `implementer`. A workstream folder holds everything its agent reads, and `factory check`
 * refuses an unknown workstream.
 */
const CLI = fileURLToPath(new URL("./cli.ts", import.meta.url));

/** The files a workstream folder lacks: its declaration, its skill, and four per owned layer. */
export const missingFiles = (dir: string, layers: string[]): string[] =>
  [
    "workstream.ts",
    "SKILL.md",
    ...layers.flatMap((l) =>
      ["rules.ts", "examples.md", "feature.steps.ts", "feature.test.ts"].map((s) => `${l}.${s}`),
    ),
  ]
    .map((f) => join(dir, f))
    .filter((f) => !existsSync(f))
    .map((f) => relative(PACKAGE_ROOT, f));

describe("a workstream folder holds everything its agent reads", () => {
  for (const w of architecture.workstreams)
    it(`${w.id}: its declaration, its skill and the files of ${w.layers.map((l) => l.name).join(", ") || "no layer"}`, () => {
      expect(
        missingFiles(
          join(WORKSTREAMS_DIR, w.id),
          w.layers.map((l) => l.name),
        ),
      ).toEqual([]);
    });

  it("a missing file is named by its path in the repository", () => {
    expect(missingFiles(join(WORKSTREAMS_DIR, "app-domain"), ["nothing"])).toEqual(
      ["rules.ts", "examples.md", "feature.steps.ts", "feature.test.ts"].map(
        (s) => `workstreams/app-domain/nothing.${s}`,
      ),
    );
  });
});

describe("a workstream can be checked alone", () => {
  it.each([
    ["--workstream", "Workstreams", architecture.workstreams.map((w) => w.id)],
    ["--layer", "Layers", architecture.workstreams.flatMap((w) => w.layers.map((l) => l.name))],
  ])("an unknown %s exits 2 listing the declared ones", (flag, label, declared) => {
    const r = spawnSync(process.execPath, [CLI, "check", flag, "nothing"], { encoding: "utf8" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain(`${label}: ${declared.join(", ")}`);
  });
});
