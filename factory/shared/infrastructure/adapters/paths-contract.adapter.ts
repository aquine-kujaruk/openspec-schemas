export declare const PACKAGE_ROOT: string;
export declare const PROJECT_ROOT: string;
export declare const SOURCE_EXT: string;
export declare const COMMAND = "factory";
export declare const SETUP_ASSETS = "setup/assets";
export declare const INSTALLED = "manifest.json";
export declare const DEVELOPING: boolean;
export declare const ARCHITECTURE_SPECS = "openspec/specs/architecture";
export declare const hasLayerSpecs: (root?: string) => boolean;

export declare const SKIPPED_WITHOUT_SPECS =
  "skipped: openspec/specs/architecture is absent";

export declare const productSpecPath: (
  glob: string,
  module: string,
  useCase: string,
) => string;

export declare const deltaSpecGlob: (
  glob: string,
  module: string,
  useCase: string,
) => string;

export declare const cacheDir: (root?: string) => string;
export declare const tool: (pkg: string, name?: string) => string;

export type Ran = {
  status: number;
  stdout: string;
  stderr: string;
};

export declare const capture: (
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    input?: string;
    show?: boolean;
  },
) => Ran;

export declare const runTool: (
  pkg: string,
  args: string[],
  options?: Parameters<typeof capture>[2] & {
    bin?: string;
  },
) => Ran;

export declare const jsonOf: (stdout: string) => any;

export declare const self: (
  root: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
) => {
  status: number;
  output: string;
};
