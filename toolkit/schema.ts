import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";
import { type ProjectConfig, resolveConfig } from "./config.ts";
import { PACKAGE_ROOT, SOURCE_EXT } from "./paths.ts";
import type {
  FactoryConfig,
  SchemaDefinition,
  SchemaVariant,
  WorkstreamDeclaration,
} from "./types.ts";
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
};

/** The schemas `root` defines, by name. */
export const schemaNames = (root = PACKAGE_ROOT): string[] =>
  readdirSync(join(root, "schemas"))
    .filter((f) => f.endsWith(SOURCE_EXT) && !f.endsWith(".d.ts"))
    .map((f) => basename(f, SOURCE_EXT))
    .sort();

const module = async <T>(path: string): Promise<T> =>
  ((await import(pathToFileURL(path).href)) as { default: T }).default;

/** The files the definition of `name` is written in: its own and, for a variant, those it starts from. */
export const definitionFiles = async (
  name: string,
  root = PACKAGE_ROOT,
  seen: string[] = [],
): Promise<string[]> => {
  const path = join(root, "schemas", `${name}${SOURCE_EXT}`);
  if (!existsSync(path))
    throw new Error(`no schema is called ${name}; schemas: ${schemaNames(root).join(", ")}`);
  if (seen.includes(name))
    throw new Error(`schema ${name} extends itself: ${[...seen, name].join(" → ")}`);
  const written = await module<SchemaDefinition | SchemaVariant>(path);
  return "extends" in written
    ? [path, ...(await definitionFiles(written.extends, root, [...seen, name]))]
    : [path];
};

/** The definition of `name`; a variant is its base with what it overrides laid over. */
export const loadDefinition = async (
  name: string,
  root = PACKAGE_ROOT,
): Promise<SchemaDefinition> => {
  const [own] = await definitionFiles(name, root);
  const written = await module<SchemaDefinition | SchemaVariant>(own!);
  if (!("extends" in written)) return written;
  const { extends: base, ...overrides } = written;
  return { ...(await loadDefinition(base, root)), ...overrides };
};

/**
 * Loads the schema `name` with the resources its definition names. Fails naming the resource when
 * one does not exist.
 */
export const loadSchema = async (name: string, root = PACKAGE_ROOT): Promise<Schema> => {
  const definition = await loadDefinition(name, root);
  const resource = (kind: string, id: string, file: string): string => {
    if (!existsSync(file))
      throw new Error(`schema ${name} names the ${kind} ${id}, which does not exist`);
    return file;
  };

  const workstreams: Record<string, WorkstreamDeclaration> = {};
  for (const id of definition.workstreams)
    workstreams[id] = await module<WorkstreamDeclaration>(
      resource("workstream", id, join(root, "workstreams", id, `workstream${SOURCE_EXT}`)),
    );
  const validator = await module<Validator>(
    resource(
      "validator",
      definition.validator,
      join(root, "validators", definition.validator, `validator${SOURCE_EXT}`),
    ),
  );
  const questions = readFileSync(
    resource(
      "question policy",
      definition.questions,
      join(root, "questions", `${definition.questions}.md`),
    ),
    "utf8",
  );
  const templates: Record<string, string> = {};
  for (const { template } of definition.artifacts)
    templates[template] = readFileSync(
      resource("template", template, join(root, "templates", template)),
      "utf8",
    );
  return { definition, workstreams, validator, questions, templates };
};

/**
 * The schema the project's tools are composed from: the project's default schema when this package
 * defines it, else the first one the package defines.
 */
export const projectSchemaName = (project: string, root = PACKAGE_ROOT): string => {
  const names = schemaNames(root);
  const config = join(project, "openspec/config.yaml");
  const named = existsSync(config)
    ? ((parse(readFileSync(config, "utf8")) ?? {}) as { schema?: unknown }).schema
    : undefined;
  return typeof named === "string" && names.includes(named) ? named : names[0]!;
};

/** The configuration of the project at `project`: the defaults of its schema under its `factory.config.ts`. */
export const projectConfig = async (project: string): Promise<FactoryConfig> => {
  const { defaults } = await loadDefinition(projectSchemaName(project));
  const path = join(project, "factory.config.ts");
  return resolveConfig(
    defaults,
    existsSync(path) ? await module<ProjectConfig>(path) : undefined,
  );
};
