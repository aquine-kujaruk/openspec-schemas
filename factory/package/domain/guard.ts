/** A write the guard refuses: the path, why, and the part of the harness it belongs to when it is harness. */
export type Refusal = {
  path: string;
  part?: string;
  reason: string;
};
/**
 * Judges a write to each of `paths` (absolute, or relative to `cwd`) in the project at `root`. A
 * path outside the project, or inside it but neither harness nor product, is nobody's business. In
 * a project that declares products, a path in a product's folder opens only to a change of that
 * product; otherwise product code opens to a change whose schema builds it.
 */
export declare const guard: (
  root: string,
  paths: string[],
  cwd?: string,
) => Promise<Refusal[]>;
/**
 * The files a tool call is about to write, from what the agent hands a hook: one path, or a patch
 * that names every file it touches.
 */
export declare const filesOf: (input: unknown) => string[];
/** The project a hook runs for: the nearest folder, from where the agent stands, that holds `openspec`. */
export declare const projectOf: (cwd: string) => string;
/** What the agent hands a hook on standard input; nothing when the command is run by hand. */
export declare const hookInput: () => {
  cwd?: string;
} & Record<string, unknown>;
/**
 * `factory guard [path…]`: judges the write an agent is about to make, read from the hook's input
 * or from the paths given. Exit status 2 with the reason on standard error refuses it; 0 lets it
 * through.
 */
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type GuardPorts = {
  environment: () => NodeJS.ProcessEnv;
  workingDirectory: () => string;
  interactive: () => boolean;
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  dirname: (typeof import("node:path"))["dirname"];
  isAbsolute: (typeof import("node:path"))["isAbsolute"];
  join: (typeof import("node:path"))["join"];
  relative: (typeof import("node:path"))["relative"];
  resolve: (typeof import("node:path"))["resolve"];
  CHANGES: (typeof import("../../shared/domain/change.ts"))["CHANGES"];
  DECISIONS: (typeof import("../../shared/domain/consolidated.ts"))["DECISIONS"];
  PROCEDURES: (typeof import("../../shared/domain/consolidated.ts"))["PROCEDURES"];
  productRoots: (typeof import("../../repository/domain/products.ts"))["productRoots"];
  productHolding: (typeof import("../../repository/domain/products.ts"))["productHolding"];
  projectProducts: (typeof import("../../repository/domain/products.ts"))["projectProducts"];
  changesInImplementation: (typeof import("../../flow/domain/validate.ts"))["changesInImplementation"];
};
