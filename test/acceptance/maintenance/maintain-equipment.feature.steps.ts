// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { MaintainEquipmentUseCase } from "../../../factory/maintenance/application/use-cases/maintain-equipment.use-case.ts";
import { EquipmentEntity } from "../../../factory/maintenance/domain/entities/equipment.entity.ts";
import type { MaintenanceReportAggregate } from "../../../factory/maintenance/domain/aggregates/maintenance-report.aggregate.ts";
import { MaintenanceKind } from "../../../factory/maintenance/domain/schemas/maintenance-item.schema.ts";
import { NeedKind } from "../../../factory/maintenance/domain/schemas/procedure-reading.schema.ts";
import { EquipmentInstallationService } from "../../../factory/maintenance/domain/services/equipment-installation.service.ts";
import { RuleChange, type RuleConformance } from "../../../factory/maintenance/domain/schemas/rule-conformance.schema.ts";

import { InMemoryEquipmentRepository } from "./repositories/in-memory-equipment.repository.ts";

const FLOW = "Every intention that changes something enters through the plan skill.";
const E2E = { e2e: "0.22.0", "@e2e-dev/web": "0.15.4", "@e2e-dev/acp": "0.1.0" };
const PHASES = ["plan", "implement", "verify", "archive", "feedback"];

export function createSteps() {
  const repository = new InMemoryEquipmentRepository();
  const setup = new MaintainEquipmentUseCase(repository);
  const lacking = new Set<string>();
  const env: Record<string, string | undefined> = {};
  let version = "1.2.0";
  let pin: string | undefined;
  let installedSchemas = ["clean-backend"];
  let alreadyLinked = true;
  let initialDefault = "clean-backend";
  let targets = ["claude", "codex"];
  let lackForAgent: { piece: string; agent: string } | undefined;
  let own: number | undefined;
  let priorRepairRuns = 0;
  let productPlatform: string | undefined;
  let projectPackages: Record<string, string> = {};
  let outcome: MaintenanceReportAggregate | null = null;
  let instructionAgent = "codex";

  const project = () => {
    repository.equipment = new EquipmentEntity({
      name: "backend",
      version,
      processes: installedSchemas,
      workInstructions: PHASES,
      controls: ["guards.json"],
      command: `factory-${version}.tgz`,
      assets: ".claude/skills/setup/assets",
      agents: targets,
      instructions: { flow: FLOW },
      packageManager: { name: "apm", version: "0.35.1" },
      project: {
        testRunner: "vitest",
        typeChecker: { name: "typescript", version: "7.0.2" },
        ...(productPlatform ? { e2e: { packages: E2E, node: "22.22.3" } } : {}),
      },
    });
    const depends = pin ?? version;
    repository.lockfileVersion = depends === "none" || lacking.has("the pinned command") ? undefined : depends;
    repository.defaultSchema = initialDefault === "none" ? undefined : initialDefault;
    const ownLines = Array.from({ length: own ?? 0 }, (_, i) => `Project rule ${i + 1}.`).join("\n");
    const lacks = (piece: string, agent: string) => lackForAgent?.piece === piece && lackForAgent.agent === agent;
    repository.reading = {
      pinned: repository.lockfileVersion,
      links: installedSchemas.map((schema, i) => ({
        schema,
        path: `openspec/schemas/${schema}`,
        holds: Boolean(repository.lockfileVersion) && alreadyLinked && !(i === 0 && lacking.has("a schema link")),
        ownFolder: false,
      })),
      hasDefault: repository.defaultSchema !== undefined,
      missingRoots: lacking.has("the consolidated roots") ? ["openspec/specs", "openspec/adr", "openspec/runbooks"] : [],
      declared: {
        ...(!lacking.has("a test runner") ? { vitest: "4.1.0" } : {}),
        ...(!lacking.has("a type checker") ? { typescript: "7.0.2" } : {}),
        ...projectPackages,
      },
      web: productPlatform === "web",
      node: "22.22.3",
      agents: targets.map((name) => ({
        name,
        skills: `.${name}/skills`,
        missingSkills: lacks("the phase skills", name) ? ["plan"] : [],
        ...(name === "claude"
          ? { rules: ".claude/rules", missingRules: lacks("the flow instruction", name) ? ["flow"] : [] }
          : {
              instructionFile: "AGENTS.md",
              instructionText: name === instructionAgent && own !== undefined
                ? ownLines
                : new EquipmentInstallationService().withSection(undefined, [FLOW]),
            }),
        unwiredGuards: lacks("the guards", name) ? ["factory guard"] : [],
        hooks: `.${name}/hooks.json`,
      })),
    };
  };
  const instruction = () =>
    repository.reading.agents.find(({ name }) => name === instructionAgent)?.instructionText ?? "";

  return {
    // Context
    skillsNameCommandVersion(skillsVersion: string): void {
      version = skillsVersion;
    },
    commandDependencyBefore(before: string): void {
      pin = before;
    },
    installedPackageHolds(schemas: string): void {
      installedSchemas = schemas.split(", ");
      alreadyLinked = false;
    },
    defaultSchemaBefore(defaultBefore: string): void {
      initialDefault = defaultBefore;
    },
    projectLacking(requirement: string): void {
      lacking.add(requirement);
    },
    instructionFileWithOwnLines(agent: string, ownLines: string): void {
      instructionAgent = agent;
      own = Number(ownLines);
    },
    setupRanBefore(earlierRuns: string): void {
      priorRepairRuns = Number(earlierRuns);
    },
    installedPackageNamesAgents(agents: string): void {
      targets = agents.split(", ");
    },
    projectLacksPieceForAgent(piece: string, agent: string): void {
      lackForAgent = { piece, agent };
    },
    runbookNeedsKey(slug: string, key: string): void {
      repository.procedures.set(slug, {
        file: `openspec/runbooks/access/${slug}.md`,
        body: `**Requires** ${key} in .env.`,
        keys: [key],
      });
    },
    keyPresence(key: string, presence: string): void {
      if (presence === "in .env") repository.dotenvKeys.add(key);
      else if (presence === "in the environment") env[key] = "present";
      else expect(presence).toBe("absent");
    },
    productOfPlatform(platform: string): void {
      productPlatform = platform;
    },
    projectDeclaresPackages(declared: string): void {
      if (declared === "nothing") return;
      projectPackages = Object.fromEntries(declared.split(", ").map((entry) => {
        const separator = entry.lastIndexOf("@");
        return [entry.slice(0, separator), entry.slice(separator + 1)];
      }));
    },
    runbookRuns(slug: string, command: string): void {
      repository.procedures.set(slug, {
        file: `openspec/runbooks/setup/${slug}.md`,
        body: ["```bash", "# from the repository root", command, "```"].join("\n"),
      });
    },
    projectHolds(holding: string): void {
      const [, kind, name] = /^the (script|binary|file) (\S+)$/.exec(holding) ?? [];
      if (kind === NeedKind.Script) repository.scripts.add(name!);
      else if (kind === NeedKind.Binary) repository.binaries.add(name!);
      else if (kind === NeedKind.File) repository.files.add(name!);
      else expect(holding).toBe("nothing");
    },
    recordedLedger(rule: string, before: string): void {
      expect(["absent", "present"]).toContain(before);
      repository.ruleConformance = [{ rule, change: RuleChange.Unchanged, files: [] }];
    },
    installedLedger(rule: string, change: string): void {
      repository.ruleConformance = [{ rule, change: change as RuleConformance["change"], files: [] }];
    },
    codeAgainstRule(state: string, rule: string): void {
      const files = state === "breaks" ? [`src/orders/${rule}.ts`] : [];

      repository.ruleConformance = repository.ruleConformance.map((conformance) =>
        conformance.rule === rule && conformance.change !== RuleChange.Removed ? { ...conformance, files } : conformance);
    },

    // Action
    async runSetupWithRepair(): Promise<void> {
      project();
      for (let i = 0; i < priorRepairRuns; i++) await setup.execute(".", { fix: true, env });
      outcome = await setup.execute(".", { fix: true, env });
    },
    async runSetupWithoutRepair(): Promise<void> {
      project();
      outcome = await setup.execute(".", { env });
    },

    // Outcome
    commandDependencyAfter(after: string): void {
      expect(repository.reading.pinned).toBe(after);
    },
    lockfileRecordsCommand(after: string): void {
      expect(repository.lockfileVersion).toBe(after);
    },
    projectResolvesSchema(schema: string): void {
      expect(repository.reading.links.find((link) => link.schema === schema)?.holds).toBe(true);
    },
    defaultSchemaAfter(defaultAfter: string): void {
      expect(repository.defaultSchema).toBe(defaultAfter);
    },
    reportsRequirementAs(requirement: string, report: string): void {
      const related = outcome!.items.filter((item) => requirement === "the key of a runbook"
        ? item.detail.startsWith("the key ")
        : item.requirement === requirement);
      expect(related.map((item) => item.report)).toEqual(report === "not reported" ? [] : [report]);
    },
    setupExitStatus(status: string): void {
      expect(outcome!.status, JSON.stringify(outcome!.items)).toBe(Number(status));
    },
    projectFilesChanged(changedFiles: string): void {
      expect(repository.repairs).toHaveLength(Number(changedFiles));
    },
    instructionFileHoldsFlowInstruction(copies: string): void {
      expect(instruction().split(FLOW)).toHaveLength(Number(copies) + 1);
    },
    instructionFileOwnLines(ownLinesAfter: string): void {
      expect(instruction().split("\n").filter((line) => /^Project rule \d+\.$/.test(line))).toHaveLength(Number(ownLinesAfter));
    },
    reportsDrift(before: string, skillsVersion: string): void {
      const drift = outcome!.items.filter((item) => item.kind === MaintenanceKind.Drift);
      expect(drift).toHaveLength(1);
      expect(drift[0]!.detail).toContain(before);
      expect(drift[0]!.detail).toContain(skillsVersion);
    },
    reportsPieceMissingForAgent(piece: string, agent: string): void {
      const found = outcome!.items.filter((item) => item.requirement === piece && item.agent === agent);
      expect(found.map((item) => item.kind)).toEqual([MaintenanceKind.Missing]);
    },
  };
}
