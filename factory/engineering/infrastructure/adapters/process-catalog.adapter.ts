import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";

import type {
  CatalogResourceKind as Kind, CatalogSchema, CoreDefinition, MisplacedResource as Misplaced,
  ProjectConfig, SchemaDefinition, SchemaVariant, Topology, WorkstreamDeclaration,
} from "../acl/process.acl.ts";

export function createProcessCatalog<V>(
  PACKAGE_ROOT: string,
  SOURCE_EXT: string,
  loadModule: (specifier: string) => Promise<unknown>,
) {
  const SCHEMAS = "schemas";

  const SHARED = "shared";

  const CORES = "cores";

  const coreFolder = (id: string): string => join(SHARED, CORES, id);

  const corePath = (root: string, id: string): string =>
    join(root, SCHEMAS, coreFolder(id), `core${SOURCE_EXT}`);

  const coreNames = (root = PACKAGE_ROOT): string[] =>
    existsSync(join(root, SCHEMAS, SHARED, CORES))
      ? readdirSync(join(root, SCHEMAS, SHARED, CORES))
          .filter((id) => existsSync(corePath(root, id)))
          .sort()
      : [];

  const definitionPath = (root: string, name: string): string =>
    join(root, SCHEMAS, name, `schema${SOURCE_EXT}`);

  const schemaNames = (root = PACKAGE_ROOT): string[] =>
    existsSync(join(root, SCHEMAS))
      ? readdirSync(join(root, SCHEMAS))
          .filter(
            (name) => name !== SHARED && existsSync(definitionPath(root, name)),
          )
          .sort()
      : [];

  const load = async <T>(path: string): Promise<T> =>
    ((await loadModule(pathToFileURL(path).href)) as { default: T }).default;

  const chain = async (
    name: string,
    root = PACKAGE_ROOT,
    seen: string[] = [],
  ): Promise<string[]> => {
    const path = definitionPath(root, name);

    if (!existsSync(path))
      throw new EngineeringException(
        `no schema is called ${name}; schemas: ${schemaNames(root).join(", ")}`,
        { cause: { root } },
      );

    if (seen.includes(name))
      throw new EngineeringException(
        `schema ${name} extends itself: ${[...seen, name].join(" → ")}`,
        { cause: { root } },
      );

    const written = await load<SchemaDefinition | SchemaVariant>(path);

    return "extends" in written
      ? [name, ...(await chain(written.extends, root, [...seen, name]))]
      : [name];
  };

  const definitionFiles = async (
    name: string,
    root = PACKAGE_ROOT,
  ): Promise<string[]> =>
    (await chain(name, root)).map((n) => definitionPath(root, n));

  const writtenDefinition = async (
    name: string,
    root = PACKAGE_ROOT,
  ): Promise<SchemaDefinition> => {
    const written = await load<SchemaDefinition | SchemaVariant>(
      definitionPath(root, name),
    );

    if (!("extends" in written)) return written;
    const { extends: base, ...overrides } = written;

    return { ...(await writtenDefinition(base, root)), ...overrides };
  };

  const loadCore = async (
    id: string,
    by: string,
    root = PACKAGE_ROOT,
  ): Promise<CoreDefinition> => {
    if (!existsSync(corePath(root, id)))
      throw new EngineeringException(
        `schema ${by} names the core ${id}, which does not exist; cores: ${coreNames(root).join(", ") || "none"}`,
        { cause: { root } },
      );

    return load<CoreDefinition>(corePath(root, id));
  };

  const joinTopology = (core: Topology, own: Topology): Topology => {
    const joined: Topology = { ...core };

    for (const [id, { dependsOn }] of Object.entries(own))
      joined[id] = {
        dependsOn: [...new Set([...(core[id]?.dependsOn ?? []), ...dependsOn])],
      };

    return joined;
  };

  const loadDefinition = async (
    name: string,
    root = PACKAGE_ROOT,
  ): Promise<SchemaDefinition> => {
    const definition = await withCore(
      await writtenDefinition(name, root),
      name,
      root,
    );

    const spike = definition.spike?.workstream;

    if (spike && !definition.workstreams.includes(spike))
      throw new EngineeringException(
        `schema ${name} names ${spike} as its spike workstream, which is not one of its workstreams: ${definition.workstreams.join(", ") || "none"}`,
        { cause: { root } },
      );

    return definition;
  };

  const withCore = async (
    written: SchemaDefinition,
    name: string,
    root: string,
  ): Promise<SchemaDefinition> => {
    if (!written.core) return written;
    const core = await loadCore(written.core, name, root);

    const again = written.workstreams.filter((id) =>
      core.workstreams.includes(id),
    );

    if (again.length)
      throw new EngineeringException(
        `schema ${name} names the workstream ${again.join(", ")}, which its core ${core.name} already lists: name only the workstreams the schema adds`,
        { cause: { root } },
      );

    return {
      ...written,
      workstreams: [...core.workstreams, ...written.workstreams],
      checks: core.checks ?? [],
      defaults: {
        ...written.defaults,
        workstreams: joinTopology(
          core.topology,
          written.defaults.workstreams ?? {},
        ),
      },
    };
  };

  const KINDS = {
    core: (id: string) => join(CORES, id, `core${SOURCE_EXT}`),
    workstream: (id: string) =>
      join("workstreams", id, `workstream${SOURCE_EXT}`),
    validator: (id: string) => join("validators", id, `validator${SOURCE_EXT}`),
    "question policy": (id: string) => join("questions", `${id}.md`),
    template: (id: string) => join("templates", id),
  } as const;

  const named = (d: SchemaDefinition): Array<{ kind: Kind; id: string }> => [
    ...d.workstreams.map((id) => ({ kind: "workstream" as const, id })),
    { kind: "validator", id: d.validator },
    { kind: "question policy", id: d.questions },
    ...d.artifacts.map((a) => ({ kind: "template" as const, id: a.template })),
  ];

  const loadSchema = async (
    name: string,
    root = PACKAGE_ROOT,
  ): Promise<CatalogSchema<V>> =>
    schemaOf(await loadDefinition(name, root), await chain(name, root), root);

  const schemaOf = async (
    definition: SchemaDefinition,
    chained: string[],
    root: string,
  ): Promise<CatalogSchema<V>> => {
    const { name } = definition;

    const folders = [
      ...chained,
      ...(definition.core ? [coreFolder(definition.core)] : []),
      SHARED,
    ].map((n) => join(root, SCHEMAS, n));

    const resources: CatalogSchema<V>["resources"] = [];

    const resource = (kind: Kind, id: string): string => {
      const file = folders
        .map((folder) => join(folder, KINDS[kind](id)))
        .find((f) => existsSync(f));

      if (!file)
        throw new EngineeringException(
          `schema ${name} names the ${kind} ${id}, which does not exist`,
          { cause: { root } },
        );

      resources.push({ kind, id, file });

      return file;
    };

    if (definition.core)
      resources.push({
        kind: "core",
        id: definition.core,
        file: corePath(root, definition.core),
      });

    const workstreams: Record<string, WorkstreamDeclaration> = {};
    const workstreamDirs: Record<string, string> = {};

    for (const id of definition.workstreams) {
      const file = resource("workstream", id);
      workstreams[id] = await load<WorkstreamDeclaration>(file);
      workstreamDirs[id] = dirname(file);
    }

    const validator = await load<V>(
      resource("validator", definition.validator),
    );

    const questions = readFileSync(
      resource("question policy", definition.questions),
      "utf8",
    );

    const templates: Record<string, string> = {};

    for (const { template } of definition.artifacts)
      templates[template] = readFileSync(
        resource("template", template),
        "utf8",
      );

    const rubricIn = (names: string[]) =>
      names
        .map((n) => join(root, SCHEMAS, n, "review/RUBRIC.md"))
        .find((f) => existsSync(f));

    const rubrics = [
      ...(definition.core ? [rubricIn([coreFolder(definition.core)])] : []),
      rubricIn([...chained, SHARED]),
    ].filter((r): r is string => r !== undefined);

    return {
      definition,
      workstreams,
      validator,
      questions,
      templates,
      workstreamDirs,
      rubrics,
      resources,
    };
  };

  const holderNames = async (root = PACKAGE_ROOT): Promise<string[]> => {
    const cores = new Set<string>();
    const schemas: string[] = [];

    for (const name of schemaNames(root)) {
      const written = await writtenDefinition(name, root);
      if (written.core) cores.add(written.core);
      if (written.workstreams.length) schemas.push(name);
    }

    return [...[...cores].sort(), ...schemas];
  };

  const loadHolder = async (
    name: string,
    root = PACKAGE_ROOT,
  ): Promise<CatalogSchema<V>> => {
    if (schemaNames(root).includes(name)) return loadSchema(name, root);
    const naming: string[][] = [];

    for (const schema of schemaNames(root))
      if ((await writtenDefinition(schema, root)).core === name)
        naming.push(await chain(schema, root));

    const base = naming[0]?.find((b) => naming.every((c) => c.includes(b)));

    if (!base)
      throw new EngineeringException(
        `nothing holds ${name}: holders: ${(await holderNames(root)).join(", ")}`,
        { cause: { root } },
      );

    const written = await writtenDefinition(base, root);
    const { examples = {} } = await loadCore(name, name, root);

    const alone = {
      ...written,
      name,
      core: name,
      workstreams: [],
      defaults: { ...written.defaults, ...examples },
    };

    const definition = await withCore(alone, name, root);

    return schemaOf(definition, await chain(base, root), root);
  };

  const misplaced = async (root = PACKAGE_ROOT): Promise<Misplaced[]> => {
    const names = schemaNames(root);

    const chains = Object.fromEntries(
      await Promise.all(
        names.map(async (n) => [n, await chain(n, root)] as const),
      ),
    );

    const cores = coreNames(root);
    const holders = [...names, SHARED, ...cores.map(coreFolder)];

    const heldIn = (kind: Kind, id: string): string[] =>
      holders.filter((n) =>
        existsSync(join(root, SCHEMAS, n, KINDS[kind](id))),
      );

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
      const base = by.find((b) => by.every((n) => chains[n]!.includes(b)));
      const belongs = base ?? SHARED;

      if (held.length !== 1 || held[0] !== belongs)
        found.push({ kind, id, held, belongs });
    }

    for (const core of [...namedCores].filter((c) => cores.includes(c)))
      for (const id of (await loadCore(core, core, root)).workstreams) {
        const held = heldIn("workstream", id);
        const belongs = coreFolder(core);

        if (held.length && (held.length !== 1 || held[0] !== belongs))
          found.push({ kind: "workstream", id, held, belongs });
      }

    return found;
  };

  const projectSchemaName = async (
    project: string,
    root = PACKAGE_ROOT,
  ): Promise<string> => {
    const names = schemaNames(root);
    const building: string[] = [];

    for (const name of names)
      if ((await loadDefinition(name, root)).workstreams.length)
        building.push(name);

    if (building.length <= 1) return building[0] ?? names[0]!;
    const path = join(project, "factory.config.ts");

    const chosen = existsSync(path)
      ? (await load<ProjectConfig>(path)).schema
      : undefined;

    if (chosen && building.includes(chosen)) return chosen;
    if (resolve(project) === resolve(root)) return building[0]!;

    throw new EngineeringException(
      `this project has ${building.length} schemas that build product code (${building.join(", ")}): declare its products by folder as \`products\` in factory.config.ts, or name the one its tools are composed from as \`schema\``,
      { cause: { root } },
    );
  };

  return {
    SCHEMAS,
    SHARED,
    CORES,
    coreFolder,
    coreNames,
    schemaNames,
    chain,
    definitionFiles,
    writtenDefinition,
    loadCore,
    loadDefinition,
    KINDS,
    named,
    loadSchema,
    holderNames,
    loadHolder,
    misplaced,
    projectSchemaName,
  };
}
