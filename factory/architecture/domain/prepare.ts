import type { Options } from "../../shared/domain/types.ts";
/** The base laid under a new module root when the configuration declares none. */
export declare const DEFAULT_BASE: string[];
type Roots = Pick<Options, "modules" | "acceptance" | "integration" | "base">;
/**
 * `factory prepare`: the minimum the implementer needs before any workstream. Every configured
 * root that does not exist is created; a new module root also gets the configured `base` (or
 * `DEFAULT_BASE`). An existing directory is never touched, so running it twice changes nothing.
 * Returns the directories it created, relative to `cwd`.
 */
export declare const prepare: (cwd: string, o: Roots) => string[];
export {};

/** Collaborators supplied by the composition root. */
export type PreparePorts = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  join: (typeof import("node:path"))["join"];
};
