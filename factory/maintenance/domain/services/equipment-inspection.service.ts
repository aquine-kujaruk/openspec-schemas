import type { EquipmentEntity } from "../entities/equipment.entity.ts";
import {
  RepairKind,
  type EquipmentFinding,
  type EquipmentNotes,
  type EquipmentReading,
} from "../schemas/equipment-reading.schema.ts";
import { MaintenanceKind } from "../schemas/maintenance-item.schema.ts";

const atLeast = (version: string, least: string): boolean => {
  const [a, b] = [version, least].map((value) =>
    value.replace(/^v/, "").split(".").map(Number),
  );
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return true;
};

export class EquipmentInspectionService {
  findings(equipment: EquipmentEntity, reading: EquipmentReading): EquipmentFinding[] {
    const found: EquipmentFinding[] = [];
    const missing = (
      requirement: string,
      detail: string,
      props?: Pick<EquipmentFinding, "agent" | "repair">,
    ) => found.push({ kind: MaintenanceKind.Missing, requirement, detail, ...props });

    if (reading.pinned !== equipment.version) {
      const pinned = reading.pinned;
      found.push({
        kind: pinned ? MaintenanceKind.Drift : MaintenanceKind.Missing,
        requirement: "the pinned command",
        detail: pinned
          ? `the skills name factory ${equipment.version} and the project depends on ${pinned}`
          : `the project does not depend on factory ${equipment.version}`,
        repair: { kind: RepairKind.Pin, hadPin: Boolean(pinned) },
      });
    }

    for (const link of reading.links) {
      if (link.holds) continue;
      missing("a schema link", link.ownFolder
        ? `${link.path} is a folder of the project: remove it so the schema of the installed command takes its place`
        : `${link.path} does not lead to the schema inside the installed command`,
      link.ownFolder ? {} : { repair: { kind: RepairKind.Link, schema: link.schema } });
    }

    if (!reading.hasDefault)
      missing("the default schema", "openspec/config.yaml names no schema", {
        repair: { kind: RepairKind.Default },
      });

    const roots = reading.missingRoots;
    if (roots.length)
      missing("the consolidated roots", `${roots.join(", ")} ${roots.length > 1 ? "do" : "does"} not exist`, {
        repair: { kind: RepairKind.Roots, paths: roots },
      });

    const { e2e, testRunner, typeChecker } = equipment.project;
    if (reading.web && e2e) {
      const off = Object.entries(e2e.packages).filter(([name, version]) =>
        reading.declared[name]?.replace(/^[\^~=]/, "") !== version);
      if (off.length)
        missing("the end-to-end tool", `a web product runs its end-to-end tests with ${off.map(([name, version]) => `${name}@${version}`).join(", ")}: add ${off.length > 1 ? "them" : "it"} at that version to the project's development dependencies`);
      const node = reading.node;
      if (!(atLeast(node, e2e.node) &&
        (node.replace(/^v/, "").startsWith("22.") || atLeast(node, "24.8.0"))))
        missing("the end-to-end tool", `Node ${node} is older than the end-to-end tool needs: use Node ${e2e.node} or 24.8 and later`);
    }

    if (!(testRunner in reading.declared))
      missing("a test runner", `add ${testRunner} to the project's development dependencies`);
    if (!(typeChecker.name in reading.declared))
      missing("a type checker", `add ${typeChecker.name} ${typeChecker.version} to the project's development dependencies`);

    for (const readingForAgent of reading.agents) {
      const { name: agent, skills, missingSkills, rules, missingRules, instructionFile, instructionText, unwiredGuards, hooks } = readingForAgent;
      if (!skills) {
        missing("the phase skills", `the command does not know where ${agent} reads its skills`, { agent });
        continue;
      }
      const again = "install the package again with the agent package manager";
      if (missingSkills?.length)
        missing("the phase skills", `${missingSkills.join(", ")} not under ${skills}: ${again}`, { agent });

      if (missingRules?.length)
        missing("the flow instruction", `${missingRules.map((name) => `${name}.md`).join(", ")} not under ${rules}: ${again}`, { agent });
      if (instructionFile && Object.values(equipment.instructions).some((body) => !instructionText?.includes(body)))
        missing("the flow instruction", `${instructionFile} does not hold it`, {
          agent,
          repair: { kind: RepairKind.Instruction, file: instructionFile, before: instructionText },
        });

      if (equipment.controls.length && unwiredGuards?.length)
        missing("the guards", `${hooks} does not call ${unwiredGuards.join(" or ")}: ${again}`, { agent });
    }
    return found;
  }

  notes(equipment: EquipmentEntity, reading: EquipmentNotes): string[] {
    const found = reading.missingKeys.map(({ name, slug, file }) =>
      `the key ${name} that the procedure ${slug} (${file}) needs is in neither the environment nor .env: only the person can add it`,
    );
    const { name, version } = equipment.packageManager;
    if (reading.packageManagerVersion && reading.packageManagerVersion !== version)
      found.push(`the package was installed with ${name} ${reading.packageManagerVersion} and built against ${version}`);
    if (reading.pendingApprovals)
      found.push(`${name} lists approvals as pending; review them with \`${name} approve --pending\``);
    const { typeChecker } = equipment.project;
    const have = reading.typeCheckerVersion;
    const major = (v: string) => Number(v.split(".")[0]);
    if (have && major(have) < major(typeChecker.version))
      found.push(`${typeChecker.name} ${have} is older than ${typeChecker.version}: the language server the package declares will not start`);
    if (equipment.controls.length && equipment.agents.includes("codex"))
      found.push("codex runs the guards only in a project it trusts and after each hook is reviewed with /hooks; review them again after every update that changes them");
    return found;
  }
}
