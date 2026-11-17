/** The end-to-end packages a web product pins, at the version the command was built with. */
export declare const E2E_TOOLS: {
  readonly e2e: "0.22.0";
  readonly "@e2e-dev/web": "0.15.4";
  readonly "@e2e-dev/acp": "0.1.0";
};
/** One end-to-end test as the command reports it. */
export type E2eTest = {
  test: string;
  result: "passed" | "failed";
};
/** What one run of the end-to-end tool gave: its exit status, what it printed, and its report when it wrote one. */
export type E2eRun = {
  status: number | null;
  output: string;
  report?: unknown;
};
/** How the end-to-end tool is run: over a folder, from a working directory, with an environment. */
export type E2eRunner = (
  cwd: string,
  root: string,
  env: NodeJS.ProcessEnv,
) => E2eRun;
/** Each test of an end-to-end report: a passing or flaky one passed, a skipped one is left out, any other failed. */
export declare const testsOf: (report: unknown) => E2eTest[];
/**
 * The end-to-end tests of a web product: the tool's status 0 and 1 are kept, any other means the
 * run could not start and becomes 2, naming the cause. A product of another platform has none.
 */
export declare const runE2e: (
  {
    platform,
    cwd,
    root,
  }: {
    platform: string;
    cwd: string;
    root: string;
  },
  run?: E2eRunner,
) => {
  status: number;
  output: string;
  tests: E2eTest[];
};
/**
 * `factory test <acceptance|integration|e2e> [--report <file>]`: the product's tests of one kind,
 * run over the configured root of that kind and nothing else: the acceptance and integration tests
 * with the project's own test runner, the end-to-end tests of a web product with the pinned
 * end-to-end tool. `--report` also writes each test's result to that file, as JSON.
 */
export declare const test: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type TestPorts = {
  environment: () => NodeJS.ProcessEnv;
  nodeExecutable: string;
  spawnSync: (typeof import("node:child_process"))["spawnSync"];
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  basename: (typeof import("node:path"))["basename"];
  join: (typeof import("node:path"))["join"];
  cacheDir: (typeof import("../../shared/domain/paths.ts"))["cacheDir"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  config: (typeof import("./project.ts"))["config"];
  product: (typeof import("./project.ts"))["product"];
};
