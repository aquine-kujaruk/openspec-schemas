import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  globSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect } from "vitest";
import { parse } from "yaml";
import { build, type BuildRecord, freshness as checkFresh, type Freshness } from "./build.ts";
import { PACKAGE_ROOT } from "../core/paths.ts";

/**
 * Each scenario builds from a repository of its own: this repository's command over a handful of
 * resources written for the scenario, laid out as this repository is. Three schemas are defined:
 * `spec-plan`, and `clean-backend` and `legacy-to-specs` extending it; a manifest lists what the
 * scenario says.
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
/** What holds a resource inside the folder of a schema: a folder, or one file. */
const PLACE: Record<string, (name: string) => string> = {
  workstream: (name) => `workstreams/${name}`,
  validator: (name) => `validators/${name}`,
  "question policy": (name) => `questions/${name}.md`,
  template: (name) => `templates/${name}`,
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
  workstreams: [],
  validator: "standard",
  questions: "ask-on-commitment",
  defaults: {},
  ...overrides,
});

const module = (value: unknown) => `export default ${JSON.stringify(value, null, 2)};\n`;
const skillText = (name: string) => `---\nname: ${name}\ndescription: The ${name} skill.\n---\n\n# ${name}\n`;

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), "build-"));
  const files: Record<string, string> = {
    "package.json": JSON.stringify({ name: "fixture", version: "1.2.0" }),
    "schemas/spec-plan/schema.ts": module(definition("spec-plan")),
    "schemas/spec-plan/validators/standard/validator.ts": "export default { ready: () => [] };\n",
    "schemas/spec-plan/questions/ask-on-commitment.md": "Ask on commitment.\n",
    "schemas/spec-plan/templates/plan.md": "# <title>\n",
    "schemas/spec-plan/templates/spec.md": "## ADDED Requirements\n",
    "schemas/clean-backend/schema.ts": module({
      name: "clean-backend",
      extends: "spec-plan",
      description: "The clean-backend schema",
      workstreams: ["app-domain"],
    }),
    "schemas/clean-backend/workstreams/app-domain/workstream.ts":
      "export default { layers: () => [] };\n",
    "schemas/clean-backend/workstreams/app-domain/SKILL.md": skillText("app-domain"),
    "schemas/clean-backend/workstreams/app-domain/domain.examples.md": "# domain\n\n## reference\n",
    "schemas/legacy-to-specs/schema.ts": module({
      name: "legacy-to-specs",
      extends: "spec-plan",
      description: "The legacy-to-specs schema",
    }),
    // Held where the variant that will name each one looks first; no definition names them yet.
    "schemas/clean-backend-strict/validators/strict/validator.ts":
      "export default { ready: () => [] };\n",
    "schemas/clean-backend-quiet/questions/ask-less.md": "Ask less.\n",
    "schemas/shared/skills/setup/SKILL.md": skillText("setup"),
    "schemas/shared/instructions/flow.md":
      "---\ndescription: The flow\n---\n\nEnter through plan.\n",
    ...Object.fromEntries(PHASES.map((p) => [`schemas/shared/phases/${p}/SKILL.md`, skillText(p)])),
  };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  symlinkSync(join(PACKAGE_ROOT, "toolkit"), join(root, "toolkit"));
  return root;
};

export function createSteps() {
  const root = repository();
  const out = join(root, "dist");
  let schemas = ["clean-backend"];
  const tools: Record<string, string> = {};
  const skills: Array<{ tool: string; path: string }> = [];
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
        skills,
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
  const place = (schema: string, kind: string, name: string): string =>
    join(root, "schemas", schema, PLACE[kind]!(name));
  const move = (from: string, to: string): void => {
    if (from === to) return;
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
  };
  const writeDefinition = (name: string, value: unknown): void => {
    mkdirSync(join(root, "schemas", name), { recursive: true });
    writeFileSync(join(root, "schemas", name, "schema.ts"), module(value));
  };

  return {
    // Context
    async manifestListingSchemas(packageStep: string, listed: string): Promise<void> {
      schemas = listed.split(", ");
      writeManifest(packageStep);
    },
    async definitionNamesResource(listed: string, kind: string, name: string): Promise<void> {
      writeDefinition(listed, {
        name: listed,
        extends: "spec-plan",
        description: `The ${listed} schema`,
        workstreams: ["app-domain"],
        [FIELD[kind]!]: kind === "workstream" ? [name] : name,
      });
    },
    async resourceDoesNotExist(kind: string, name: string): Promise<void> {
      expect(globSync(join(root, "schemas/*", PLACE[kind]!(name)))).toEqual([]);
    },
    async variantOverrides(
      variant: string,
      base: string,
      kind: string,
      override: string,
    ): Promise<void> {
      writeDefinition(variant, { name: variant, extends: base, [FIELD[kind]!]: override });
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
    async definitionsNameResourceAnd(
      listed: string,
      kind: string,
      name: string,
      relation: string,
    ): Promise<void> {
      for (const file of globSync(join(root, "schemas/*/schema.ts"))) rmSync(file);
      const naming = { [FIELD[kind]!]: kind === "workstream" ? [name] : name };
      const [, extending, base] = /^(\S+) extends (\S+)$/.exec(relation) ?? [];
      for (const schema of listed.split(", "))
        writeDefinition(
          schema,
          schema === extending
            ? { name: schema, extends: base, description: `The ${schema} schema` }
            : definition(schema, naming),
        );
      // Everything else these definitions name goes where the rule puts it, so only the resource
      // of the scenario can be out of place.
      const schemas = listed.split(", ");
      const belongs = base ?? (schemas.length === 1 ? schemas[0]! : "shared");
      for (const [otherKind, other] of [
        ["validator", "standard"],
        ["question policy", "ask-on-commitment"],
        ["template", "plan.md"],
        ["template", "spec.md"],
      ] as const) {
        if (otherKind === kind && other === name) continue;
        const [now] = globSync(join(root, "schemas/*", PLACE[otherKind]!(other)));
        move(now!, place(belongs, otherKind, other));
      }
    },
    async resourceHeldIn(kind: string, name: string, held: string): Promise<void> {
      const [now] = globSync(join(root, "schemas/*", PLACE[kind]!(name)));
      move(now!, place(held, kind, name));
    },
    async manifestTakesSkillFromTool(skill: string, tool: string, repository: string): Promise<void> {
      const installed = join(root, "node_modules", TOOLS[tool]!);
      mkdirSync(join(installed, "skills", skill), { recursive: true });
      writeFileSync(join(installed, "skills", skill, "SKILL.md"), skillText(skill));
      writeFileSync(
        join(installed, "package.json"),
        JSON.stringify({
          name: TOOLS[tool],
          version: tools[TOOLS[tool]!],
          ...(repository === "none"
            ? {}
            : { repository: { type: "git", url: `git+https://github.com/${repository}.git` } }),
        }),
      );
      skills.push({ tool: TOOLS[tool]!, path: `skills/${skill}` });
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
        entries.includes(`package/schemas/${schema}/schema.js`);
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
      expect(existsSync(join(out, packageStep)) ? 1 : 0, failure?.message).toBe(
        Number(builtPackages),
      );
    },
    async builtSchemaUses(variant: string, kind: string, override: string): Promise<void> {
      expect(failure?.message).toBeUndefined();
      expect(built!.record.schemas[variant]![FIELD[kind] as "validator" | "questions"]).toBe(
        override,
      );
      expect(shipped(`schemas/${variant}/schema.js`)).toContain(`"${FIELD[kind]}": "${override}"`);
      if (kind === "validator")
        expect(shipped(`schemas/${variant}/validators/${override}/validator.js`)).toContain("ready");
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
    async failureSaysBelongsIn(belongs: string): Promise<void> {
      expect(failure?.message).toContain(`belongs in schemas/${belongs}:`);
    },
    async builtPackageDeclares(dependency: string): Promise<void> {
      expect(failure?.message).toBeUndefined();
      const manifest = parse(readFileSync(join(built!.dir, "apm.yml"), "utf8")) as {
        dependencies?: { apm?: string[] };
      };
      expect(manifest.dependencies?.apm).toContain(dependency);
    },
    async skillCopiesHeld(copies: string, skill: string): Promise<void> {
      const files = readdirSync(built!.dir, { recursive: true }) as string[];
      expect(files.filter((f) => f.endsWith(join("skills", skill, "SKILL.md")))).toHaveLength(
        Number(copies),
      );
    },
  };
}
