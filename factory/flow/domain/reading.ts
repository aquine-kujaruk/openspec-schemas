/** An artifact to show the person, and the copy of it in their language that is shown instead. */
export type Reading = {
  source: string;
  copy: string;
  fresh: boolean;
};
/** Where to look, for a test: the environment and the system's temporary folder. */
export type ReadingOptions = {
  env?: NodeJS.ProcessEnv;
  tmp?: string;
};
/** The language the person reads in: their environment or `.env` first, then the project's; none for English. */
export declare const languageOf: (
  root: string,
  env?: NodeJS.ProcessEnv,
) => Promise<string | undefined>;
/**
 * The reading copies of `paths` in the person's language, under the system's temporary folder at
 * `factory-reading/<language>/<project folder>-<hash of its path>/<path>`: never in the project.
 * A copy is stale when it is missing or its artifact changed since it was written. None when the
 * language is English or none is configured.
 */
export declare const readingsOf: (
  root: string,
  paths: string[],
  { env, tmp }?: ReadingOptions,
) => Promise<Reading[]>;
/** Records that the copies of `paths` were written from their artifacts as they are now. */
export declare const markWritten: (
  root: string,
  paths: string[],
  options?: ReadingOptions,
) => Promise<Reading[]>;
/** `factory reading [--written] <paths…>`, as lines and an exit status. */
export declare const reading: (
  root: string,
  args: string[],
  options?: ReadingOptions,
) => Promise<{
  status: number;
  lines: string[];
}>;
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type ReadingPorts = {
  environment: () => NodeJS.ProcessEnv;
  createHash: (typeof import("node:crypto"))["createHash"];
  existsSync: (typeof import("node:fs"))["existsSync"];
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  statSync: (typeof import("node:fs"))["statSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  tmpdir: (typeof import("node:os"))["tmpdir"];
  basename: (typeof import("node:path"))["basename"];
  dirname: (typeof import("node:path"))["dirname"];
  isAbsolute: (typeof import("node:path"))["isAbsolute"];
  join: (typeof import("node:path"))["join"];
  relative: (typeof import("node:path"))["relative"];
  resolve: (typeof import("node:path"))["resolve"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  loadEnv: (typeof import("../../shared/domain/env.ts"))["loadEnv"];
  readProjectConfig: (typeof import("../../repository/domain/products.ts"))["readProjectConfig"];
};
