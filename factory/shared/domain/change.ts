export declare const CHANGES = "openspec/changes";
/** The record of where a change stands with the completion gate. It exists from the moment the implement phase starts the change. */
export declare const GATE = "gate.json";
/** The implement phase started the change and nothing has ended that yet. */
export declare const isStarted: (root: string, name: string) => boolean;
/** A change as it is on disk. */
export type Change = {
  name: string;
  dir: string;
  /** The schema the change was made with, as the specification tool recorded it. */
  schema?: string;
  /** The day it was created, as the specification tool recorded it. */
  created?: string;
  /** The change is marked as changing no behaviour a user notices. */
  noBehaviour: boolean;
  /** The text of its plan, when it has one. */
  plan?: string;
  /** Its delta specs, relative to `dir`. */
  deltaSpecs: string[];
  /** The product it builds, in a project that declares products (`x-product`). */
  product?: string;
  /** The other changes of its intention (`x-linked`). */
  linked: string[];
};
export declare const readChange: (
  root: string,
  name: string,
) => Change | undefined;
/** The change archived under `name`, if any: the folder `archive/<date>-<name>`. */
export declare const readArchivedChange: (
  root: string,
  name: string,
) => Change | undefined;
/** The changes that are not archived, by name. */
export declare const activeChanges: (root: string) => string[];

/** Collaborators supplied by the composition root. */
export type ChangePorts = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  globSync: (typeof import("node:fs"))["globSync"];
  readdirSync: (typeof import("node:fs"))["readdirSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  join: (typeof import("node:path"))["join"];
  parse: (typeof import("yaml"))["parse"];
};
