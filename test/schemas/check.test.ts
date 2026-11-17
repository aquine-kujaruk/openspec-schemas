import { resolve, sep } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createCheck } from "../../factory/quality/infrastructure/adapters/inspection.adapter.ts";
import { defaults } from "../../schemas/spec-plan/schema.ts";
import { wholeProduct } from "../../schemas/shared/cores/clean-core/checks.ts";

describe("whole-product checks", () => {
  it.each([
    { ignore: [], elsewhere: [] },
    { ignore: ["tools/**"], elsewhere: [] },
    { ignore: ["tools/**", "!tools/in-line.ts"], elsewhere: ["worker/**"] },
  ])("scope each check with $ignore and $elsewhere", async ({ ignore, elsewhere }) => {
    const config = { ...defaults, ignore, unit: "tests/core" };
    const writeFileSync = vi.fn();
    const { check } = createCheck({
      globSync: () => [],
      writeFileSync,
      join: (...parts) => parts.join("/"),
      resolve,
      sep,
      COVERAGE_RULE: "every-file-in-a-zone",
      fallowConfig: vi.fn(),
      oxlintConfig: vi.fn(),
      fileOf: vi.fn(),
      generate: vi.fn(),
      withUpstream: vi.fn(),
      cacheDir: () => ".fallow",
      jsonOf: vi.fn(),
      PROJECT_ROOT: ".",
      runTool: () => ({ status: 0, stdout: "", stderr: "" }),
      architecture: { ...defaults, workstreams: [], checks: wholeProduct },
      config,
      product: { elsewhere },
      archunitRules: vi.fn(),
    });

    expect(await check(["--whole"])).toBe(0);

    const written = Object.fromEntries(
      writeFileSync.mock.calls.map(([file, body]) => [file, JSON.parse(body)]),
    );
    const deadCode = written[".fallow/no-unused-files.json"];
    const duplicates = written[".fallow/duplication-below-threshold.json"];
    expect(deadCode.ignorePatterns ?? []).toEqual([...elsewhere, ...ignore]);
    expect(duplicates.ignorePatterns).toEqual([
      `${defaults.acceptance}/**/*.feature.test.ts`,
      ...elsewhere,
      ...ignore,
    ]);
    expect(deadCode.entry).toContain("tests/core/**/*.test.ts");
  });
});
