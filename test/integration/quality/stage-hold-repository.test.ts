import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { StageHoldAdapter } from "../../../factory/quality/infrastructure/adapters/stage-hold.adapter.ts";
import { StageHoldRepositoryImplementation } from "../../../factory/quality/infrastructure/repository-implementations/stage-hold.repository-implementation.ts";

const CLI = fileURLToPath(new URL("../../../factory/main.ts", import.meta.url));
const SCHEMA = "openspec/schemas/clean-backend";
const ORDERS = "openspec/changes";
const ORDER = "add-orders";
const GAUGE = "test/acceptance/orders/list-orders.feature.test.ts";

const SPEC = [
  "# Orders", "", "## Purpose", "", "Listing the orders of a customer so whoever serves them sees their purchases.", "", "## Requirements", "",
  "### Requirement: Orders are listed", "", "The system SHALL list orders.", "",
  "#### Scenario: Orders are listed", "",
  "- **GIVEN** an existing order <!-- orderExists -->",
  "- **WHEN** the orders are listed <!-- listOrders -->",
  "- **THEN** the order is listed <!-- orderListed -->",
].join("\n");

describe("the stage hold repository", () => {
  it("translates real changes to the generated test, installed schema and committed configuration into findings", async () => {
    const root = mkdtempSync(join(tmpdir(), "stage-hold-"));
    try {
      const run = (executable: string, ...args: string[]) => {
        const result = spawnSync(executable, args, { cwd: root, encoding: "utf8" });
        expect(result.status, result.stdout + result.stderr).toBe(0);
      };
      const config = join(root, "factory.config.ts");
      writeFileSync(config, 'export default { schema: "clean-backend" };\n');
      const spec = join(root, "openspec/specs/orders/list-orders");
      mkdirSync(spec, { recursive: true });
      writeFileSync(join(spec, "spec.md"), SPEC + "\n");
      const installed = "node_modules/factory/openspec/schemas/clean-backend";
      mkdirSync(join(root, installed), { recursive: true });
      mkdirSync(join(root, "openspec/schemas"), { recursive: true });
      symlinkSync(join("../..", installed), join(root, SCHEMA));
      writeFileSync(join(root, ".gitignore"), "node_modules\n");
      run(process.execPath, CLI, "generate");
      run("git", "init", "-q");
      run("git", "add", "-A");
      run("git", "-c", "user.name=test", "-c", "user.email=test@example.com", "commit", "-qm", "base");

      const adapter = new StageHoldAdapter(root, ORDERS, "gate.json", {
        active: async () => [],
        workstreams: async () => [],
        installed: () => ({ schemas: ["clean-backend"], guards: [], agents: [] }),
        linked: () => lstatSync(join(root, SCHEMA)).isSymbolicLink(),
        hooks: () => [],
        places: {},
      });
      const stages = new StageHoldRepositoryImplementation(adapter);
      expect(await stages.listHarnessFindings()).toEqual([]);

      appendFileSync(join(root, GAUGE), "// edited\n");
      rmSync(join(root, SCHEMA));
      mkdirSync(join(root, SCHEMA));
      appendFileSync(config, "// edited\n");
      expect(await stages.listHarnessFindings()).toEqual([
        expect.stringContaining("generated tests:"),
        expect.stringContaining("installed schemas:"),
        expect.stringContaining("factory configuration:"),
      ]);

      const order = join(root, ORDERS, ORDER);
      mkdirSync(order, { recursive: true });
      expect((await stages.readRecord(ORDER)).failures).toBe(0);
      const record = { phase: "Measure", failures: 2, waitingFor: "the agent", findings: ["test fails"] } as const;
      await stages.saveRecord(ORDER, { ...record, findings: [...record.findings] });
      expect(await stages.readRecord(ORDER)).toEqual(record);
      await stages.resetRecord(ORDER);
      expect(existsSync(join(order, "gate.json"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);
});
