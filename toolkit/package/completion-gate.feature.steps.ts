import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import { gate, readGate, type Verdict } from "./gate.ts";
import { COMMAND, INSTALLED, SETUP_ASSETS } from "../core/paths.ts";
import { readyChange, write } from "../core/testing.ts";
import type { Installed } from "../core/types.ts";

/**
 * Each scenario judges an attempt to finish in a project of its own: a repository with its factory
 * configuration committed, the package's schema linked from the installed command, and one product
 * spec with the test generated from it. The change's checks are stood in for; the harness is real.
 */
const CHANGE = "add-orders";
const CLI = fileURLToPath(new URL("../cli.ts", import.meta.url));
const SCHEMA = join("node_modules", COMMAND, "openspec/schemas/clean-backend");
const SPEC = `# orders/list-orders Specification

## Purpose

Listing the orders of a customer, so that whoever serves them sees what was bought.

## Requirements

### Requirement: Orders are listed

The system SHALL list the orders of a customer.

#### Scenario Outline: a customer with \`<orders>\` order(s) sees \`<listed>\`

- **GIVEN** a customer with \`<orders>\` order(s) <!-- customerWithOrders -->
- **WHEN** the orders are listed <!-- listOrders -->
- **THEN** \`<listed>\` order(s) are listed <!-- ordersListed -->

##### Examples:

  | orders | listed |
  | ------ | ------ |
  | 2      | 2      |
`;
const INSTALLED_PACKAGE: Installed = {
  package: "backend",
  version: "1.2.0",
  command: `${COMMAND}-1.2.0.tgz`,
  agents: [],
  schemas: ["clean-backend"],
  phases: [],
  instructions: {},
  guards: [],
  packageManager: { name: "apm", version: "0.35.1" },
  project: { testRunner: "vitest", typeChecker: { name: "typescript", version: "7.0.2" } },
};

export function createSteps() {
  const root = mkdtempSync(join(tmpdir(), "completion-gate-"));
  const run = (cmd: string, ...args: string[]) => {
    const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}\n${r.stdout}\n${r.stderr}`);
  };
  let findings: string[] = [];
  let building = 1;
  let made = "clean-backend";
  let productFails: boolean | undefined;
  let failed = 0;
  let altered: string | undefined;
  let outcome: Verdict | undefined;

  const project = () => {
    write(root, "factory.config.ts", "export default {};\n");
    write(root, join(".claude/skills", SETUP_ASSETS, INSTALLED), JSON.stringify(INSTALLED_PACKAGE));
    write(root, join(SCHEMA, "schema.yaml"), "name: clean-backend\n");
    mkdirSync(join(root, "openspec/schemas"), { recursive: true });
    symlinkSync(join("../..", SCHEMA), join(root, "openspec/schemas/clean-backend"));
    write(root, "openspec/specs/orders/list-orders/spec.md", SPEC);
    write(root, "openspec/config.yaml", "schema: clean-backend\n");
    if (building) readyChange(root, CHANGE, { schema: made });
    run(process.execPath, CLI, "generate");
    write(root, ".gitignore", "node_modules\n");
    run("git", "init", "-q");
    run("git", "add", "-A");
    run("git", "-c", "user.name=test", "-c", "user.email=test@example.com", "commit", "-qm", "base");
    if (failed)
      write(
        root,
        `openspec/changes/${CHANGE}/gate.json`,
        JSON.stringify({ failures: failed, waitingFor: "the agent", findings: ["earlier"] }),
      );
    if (altered === "generated tests")
      appendFileSync(join(root, "test/acceptance/orders/list-orders.feature.test.ts"), "\n// edited\n");
    else if (altered === "installed schemas") {
      rmSync(join(root, "openspec/schemas/clean-backend"));
      write(root, "openspec/schemas/clean-backend/schema.yaml", "name: clean-backend\n");
    } else if (altered === "factory configuration")
      appendFileSync(join(root, "factory.config.ts"), "// edited\n");
    else if (altered) throw new Error(`unknown harness part: ${altered}`);
  };

  return {
    // Context
    async changeChecks(checks: string): Promise<void> {
      findings = checks === "pass" ? [] : ["the check of app-domain fails"];
    },
    async failedAttemptsBefore(failures: string): Promise<void> {
      failed = Number(failures);
    },
    async harnessPartAltered(part: string): Promise<void> {
      altered = part;
    },
    async changesInImplementation(changes: string): Promise<void> {
      building = Number(changes);
    },
    async changeInImplementationWithSchema(schema: string): Promise<void> {
      made = schema;
    },
    async productChecks(checks: string): Promise<void> {
      productFails = checks === "fail";
    },

    // Action
    async aboutToFinish(agentKind: string): Promise<void> {
      expect(["main", "helper"]).toContain(agentKind);
      project();
      outcome = await gate(
        root,
        productFails === undefined
          ? { checks: async () => findings }
          : { run: () => ({ status: productFails ? 1 : 0, output: "a rule is broken" }) },
      );
    },

    // Outcome
    async finishVerdict(verdict: string): Promise<void> {
      expect(outcome!.allowed ? "allowed" : "refused", outcome!.findings.join("\n")).toBe(verdict);
    },
    async failedAttemptsCounted(failuresAfter: string): Promise<void> {
      expect(readGate(root, CHANGE).failures).toBe(Number(failuresAfter));
    },
    async changeWaitingFor(waitingFor: string): Promise<void> {
      expect(readGate(root, CHANGE).waitingFor).toBe(waitingFor);
    },
    async refusalNamesHarnessPart(part: string): Promise<void> {
      expect(outcome!.findings.join("\n")).toContain(`${part}:`);
    },
  };
}
