import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { stringify } from "yaml";
import {
  capture,
  COMMAND,
  INSTALLED,
  PACKAGE_ROOT,
  PROJECT_ROOT,
  SETUP_ASSETS,
  SOURCE_EXT,
} from "../factory/shared/infrastructure/adapters/paths.adapter.ts";
import type { Schema } from "../factory/engineering.ts";
import { schema as repositoryschema } from "../factory/engineering.ts";
const { definitionFiles, loadSchema, misplaced, SCHEMAS, SHARED } =
  repositoryschema;
import { schemaYaml as repositoryschemaYaml } from "../factory/engineering.ts";
const { schemaFiles } = repositoryschemaYaml;
import type {
  Installed,
  PackageManifest,
} from "../factory/shared/domain/schemas/line-types.schema.ts";

/** What a build wrote down about itself: what the package carries and every resource it was built from. */
export type BuildRecord = {
  package: string;
  version: string;
  agents: string[];
  /** Per schema, the resources its definition resolved to. */
  schemas: Record<
    string,
    {
      workstreams: string[];
      validator: string;
      questions: string;
      templates: string[];
    }
  >;
  tools: Record<string, string>;
  /** The file name of the command's tarball. */
  command: string;
  /** Every file the package was built from, by its path in the repository, with its hash. */
  resources: Record<string, string>;
};

export type BuildOptions = { root?: string; out?: string };

const RECORD = "build.json";

const body = (markdown: string): string =>
  markdown.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
const EXACT = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const IMPORT = /(?:from|import\()\s*"(\.{1,2}\/[^"]+\.ts)"/g;

const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

const write = (path: string, content: string | Buffer): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

/** The modules reached from `entries` through relative imports, as paths under `root`: what the command runs. */
const reached = (root: string, entries: string[]): string[] => {
  const seen = new Set<string>();
  const visit = (file: string): void => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const [, specifier] of readFileSync(join(root, file), "utf8").matchAll(
      IMPORT,
    ))
      visit(relative(root, join(root, dirname(file), specifier!)));
  };
  entries.forEach(visit);
  return [...seen].sort();
};

/** The packages `root` defines, by name. */
export const packageNames = (root = PACKAGE_ROOT): string[] =>
  existsSync(join(root, "packages"))
    ? readdirSync(join(root, "packages"))
        .filter((f) => f.endsWith(SOURCE_EXT))
        .map((f) => basename(f, SOURCE_EXT))
        .sort()
    : [];

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.ESNext,
  verbatimModuleSyntax: true,
  rewriteRelativeImportExtensions: true,
};

const javascript = (path: string): string =>
  ts.transpileModule(readFileSync(path, "utf8"), {
    fileName: path,
    compilerOptions: COMPILER_OPTIONS,
  }).outputText;

/** The declarations of a module, importing its neighbours as the built files are named. */
const declarations = (path: string): string =>
  ts
    .transpileDeclaration(readFileSync(path, "utf8"), {
      fileName: path,
      compilerOptions: { ...COMPILER_OPTIONS, declaration: true },
    })
    .outputText.replace(/((?:from\s*|import\(\s*)"\.{1,2}\/[^"]+)\.ts"/g, '$1.js"');

const REPOSITORY =
  /^(?:git\+)?(?:https?:\/\/|ssh:\/\/git@|git@)?([^/:@]+)[/:](.+?)(?:\.git)?\/?$/;

/**
 * A skill that ships inside a pinned tool, as the agent package manager installs it: its folder in
 * the tool's repository, at the tag of the version the manifest pins. The package carries no copy.
 */
const skillDependency = (
  root: string,
  manifest: PackageManifest,
  taken: PackageManifest["skills"][number],
  used: (path: string) => string,
): string => {
  if ("repository" in taken) {
    const skill = basename(taken.path);
    if (!taken.commit)
      throw new Error(
        `package ${manifest.name} takes the skill ${skill} from ${taken.repository} at no commit: pin the commit it is declared at`,
      );
    return `${taken.repository}/${taken.path}#${taken.commit}`;
  }
  const { tool, path } = taken;
  const skill = basename(path);
  const about = `package ${manifest.name} takes the skill ${skill} from ${tool}`;
  const version = manifest.tools[tool];
  if (!version)
    throw new Error(
      `${about}, which it does not pin: add ${tool} to its tools`,
    );
  const described = join(root, "node_modules", tool, "package.json");
  if (!existsSync(join(root, "node_modules", tool, path, "SKILL.md")))
    throw new Error(`${about}, and ${tool} ${version} has no ${path}/SKILL.md`);
  const { repository } = JSON.parse(readFileSync(used(described), "utf8")) as {
    repository?: string | { url?: string };
  };
  const url = typeof repository === "string" ? repository : repository?.url;
  const [, host, repo] =
    REPOSITORY.exec(url?.replace(/^github:/, "github.com/") ?? "") ?? [];
  if (!host || !repo)
    throw new Error(
      `${about}, and ${tool} does not say where its repository is: the skill ${skill} cannot be declared`,
    );
  // The agent package manager reads `owner/repo` as a repository of its default host.
  const source = host === "github.com" ? repo : `${host}/${repo}`;
  return `${source}/${path}#v${version}`;
};

/**
 * Builds the package `name` of `root` into `<out>/<name>`: the folder the agent package manager
 * installs from. Whatever was built there before is gone first, so a build that fails leaves none.
 */
export const build = async (
  name: string,
  { root = PACKAGE_ROOT, out = join(root, "dist") }: BuildOptions = {},
): Promise<{ dir: string; record: BuildRecord }> => {
  const dir = join(out, name);
  rmSync(dir, { recursive: true, force: true });

  const manifestPath = join(root, "packages", `${name}${SOURCE_EXT}`);
  if (!existsSync(manifestPath))
    throw new Error(
      `no package is called ${name}; packages: ${packageNames(root).join(", ")}`,
    );
  const manifest = (
    (await import(pathToFileURL(manifestPath).href)) as {
      default: PackageManifest;
    }
  ).default;
  for (const [tool, version] of Object.entries(manifest.tools))
    if (!EXACT.test(version))
      throw new Error(
        `package ${name} pins ${tool} at ${version}: pin one exact version`,
      );
  const { version, engines } = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  ) as {
    version: string;
    engines?: Record<string, string>;
  };

  const wrong = await misplaced(root);
  if (wrong.length)
    throw new Error(
      wrong
        .map(
          (w) =>
            `the ${w.kind} ${w.id} is held in ${w.held.map((h) => `${SCHEMAS}/${h}`).join(" and ")} and belongs in ${SCHEMAS}/${w.belongs}: a resource lives with the one definition that names it, with the one the others extend, or in ${SCHEMAS}/${SHARED} when unrelated definitions name it`,
        )
        .join("\n"),
    );
  const schemas: Schema[] = [];
  for (const schema of manifest.schemas)
    schemas.push(await loadSchema(schema, root));
  const shared = (folder: string): string => join(SCHEMAS, SHARED, folder);
  const found = (kinds: string[]): string[] => [
    ...new Set(
      schemas.flatMap((s) =>
        s.resources
          .filter((r) => kinds.includes(r.kind))
          .map((r) => relative(root, r.file)),
      ),
    ),
  ];
  const workstreamDirs = [
    ...new Map(
      schemas.flatMap((s) =>
        Object.entries(s.workstreamDirs).map(
          ([id, dir]) => [id, relative(root, dir)] as const,
        ),
      ),
    ),
  ];

  const resources: Record<string, string> = {};
  const used = (path: string): string => {
    resources[relative(root, path)] = sha256(path);
    return path;
  };
  const files = (folder: string, pattern = "**/*"): string[] =>
    existsSync(join(root, folder))
      ? globSync(pattern, { cwd: join(root, folder), withFileTypes: true })
          .filter((f) => f.isFile())
          .map((f) => relative(root, join(f.parentPath, f.name)))
          .sort()
      : [];
  const copy = (from: string, to: string): void =>
    write(to, readFileSync(used(join(root, from))));

  used(manifestPath);
  used(join(root, "package.json"));
  const definitions: string[] = [];
  for (const schema of manifest.schemas)
    for (const file of await definitionFiles(schema, root))
      if (!definitions.includes(file)) definitions.push(used(file));

  const building = mkdtempSync(join(tmpdir(), `${COMMAND}-build-`));
  try {
    const pkg = join(building, "package");
    const skills = join(pkg, ".apm/skills");

    for (const folder of [shared("phases"), shared("skills")])
      for (const file of files(folder))
        copy(file, join(skills, relative(folder, file)));
    if (!existsSync(join(skills, "setup/SKILL.md")))
      throw new Error(
        `the package needs ${shared("skills")}/setup/SKILL.md: the setup skill carries the command`,
      );
    for (const [id, dir] of workstreamDirs)
      for (const file of files(dir, "{SKILL.md,*.examples.md}"))
        copy(
          file,
          join(skills, "implement/references/workstreams", id, basename(file)),
        );
    const declared = manifest.skills.map((skill) =>
      skillDependency(root, manifest, skill, used),
    );
    for (const file of files(shared("instructions"), "*.md"))
      copy(
        file,
        join(
          pkg,
          ".apm/instructions",
          `${basename(file, ".md")}.instructions.md`,
        ),
      );
    for (const file of files(shared("hooks"), "*.json"))
      copy(file, join(pkg, ".apm/hooks", basename(file)));

    const command = join(building, "command");
    const compiled = reached(root, [
      "factory/main.ts",
      "factory/shared/domain/schemas/configuration.schema.ts",
      "factory/sdk.ts",
      ...definitions.map((file) => relative(root, file)),
      ...found(["core", "workstream", "validator"]),
    ]);
    for (const file of compiled.filter((f) => !f.startsWith("tools/")))
      write(
        join(command, file.replace(/\.ts$/, ".js")),
        javascript(used(join(root, file))),
      );
    for (const file of compiled.filter((f) => !f.startsWith("tools/")))
      write(
        join(command, file.replace(/\.ts$/, ".d.ts")),
        declarations(join(root, file)),
      );
    chmodSync(join(command, "factory/main.js"), 0o755);
    for (const file of [
      ...found(["question policy", "template"]),
      ...new Set(
        schemas.flatMap((s) => s.rubrics.map((r) => relative(root, r))),
      ),
    ])
      copy(file, join(command, file));
    for (const schema of schemas)
      for (const [path, text] of Object.entries(schemaFiles(schema)))
        write(
          join(command, "openspec/schemas", schema.definition.name, path),
          text,
        );
    write(
      join(command, "package.json"),
      `${JSON.stringify(
        {
          name: COMMAND,
          version,
          description: manifest.description,
          type: "module",
          bin: { [COMMAND]: "./factory/main.js" },
          exports: {
            ".": {
              types: "./factory/shared/domain/schemas/configuration.schema.d.ts",
              default: "./factory/shared/domain/schemas/configuration.schema.js",
            },
            "./sdk": {
              types: "./factory/sdk.d.ts",
              default: "./factory/sdk.js",
            },
            "./package.json": "./package.json",
          },
          dependencies: Object.fromEntries(
            Object.entries(manifest.tools).sort(([a], [b]) =>
              a.localeCompare(b),
            ),
          ),
          ...(engines ? { engines } : {}),
        },
        null,
        2,
      )}\n`,
    );
    const assets = join(skills, SETUP_ASSETS);
    mkdirSync(assets, { recursive: true });
    const packed = capture("pnpm", ["pack", "--pack-destination", assets], {
      cwd: command,
    });
    const tarball = `${COMMAND}-${version}.tgz`;
    if (packed.status !== 0 || !existsSync(join(assets, tarball)))
      throw new Error(
        `packing the command failed:\n${packed.stdout}\n${packed.stderr}`,
      );

    const installed: Installed = {
      package: manifest.name,
      version,
      command: tarball,
      agents: manifest.agents,
      schemas: manifest.schemas,
      phases: files(shared("phases"), "*/SKILL.md").map((f) =>
        basename(dirname(f)),
      ),
      instructions: Object.fromEntries(
        files(shared("instructions"), "*.md").map((f) => [
          basename(f, ".md"),
          body(readFileSync(join(root, f), "utf8")),
        ]),
      ),
      guards: files(shared("hooks"), "*.json").map((f) => basename(f)),
      packageManager: manifest.packageManager,
      project: manifest.project,
    };
    write(join(assets, INSTALLED), `${JSON.stringify(installed, null, 2)}\n`);

    write(
      join(pkg, "apm.yml"),
      stringify({
        name: manifest.name,
        version,
        description: manifest.description,
        targets: manifest.agents,
        ...(declared.length || manifest.languageServers.length
          ? {
              dependencies: {
                ...(declared.length ? { apm: declared } : {}),
                ...(manifest.languageServers.length
                  ? { lsp: manifest.languageServers }
                  : {}),
              },
            }
          : {}),
      }),
    );
    const record: BuildRecord = {
      package: manifest.name,
      version,
      agents: manifest.agents,
      schemas: Object.fromEntries(
        schemas.map(({ definition: d }) => [
          d.name,
          {
            workstreams: d.workstreams,
            validator: d.validator,
            questions: d.questions,
            templates: d.artifacts.map((a) => a.template),
          },
        ]),
      ),
      tools: manifest.tools,
      command: tarball,
      resources: Object.fromEntries(
        Object.entries(resources).sort(([a], [b]) => a.localeCompare(b)),
      ),
    };
    write(join(pkg, RECORD), `${JSON.stringify(record, null, 2)}\n`);

    mkdirSync(out, { recursive: true });
    try {
      renameSync(pkg, dir);
    } catch {
      cpSync(pkg, dir, { recursive: true });
    }
    return { dir, record };
  } finally {
    rmSync(building, { recursive: true, force: true });
  }
};

export type Freshness = { fresh: boolean; changed: string[] };

/**
 * Whether `<out>/<name>` is what a build would give now: `changed` lists every resource that was
 * edited, added or removed since it was built. A package that was never built is stale.
 */
export const freshness = async (
  name: string,
  { root = PACKAGE_ROOT, out = join(root, "dist") }: BuildOptions = {},
): Promise<Freshness> => {
  const recorded = join(out, name, RECORD);
  if (!existsSync(recorded))
    return { fresh: false, changed: [`${name} was never built`] };
  const before = (JSON.parse(readFileSync(recorded, "utf8")) as BuildRecord)
    .resources;
  const scratch = mkdtempSync(join(tmpdir(), `${COMMAND}-fresh-`));
  try {
    const now = (await build(name, { root, out: scratch })).record.resources;
    const changed = [...new Set([...Object.keys(before), ...Object.keys(now)])]
      .filter((path) => before[path] !== now[path])
      .sort();
    return { fresh: changed.length === 0, changed };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
};

/**
 * `factory build <package> [--check]`: builds the package into `dist/<package>`; with `--check`,
 * only says whether what is there is fresh. Exit status 1 when the build fails or the package is stale.
 */
export const run = async (args: string[]): Promise<number> => {
  const name = args.find((a) => !a.startsWith("--"));
  if (!name) {
    console.error(
      `Name the package to build. Packages: ${packageNames(PROJECT_ROOT).join(", ")}`,
    );
    return 2;
  }
  try {
    if (args.includes("--check")) {
      const { fresh, changed } = await freshness(name, { root: PROJECT_ROOT });
      console.log(`${fresh ? "fresh" : "stale"}: ${name}`);
      for (const path of changed) console.log(`- ${path}`);
      return fresh ? 0 : 1;
    }
    const { dir, record } = await build(name, { root: PROJECT_ROOT });
    console.log(
      `built ${relative(PROJECT_ROOT, dir)}: ${Object.keys(record.schemas).join(", ")} for ${record.agents.join(", ")}, ${record.command}`,
    );
    return 0;
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
};
