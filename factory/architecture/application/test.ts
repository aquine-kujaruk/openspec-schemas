import type { E2eTest, E2eRun, E2eRunner } from "../domain/test.ts";
import type { TestPorts } from "../domain/test.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createTest = ({
  environment,
  nodeExecutable,
  spawnSync,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
  basename,
  join,
  cacheDir,
  PROJECT_ROOT,
  config,
  product,
}: TestPorts): typeof import("../domain/test.ts") => {
  const KINDS = {
    acceptance: () => config.acceptance,
    integration: () => config.integration,
  };

  /** The end-to-end packages a web product pins, at the version the command was built with. */
  const E2E_TOOLS = {
    e2e: "0.22.0",
    "@e2e-dev/web": "0.15.4",
    "@e2e-dev/acp": "0.1.0",
  } as const;

  /** One end-to-end test as the command reports it. */

  /** What one run of the end-to-end tool gave: its exit status, what it printed, and its report when it wrote one. */

  /** How the end-to-end tool is run: over a folder, from a working directory, with an environment. */

  type Report = {
    run?: {
      results?: Array<{ file: string; titlePath: string[]; status: string }>;
    };
  };

  /** Each test of an end-to-end report: a passing or flaky one passed, a skipped one is left out, any other failed. */
  const testsOf = (report: unknown): E2eTest[] =>
    ((report as Report)?.run?.results ?? [])
      .filter((r) => r.status !== "skipped")
      .map((r) => ({
        test: `${basename(r.file).replace(/\.e2e\.[cm]?[jt]s$/, "")} · ${r.titlePath.at(-1)}`,
        result:
          r.status === "passed" || r.status === "flaky" ? "passed" : "failed",
      }));

  /** The real tool: `e2e run <root> --reporter json`, its telemetry off, replaying a committed cache strictly. */
  const realRunner: E2eRunner = (cwd, root, env) => {
    const bin = join(cwd, "node_modules/.bin/e2e");
    const binary = existsSync(bin)
      ? bin
      : join(PROJECT_ROOT, "node_modules/.bin/e2e");
    if (!existsSync(binary))
      return {
        status: 2,
        output: `the project has no end-to-end tool: add ${Object.entries(
          E2E_TOOLS,
        )
          .map(([n, v]) => `${n}@${v}`)
          .join(", ")} to its development dependencies`,
      };
    const strict = existsSync(join(cwd, ".e2e/cache"))
      ? ["--strict-cache"]
      : [];
    const report = join(cwd, ".e2e/report.json");
    rmSync(report, { force: true });
    const r = spawnSync(
      binary,
      ["run", root, "--reporter", "list", ...strict],
      { cwd, env, encoding: "utf8" },
    );
    return {
      status: r.status,
      output: `${r.stdout ?? ""}${r.stderr ?? ""}`,
      report: existsSync(report)
        ? JSON.parse(readFileSync(report, "utf8"))
        : undefined,
    };
  };

  /**
   * The end-to-end tests of a web product: the tool's status 0 and 1 are kept, any other means the
   * run could not start and becomes 2, naming the cause. A product of another platform has none.
   */
  const runE2e = (
    { platform, cwd, root }: { platform: string; cwd: string; root: string },
    run: E2eRunner = realRunner,
  ): { status: number; output: string; tests: E2eTest[] } => {
    if (platform !== "web")
      return {
        status: 2,
        output: `the product's platform is ${platform}: only a web product has end-to-end tests`,
        tests: [],
      };
    const r = run(cwd, root, { ...environment(), E2E_TELEMETRY_DISABLED: "1" });
    const tests = testsOf(r.report);
    if (r.status === 0 || r.status === 1)
      return { status: r.status, output: r.output, tests };
    const why =
      r.status === 3
        ? "the app, the browser or the model could not be reached"
        : r.status === 4
          ? "the end-to-end tool failed inside"
          : r.status === 130
            ? "the run was interrupted"
            : "the configuration, a credential or the selection is wrong";
    return {
      status: 2,
      output: `the end-to-end run could not start (status ${r.status}): ${why}\n${r.output}`,
      tests,
    };
  };

  /**
   * `factory test <acceptance|integration|e2e> [--report <file>]`: the product's tests of one kind,
   * run over the configured root of that kind and nothing else: the acceptance and integration tests
   * with the project's own test runner, the end-to-end tests of a web product with the pinned
   * end-to-end tool. `--report` also writes each test's result to that file, as JSON.
   */
  const test = async (args: string[]): Promise<number> => {
    const [kind] = args;
    const report = args.indexOf("--report");
    if (kind === "e2e") {
      const r = runE2e({
        platform: config.platform.name,
        cwd: join(PROJECT_ROOT, product.root),
        root: config.e2e,
      });
      console.log(r.output);
      if (report !== -1)
        writeFileSync(
          args[report + 1]!,
          JSON.stringify({ tests: r.tests }, null, 2),
        );
      return r.status;
    }
    if (!kind || !(kind in KINDS)) {
      console.error(
        `Unknown kind of test: ${kind}. Kinds: ${[...Object.keys(KINDS), "e2e"].join(", ")}`,
      );
      return 2;
    }
    const runner = join(PROJECT_ROOT, "node_modules/vitest/vitest.mjs");
    if (!existsSync(runner)) {
      console.error(
        "the project has no test runner: add vitest to its development dependencies",
      );
      return 2;
    }
    const root = KINDS[kind as keyof typeof KINDS]();
    const path = join(cacheDir(PROJECT_ROOT), `vitest.${kind}.config.mjs`);
    writeFileSync(
      path,
      `export default ${JSON.stringify({
        root: PROJECT_ROOT,
        test: {
          include: [`${root}/**/*.test.ts`],
          environment: "node",
          passWithNoTests: true,
        },
      })};\n`,
    );
    const reporters =
      report === -1
        ? []
        : [
            "--reporter=default",
            "--reporter=json",
            `--outputFile.json=${args[report + 1]}`,
          ];
    const r = spawnSync(
      nodeExecutable,
      [runner, "run", "--config", path, ...reporters],
      {
        stdio: "inherit",
      },
    );
    return r.status ?? 1;
  };
  return { E2E_TOOLS, testsOf, runE2e, test };
};
