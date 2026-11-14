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
} from "./paths.ts";
import { definitionFiles, loadSchema, type Schema } from "./schema.ts";
import { schemaFiles } from "./schema-yaml.ts";
import type { Installed, PackageManifest } from "./types.ts";

/** What a build wrote down about itself: what the package carries and every resource it was built from. */
export type BuildRecord = {
  package: string;
  version: string;
  agents: string[];
  /** Per schema, the resources its definition resolved to. */
  schemas: Record<
    string,
    { workstreams: string[]; validator: string; questions: string; templates: string[] }
  >;
  tools: Record<string, string>;
  /** The file name of the command's tarball. */
  command: string;
  /** Every file the package was built from, by its path in the repository, with its hash. */
  resources: Record<string, string>;
};

export type BuildOptions = { root?: string; out?: string };

const RECORD = "build.json";

const body = (markdown: string): string => markdown.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
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
    for (const [, specifier] of readFileSync(join(root, file), "utf8").matchAll(IMPORT))
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
    .outputText.replace(/(from "\.{1,2}\/[^"]+)\.ts"/g, '$1.js"');

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
    throw new Error(`no package is called ${name}; packages: ${packageNames(root).join(", ")}`);
  const manifest = (
    (await import(pathToFileURL(manifestPath).href)) as { default: PackageManifest }
  ).default;
  for (const [tool, version] of Object.entries(manifest.tools))
    if (!EXACT.test(version))
      throw new Error(`package ${name} pins ${tool} at ${version}: pin one exact version`);
  const { version, engines } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
    version: string;
    engines?: Record<string, string>;
  };

  const schemas: Schema[] = [];
  for (const schema of manifest.schemas) schemas.push(await loadSchema(schema, root));
  const workstreams = [...new Set(schemas.flatMap((s) => s.definition.workstreams))];
  const validators = [...new Set(schemas.map((s) => s.definition.validator))];
  const policies = [...new Set(schemas.map((s) => s.definition.questions))];
  const templates = [
    ...new Set(schemas.flatMap((s) => s.definition.artifacts.map((a) => a.template))),
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
  const copy = (from: string, to: string): void => write(to, readFileSync(used(join(root, from))));

  used(manifestPath);
  used(join(root, "package.json"));
  for (const schema of manifest.schemas)
    for (const file of await definitionFiles(schema, root)) used(file);

  const building = mkdtempSync(join(tmpdir(), `${COMMAND}-build-`));
  try {
    const pkg = join(building, "package");
    const skills = join(pkg, ".apm/skills");

    for (const file of files("phases")) copy(file, join(skills, relative("phases", file)));
    for (const file of files("skills")) copy(file, join(skills, relative("skills", file)));
    if (!existsSync(join(skills, "setup/SKILL.md")))
      throw new Error("the package needs skills/setup/SKILL.md: the setup skill carries the command");
    for (const id of workstreams)
      for (const file of files(`workstreams/${id}`, "{SKILL.md,*.examples.md}"))
        copy(file, join(skills, "implement/references", file));
    for (const { tool, path } of manifest.skills) {
      const from = join(root, "node_modules", tool, path);
      if (!existsSync(join(from, "SKILL.md")))
        throw new Error(`package ${name} names the skill ${path} of ${tool}, which does not exist`);
      for (const file of files(relative(root, from)))
        copy(file, join(skills, basename(path), relative(relative(root, from), file)));
    }
    for (const file of files("instructions", "*.md"))
      copy(file, join(pkg, ".apm/instructions", `${basename(file, ".md")}.instructions.md`));
    for (const file of files("hooks", "*.json")) copy(file, join(pkg, ".apm/hooks", basename(file)));

    const command = join(building, "command");
    const compiled = reached(root, [
      "toolkit/cli.ts",
      "toolkit/config.ts",
      ...workstreams.map((id) => `workstreams/${id}/workstream.ts`),
      ...validators.map((id) => `validators/${id}/validator.ts`),
    ]);
    for (const file of compiled)
      write(join(command, file.replace(/\.ts$/, ".js")), javascript(used(join(root, file))));
    for (const file of ["toolkit/config.ts", "toolkit/types.ts"])
      write(join(command, file.replace(/\.ts$/, ".d.ts")), declarations(join(root, file)));
    chmodSync(join(command, "toolkit/cli.js"), 0o755);
    for (const file of files("review", "*.md")) copy(file, join(command, file));
    for (const policy of policies)
      copy(`questions/${policy}.md`, join(command, `questions/${policy}.md`));
    for (const template of templates)
      copy(`templates/${template}`, join(command, `templates/${template}`));
    for (const schema of schemas) {
      const d = schema.definition;
      write(join(command, `schemas/${d.name}.js`), `export default ${JSON.stringify(d, null, 2)};\n`);
      for (const [path, text] of Object.entries(schemaFiles(schema)))
        write(join(command, "openspec/schemas", d.name, path), text);
    }
    write(
      join(command, "package.json"),
      `${JSON.stringify(
        {
          name: COMMAND,
          version,
          description: manifest.description,
          type: "module",
          bin: { [COMMAND]: "./toolkit/cli.js" },
          exports: {
            ".": { types: "./toolkit/config.d.ts", default: "./toolkit/config.js" },
            "./package.json": "./package.json",
          },
          dependencies: Object.fromEntries(
            Object.entries(manifest.tools).sort(([a], [b]) => a.localeCompare(b)),
          ),
          ...(engines ? { engines } : {}),
        },
        null,
        2,
      )}\n`,
    );
    const assets = join(skills, SETUP_ASSETS);
    mkdirSync(assets, { recursive: true });
    const packed = capture("pnpm", ["pack", "--pack-destination", assets], { cwd: command });
    const tarball = `${COMMAND}-${version}.tgz`;
    if (packed.status !== 0 || !existsSync(join(assets, tarball)))
      throw new Error(`packing the command failed:\n${packed.stdout}\n${packed.stderr}`);

    const installed: Installed = {
      package: manifest.name,
      version,
      command: tarball,
      agents: manifest.agents,
      schemas: manifest.schemas,
      phases: files("phases", "*/SKILL.md").map((f) => basename(dirname(f))),
      instructions: Object.fromEntries(
        files("instructions", "*.md").map((f) => [
          basename(f, ".md"),
          body(readFileSync(join(root, f), "utf8")),
        ]),
      ),
      guards: files("hooks", "*.json").map((f) => basename(f)),
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
        ...(manifest.languageServers.length
          ? { dependencies: { lsp: manifest.languageServers } }
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
  if (!existsSync(recorded)) return { fresh: false, changed: [`${name} was never built`] };
  const before = (JSON.parse(readFileSync(recorded, "utf8")) as BuildRecord).resources;
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
    console.error(`Name the package to build. Packages: ${packageNames(PROJECT_ROOT).join(", ")}`);
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
