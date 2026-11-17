import type {
  CoreDefinition,
  SchemaDefinition,
  WorkstreamDeclaration,
} from "../../shared/domain/types.ts";
import type { Validator } from "./validation.ts";
/** A definition with every resource it names loaded. */
export type Schema = {
  definition: SchemaDefinition;
  workstreams: Record<string, WorkstreamDeclaration>;
  validator: Validator;
  /** The text of its question policy. */
  questions: string;
  /** The text of each template its artifacts name, by file name. */
  templates: Record<string, string>;
  /** The folder of each workstream it names. */
  workstreamDirs: Record<string, string>;
  /** Its rubrics, in the order review asks them: its core's, then its own or the nearest base's. */
  rubrics: string[];
  /** The file each resource it names was found in. */
  resources: Array<{
    kind: Kind;
    id: string;
    file: string;
  }>;
};
/** Where the schemas live, and the folder of what unrelated schemas share and every package carries. */
export declare const SCHEMAS = "schemas";
export declare const SHARED = "shared";
/** Where the cores live inside the shared folder. */
export declare const CORES = "cores";
/** The folder of the core `id`, from the schemas folder. */
export declare const coreFolder: (id: string) => string;
/** The cores `root` defines, by name. */
export declare const coreNames: (root?: string) => string[];
/** The schemas `root` defines, by name. */
export declare const schemaNames: (root?: string) => string[];
/** `name` and every definition it extends, nearest first. */
export declare const chain: (
  name: string,
  root?: string,
  seen?: string[],
) => Promise<string[]>;
/** The files the definition of `name` is written in: its own and, for a variant, those it starts from. */
export declare const definitionFiles: (
  name: string,
  root?: string,
) => Promise<string[]>;
/** The definition of `name` as written; a variant is its base with what it overrides laid over. */
export declare const writtenDefinition: (
  name: string,
  root?: string,
) => Promise<SchemaDefinition>;
/** The core `id`, which the schema `by` names. */
export declare const loadCore: (
  id: string,
  by: string,
  root?: string,
) => Promise<CoreDefinition>;
/**
 * The definition of `name`: a variant is its base with what it overrides laid over, and a
 * definition that names a core builds through the core's workstreams, then its own.
 */
export declare const loadDefinition: (
  name: string,
  root?: string,
) => Promise<SchemaDefinition>;
/** The kinds of resource a definition names, and the file that stands for one inside a folder. */
export declare const KINDS: {
  readonly core: (id: string) => string;
  readonly workstream: (id: string) => string;
  readonly validator: (id: string) => string;
  readonly "question policy": (id: string) => string;
  readonly template: (id: string) => string;
};
export type Kind = keyof typeof KINDS;
/** The resources a definition names, by kind. */
export declare const named: (d: SchemaDefinition) => Array<{
  kind: Kind;
  id: string;
}>;
/**
 * Loads the schema `name` with the resources its definition names: each one from the definition's
 * own folder, else from the folder of a definition it extends, else from the shared one. Fails
 * naming the resource when it is in none.
 */
export declare const loadSchema: (
  name: string,
  root?: string,
) => Promise<Schema>;
/**
 * What holds workstreams in `root`: every core a schema names, and every schema that names
 * workstreams of its own. In the repository the command is developed in, the examples of a layer
 * are verified with the defaults of whoever holds the layer's workstream.
 */
export declare const holderNames: (root?: string) => Promise<string[]>;
/**
 * The holder `name` as a schema: a schema as it loads, or a core alone, over the defaults of the
 * nearest definition every schema naming the core extends.
 */
export declare const loadHolder: (
  name: string,
  root?: string,
) => Promise<Schema>;
/** A resource held where the rule of the repository does not put it. */
export type Misplaced = {
  kind: Kind;
  id: string;
  held: string[];
  belongs: string;
};
/**
 * Every resource of `root` that is held somewhere else than where the definitions naming it put
 * it: with the one definition that names it, with the one the others extend, or in the shared
 * folder when two that name it are unrelated.
 */
export declare const misplaced: (root?: string) => Promise<Misplaced[]>;
/**
 * The schema the project's tools are composed from: the one schema with workstreams the package
 * defines, or the one the project's `factory.config.ts` names when there are several. With none,
 * the first schema, whose tools check nothing.
 */
export declare const projectSchemaName: (
  project: string,
  root?: string,
) => Promise<string>;

/** Collaborators supplied by the composition root. */
export type SchemaPorts = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  readdirSync: (typeof import("node:fs"))["readdirSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  dirname: (typeof import("node:path"))["dirname"];
  join: (typeof import("node:path"))["join"];
  resolve: (typeof import("node:path"))["resolve"];
  pathToFileURL: (typeof import("node:url"))["pathToFileURL"];
  PACKAGE_ROOT: (typeof import("../../shared/domain/paths.ts"))["PACKAGE_ROOT"];
  SOURCE_EXT: (typeof import("../../shared/domain/paths.ts"))["SOURCE_EXT"];
  loadModule: (specifier: string) => Promise<unknown>;
};
