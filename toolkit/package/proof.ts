import {
  cpSync,
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { build, packageNames } from "../repository/build.ts";
import { PLACES } from "./doctor.ts";
import { parseExampleFile } from "../architecture/example-file.ts";
import { capture, COMMAND, INSTALLED, PROJECT_ROOT, SETUP_ASSETS, SOURCE_EXT } from "../core/paths.ts";
import { loadCore, loadDefinition, loadSchema } from "../repository/schema.ts";
import type { Installed } from "../core/types.ts";

const TSCONFIG = {
  compilerOptions: {
    target: "es2023",
    module: "esnext",
    moduleResolution: "bundler",
    strict: true,
    jsx: "react-jsx",
    noEmit: true,
    skipLibCheck: true,
  },
  include: ["src", "test"],
};

/**
 * The packages the reference module written in `project` imports, by name, with the types a file
 * that carries markup needs to type-check.
 */
const referenceImports = (project: string): string[] => {
  const names = new Set<string>();
  const files = globSync("{src,test}/**/*.{ts,tsx}", { cwd: project });
  for (const file of files)
    for (const [, specifier] of readFileSync(join(project, file), "utf8").matchAll(/from "([^"./][^"]*)"/g)) {
      if (specifier!.startsWith("node:")) continue;
      const parts = specifier!.split("/");
      names.add(specifier!.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!);
    }
  if (files.some((f) => f.endsWith(".tsx"))) for (const name of ["react", "@types/react"]) names.add(name);
  names.add("@types/node");
  return [...names].sort();
};

/**
 * `factory proof [package]`: builds the package and proves it in an empty project. The package is
 * installed from the folder it was built in, the command is pinned from its tarball, setup repairs
 * the project, and the reference module of the package's workstreams is written out, its tests
 * generated, its rules checked and its tests run, all with the installed command. Exit status 0
 * when every step passes; the project is kept when one fails.
 */
export const run = async (args: string[]): Promise<number> => {
  const name = args.find((a) => !a.startsWith("--")) ?? packageNames(PROJECT_ROOT)[0];
  if (!name) {
    console.error("This repository defines no package to prove.");
    return 2;
  }
  const out = mkdtempSync(join(tmpdir(), `${COMMAND}-proof-`));
  const project = join(out, "project");
  mkdirSync(project);
  const step = (label: string, command: string, ...rest: string[]): boolean => {
    const r = capture(command, rest, { cwd: project });
    console.log(`${r.status === 0 ? "✓" : "✗"} ${label}`);
    if (r.status !== 0) console.log(`${r.stdout}${r.stderr}`.trim().split("\n").slice(-40).join("\n"));
    return r.status === 0;
  };
  const factory = (label: string, ...rest: string[]) =>
    step(label, "pnpm", "exec", COMMAND, ...rest);

  const { dir, record } = await build(name, { root: PROJECT_ROOT, out: join(out, "dist") });
  const installed = JSON.parse(
    readFileSync(join(dir, ".apm/skills", SETUP_ASSETS, INSTALLED), "utf8"),
  ) as Installed;
  writeFileSync(join(project, "package.json"), JSON.stringify({ name: "proof", private: true, type: "module" }));
  writeFileSync(join(project, "tsconfig.json"), JSON.stringify(TSCONFIG, null, 2));

  const { name: manager } = installed.packageManager;
  const available = capture(manager, ["--version"]).status === 0;
  if (available)
    step(`${name} is installed with ${manager}`, manager, "install", dir, "--target", installed.agents.join(","));
  else {
    console.log(`✓ ${name} is put where ${manager} would install it (${manager} is not on the path)`);
    for (const agent of installed.agents) {
      const place = PLACES[agent]!;
      cpSync(join(dir, ".apm/skills"), join(project, place.skills), { recursive: true });
      for (const hooks of globSync("*.json", { cwd: join(dir, ".apm/hooks") })) {
        mkdirSync(dirname(join(project, place.hooks)), { recursive: true });
        cpSync(join(dir, ".apm/hooks", hooks), join(project, place.hooks));
      }
      if ("rules" in place.instruction)
        for (const [rule, text] of Object.entries(installed.instructions)) {
          mkdirSync(join(project, place.instruction.rules), { recursive: true });
          writeFileSync(join(project, place.instruction.rules, `${rule}.md`), `${text}\n`);
        }
    }
  }

  const own = JSON.parse(readFileSync(join(PROJECT_ROOT, "package.json"), "utf8")) as {
    devDependencies: Record<string, string>;
  };
  const { testRunner, typeChecker } = installed.project;
  const schemaPackages = new Set<string>();
  for (const schema of installed.schemas)
    schemaPackages.add((await loadDefinition(schema, PROJECT_ROOT)).defaults.schemaPackage);
  const skills = PLACES[installed.agents[0]!]!.skills;
  const proved = await loadSchema(installed.schemas[0]!, PROJECT_ROOT);
  // The workstream that owns the cross-module layer reduces the code workstreams; its check covers them.
  const reducer = Object.entries(proved.workstreamDirs).find(([, folder]) =>
    existsSync(join(folder, `modules.rules${SOURCE_EXT}`)),
  )?.[0];
  // What the schema adds to its core is its framework: proved on top, with the packages its reference imports.
  const { core } = proved.definition;
  const ofCore = core ? (await loadCore(core, proved.definition.name, PROJECT_ROOT)).workstreams : [];
  const added = core ? proved.definition.workstreams.filter((w) => !ofCore.includes(w)) : [];
  const steps: Array<() => boolean> = [
    () =>
      step(
        "the command is pinned from its tarball, with what the project supplies",
        "pnpm",
        "add",
        "-D",
        `./${join(skills, SETUP_ASSETS, record.command)}`,
        `${testRunner}@${own.devDependencies[testRunner] ?? "latest"}`,
        `${typeChecker.name}@${typeChecker.version}`,
        ...schemaPackages,
        // A package that builds a web frontend pins its end-to-end tools; setup reports them missing otherwise.
        ...Object.entries(installed.project.e2e?.packages ?? {}).map(([name, version]) => `${name}@${version}`),
      ),
    () => factory("setup repairs the project and nothing is lacking", "doctor", "--fix"),
    () => factory("the roots are prepared", "prepare"),
    () => {
      for (const file of globSync(join(project, skills, "implement/references/workstreams/*/*.examples.md")))
        for (const [path, content] of parseExampleFile(file).reference) {
          // A reference shows a generated test only as a stand-in; the generator writes the real one.
          if (path.endsWith(".feature.test.ts")) continue;
          mkdirSync(dirname(join(project, path)), { recursive: true });
          writeFileSync(join(project, path), content);
        }
      console.log("✓ the reference module is written out");
      return true;
    },
    () => factory("its tests are generated from its spec", "generate"),
    () => factory("the generated tests are fresh", "generate", "--check"),
    () => (reducer ? factory("its rules hold", "check", "--workstream", reducer) : factory("its rules hold", "check")),
    ...(added.length
      ? [
          () => {
            const imported = referenceImports(project);
            return step(
              `the packages its reference imports are added (${imported.join(", ")})`,
              "pnpm",
              "add",
              "-D",
              ...imported,
            );
          },
          ...added.map((w) => () => factory(`the rules of ${w} hold`, "check", "--workstream", w)),
          () => {
            // The framework's reference files and what they import; the core's own references are proved by their rules and tests.
            const files = added.flatMap((w) =>
              globSync(join(project, skills, "implement/references/workstreams", w, "*.examples.md")).flatMap((f) =>
                [...parseExampleFile(f).reference.keys()].filter((path) => !path.endsWith(".feature.test.ts")),
              ),
            );
            const { include: _all, compilerOptions } = TSCONFIG;
            const framework = { compilerOptions: { ...compilerOptions, types: ["node"] }, files };
            writeFileSync(join(project, "tsconfig.framework.json"), JSON.stringify(framework, null, 2));
            return step(`its ${added.join(" and ")} reference type-checks`, "pnpm", "exec", "tsc", "-p", "tsconfig.framework.json");
          },
        ]
      : []),
    () => factory("its acceptance tests pass", "test", "acceptance"),
    () => factory("its integration tests pass", "test", "integration"),
  ];
  const passed = steps.every((run) => run());
  if (passed) rmSync(out, { recursive: true, force: true });
  console.log(passed ? `proof passes: ${basename(dir)}` : `proof fails; the project is kept at ${project}`);
  return passed ? 0 : 1;
};
