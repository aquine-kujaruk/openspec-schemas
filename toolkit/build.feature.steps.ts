import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect } from "vitest";
import { build, type BuildRecord, freshness as checkFresh, type Freshness } from "./build.ts";
import { PACKAGE_ROOT } from "./paths.ts";

/**
 * Each scenario builds from a repository of its own: this repository's command over a handful of
 * resources written for the scenario. Two schemas are defined, `clean-backend` and
 * `legacy-to-specs`; a manifest lists what the scenario says.
 */
const PHASES = ["plan", "implement", "verify", "archive", "feedback"];
const TOOLS: Record<string, string> = {
  "specification tool": "@fission-ai/openspec",
  linter: "oxlint",
};
const FIELD: Record<string, "workstreams" | "validator" | "questions"> = {
  workstream: "workstreams",
  validator: "validator",
  "question policy": "questions",
};
const PLACE: Record<string, (name: string) => string> = {
  workstream: (name) => `workstreams/${name}`,
  validator: (name) => `validators/${name}`,
  "question policy": (name) => `questions/${name}.md`,
};

const definition = (name: string, overrides: Record<string, unknown> = {}) => ({
  name,
  description: `The ${name} schema`,
  artifacts: [
    {
      id: "plan",
      generates: "plan.md",
      description: "The plan",
      template: "plan.md",
      instruction: "Write the plan.",
      requires: [],
      decides: true,
    },
    {
      id: "specs",
      generates: "specs/**/*.md",
      description: "The specs",
      template: "spec.md",
      instruction: "Write the specs.",
      requires: [],
    },
  ],
  apply: { requires: ["plan"], tracks: "plan.md", instruction: "Build it." },
  workstreams: ["app-domain"],
  validator: "standard",
  questions: "ask-on-commitment",
  defaults: {},
  ...overrides,
});

const module = (value: unknown) => `export default ${JSON.stringify(value, null, 2)};\n`;
const skill = (name: string) => `---\nname: ${name}\ndescription: The ${name} skill.\n---\n\n# ${name}\n`;

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), "build-"));
  const files: Record<string, string> = {
    "package.json": JSON.stringify({ name: "fixture", version: "1.2.0" }),
    "schemas/clean-backend.ts": module(definition("clean-backend")),
    "schemas/legacy-to-specs.ts": module(definition("legacy-to-specs")),
    "workstreams/app-domain/workstream.ts": "export default { layers: () => [] };\n",
    "workstreams/app-domain/SKILL.md": skill("app-domain"),
    "workstreams/app-domain/domain.examples.md": "# domain\n\n## reference\n",
    "validators/standard/validator.ts": "export default { ready: () => [] };\n",
    "validators/strict/validator.ts": "export default { ready: () => [] };\n",
    "questions/ask-on-commitment.md": "Ask on commitment.\n",
    "questions/ask-less.md": "Ask less.\n",
    "templates/plan.md": "# <title>\n",
    "templates/spec.md": "## ADDED Requirements\n",
    "skills/setup/SKILL.md": skill("setup"),
    "instructions/flow.md": "---\ndescription: The flow\n---\n\nEnter through plan.\n",
    ...Object.fromEntries(PHASES.map((p) => [`phases/${p}/SKILL.md`, skill(p)])),
  };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  for (const code of ["toolkit", "review"]) symlinkSync(join(PACKAGE_ROOT, code), join(root, code));
  return root;
};

export function createSteps() {
  const root = repository();
  const out = join(root, "dist");
  let schemas = ["clean-backend"];
  const tools: Record<string, string> = {};
  let built: { dir: string; record: BuildRecord } | undefined;
  let failure: Error | undefined;
  let fresh: Freshness | undefined;

  const writeManifest = (name: string) =>
    writeFileSync(
      join(root, "packages", `${name}.ts`),
      module({
        name,
        description: `The ${name} package`,
        schemas,
        agents: ["claude", "codex"],
        tools,
        skills: [],
        languageServers: [],
        packageManager: { name: "apm", version: "0.35.1" },
        project: { testRunner: "vitest", typeChecker: { name: "typescript", version: "7.0.2" } },
      }),
    );
  const tarball = () => join(built!.dir, ".apm/skills/setup/assets", built!.record.command);
  const tar = (...args: string[]): string =>
    spawnSync("tar", [...args.slice(0, 1), tarball(), ...args.slice(1)], { encoding: "utf8" })
      .stdout;
  const shipped = (path: string): string => tar("-xzOf", `package/${path}`);
  mkdirSync(join(root, "packages"));

  return {
    // Context
    async manifestListingSchemas(packageStep: string, listed: string): Promise<void> {
      schemas = listed.split(", ");
      writeManifest(packageStep);
    },
    async definitionNamesResource(listed: string, kind: string, name: string): Promise<void> {
      const value = kind === "workstream" ? [name] : name;
      writeFileSync(
        join(root, "schemas", `${listed}.ts`),
        module(definition(listed, { [FIELD[kind]!]: value })),
      );
    },
    async resourceDoesNotExist(kind: string, name: string): Promise<void> {
      expect(existsSync(join(root, PLACE[kind]!(name)))).toBe(false);
    },
    async variantOverrides(
      variant: string,
      base: string,
      kind: string,
      override: string,
    ): Promise<void> {
      writeFileSync(
        join(root, "schemas", `${variant}.ts`),
        module({ name: variant, extends: base, [FIELD[kind]!]: override }),
      );
    },
    async packageWasBuilt(packageStep: string): Promise<void> {
      writeManifest(packageStep);
      built = await build(packageStep, { root, out });
    },
    async resourceStateSinceBuild(resource: string, state: string): Promise<void> {
      if (state === "edited") appendFileSync(join(root, resource), "\nedited\n");
      else if (state !== "unchanged") throw new Error(`unknown state: ${state}`);
    },
    async manifestPinsTool(tool: string, version: string): Promise<void> {
      tools[TOOLS[tool]!] = version;
      for (const file of readdirSync(join(root, "packages"))) writeManifest(file.slice(0, -3));
    },

    // Action
    async buildPackage(packageStep: string): Promise<void> {
      try {
        built = await build(packageStep, { root, out });
      } catch (e) {
        failure = e as Error;
      }
    },
    async checkFreshness(packageStep: string): Promise<void> {
      fresh = await checkFresh(packageStep, { root, out });
    },

    // Outcome
    async builtSchemaPresence(schema: string, presence: string): Promise<void> {
      expect(failure?.message).toBeUndefined();
      const entries = tar("-tzf").split("\n");
      const present =
        entries.includes(`package/openspec/schemas/${schema}/schema.yaml`) &&
        entries.includes(`package/schemas/${schema}.js`);
      expect(present ? "present" : "absent").toBe(presence);
      expect(schema in built!.record.schemas).toBe(present);
    },
    async phaseSkillCopies(skillCopies: string): Promise<void> {
      const files = readdirSync(built!.dir, { recursive: true }) as string[];
      for (const phase of PHASES)
        expect(
          files.filter((f) => f.endsWith(join("skills", phase, "SKILL.md"))),
          phase,
        ).toHaveLength(Number(skillCopies));
    },
    async buildFailsNaming(name: string): Promise<void> {
      expect(failure?.message).toContain(name);
    },
    async builtPackagesCalled(builtPackages: string, packageStep: string): Promise<void> {
      expect(existsSync(join(out, packageStep)) ? 1 : 0).toBe(Number(builtPackages));
    },
    async builtSchemaUses(variant: string, kind: string, override: string): Promise<void> {
      expect(failure?.message).toBeUndefined();
      expect(built!.record.schemas[variant]![FIELD[kind] as "validator" | "questions"]).toBe(
        override,
      );
      expect(shipped(`schemas/${variant}.js`)).toContain(`"${FIELD[kind]}": "${override}"`);
      if (kind === "validator")
        expect(shipped(`validators/${override}/validator.js`)).toContain("ready");
      else expect(shipped(`openspec/schemas/${variant}/schema.yaml`)).toContain("Ask less.");
    },
    async builtSchemaKeeps(variant: string, keptKind: string, base: string): Promise<void> {
      const kept = FIELD[keptKind] as "validator" | "questions";
      expect(built!.record.schemas[variant]![kept]).toBe(built!.record.schemas[base]![kept]);
    },
    async packageReportedAs(freshness: string): Promise<void> {
      expect(fresh!.fresh ? "fresh" : "stale", fresh!.changed.join("\n")).toBe(freshness);
    },
    async builtToolVersion(tool: string, version: string): Promise<void> {
      expect(failure?.message).toBeUndefined();
      const { dependencies } = JSON.parse(shipped("package.json")) as {
        dependencies: Record<string, string>;
      };
      expect(dependencies[TOOLS[tool]!]).toBe(version);
    },
  };
}
