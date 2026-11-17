import type { Schema } from "./schema.ts";
/**
 * The files of a schema as the specification tool reads it: `schema.yaml` and the templates its
 * artifacts name. The instruction of the artifact that decides ends with what only the schema
 * knows: the workstreams a task may name and its question policy.
 */
export declare const schemaFiles: (schema: Schema) => Record<string, string>;
/** Writes the schema's files under `dir`. */
export declare const emitSchema: (schema: Schema, dir: string) => string[];

/** Collaborators supplied by the composition root. */
export type SchemaYamlPorts = {
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  dirname: (typeof import("node:path"))["dirname"];
  join: (typeof import("node:path"))["join"];
  stringify: (typeof import("yaml"))["stringify"];
};
