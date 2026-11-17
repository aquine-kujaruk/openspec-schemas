export { PLACES, readInstalled } from "../../repository/domain/installed.ts";
/** The markers of the section the agent package manager manages in an instruction file. */
export declare const SECTION: {
  start: string;
  end: string;
};
export type Item = {
  requirement: string;
  agent?: string;
  report: "missing" | "drift" | "repaired";
  detail: string;
};
/** `suspects` are consolidated runbooks that run what the project no longer has: the agent investigates them. */
export type Report = {
  items: Item[];
  notes: string[];
  suspects: string[];
  status: 0 | 1;
};
/** The version of the command the project depends on, as its lockfile records it. */
export declare const pinnedVersion: (root: string) => string | undefined;
/** The instruction file with the package's instructions as its one managed section, the project's own lines kept. */
export declare const withSection: (
  own: string | undefined,
  instructions: string[],
) => string;
/** The link of `schema` under the project's schemas leads to that schema inside the installed command. */
export declare const schemaLinkHolds: (root: string, schema: string) => boolean;
/** The guard commands the hook file of `agent` does not call. */
export declare const unwiredGuards: (root: string, agent: string) => string[];
/**
 * What the flow needs and the project lacks. With `fix`, what the package owns is repaired first
 * and only what is still lacking counts against the project.
 */
export declare const doctor: (
  root: string,
  {
    fix,
    env,
    node,
  }?: {
    fix?: boolean;
    env?: NodeJS.ProcessEnv;
    node?: string;
  },
) => Promise<Report | undefined>;
/**
 * `factory doctor [--fix]`: lists what the flow needs and the project lacks; `--fix` repairs what
 * the package owns. Exit status 0 when nothing is lacking, 1 when something is, 2 when no package
 * is installed.
 */
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type DoctorPorts = {
  environment: () => NodeJS.ProcessEnv;
  nodeVersion: string;
  existsSync: (typeof import("node:fs"))["existsSync"];
  lstatSync: (typeof import("node:fs"))["lstatSync"];
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  realpathSync: (typeof import("node:fs"))["realpathSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  symlinkSync: (typeof import("node:fs"))["symlinkSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  dirname: (typeof import("node:path"))["dirname"];
  join: (typeof import("node:path"))["join"];
  relative: (typeof import("node:path"))["relative"];
  parse: (typeof import("yaml"))["parse"];
  parseDocument: (typeof import("yaml"))["parseDocument"];
  DECISIONS: (typeof import("../../shared/domain/consolidated.ts"))["DECISIONS"];
  PROCEDURES: (typeof import("../../shared/domain/consolidated.ts"))["PROCEDURES"];
  readConsolidated: (typeof import("../../shared/domain/consolidated.ts"))["readConsolidated"];
  loadEnv: (typeof import("../../shared/domain/env.ts"))["loadEnv"];
  capture: (typeof import("../../shared/domain/paths.ts"))["capture"];
  COMMAND: (typeof import("../../shared/domain/paths.ts"))["COMMAND"];
  INSTALLED: (typeof import("../../shared/domain/paths.ts"))["INSTALLED"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  SETUP_ASSETS: (typeof import("../../shared/domain/paths.ts"))["SETUP_ASSETS"];
  projectProducts: (typeof import("../../repository/domain/products.ts"))["projectProducts"];
  readProjectConfig: (typeof import("../../repository/domain/products.ts"))["readProjectConfig"];
  holdingsOf: (typeof import("./suspects.ts"))["holdingsOf"];
  suspectsOf: (typeof import("./suspects.ts"))["suspectsOf"];
  PLACES: (typeof import("../../repository/domain/installed.ts"))["PLACES"];
  readInstalled: (typeof import("../../repository/domain/installed.ts"))["readInstalled"];
};
