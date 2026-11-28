import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { capture, self } from "../../../shared/infrastructure/adapters/paths.adapter.ts";
import type { BuildingRecord, GateRecord, StageHoldAcl, WorkstreamRecord } from "../acl/stage-hold.acl.ts";

export type StageHoldResources = {
  active(): Promise<BuildingRecord[]>;
  workstreams(stage: BuildingRecord): Promise<WorkstreamRecord[]>;
  hasCurrentVerification?(name: string): Promise<boolean>;
  installed(): { schemas: string[]; guards: string[]; agents: string[] } | undefined;
  linked(schema: string): boolean;
  hooks(agent: string): string[];
  places: Record<string, { skills: string; hooks?: string } | undefined>;
};

export class StageHoldAdapter implements StageHoldAcl {
  private readonly root: string;
  private readonly orders: string;
  private readonly gateFile: string;
  private readonly resources: StageHoldResources;

  constructor(root: string, orders: string, gateFile: string, resources: StageHoldResources) {
    this.root = root;
    this.orders = orders;
    this.gateFile = gateFile;
    this.resources = resources;
  }

  buildingRecords(): Promise<BuildingRecord[]> {
    return this.resources.active();
  }

  workstreams(stage: BuildingRecord): Promise<WorkstreamRecord[]> {
    return this.resources.workstreams(stage);
  }

  hasCurrentVerification(name: string): Promise<boolean> {
    return this.resources.hasCurrentVerification?.(name) ?? Promise.resolve(false);
  }

  async harnessFindings(): Promise<string[]> {
    const { root, resources } = this;
    const found: string[] = [];
    const fresh = self(root, ["generate", "--check"]);

    if (fresh.status !== 0)
      found.push(
        `generated tests: they differ from what their specs generate; run \`pnpm exec factory generate\` and leave them as it writes them\n${fresh.output}`,
      );

    const installed = resources.installed();

    for (const schema of installed?.schemas ?? [])
      if (!resources.linked(schema))
        found.push(
          `installed schemas: openspec/schemas/${schema} no longer leads to the schema inside the installed command; run \`pnpm exec factory doctor --fix\``,
        );

    const status = capture("git", ["status", "--porcelain", "--", "factory.config.ts"], { cwd: root });

    if (status.status === 0 && status.stdout.trim())
      found.push("factory configuration: factory.config.ts differs from what is committed; the person edits and commits it, an agent restores it");

    const lock = join(root, "apm.lock.yaml");

    if (existsSync(lock)) {
      const skills = Object.values(resources.places).flatMap((place) => place ? [`${place.skills}/`] : []);

      const { dependencies = [] } = (parse(readFileSync(lock, "utf8")) ?? {}) as {
        dependencies?: Array<{ deployed_file_hashes?: Record<string, string> }>;
      };

      const altered = dependencies
        .flatMap((dependency) => Object.entries(dependency.deployed_file_hashes ?? {}))
        .filter(([path]) => skills.some((folder) => path.startsWith(folder)))
        .filter(([path, expected]) => {
          const file = join(root, path);

          return expected !== (existsSync(file)
            ? `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`
            : "absent");
        })
        .map(([path]) => path);

      if (altered.length) {
        const more = altered.length > 5 ? ` and ${altered.length - 5} more` : "";
        found.push(`agent skills: ${altered.slice(0, 5).join(", ")}${more} differ from what was installed; install the package again`);
      }
    }

    if (installed?.guards.length)
      for (const agent of installed.agents) {
        const unwired = resources.hooks(agent);

        if (unwired.length)
          found.push(
            `agent guards: ${resources.places[agent]?.hooks} no longer calls ${unwired.join(" or ")}; install the package again`,
          );
      }

    return found;
  }

  private path(name: string): string {
    return join(this.root, this.orders, name, this.gateFile);
  }

  async readRecord(name: string): Promise<unknown> {
    const path = this.path(name);

    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  }

  async writeRecord(name: string, record: GateRecord): Promise<void> {
    writeFileSync(this.path(name), `${JSON.stringify(record, null, 2)}\n`);
  }

  async removeRecord(name: string): Promise<void> {
    rmSync(this.path(name), { force: true });
  }

  async run(stage: BuildingRecord, args: string[]) {
    const selection = stage.line ? ["--product", stage.line] : [];

    return self(this.root, [...args, ...selection]);
  }
}
