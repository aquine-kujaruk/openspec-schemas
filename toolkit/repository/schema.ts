import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ProjectConfig } from "../core/config.ts";
import { PACKAGE_ROOT, SOURCE_EXT } from "../core/paths.ts";
import type {
  CoreDefinition,
  SchemaDefinition,
  SchemaVariant,
  Topology,
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
  /** Its rubrics, in the order review asks them: its core's, then its own or the nearest base's. */
  rubrics: string[];
  /** The file each resource it names was found in. */
  resources: Array<{ kind: Kind; id: string; file: string }>;
};

/** Where the schemas live, and the folder of what unrelated schemas share and every package carries. */
export const SCHEMAS = "schemas";
export const SHARED = "shared";
/** Where the cores live inside the shared folder. */
export const CORES = "cores";

/** The folder of the core `id`, from the schemas folder. */
export const coreFolder = (id: string): string => join(SHARED, CORES, id);
const corePath = (root: string, id: string): string =>
  join(root, SCHEMAS, coreFolder(id), `core${SOURCE_EXT}`);

/** The cores `root` defines, by name. */
export const coreNames = (root = PACKAGE_ROOT): string[] =>
  existsSync(join(root, SCHEMAS, SHARED, CORES))
    ? readdirSync(join(root, SCHEMAS, SHARED, CORES))
        .filter((id) => existsSync(corePath(root, id)))
        .sort()
    : [];

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

/** The definition of `name` as written; a variant is its base with what it overrides laid over. */
export const writtenDefinition = async (
  name: string,
  root = PACKAGE_ROOT,
): Promise<SchemaDefinition> => {
  const written = await module<SchemaDefinition | SchemaVariant>(definitionPath(root, name));
  if (!("extends" in written)) return written;
  const { extends: base, ...overrides } = written;
  return { ...(await writtenDefinition(base, root)), ...overrides };
};

/** The core `id`, which the schema `by` names. */
export const loadCore = async (id: string, by: string, root = PACKAGE_ROOT): Promise<CoreDefinition> => {
  if (!existsSync(corePath(root, id)))
    throw new Error(
      `schema ${by} names the core ${id}, which does not exist; cores: ${coreNames(root).join(", ") || "none"}`,
    );
  return module<CoreDefinition>(corePath(root, id));
};

/** `own` laid over `core`: a workstream of either keeps what it waits for and gains what `own` adds. */
const joinTopology = (core: Topology, own: Topology): Topology => {
  const joined: Topology = { ...core };
  for (const [id, { dependsOn }] of Object.entries(own))
    joined[id] = { dependsOn: [...new Set([...(core[id]?.dependsOn ?? []), ...dependsOn])] };
  return joined;
};

/**
 * The definition of `name`: a variant is its base with what it overrides laid over, and a
 * definition that names a core builds through the core's workstreams, then its own.
 */
export const loadDefinition = async (
  name: string,
  root = PACKAGE_ROOT,
): Promise<SchemaDefinition> => withCore(await writtenDefinition(name, root), name, root);

/** `written` building through the workstreams of the core it names, then its own. */
const withCore = async (
  written: SchemaDefinition,
  name: string,
  root: string,
): Promise<SchemaDefinition> => {
  if (!written.core) return written;
  const core = await loadCore(written.core, name, root);
  const again = written.workstreams.filter((id) => core.workstreams.includes(id));
  if (again.length)
    throw new Error(
      `schema ${name} names the workstream ${again.join(", ")}, which its core ${core.name} already lists: name only the workstreams the schema adds`,
    );
  return {
    ...written,
    workstreams: [...core.workstreams, ...written.workstreams],
    defaults: {
      ...written.defaults,
      workstreams: joinTopology(core.topology, written.defaults.workstreams ?? {}),
    },
  };
};

/** The kinds of resource a definition names, and the file that stands for one inside a folder. */
export const KINDS = {
  core: (id: string) => join(CORES, id, `core${SOURCE_EXT}`),
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
export const loadSchema = async (name: string, root = PACKAGE_ROOT): Promise<Schema> =>
  schemaOf(await loadDefinition(name, root), await chain(name, root), root);

/** `definition` with every resource it names, looked up in the folders of `chained`, its core's and the shared one. */
const schemaOf = async (definition: SchemaDefinition, chained: string[], root: string): Promise<Schema> => {
  const { name } = definition;
  // A core's workstreams are found in the core's folder, after the schema's own and its bases'.
  const folders = [
    ...chained,
    ...(definition.core ? [coreFolder(definition.core)] : []),
    SHARED,
  ].map((n) => join(root, SCHEMAS, n));
  const resources: Schema["resources"] = [];
  const resource = (kind: Kind, id: string): string => {
    const file = folders.map((folder) => join(folder, KINDS[kind](id))).find((f) => existsSync(f));
    if (!file) throw new Error(`schema ${name} names the ${kind} ${id}, which does not exist`);
    resources.push({ kind, id, file });
    return file;
  };

  if (definition.core)
    resources.push({ kind: "core", id: definition.core, file: corePath(root, definition.core) });
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
  const rubricIn = (names: string[]) =>
    names.map((n) => join(root, SCHEMAS, n, "review/RUBRIC.md")).find((f) => existsSync(f));
  const rubrics = [
    ...(definition.core ? [rubricIn([coreFolder(definition.core)])] : []),
    rubricIn([...chained, SHARED]),
  ].filter((r): r is string => r !== undefined);
  return { definition, workstreams, validator, questions, templates, workstreamDirs, rubrics, resources };
};

/**
 * What holds workstreams in `root`: every core a schema names, and every schema that names
 * workstreams of its own. In the repository the command is developed in, the examples of a layer
 * are verified with the defaults of whoever holds the layer's workstream.
 */
export const holderNames = async (root = PACKAGE_ROOT): Promise<string[]> => {
  const cores = new Set<string>();
  const schemas: string[] = [];
  for (const name of schemaNames(root)) {
    const written = await writtenDefinition(name, root);
    if (written.core) cores.add(written.core);
    if (written.workstreams.length) schemas.push(name);
  }
  return [...[...cores].sort(), ...schemas];
};

/**
 * The holder `name` as a schema: a schema as it loads, or a core alone, over the defaults of the
 * nearest definition every schema naming the core extends.
 */
export const loadHolder = async (name: string, root = PACKAGE_ROOT): Promise<Schema> => {
  if (schemaNames(root).includes(name)) return loadSchema(name, root);
  const naming: string[][] = [];
  for (const schema of schemaNames(root))
    if ((await writtenDefinition(schema, root)).core === name) naming.push(await chain(schema, root));
  const base = naming[0]?.find((b) => naming.every((c) => c.includes(b)));
  if (!base) throw new Error(`nothing holds ${name}: holders: ${(await holderNames(root)).join(", ")}`);
  const written = await writtenDefinition(base, root);
  const { examples = {} } = await loadCore(name, name, root);
  const alone = { ...written, name, core: name, workstreams: [], defaults: { ...written.defaults, ...examples } };
  const definition = await withCore(alone, name, root);
  return schemaOf(definition, await chain(base, root), root);
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
  const cores = coreNames(root);
  const holders = [...names, SHARED, ...cores.map(coreFolder)];
  const heldIn = (kind: Kind, id: string): string[] =>
    holders.filter((n) => existsSync(join(root, SCHEMAS, n, KINDS[kind](id))));
  const namers = new Map<string, { kind: Kind; id: string; by: string[] }>();
  const namedCores = new Set<string>();
  for (const name of names) {
    const written = await writtenDefinition(name, root);
    if (written.core) namedCores.add(written.core);
    for (const { kind, id } of named(written)) {
      const entry = namers.get(`${kind}:${id}`) ?? { kind, id, by: [] };
      if (!entry.by.includes(name)) entry.by.push(name);
      namers.set(`${kind}:${id}`, entry);
    }
  }
  const found: Misplaced[] = [];
  for (const { kind, id, by } of namers.values()) {
    const held = heldIn(kind, id);
    if (!held.length) continue;
    // The definition every other one naming it extends; none when two of them are unrelated.
    const base = by.find((b) => by.every((n) => chains[n]!.includes(b)));
    const belongs = base ?? SHARED;
    if (held.length !== 1 || held[0] !== belongs) found.push({ kind, id, held, belongs });
  }
  // A workstream a core lists lives in that core's folder, whoever names the core.
  for (const core of [...namedCores].filter((c) => cores.includes(c)))
    for (const id of (await loadCore(core, core, root)).workstreams) {
      const held = heldIn("workstream", id);
      const belongs = coreFolder(core);
      if (held.length && (held.length !== 1 || held[0] !== belongs))
        found.push({ kind: "workstream", id, held, belongs });
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
  // The repository the command is developed in builds every schema; a run picks its holder apart.
  if (resolve(project) === resolve(root)) return building[0]!;
  throw new Error(
    `this project has ${building.length} schemas that build product code (${building.join(", ")}): declare its products by folder as \`products\` in factory.config.ts, or name the one its tools are composed from as \`schema\``,
  );
};
