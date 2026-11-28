
import type { DrawingTools, DrawingRecord } from "../acl/drawing.acl.ts";

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
