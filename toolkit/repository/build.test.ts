import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import manifest from "../../packages/backend.ts";
import { build } from "./build.ts";
import { PACKAGE_ROOT } from "../core/paths.ts";

/** Every file under `dir` with the hash of its content. */
const tree = (dir: string): Record<string, string> =>
  Object.fromEntries(
    (readdirSync(dir, { recursive: true }) as string[])
      .filter((f) => statSync(join(dir, f)).isFile())
      .sort()
      .map((f) => [f, createHash("sha256").update(readFileSync(join(dir, f))).digest("hex")]),
  );

const out = () => mkdtempSync(join(tmpdir(), "backend-"));

describe("the backend package", () => {
  it("pins the tools at the versions this repository runs them", () => {
    const { dependencies } = JSON.parse(
      readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"),
    ) as { dependencies: Record<string, string> };
    expect(manifest.tools).toEqual(dependencies);
  });

  it("holds what a project installs", async () => {
    const { dir, record } = await build("backend", { out: out() });
    const files = Object.keys(tree(dir));
    const skills = files.filter((f) => f.endsWith("/SKILL.md") && f.split("/").length === 4);
    expect(skills.map((f) => f.split("/")[2]).sort()).toEqual(
      ["archive", "feedback", "implement", "plan", "setup", "verify"].sort(),
    );
    expect(files).toContain(`.apm/skills/setup/assets/${record.command}`);
    expect(files).toContain(".apm/instructions/flow.instructions.md");
    for (const workstream of record.schemas["clean-backend"]!.workstreams)
      expect(files).toContain(`.apm/skills/implement/references/workstreams/${workstream}/SKILL.md`);
    expect(parse(readFileSync(join(dir, "apm.yml"), "utf8"))).toMatchObject({
      name: "backend",
      version: record.version,
      targets: ["claude", "codex"],
      dependencies: {
        apm: [
          `aquine-kujaruk/feat2test/skills/gherkin-craft#v${record.tools.feat2test}`,
          `aquine-kujaruk/opsx-gherkin/skills/opsx-gherkin#v${record.tools["opsx-gherkin"]}`,
        ],
        lsp: [{ name: "typescript" }],
      },
    });
  });

  it("is the same, byte for byte, when built twice", async () => {
    const [first, second] = [await build("backend", { out: out() }), await build("backend", { out: out() })];
    expect(tree(second.dir)).toEqual(tree(first.dir));
  });
});
