import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { type ProjectConfig, resolveConfig } from "../core/config.ts";
import { PACKAGE_ROOT, SOURCE_EXT } from "../core/paths.ts";
import type {
  FactoryConfig,
  SchemaDefinition,
  SchemaVariant,
  WorkstreamDeclaration,
} from "../core/types.ts";
import type { Validator } from "../flow/validation.ts";

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
  /** Its rubric, when it or a definition it extends has one. */
  rubric?: string;
  /** The file each resource it names was found in. */
  resources: Array<{ kind: Kind; id: string; file: string }>;
};

/** Where the schemas live, and the folder of what unrelated schemas share and every package carries. */
export const SCHEMAS = "schemas";
export const SHARED = "shared";

const definitionPath = (root: string, name: string): string =>
  join(root, SCHEMAS, name, `schema${SOURCE_EXT}`);

/** The schemas `root` defines, by name. */
export const schemaNames = (root = PACKAGE_ROOT): string[] =>
  existsSync(join(root, SCHEMAS))
    ? readdirSync(join(root, SCHEMAS))
        .filter((name) => name !== SHARED && existsSync(definitionPath(root, name)))
        .sort()
    : [];

const module = async <T>(path: string): Promise<T> =>
  ((await import(pathToFileURL(path).href)) as { default: T }).default;

/** `name` and every definition it extends, nearest first. */
export const chain = async (
  name: string,
  root = PACKAGE_ROOT,
  seen: string[] = [],
): Promise<string[]> => {
  const path = definitionPath(root, name);
  if (!existsSync(path))
    throw new Error(`no schema is called ${name}; schemas: ${schemaNames(root).join(", ")}`);
  if (seen.includes(name))
    throw new Error(`schema ${name} extends itself: ${[...seen, name].join(" → ")}`);
  const written = await module<SchemaDefinition | SchemaVariant>(path);
  return "extends" in written
    ? [name, ...(await chain(written.extends, root, [...seen, name]))]
    : [name];
};

/** The files the definition of `name` is written in: its own and, for a variant, those it starts from. */
export const definitionFiles = async (name: string, root = PACKAGE_ROOT): Promise<string[]> =>
  (await chain(name, root)).map((n) => definitionPath(root, n));

/** The definition of `name`; a variant is its base with what it overrides laid over. */
export const loadDefinition = async (
  name: string,
  root = PACKAGE_ROOT,
): Promise<SchemaDefinition> => {
  const written = await module<SchemaDefinition | SchemaVariant>(definitionPath(root, name));
  if (!("extends" in written)) return written;
  const { extends: base, ...overrides } = written;
  return { ...(await loadDefinition(base, root)), ...overrides };
};

/** The kinds of resource a definition names, and the file that stands for one inside a folder. */
export const KINDS = {
  workstream: (id: string) => join("workstreams", id, `workstream${SOURCE_EXT}`),
  validator: (id: string) => join("validators", id, `validator${SOURCE_EXT}`),
  "question policy": (id: string) => join("questions", `${id}.md`),
  template: (id: string) => join("templates", id),
} as const;
export type Kind = keyof typeof KINDS;

/** The resources a definition names, by kind. */
export const named = (d: SchemaDefinition): Array<{ kind: Kind; id: string }> => [
  ...d.workstreams.map((id) => ({ kind: "workstream" as const, id })),
  { kind: "validator", id: d.validator },
  { kind: "question policy", id: d.questions },
  ...d.artifacts.map((a) => ({ kind: "template" as const, id: a.template })),
];

/**
 * Loads the schema `name` with the resources its definition names: each one from the definition's
 * own folder, else from the folder of a definition it extends, else from the shared one. Fails
 * naming the resource when it is in none.
 */
export const loadSchema = async (name: string, root = PACKAGE_ROOT): Promise<Schema> => {
  const definition = await loadDefinition(name, root);
  const folders = [...(await chain(name, root)), SHARED].map((n) => join(root, SCHEMAS, n));
  const resources: Schema["resources"] = [];
  const resource = (kind: Kind, id: string): string => {
    const file = folders.map((folder) => join(folder, KINDS[kind](id))).find((f) => existsSync(f));
    if (!file) throw new Error(`schema ${name} names the ${kind} ${id}, which does not exist`);
    resources.push({ kind, id, file });
    return file;
  };

  const workstreams: Record<string, WorkstreamDeclaration> = {};
  const workstreamDirs: Record<string, string> = {};
  for (const id of definition.workstreams) {
    const file = resource("workstream", id);
    workstreams[id] = await module<WorkstreamDeclaration>(file);
    workstreamDirs[id] = dirname(file);
  }
  const validator = await module<Validator>(resource("validator", definition.validator));
  const questions = readFileSync(resource("question policy", definition.questions), "utf8");
  const templates: Record<string, string> = {};
  for (const { template } of definition.artifacts)
    templates[template] = readFileSync(resource("template", template), "utf8");
  const rubric = folders.map((folder) => join(folder, "review/RUBRIC.md")).find((f) => existsSync(f));
  return { definition, workstreams, validator, questions, templates, workstreamDirs, rubric, resources };
};

/** A resource held where the rule of the repository does not put it. */
export type Misplaced = { kind: Kind; id: string; held: string[]; belongs: string };

/**
 * Every resource of `root` that is held somewhere else than where the definitions naming it put
 * it: with the one definition that names it, with the one the others extend, or in the shared
 * folder when two that name it are unrelated.
 */
export const misplaced = async (root = PACKAGE_ROOT): Promise<Misplaced[]> => {
  const names = schemaNames(root);
  const chains = Object.fromEntries(
    await Promise.all(names.map(async (n) => [n, await chain(n, root)] as const)),
  );
  const namers = new Map<string, { kind: Kind; id: string; by: string[] }>();
  for (const name of names)
    for (const { kind, id } of named(await loadDefinition(name, root))) {
      const entry = namers.get(`${kind}:${id}`) ?? { kind, id, by: [] };
      if (!entry.by.includes(name)) entry.by.push(name);
      namers.set(`${kind}:${id}`, entry);
    }
  const found: Misplaced[] = [];
  for (const { kind, id, by } of namers.values()) {
    const held = [...names, SHARED].filter((n) => existsSync(join(root, SCHEMAS, n, KINDS[kind](id))));
    if (!held.length) continue;
    // The definition every other one naming it extends; none when two of them are unrelated.
    const base = by.find((b) => by.every((n) => chains[n]!.includes(b)));
    const belongs = base ?? SHARED;
    if (held.length !== 1 || held[0] !== belongs) found.push({ kind, id, held, belongs });
  }
  return found;
};

/**
 * The schema the project's tools are composed from: the one schema with workstreams the package
 * defines, or the one the project's `factory.config.ts` names when there are several. With none,
 * the first schema, whose tools check nothing.
 */
export const projectSchemaName = async (project: string, root = PACKAGE_ROOT): Promise<string> => {
  const names = schemaNames(root);
  const building: string[] = [];
  for (const name of names)
    if ((await loadDefinition(name, root)).workstreams.length) building.push(name);
  if (building.length <= 1) return building[0] ?? names[0]!;
  const path = join(project, "factory.config.ts");
  const chosen = existsSync(path) ? (await module<ProjectConfig>(path)).schema : undefined;
  if (chosen && building.includes(chosen)) return chosen;
  throw new Error(
    `this project has ${building.length} schemas that build product code (${building.join(", ")}): name the one its tools are composed from as \`schema\` in factory.config.ts`,
  );
};

/** The configuration of the project at `project`: the defaults of its schema under its `factory.config.ts`. */
export const projectConfig = async (project: string): Promise<FactoryConfig> => {
  const { defaults } = await loadDefinition(await projectSchemaName(project));
  const path = join(project, "factory.config.ts");
  return resolveConfig(
    defaults,
    existsSync(path) ? await module<ProjectConfig>(path) : undefined,
  );
};
