import { existsSync, globSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { ownerOf } from "./graph.ts";
import { mergedSpecs } from "../flow/merged.ts";
import {
  ARCHITECTURE_SPECS,
  DEVELOPING,
  PACKAGE_ROOT,
  PROJECT_ROOT,
  runTool,
} from "../core/paths.ts";
import { architecture, config, WORKSTREAM_DIRS } from "./project.ts";
import { loadSchema, schemaNames } from "../repository/schema.ts";
import { emitSchema, schemaFiles } from "../repository/schema-yaml.ts";

/**
 * `factory generate [--check]`: the tests come from the specs.
 *
 * Every product spec the configured `productSpecs` glob finds
 * (`openspec/specs/<module>/<use-case>/spec.md` by default), as it will stand once the changes that
 * validation reports ready are archived, is converted to plain Gherkin in memory
 * (opsx-gherkin) and piped into feat2test, which writes
 * `<acceptance>/<module>/<use-case>.feature.test.ts` next to the step adapter the implementer writes
 * (`<use-case>.feature.steps.ts`, scaffolded on the first run and kept afterwards).
 *
 * In the repository that develops the schemas, its own tests are generated the same way: every
 * `openspec/specs/architecture/<layer>/spec.md` whose name is a layer of some workstream becomes
 * `workstreams/<workstream>/<layer>.feature.test.ts`, and any other capability is generated into
 * the folder that holds its adapter, `<capability>.feature.steps.ts` (`review/`, a validator's
 * folder). A capability with neither (`linting`) is verified by running the pipeline, not
 * generated.
 *
 * In this repository it also writes each schema under `openspec/schemas/<name>` as the specification
 * tool reads it, so the repository's own changes use the schemas it builds.
 *
 * `--check` only verifies the tests are fresh; `--product-specs <glob>` overrides the configured glob.
 */
export const generate = async (args: string[]): Promise<number> => {
  const check = args.includes("--check");
  const flag = args.lastIndexOf("--product-specs");
  const productSpecs = flag >= 0 ? args[flag + 1]! : config.productSpecs;
  let failed = false;

  const write = (spec: string, dir: string, name: string) => {
    const gherkin = runTool("opsx-gherkin", [spec], { bin: "opsx-to-feature" });
    if (gherkin.status !== 0) {
      failed = true;
      console.error(`${spec}: ${gherkin.stderr.trim()}`);
      return;
    }
    const generated = runTool(
      "feat2test",
      [
        "generate",
        dir,
        "--stdin",
        "--format",
        "feature",
        "--source",
        `${name}.feature`,
        "--runner",
        "vitest",
        ...(check ? ["--check"] : []),
      ],
      { input: gherkin.stdout, show: true },
    );
    if (generated.status !== 0) failed = true;
  };

  if (DEVELOPING) {
    // The repository plans its own changes with the schemas it builds: the specification tool
    // reads them here, written from their definitions.
    for (const name of schemaNames()) {
      const schema = await loadSchema(name);
      const dir = join(PROJECT_ROOT, "openspec/schemas", name);
      if (!check) {
        rmSync(dir, { recursive: true, force: true });
        emitSchema(schema, dir);
      } else if (
        Object.entries(schemaFiles(schema)).some(
          ([path, text]) =>
            !existsSync(join(dir, path)) || readFileSync(join(dir, path), "utf8") !== text,
        )
      ) {
        failed = true;
        console.error(`out of date: openspec/schemas/${name}: run \`pnpm exec factory generate\``);
      }
    }
    const adapters = new Map(
      globSync("**/*.feature.steps.ts", {
        cwd: PACKAGE_ROOT,
        exclude: (f) => ["node_modules", "dist", "workstreams"].includes(f),
      }).map((f) => [basename(f, ".feature.steps.ts"), join(PACKAGE_ROOT, dirname(f))]),
    );
    for (const spec of globSync("openspec/specs/**/spec.md").sort()) {
      const capability = basename(dirname(spec));
      const owner = spec.startsWith(`${ARCHITECTURE_SPECS}/`)
        ? ownerOf(architecture.workstreams, capability)
        : undefined;
      const dir = owner ? WORKSTREAM_DIRS[owner.id] : adapters.get(capability);
      if (dir) write(spec, dir, capability);
    }
  }

  let merged: Awaited<ReturnType<typeof mergedSpecs>>;
  try {
    merged = await mergedSpecs(PROJECT_ROOT);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
  try {
    const from = merged?.root ?? PROJECT_ROOT;
    for (const spec of globSync(productSpecs, { cwd: from }).sort()) {
      const useCase = basename(dirname(spec));
      const module = basename(dirname(dirname(spec)));
      const dir = `${config.acceptance}/${module}`;
      if (!check) mkdirSync(dir, { recursive: true });
      write(join(from, spec), dir, useCase);
    }
  } finally {
    merged?.dispose();
  }
  return failed ? 1 : 0;
};
