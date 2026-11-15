import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { change, delta, scratchProject } from "../core/testing.ts";

/** Spec: `implementer`, "Acceptance tests are generated from the product specs". */
const CLI = fileURLToPath(new URL("../cli.ts", import.meta.url));
const SPEC = "openspec/specs/demo/do-thing/spec.md";
const DEFAULT_ROOT = "openspec/specs/*/*/spec.md";

const spec = (rows: string[]) => `# demo/do-thing Specification

## Purpose

Scratch capability that doubles a number, to check acceptance generation.

## Requirements

### Requirement: A thing is done

The system SHALL double the given number.

#### Scenario Outline: doubling \`<input>\` gives \`<output>\`

- **GIVEN** the number \`<input>\` <!-- numberGiven -->
- **WHEN** the thing is done <!-- thingDone -->
- **THEN** the result is \`<output>\` <!-- resultIs -->

##### Examples:

  | input | output |
  | ----- | ------ |
${rows.map((r) => `  | ${r} |`).join("\n")}
`;

const repo = (rows: string[], path = SPEC) => {
  const cwd = scratchProject("generate-");
  mkdirSync(join(cwd, dirname(path)), { recursive: true });
  writeFileSync(join(cwd, path), spec(rows));
  return cwd;
};
const generate = (cwd: string, ...args: string[]) =>
  spawnSync(process.execPath, [CLI, "generate", "--product-specs", DEFAULT_ROOT, ...args], {
    cwd,
    encoding: "utf8",
  });

describe("acceptance tests are generated from the product specs", () => {
  it.each([
    [DEFAULT_ROOT, SPEC],
    ["openspec/specs/examples/*/*/spec.md", "openspec/specs/examples/demo/do-thing/spec.md"],
  ])(
    "under the root %s the product spec %s generates 2 tests",
    (root, path) => {
      const cwd = repo(["2     | 4      ", "5     | 10     "], path);
      const r = generate(cwd, "--product-specs", root);
      expect(r.status, r.stderr).toBe(0);
      const test = readFileSync(join(cwd, "test/acceptance/demo/do-thing.feature.test.ts"), "utf8");
      expect(test.match(/\btest\(/g)).toHaveLength(2);
      expect(existsSync(join(cwd, "test/acceptance/demo/do-thing.feature.steps.ts"))).toBe(true);
    },
    60_000,
  );

  it("a product spec changed after generation is stale", () => {
    const cwd = repo(["2     | 4      "]);
    expect(generate(cwd).status).toBe(0);
    writeFileSync(join(cwd, SPEC), spec(["2     | 4      ", "3     | 6      "]));
    expect(generate(cwd, "--check").status).not.toBe(0);
  }, 60_000);
});

/** Spec: `implementer`, "The command's own tests are generated from its specs as ready changes leave them". */
describe("in the command's repository, a ready change's delta has its tests before it is archived", () => {
  const REPOSITORY = fileURLToPath(new URL("../..", import.meta.url));
  const GENERATED = "toolkit/flow/verify.feature.test.ts";

  const copy = (): string => {
    const cwd = mkdtempSync(join(tmpdir(), "repository-"));
    const files = spawnSync("git", ["ls-files", "-co", "--exclude-standard"], {
      cwd: REPOSITORY,
      encoding: "utf8",
    })
      .stdout.split("\n")
      .filter((f) => f && !f.startsWith("openspec/changes/") && existsSync(join(REPOSITORY, f)));
    for (const file of files) {
      mkdirSync(join(cwd, dirname(file)), { recursive: true });
      cpSync(join(REPOSITORY, file), join(cwd, file));
    }
    symlinkSync(join(REPOSITORY, "node_modules"), join(cwd, "node_modules"));
    return cwd;
  };
  const scenarios = (cwd: string): number => {
    const r = spawnSync(process.execPath, [join(cwd, "toolkit/cli.ts"), "generate"], {
      cwd,
      encoding: "utf8",
    });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    return readFileSync(join(cwd, GENERATED), "utf8").split("\n").filter((l) => /^\s*test\(/.test(l))
      .length;
  };

  it("generates the scenario a ready change adds, and none for a change that is not ready", () => {
    const cwd = copy();
    const standing = scenarios(cwd);
    change(cwd, "probe", {
      schema: "spec-plan",
      deltas: { "flow/verify": delta() },
      parts: { questions: ["Which one?"] },
    });
    expect(scenarios(cwd)).toBe(standing);
    change(cwd, "probe", { schema: "spec-plan", deltas: { "flow/verify": delta() } });
    expect(scenarios(cwd)).toBe(standing + 1);
  });
});
