import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { expect } from "vitest";
import { parse } from "yaml";
import { doctor, pinnedVersion, PLACES, type Report, withSection } from "./doctor.ts";
import { COMMAND, INSTALLED, SETUP_ASSETS } from "../core/paths.ts";
import type { Installed } from "../core/types.ts";

/**
 * Each scenario sets up a project of its own, complete by default: the package installed for both
 * agents, the command pinned from a stub tarball, the schemas linked, the roots in place. Every
 * Given takes one thing away; the project is written, and installed with pnpm, when setup runs.
 */
const PHASES = ["plan", "implement", "verify", "archive", "feedback"];
/** The end-to-end packages a package that builds a web frontend pins. */
const E2E = { e2e: "0.22.0", "@e2e-dev/web": "0.15.4", "@e2e-dev/acp": "0.1.0" };
const FLOW = "Every intention that changes something enters through the plan skill.";
const HOOKS = JSON.stringify({
  hooks: {
    PreToolUse: [{ matcher: "Edit|Write", hooks: [{ type: "command", command: `pnpm exec ${COMMAND} guard` }] }],
    Stop: [{ hooks: [{ type: "command", command: `pnpm exec ${COMMAND} gate` }] }],
  },
});
const OWN_LINE = /^Project rule \d+\.$/;

const pnpm = (cwd: string, ...args: string[]) => {
  const r = spawnSync("pnpm", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`pnpm ${args.join(" ")}\n${r.stdout}\n${r.stderr}`);
};

/** A package of one manifest and the given files, packed once and reused by every scenario. */
const packed = new Map<string, string>();
const stub = (name: string, version: string, files: Record<string, string> = {}): string => {
  const key = `${name}@${version}:${Object.keys(files).sort().join(",")}`;
  if (!packed.has(key)) {
    const dir = mkdtempSync(join(tmpdir(), "stub-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version }));
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    pnpm(dir, "pack", "--pack-destination", join(dir, "out"));
    packed.set(key, join(dir, "out", `${name}-${version}.tgz`));
  }
  return packed.get(key)!;
};

const snapshot = (root: string): Record<string, string> =>
  Object.fromEntries(
    (readdirSync(root, { recursive: true }) as string[])
      .filter((f) => !f.startsWith("node_modules") && statSync(join(root, f)).isFile())
      .map((f) => [f, createHash("sha256").update(readFileSync(join(root, f))).digest("hex")]),
  );

export function createSteps() {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  const at = (path: string) => join(root, path);
  const write = (path: string, text: string) => {
    mkdirSync(dirname(at(path)), { recursive: true });
    writeFileSync(at(path), text);
  };
  let named = "1.2.0";
  let depends: string | undefined;
  let held = ["clean-backend"];
  let linked: string[] | undefined;
  let defaultSchema = "clean-backend";
  let targets = ["claude", "codex"];
  const lacking = new Set<string>();
  let lackingPiece: { piece: string; agent: string } | undefined;
  let own: number | undefined;
  let runsBefore = 0;
  let written = false;
  let outcome: Report | undefined;
  let runbookKey: string | undefined;
  let env: NodeJS.ProcessEnv = process.env;
  // The product's platform, when the package pins end-to-end tools, and the packages the project declares.
  let productPlatform: string | undefined;
  let e2eDeclared: Record<string, string> = {};
  // The runbook a scenario judges, and the scripts and binaries the project holds besides the defaults.
  let suspectSlug: string | undefined;
  const scripts: Record<string, string> = {};
  const binaries: string[] = [];
  let changed = -1;

  const command = (version: string) =>
    stub(
      COMMAND,
      version,
      Object.fromEntries(held.map((s) => [`openspec/schemas/${s}/schema.yaml`, `name: ${s}\n`])),
    );

  const project = () => {
    if (written) return;
    written = true;
    const before = lacking.has("the pinned command") ? "none" : (depends ?? named);
    const installed: Installed = {
      package: "backend",
      version: named,
      command: `${COMMAND}-${named}.tgz`,
      agents: targets,
      schemas: held,
      phases: PHASES,
      instructions: { flow: FLOW },
      guards: ["guards.json"],
      packageManager: { name: "apm", version: "0.35.1" },
      project: {
        testRunner: "vitest",
        typeChecker: { name: "typescript", version: "7.0.2" },
        ...(productPlatform ? { e2e: { packages: E2E, node: "22.22.3" } } : {}),
      },
    };
    if (productPlatform)
      write("factory.config.ts", `export default { schema: "${productPlatform === "web" ? "clean-react" : "clean-backend"}" };\n`);
    const lacks = (piece: string, agent: string) =>
      lackingPiece?.piece === piece && lackingPiece.agent === agent;
    for (const agent of targets) {
      const place = PLACES[agent]!;
      for (const phase of PHASES)
        if (!(phase === "plan" && lacks("the phase skills", agent)))
          write(join(place.skills, phase, "SKILL.md"), `# ${phase}\n`);
      write(join(place.skills, "setup/SKILL.md"), "# setup\n");
      write(join(place.skills, SETUP_ASSETS, INSTALLED), JSON.stringify(installed));
      if (!lacks("the guards", agent)) write(place.hooks, HOOKS);
      if (lacks("the flow instruction", agent)) continue;
      if ("rules" in place.instruction) write(join(place.instruction.rules, "flow.md"), FLOW);
      else write(place.instruction.file, withSection(undefined, [FLOW]));
    }
    if (own !== undefined) {
      rmSync(at("AGENTS.md"), { force: true });
      if (own)
        write(
          "AGENTS.md",
          `${Array.from({ length: own }, (_, i) => `Project rule ${i + 1}.`).join("\n")}\n`,
        );
    }
    write("apm.yml", "name: project\ntargets:\n  - claude\n  - codex\n");

    const assets = join(PLACES[targets[0]!]!.skills, SETUP_ASSETS);
    const tarball = (version: string) => join(assets, `${COMMAND}-${version}.tgz`);
    const devDependencies: Record<string, string> = {};
    if (before !== "none") {
      copyFileSync(command(before), at(tarball(before)));
      devDependencies[COMMAND] = `file:${tarball(before)}`;
    }
    for (const [requirement, name, version] of [
      ["a test runner", "vitest", "5.0.5"],
      ["a type checker", "typescript", "7.0.2"],
    ] as const)
      if (!lacking.has(requirement)) {
        mkdirSync(at("stubs"), { recursive: true });
        copyFileSync(stub(name, version), at(`stubs/${name}-${version}.tgz`));
        devDependencies[name] = `file:stubs/${name}-${version}.tgz`;
      }
    write("package.json", JSON.stringify({ name: "project", private: true, scripts, devDependencies }));
    if (Object.keys(devDependencies).length) pnpm(root, "install");
    for (const name of binaries) write(join("node_modules/.bin", name), "#!/bin/sh\n");
    // The end-to-end packages are declared after the install: setup reads what is declared, and nothing fetches them.
    if (Object.keys(e2eDeclared).length)
      write("package.json", JSON.stringify({ name: "project", private: true, scripts, devDependencies: { ...devDependencies, ...e2eDeclared } }));
    if (before !== named) {
      if (before !== "none") rmSync(at(tarball(before)));
      copyFileSync(command(named), at(tarball(named)));
    }
    for (const agent of targets.slice(1))
      copyFileSync(
        at(tarball(named)),
        at(join(PLACES[agent]!.skills, SETUP_ASSETS, basename(tarball(named)))),
      );

    const links =
      before === "none"
        ? []
        : (linked ?? held).filter((_, i) => !(i === 0 && lacking.has("a schema link")));
    for (const schema of links) {
      mkdirSync(at("openspec/schemas"), { recursive: true });
      symlinkSync(
        join("../../node_modules", COMMAND, "openspec/schemas", schema),
        at(join("openspec/schemas", schema)),
      );
    }
    if (defaultSchema !== "none") write("openspec/config.yaml", `schema: ${defaultSchema}\n`);
    if (!lacking.has("the consolidated roots"))
      for (const dir of ["openspec/specs", "openspec/adr", "openspec/runbooks"])
        mkdirSync(at(dir), { recursive: true });
  };

  return {
    // Context
    async skillsNameCommandVersion(skillsVersion: string): Promise<void> {
      named = skillsVersion;
    },
    async commandDependencyBefore(before: string): Promise<void> {
      if (before === "none") lacking.add("the pinned command");
      else depends = before;
    },
    async installedPackageHolds(schemas: string): Promise<void> {
      held = schemas.split(", ");
      linked = [];
    },
    async defaultSchemaBefore(defaultBefore: string): Promise<void> {
      defaultSchema = defaultBefore;
    },
    async projectLacking(requirement: string): Promise<void> {
      lacking.add(requirement);
    },
    async instructionFileWithOwnLines(agent: string, ownLines: string): Promise<void> {
      expect("file" in PLACES[agent]!.instruction).toBe(true);
      own = Number(ownLines);
    },
    async setupRanBefore(earlierRuns: string): Promise<void> {
      runsBefore = Number(earlierRuns);
    },
    async installedPackageNamesAgents(agents: string): Promise<void> {
      targets = agents.split(", ");
    },
    async projectLacksPieceForAgent(piece: string, agent: string): Promise<void> {
      lackingPiece = { piece, agent };
    },
    async runbookNeedsKey(slug: string, key: string): Promise<void> {
      runbookKey = key;
      write(
        `openspec/runbooks/access/${slug}.md`,
        `# ${slug}\n\n### Procedure: ${slug} · Reach the API\n\n@origin:2026-11-16-add-invoices @purpose:access @env:sandbox @probed:2026-11-16 @keys:${key}\n\n**Requires** ${key} in .env.\n`,
      );
    },
    async keyPresence(key: string, presence: string): Promise<void> {
      if (presence === "in .env") write(".env", `${key}=present\n`);
      else if (presence === "in the environment") env = { ...process.env, [key]: "present" };
      else expect(presence).toBe("absent");
    },
    async productOfPlatform(platform: string): Promise<void> {
      productPlatform = platform;
    },
    async projectDeclaresPackages(declared: string): Promise<void> {
      if (declared === "nothing") return;
      // Declared only, never installed: setup reads what the project declares.
      e2eDeclared = Object.fromEntries(
        declared.split(", ").map((p) => {
          const at = p.lastIndexOf("@");
          return [p.slice(0, at), p.slice(at + 1)];
        }),
      );
    },
    async runbookRuns(slug: string, command: string): Promise<void> {
      suspectSlug = slug;
      // A shell comment inside the fence must not end the block.
      write(
        `openspec/runbooks/setup/${slug}.md`,
        `# ${slug}\n\n### Procedure: ${slug} · Run it\n\n@origin:2026-11-16-add-invoices @purpose:setup @topic:${slug} @env:local\n\n**Steps**\n\n1. Run it:\n\n   \`\`\`bash\n   # from the repository root\n   ${command}\n   \`\`\`\n\n**Verification** It answers.\n`,
      );
    },
    async projectHolds(holding: string): Promise<void> {
      const [, kind, name] = /^the (script|binary|file) (\S+)$/.exec(holding) ?? [];
      if (kind === "script") scripts[name!] = "true";
      else if (kind === "binary") binaries.push(name!);
      else if (kind === "file") write(name!, "#!/bin/sh\n");
      else expect(holding).toBe("nothing");
    },

    // Action
    async runSetupWithRepair(): Promise<void> {
      project();
      for (let i = 0; i < runsBefore; i++) await doctor(root, { fix: true, env });
      outcome = await doctor(root, { fix: true, env });
    },
    async runSetupWithoutRepair(): Promise<void> {
      project();
      const before = snapshot(root);
      outcome = await doctor(root, { env, node: "22.22.3" });
      const after = snapshot(root);
      changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
        (f) => before[f] !== after[f],
      ).length;
    },

    // Outcome
    async commandDependencyAfter(after: string): Promise<void> {
      const { devDependencies } = JSON.parse(readFileSync(at("package.json"), "utf8")) as {
        devDependencies: Record<string, string>;
      };
      expect(devDependencies[COMMAND]).toMatch(new RegExp(`${COMMAND}-${after}\\.tgz$`));
      const installed = JSON.parse(
        readFileSync(at(join("node_modules", COMMAND, "package.json")), "utf8"),
      ) as { version: string };
      expect(installed.version).toBe(after);
    },
    async lockfileRecordsCommand(after: string): Promise<void> {
      expect(pinnedVersion(root)).toBe(after);
      const { packages } = parse(readFileSync(at("pnpm-lock.yaml"), "utf8")) as {
        packages: Record<string, { version?: string }>;
      };
      const recorded = Object.entries(packages).filter(([key]) => key.startsWith(`${COMMAND}@`));
      expect(recorded.map(([, entry]) => entry.version)).toEqual([after]);
    },
    async projectResolvesSchema(schema: string): Promise<void> {
      const link = at(join("openspec/schemas", schema));
      expect(readFileSync(join(link, "schema.yaml"), "utf8")).toBe(`name: ${schema}\n`);
      expect(realpathSync(link)).toBe(
        realpathSync(at(join("node_modules", COMMAND, "openspec/schemas", schema))),
      );
    },
    async defaultSchemaAfter(defaultAfter: string): Promise<void> {
      const config = parse(readFileSync(at("openspec/config.yaml"), "utf8")) as { schema: string };
      expect(config.schema).toBe(defaultAfter);
    },
    async reportsRequirementAs(requirement: string, report: string): Promise<void> {
      // A suspect is never an item nor a note: it is a suspect, or nothing.
      if (requirement === "a suspect runbook") {
        expect(outcome!.items.filter((i) => i.detail.includes(`procedure ${suspectSlug} `))).toEqual([]);
        const flagged = outcome!.suspects.filter((n) => n.includes(`the procedure ${suspectSlug} `));
        expect(flagged, JSON.stringify(outcome!.suspects)).toHaveLength(report === "suspect" ? 1 : 0);
        if (report !== "suspect") expect(report).toBe("not reported");
        return;
      }
      // A key is never an item: it is a note, or nothing.
      if (requirement === "the key of a runbook") {
        expect(outcome!.items.filter((i) => i.detail.includes(runbookKey!))).toEqual([]);
        const noted = outcome!.notes.filter((n) => n.includes(`the key ${runbookKey} `));
        expect(noted).toHaveLength(report === "note" ? 1 : 0);
        if (report !== "note") expect(report).toBe("not reported");
        return;
      }
      expect(outcome!.items.filter((i) => i.requirement === requirement).map((i) => i.report)).toEqual(
        report === "not reported" ? [] : [report],
      );
    },
    async setupExitStatus(status: string): Promise<void> {
      expect(outcome!.status, JSON.stringify(outcome!.items, null, 2)).toBe(Number(status));
    },
    async projectFilesChanged(changedFiles: string): Promise<void> {
      expect(changed).toBe(Number(changedFiles));
    },
    async instructionFileHoldsFlowInstruction(copies: string): Promise<void> {
      expect(readFileSync(at("AGENTS.md"), "utf8").split(FLOW)).toHaveLength(Number(copies) + 1);
    },
    async instructionFileOwnLines(ownLinesAfter: string): Promise<void> {
      const lines = readFileSync(at("AGENTS.md"), "utf8").split("\n");
      expect(lines.filter((l) => OWN_LINE.test(l))).toHaveLength(Number(ownLinesAfter));
    },
    async reportsDrift(before: string, skillsVersion: string): Promise<void> {
      const drift = outcome!.items.filter((i) => i.report === "drift");
      expect(drift).toHaveLength(1);
      expect(drift[0]!.detail).toContain(before);
      expect(drift[0]!.detail).toContain(skillsVersion);
    },
    async reportsPieceMissingForAgent(piece: string, agent: string): Promise<void> {
      expect(
        outcome!.items.filter((i) => i.requirement === piece && i.agent === agent),
        JSON.stringify(outcome!.items, null, 2),
      ).toMatchObject([{ report: "missing" }]);
    },
  };
}
