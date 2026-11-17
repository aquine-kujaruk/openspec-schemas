/** The command's own package: where the workstreams, the review and the schemas live. */
export declare const PACKAGE_ROOT: string;
/** The project the command serves: the folder it runs in. */
export declare const PROJECT_ROOT: string;
/** The extension of the command's own modules: TypeScript where it is developed, JavaScript once built. */
export declare const SOURCE_EXT: string;
/** The name the command is installed under in a project. */
export declare const COMMAND = "factory";
/** Where the setup skill keeps the command, and the record of what the package says about itself. */
export declare const SETUP_ASSETS = "setup/assets";
export declare const INSTALLED = "manifest.json";
/** The command runs in the repository that develops it, where the layer specs and the example files are sources. */
export declare const DEVELOPING: boolean;
/** The layer specs. They exist in the repository that develops the workstreams, not in a project. */
export declare const ARCHITECTURE_SPECS = "openspec/specs/architecture";
export declare const hasLayerSpecs: (root?: string) => boolean;
/** Why the spec checks are skipped, for test titles. */
export declare const SKIPPED_WITHOUT_SPECS =
  "skipped: openspec/specs/architecture is absent";
/** The product spec of `useCase` in `module`, from the configured glob (`openspec/specs/*\/*\/spec.md`). */
export declare const productSpecPath: (
  glob: string,
  module: string,
  useCase: string,
) => string;
/** Where an active change holds that same spec while it is a delta: any change, the same path under its `specs`. */
export declare const deltaSpecGlob: (
  glob: string,
  module: string,
  useCase: string,
) => string;
/** Where the command writes the tool configurations it composes for one run, inside the project. */
export declare const cacheDir: (root?: string) => string;
/** The executable `name` of the package `pkg`, one of the command's own dependencies. */
export declare const tool: (pkg: string, name?: string) => string;
export type Ran = {
  status: number;
  stdout: string;
  stderr: string;
};
/**
 * Runs a program and returns what it printed. Its output goes through files and not through pipes:
 * the sandbox an agent runs commands in may forbid the pipes a subprocess is usually read through.
 * With `show`, the output goes straight to the terminal instead and is not returned.
 */
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
/** Runs an executable of one of the command's dependencies under this Node. */
export declare const runTool: (
  pkg: string,
  args: string[],
  options?: Parameters<typeof capture>[2] & {
    bin?: string;
  },
) => Ran;
/** The JSON object a tool printed, whatever it printed around it. */
export declare const jsonOf: (stdout: string) => any;
/** Runs the command itself in the project at `root`, as an agent would; returns its status and the tail of what it printed. */
export declare const self: (
  root: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
) => {
  status: number;
  output: string;
};
