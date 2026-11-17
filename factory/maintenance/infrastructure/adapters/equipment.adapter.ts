import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { parse, parseDocument } from "yaml";
import { MaintenanceException } from "../../domain/exceptions/maintenance.exceptions.ts";
import { PLACES, RepairKind, SECTION, type EquipmentAcl, type EquipmentAuthority, type EquipmentInstallation } from "../acl/equipment.acl.ts";

const COMMAND = "factory";
const SETUP_ASSETS = "setup/assets";
const INSTALLED = "manifest.json";
const SCHEMAS = "openspec/schemas";
const CONFIG = "openspec/config.yaml";
const ROOTS = ["openspec/specs", "openspec/adr", "openspec/runbooks"];
const GUARDS = [`${COMMAND} guard`, `${COMMAND} gate`];

const text = (path: string): string | undefined => existsSync(path) ? readFileSync(path, "utf8") : undefined;
const manifest = (root: string) => JSON.parse(text(join(root, "package.json")) ?? "{}") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};
const fromYAML = (path: string): object => (parse(text(path) ?? "") ?? {}) as object;

export class EquipmentAdapter implements EquipmentAcl {
  private readonly authority: EquipmentAuthority;

  constructor(authority: EquipmentAuthority) {
    this.authority = authority;
  }

  readInstalled(root: string): EquipmentInstallation | undefined {
    for (const place of Object.values(PLACES)) {
      const assets = join(place.skills, SETUP_ASSETS);
      const record = text(join(root, assets, INSTALLED));
      if (record) return { installed: JSON.parse(record) as EquipmentInstallation["installed"], assets };
    }
    return undefined;
  }

  pinnedVersion(root: string): string | undefined {
    const lock = join(root, "pnpm-lock.yaml");
    const own = manifest(root);
    if (!own.devDependencies?.[COMMAND] || !existsSync(lock)) return undefined;
    return this.authority.pinnedVersion(COMMAND, own, fromYAML(lock));
  }

  schemaLinkHolds(root: string, schema: string): boolean {
    const link = join(root, SCHEMAS, schema);
    const inside = join(root, "node_modules", COMMAND, SCHEMAS, schema);
    return existsSync(join(link, "schema.yaml")) && existsSync(inside) &&
      realpathSync(link) === realpathSync(inside);
  }

  unwiredGuards(root: string, agent: string): string[] {
    const place = PLACES[agent];
    const wiring = place ? text(join(root, place.hooks)) ?? "" : "";
    return GUARDS.filter((guard) => !wiring.includes(guard));
  }

  async inspectEquipment(
    root: string,
    equipment: Parameters<EquipmentAcl["inspectEquipment"]>[1],
    node = this.authority.nodeVersion,
  ): ReturnType<EquipmentAcl["inspectEquipment"]> {
    const own = manifest(root);
    const at = (path: string) => join(root, path);
    const reading = {
      pinned: this.pinnedVersion(root),
      links: equipment.processes.map(({ value: schema }) => {
        const path = join(SCHEMAS, schema);
        const link = at(path);
        return {
          schema, path,
          holds: this.schemaLinkHolds(root, schema),
          ownFolder: existsSync(link) && !lstatSync(link).isSymbolicLink(),
        };
      }),
      hasDefault: typeof (fromYAML(at(CONFIG)) as { schema?: unknown }).schema === "string",
      missingRoots: ROOTS.filter((path) => !existsSync(at(path))),
      declared: { ...own.dependencies, ...own.devDependencies },
      web: equipment.project.e2e ? await this.authority.hasWebProduct(root) : false,
      node,
      agents: equipment.agents.map((name) => {
        const place = PLACES[name];
        if (!place) return { name };
        const instruction = place.instruction;
        return {
          name,
          skills: place.skills,
          missingSkills: equipment.workInstructions.filter((phase) =>
            !existsSync(at(join(place.skills, phase, "SKILL.md")))),
          ...("rules" in instruction ? {
            rules: instruction.rules,
            missingRules: Object.keys(equipment.instructions).filter((key) =>
              !existsSync(at(join(instruction.rules, `${key}.md`)))),
          } : {
            instructionFile: instruction.file,
            instructionText: text(at(instruction.file)),
          }),
          hooks: place.hooks,
          unwiredGuards: equipment.controls.length ? this.unwiredGuards(root, name) : [],
        };
      }),
    };
    return reading;
  }

  repairEquipment(
    root: string,
    equipment: Parameters<EquipmentAcl["repairEquipment"]>[1],
    repair: Parameters<EquipmentAcl["repairEquipment"]>[2],
  ): void {
    const at = (path: string) => join(root, path);
    switch (repair.kind) {
      case RepairKind.Pin: {
        const tarball = `./${join(equipment.assets, equipment.command)}`;
        const run = (args: string[]) => {
          const result = this.authority.run("pnpm", args, root);
          if (result.status !== 0)
            throw new MaintenanceException(`pnpm ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`, { cause: result });
        };
        if (!repair.hadPin) run(["add", "-D", tarball]);
        else {
          run(["pkg", "set", `devDependencies.${COMMAND}=file:${tarball}`]);
          run(["install", "--no-frozen-lockfile"]);
        }
        break;
      }
      case RepairKind.Link: {
        const link = at(join(SCHEMAS, repair.schema));
        const inside = at(join("node_modules", COMMAND, SCHEMAS, repair.schema));
        rmSync(link, { force: true });
        mkdirSync(dirname(link), { recursive: true });
        symlinkSync(relative(dirname(link), inside), link);
        break;
      }
      case RepairKind.Default: {
        const path = at(CONFIG);
        const document = parseDocument(text(path) ?? "");
        document.set("schema", equipment.processes[0]?.value);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, String(document));
        break;
      }
      case RepairKind.Roots:
        for (const path of repair.paths) {
          mkdirSync(at(path), { recursive: true });
          writeFileSync(at(join(path, ".gitkeep")), "");
        }
        break;
      case RepairKind.Instruction: {
        const bodies = Object.values(equipment.instructions);
        writeFileSync(at(repair.file), this.authority.withSection(repair.before, bodies));
        const manifestPath = at("apm.yml");
        const before = text(manifestPath);
        if (!before) break;
        const document = parseDocument(before);
        document.setIn(["compilation", "agents_md"], {
          mode: "managed_section",
          start_marker: SECTION.start,
          end_marker: SECTION.end,
        });
        writeFileSync(manifestPath, String(document));
        break;
      }
    }
  }

  readNotes(
    root: string,
    equipment: Parameters<EquipmentAcl["readNotes"]>[1],
    env = this.authority.environment(),
  ): ReturnType<EquipmentAcl["readNotes"]> {
    const held = this.authority.loadEnv(root, env);
    const missingKeys = [...this.listProcedures(root)].flatMap(([slug, { file, keys = [] }]) =>
      keys.filter((name) => !held[name]).map((name) => ({ name, slug, file })));
    const { name } = equipment.packageManager;
    const lock = fromYAML(join(root, `${name}.lock.yaml`)) as { apm_version?: string };
    const pending = this.authority.run(name, ["approve", "--pending"], root);
    const tool = text(join(root, "node_modules", equipment.project.typeChecker.name, "package.json"));
    return {
      missingKeys,
      packageManagerVersion: lock.apm_version,
      pendingApprovals: pending.status === 0 && /unapproved/.test(pending.stdout),
      typeCheckerVersion: tool ? (JSON.parse(tool) as { version: string }).version : undefined,
    };
  }

  listProcedures(root: string) {
    return this.authority.readProcedures(root);
  }

  async readHoldings(root: string): ReturnType<EquipmentAcl["readHoldings"]> {
    const folders = [...new Set([".", ...await this.authority.listProductRoots(root)])];
    return this.holdingsOf(root, folders);
  }

  holdingsOf(root: string, roots: string[]): Awaited<ReturnType<EquipmentAcl["readHoldings"]>> {
    const folders = [...new Set([".", ...roots])].map((path) => join(root, path));
    return {
      scripts: new Set(folders.flatMap((folder) => Object.keys(manifest(folder).scripts ?? {}))),
      binaries: (name) => folders.some((folder) => existsSync(join(folder, "node_modules", ".bin", name))),
      file: (path) => folders.some((folder) => existsSync(join(folder, path))),
    };
  }
}
