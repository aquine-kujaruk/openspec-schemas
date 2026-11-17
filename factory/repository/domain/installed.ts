import type { Installed } from "../../shared/domain/types.ts";
/** Where each agent reads what a package deploys for it. */
type Place = {
  skills: string;
  /** A rule file per instruction, or one instruction file the project may have written. */
  instruction:
    | {
        rules: string;
      }
    | {
        file: string;
      };
  hooks: string;
};
export declare const PLACES: Record<string, Place>;
/** What the installed package says about itself, read from the first agent that has its setup skill. */
export declare const readInstalled: (root: string) =>
  | {
      installed: Installed;
      assets: string;
    }
  | undefined;
export {};

/** Collaborators supplied by the composition root. */
export type InstalledPorts = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  join: (typeof import("node:path"))["join"];
  SETUP_ASSETS: (typeof import("../../shared/domain/paths.ts"))["SETUP_ASSETS"];
  INSTALLED: (typeof import("../../shared/domain/paths.ts"))["INSTALLED"];
};
