import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { FindSuspectProceduresUseCase } from "../../../factory/maintenance/application/use-cases/find-suspect-procedures.use-case.ts";
import { MaintainEquipmentUseCase } from "../../../factory/maintenance/application/use-cases/maintain-equipment.use-case.ts";
import { MaintenanceKind } from "../../../factory/maintenance/domain/schemas/maintenance-item.schema.ts";
import { EquipmentInstallationService } from "../../../factory/maintenance/domain/services/equipment-installation.service.ts";
import type { EquipmentAuthority } from "../../../factory/maintenance/infrastructure/acl/equipment.acl.ts";
import { EquipmentAdapter } from "../../../factory/maintenance/infrastructure/adapters/equipment.adapter.ts";
import { EquipmentRepositoryImplementation } from "../../../factory/maintenance/infrastructure/repository-implementations/equipment.repository-implementation.ts";

const VERSION = "1.2.0";
const ASSETS = ".agents/skills/setup/assets";
const FACTORY_SCHEMA = "node_modules/factory/openspec/schemas/clean-backend";
const SCHEMA = "openspec/schemas/clean-backend";
const FLOW = "Enter through the plan skill.";
const installation = new EquipmentInstallationService();
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "equipment-"));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

function write(path: string, text: string): void {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

const read = (path: string): string => readFileSync(join(root, path), "utf8");

function seedEquipment(): void {
  write(`${ASSETS}/manifest.json`, JSON.stringify({
    package: "backend",
    version: VERSION,
    command: `factory-${VERSION}.tgz`,
    agents: ["codex"],
    schemas: ["clean-backend"],
    phases: ["plan"],
    instructions: { flow: FLOW },
    guards: [],
    packageManager: { name: "apm", version: "0.35.1" },
    project: { testRunner: "factory", typeChecker: { name: "factory", version: VERSION } },
  }));
  write(".agents/skills/plan/SKILL.md", "# Plan\n");
  write("apm.yml", "name: test\n");
  write("AGENTS.md", "Project rule.\n");
  write("package.json", JSON.stringify({ name: "test-project", private: true }));
}

function pnpm(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function packFactory(): void {
  const tarball = join(root, ASSETS);
  write("stub/package.json", JSON.stringify({ name: "factory", version: VERSION }));
  write("stub/openspec/schemas/clean-backend/schema.yaml", "name: clean-backend\n");
  const packed = pnpm("pnpm", ["pack", "--pack-destination", tarball], join(root, "stub"));
  expect(packed.status, packed.stderr).toBe(0);
}

function repository(overrides: Partial<EquipmentAuthority> = {}) {
  return new EquipmentRepositoryImplementation(new EquipmentAdapter({
    readProcedures: () => new Map(),
    listProductRoots: async () => [],
    hasWebProduct: async () => false,
    environment: () => ({}),
    nodeVersion: "22.22.3",
    loadEnv: (_root, env) => env,
    run: (command, args, cwd) =>
      command === "pnpm" ? pnpm(command, args, cwd) : { status: 0, stdout: "", stderr: "" },
    withSection: (own, instructions) => installation.withSection(own, instructions),
    pinnedVersion: (command, manifest, lock) => installation.pinnedVersion(command, manifest, lock),
    ...overrides,
  }));
}

it("returns no equipment when an agent does not hold the package manifest", () => {
  expect(repository().findEquipment(root)).toBeNull();
});

it.each([undefined, "1.1.0"])(
  "repairs the pin from %s, links the installed schema, and preserves project instructions",
  async (before) => {
    seedEquipment();
    packFactory();
    if (before) {
      const old = `file:./${ASSETS}/factory-${before}.tgz`;
      write("package.json", JSON.stringify({
        name: "test-project",
        devDependencies: { factory: old },
      }));
      write("pnpm-lock.yaml", [
        "lockfileVersion: '9.0'",
        "importers:",
        "  .:",
        "    devDependencies:",
        "      factory:",
        `        specifier: ${old}`,
        `        version: ${old}`,
        "packages:",
        `  factory@${old}:`,
        `    version: ${before}`,
      ].join("\n"));
    }

    const setup = new MaintainEquipmentUseCase(repository());
    const report = await setup.execute(root, { fix: true });

    expect(report!.status, JSON.stringify(report!.items)).toBe(0);
    expect(report!.items.filter((item) => item.isLack).map((item) => item.report)).toEqual(
      Array.from({ length: 5 }, () => "repaired"),
    );
    expect(JSON.parse(read("node_modules/factory/package.json")).version).toBe(VERSION);
    expect(JSON.parse(read("package.json")).devDependencies.factory).toMatch(
      /factory-1\.2\.0\.tgz$/,
    );
    const lockfile = parse(read("pnpm-lock.yaml"));
    expect(Object.values(lockfile.packages)).toMatchObject([{ version: VERSION }]);
    expect(realpathSync(join(root, SCHEMA))).toBe(realpathSync(join(root, FACTORY_SCHEMA)));
    expect(parse(read("openspec/config.yaml")).schema).toBe("clean-backend");
    for (const directory of ["openspec/specs", "openspec/adr", "openspec/runbooks"])
      expect(read(`${directory}/.gitkeep`)).toBe("");
    expect(read("AGENTS.md")).toBe(`Project rule.\n\n<!-- apm:start -->\n${FLOW}\n<!-- apm:end -->\n`);
    expect(parse(read("apm.yml")).compilation.agents_md).toEqual({
      mode: "managed_section",
      start_marker: "<!-- apm:start -->",
      end_marker: "<!-- apm:end -->",
    });

    const after = await setup.execute(root, { fix: true });
    expect(after!.status).toBe(0);
    expect(after!.items).toEqual([]);
  },
  60_000,
);

it("reads actual pnpm, agent, and schema paths without performing repairs", async () => {
  seedEquipment();
  write(`${SCHEMA}/schema.yaml`, "name: my-project-schema\n");
  const pkg = read("package.json");
  const run = vi.fn<EquipmentAuthority["run"]>(() => ({ status: 0, stdout: "", stderr: "" }));
  const setup = new MaintainEquipmentUseCase(repository({ run }));

  const report = await setup.execute(root);

  expect(report!.items).toEqual(expect.arrayContaining([
    expect.objectContaining({ kind: MaintenanceKind.Missing, requirement: "the pinned command" }),
    expect.objectContaining({ kind: MaintenanceKind.Missing, requirement: "a schema link", detail: expect.stringContaining("a folder of the project") }),
  ]));
  expect(report!.status).toBe(1);
  expect(run).toHaveBeenCalledExactlyOnceWith("apm", ["approve", "--pending"], root);
  expect(read("package.json")).toBe(pkg);
  expect(read(`${SCHEMA}/schema.yaml`)).toBe("name: my-project-schema\n");
  expect(read("AGENTS.md")).toBe("Project rule.\n");
  expect(existsSync(join(root, "openspec/config.yaml"))).toBe(false);
});

it("preserves the failed repair's diagnostic and leaves the requirement open", async () => {
  seedEquipment();
  const repo = repository({
    run: (command) => command === "pnpm"
      ? { status: 1, stdout: "installation log", stderr: "tarball missing" }
      : { status: 0, stdout: "", stderr: "" },
  });
  const report = await new MaintainEquipmentUseCase(repo).execute(root, { fix: true });
  expect(report!.status).toBe(1);
  expect(report!.items.find((item) => item.requirement === "the pinned command")).toMatchObject({
    kind: MaintenanceKind.Missing,
    repaired: false,
    detail: `pnpm add -D ./${ASSETS}/factory-${VERSION}.tgz failed:\ninstallation log\ntarball missing`,
  });
});

it("names the runbook, its file, the command and what is missing", async () => {
  write("package.json", JSON.stringify({ scripts: { dev: "vite" } }));
  const repo = repository({
    readProcedures: () => new Map([["local-run", {
      file: "openspec/runbooks/setup/local-run.md",
      body: "```bash\n# a comment ends no block\npnpm run start\n```",
    }]]),
  });
  expect(await new FindSuspectProceduresUseCase(repo).execute(root)).toEqual([
    "the procedure local-run (openspec/runbooks/setup/local-run.md) runs pnpm run start and no package.json has the script start",
  ]);
});

it("finds a script, a binary or a file in a product's folder", async () => {
  write("apps/web/package.json", JSON.stringify({ scripts: { dev: "vite" } }));
  write("apps/web/node_modules/.bin/vite", "");
  write("apps/web/scripts/seed.mjs", "");
  const readProcedures = () => new Map([["local-run", {
    file: "openspec/runbooks/setup/local-run.md",
    body: "`pnpm dev` `pnpm exec vite` `node scripts/seed.mjs`",
  }]]);
  const found = new FindSuspectProceduresUseCase(repository({
    readProcedures, listProductRoots: async () => ["apps/web"],
  }));
  expect(await found.execute(root)).toEqual([]);
  const missing = new FindSuspectProceduresUseCase(repository({ readProcedures }));
  expect(await missing.execute(root)).toHaveLength(3);
});
