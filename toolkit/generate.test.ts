import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** Spec: `implementer`, "Acceptance tests are generated from the product specs". */
const CLI = fileURLToPath(new URL("./cli.ts", import.meta.url));
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
  const cwd = mkdtempSync(join(tmpdir(), "generate-"));
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
