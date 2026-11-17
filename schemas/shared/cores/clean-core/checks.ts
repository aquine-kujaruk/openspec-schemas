import { posix } from "node:path";
import type { Check } from "factory/sdk";

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
 * The checks that only make sense once every workstream's work is joined: no workstream owns them.
 * `factory check` runs them after every workstream's rules, and verify runs them; a workstream's
 * own check and the completion gate do not.
 */
export const wholeProduct: Check[] = [
    {
      id: "no-unused-files",
      args: ["dead-code", "--quiet"],
      config: (o) => ({
        entry: [
          ...o.entry,
          `${o.acceptance}/**/*.test.ts`,
          `${o.integration}/**/*.test.ts`,
          // The end-to-end tests of a web product and the configuration they run with.
          `${o.e2e}/**/*.e2e.ts`,
          "e2e.config.ts",
          // The helpers beside the acceptance root (`test/*.ts`), in the product's own folder.
          `${posix.dirname(o.acceptance)}/*.ts`,
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
];
