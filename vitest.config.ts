import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * One test project per holder of workstreams (every core under `schemas/shared/cores`, and every
 * schema with workstreams of its own), each run with that holder's defaults (`FACTORY_HOLDER`), so
 * that a layer's examples are verified with the defaults of whoever holds its workstream. The
 * toolkit's tests over the loaded workstreams run once per holder; every other test runs once.
 */
const CORES = "schemas/shared/cores";
const folders = (dir: string, holds: (name: string) => boolean): string[] =>
  existsSync(dir) ? readdirSync(dir).filter(holds).sort() : [];
const holders = [
  ...folders(CORES, (c) => existsSync(join(CORES, c, "core.ts"))).map((c) => ({ name: c, dir: join(CORES, c) })),
  ...folders("schemas", (s) => s !== "shared" && existsSync(join("schemas", s, "workstreams"))).map((s) => ({
    name: s,
    dir: join("schemas", s),
  })),
];
/** The toolkit's tests over the workstreams a run loads. */
const PER_HOLDER = [
  "case-ids",
  "factory",
  "module-rules",
  "record-findings",
  "rule-ids",
  "scaffolds",
].map((t) => `toolkit/architecture/${t}.test.ts`);

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
    projects: [
      ...holders.map(({ name, dir }) => ({
        extends: true as const,
        test: { name, include: [`${dir}/workstreams/**/*.test.ts`, ...PER_HOLDER], env: { FACTORY_HOLDER: name } },
      })),
      {
        extends: true as const,
        test: {
          name: "repository",
          include: ["toolkit/**/*.test.ts", "schemas/**/*.test.ts"],
          exclude: [...PER_HOLDER, ...holders.map(({ dir }) => `${dir}/workstreams/**`), "**/node_modules/**"],
        },
      },
    ],
  },
});
