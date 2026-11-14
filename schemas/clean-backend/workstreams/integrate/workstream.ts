import type { WorkstreamDeclaration } from "../../../../toolkit/core/types.ts";

const OFF = [
  "unused-exports",
  "unused-types",
  "private-type-leaks",
  "unused-dependencies",
  "unused-dev-dependencies",
  "unused-optional-dependencies",
  "unused-enum-members",
  "unused-class-members",
  "unresolved-imports",
  "unlisted-dependencies",
  "duplicate-exports",
  "circular-dependencies",
  "re-export-cycle",
  "type-only-dependencies",
  "test-only-dependencies",
  "dev-dependencies-in-production",
  "coverage-gaps",
  "stale-suppressions",
];

/**
 * Reduce over clean-architecture: the whole product wired. No layer of its own; it owns the checks
 * that only make sense once everything is connected.
 */
export default {
  layers: () => [],
  checks: [
    {
      id: "no-unused-files",
      args: ["dead-code", "--quiet"],
      config: (o) => ({
        entry: [
          ...o.entry,
          `${o.acceptance}/**/*.test.ts`,
          `${o.integration}/**/*.test.ts`,
          "test/*.ts",
          "factory.config.ts",
        ],
        rules: { "unused-files": "error", ...Object.fromEntries(OFF.map((r) => [r, "off"])) },
      }),
    },
    {
      id: "duplication-below-threshold",
      args: ["dupes", "--threshold", "4", "--quiet"],
      config: (o) => ({ ignorePatterns: [`${o.acceptance}/**/*.feature.test.ts`] }),
    },
  ],
} satisfies WorkstreamDeclaration;
