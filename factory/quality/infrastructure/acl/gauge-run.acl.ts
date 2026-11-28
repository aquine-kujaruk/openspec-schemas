export interface GaugeRunAcl {
  runGauges(args: readonly string[]): Promise<number>;
}

export declare const E2E_TOOLS: {
  readonly e2e: "0.22.0";
  readonly "@e2e-dev/web": "0.15.4";
  readonly "@e2e-dev/acp": "0.1.0";
};

export type E2eTest = {
  test: string;
  result: "passed" | "failed";
};

export type E2eRun = {
  status: number | null;
  output: string;
  report?: unknown;
};

export type E2eRunner = (
  cwd: string,
  root: string,
  env: NodeJS.ProcessEnv,
) => E2eRun;

export declare const testsOf: (report: unknown) => E2eTest[];

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

export declare const test: (args: string[]) => Promise<number>;

export type GaugeRunnerTools = {
  environment: () => NodeJS.ProcessEnv;
  nodeExecutable: string;
  spawnSync: (typeof import("node:child_process"))["spawnSync"];
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  basename: (typeof import("node:path"))["basename"];
  join: (typeof import("node:path"))["join"];
  cacheDir(root?: string): string;
  PROJECT_ROOT: string;
  config: { acceptance: string; unit: string; integration: string; e2e: string; platform: { name: string } };
  product: { root: string };
};
