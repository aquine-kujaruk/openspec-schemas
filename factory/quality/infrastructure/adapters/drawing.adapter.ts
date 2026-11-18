import type { DrawingAcl } from "../acl/drawing.acl.ts";

export class DrawingAdapter implements DrawingAcl {
  private readonly run: DrawingAcl["makeGauges"];

  constructor(run: DrawingAcl["makeGauges"]) {
    this.run = run;
  }

  makeGauges(args: readonly string[]) {
    return this.run(args);
  }
}

import type { DrawingTools, DrawingRecord } from "../acl/drawing.acl.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createGenerate = <Loaded>({
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  rmSync,
  basename,
  dirname,
  join,
  relative,
  layoutOf,
  testOf,
  productTestOf,
  mergedSpecs,
  DEVELOPING,
  PROJECT_ROOT,
  runTool,
  rubricExamples,
  config,
  loadSchema,
  schemaNames,
  emitSchema,
  schemaFiles,
}: DrawingTools<Loaded>): { generate(args: string[], record?: (drawing: DrawingRecord) => void): Promise<number> } => {
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
  const generate = async (args: string[], record?: (drawing: DrawingRecord) => void): Promise<number> => {
    const check = args.includes("--check");
    const flag = args.lastIndexOf("--product-specs");
    const productSpecs = flag >= 0 ? args[flag + 1]! : config.productSpecs;
    let failed = false;

    const write = (spec: string, dir: string, name: string, path?: string) => {
      const gherkin = runTool("opsx-gherkin", [spec], {
        bin: "opsx-to-feature",
      });
      if (gherkin.status !== 0) {
        failed = true;
        console.error(`${spec}: ${gherkin.stderr.trim()}`);
        return;
      }
      const feature = gherkin.stdout + (DEVELOPING && !path ? rubricExamples(dir, name) : "");
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
        { input: feature, show: true },
      );
      if (generated.status !== 0) failed = true;
      else if (path) record?.({ path, file: join(dir, `${name}.feature.test.ts`), gherkin: gherkin.stdout });
    };

    if (DEVELOPING) {
      for (const name of schemaNames()) {
        const schema = await loadSchema(name);
        const dir = join(PROJECT_ROOT, "openspec/schemas", name);
        if (!check) {
          rmSync(dir, { recursive: true, force: true });
          emitSchema(schema, dir);
        } else if (
          Object.entries(schemaFiles(schema)).some(
            ([path, text]) =>
              !existsSync(join(dir, path)) ||
              readFileSync(join(dir, path), "utf8") !== text,
          )
        ) {
          failed = true;
          console.error(
            `out of date: openspec/schemas/${name}: run \`pnpm exec factory generate\``,
          );
        }
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
      if (DEVELOPING) {
        const layout = await layoutOf(PROJECT_ROOT);
        for (const file of globSync("openspec/specs/**/spec.md", {
          cwd: from,
        }).sort()) {
          const spec = relative("openspec/specs", dirname(file));
          const test = testOf(spec, layout);
          if (test) write(join(from, file), dirname(test), basename(spec));
        }
      }
      for (const spec of globSync(productSpecs, { cwd: from }).sort()) {
        const useCase = basename(dirname(spec));
        const test = productTestOf(dirname(spec), config.acceptance);
        const dir = dirname(test);
        if (!check) mkdirSync(dir, { recursive: true });
        write(join(from, spec), dir, useCase, relative("openspec/specs", dirname(spec)));
      }
    } finally {
      merged?.dispose();
    }
    return failed ? 1 : 0;
  };
  return { generate };
};
