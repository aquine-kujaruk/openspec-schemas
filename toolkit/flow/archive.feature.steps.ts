import { existsSync, globSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { type Archived, archive } from "./archive.ts";
import { activeChanges } from "./change.ts";
import { readConsolidated } from "./consolidated.ts";
import { digestOf, writeEvidence } from "./evidence.ts";
import { raised } from "./feedback.ts";
import { self } from "../core/paths.ts";
import { loadSchema } from "../repository/schema.ts";
import { emitSchema } from "../repository/schema-yaml.ts";
import { block, change as writeChange, declareProducts, delta, type PlanParts, scratchProject, write } from "../core/testing.ts";

/**
 * Each scenario archives in a project of its own, with the schema as the specification tool reads
 * it. The changes, their evidence and the consolidated decisions are written when the archive runs.
 */
const SEEN = "2026-11-01-add-money";
const DECISION_TAGS = ["@applies:domain", "@enforced:review"];

type Planned = {
  evidence: "verified" | "not verified" | "absent";
  decisions: Array<{ slug: string; tags: string[] }>;
  procedures: string[];
  deltas: number;
  created: string;
  product?: string;
};

const decisionBody = (alternatives: number) =>
  [
    "The system SHALL keep this rule.",
    "**Why** It was agreed.",
    ["**Alternatives**", ...Array.from({ length: alternatives }, (_, i) => `- Alternative ${i + 1}: something else.`)].join("\n"),
    "**Consequences** It costs something.",
  ].join("\n\n");

export function createSteps() {
  const root = scratchProject("archive-");
  const changes = new Map<string, Planned>();
  const standing = new Map<string, string>();
  let alternativesListed = 0;
  let report: Archived[] = [];
  let last = "";

  const planned = (name: string, evidence: Planned["evidence"] = "verified"): Planned => {
    last = name;
    if (!changes.has(name))
      changes.set(name, {
        evidence,
        decisions: [],
        procedures: [],
        deltas: 0,
        created: `2026-11-${String(10 + changes.size).padStart(2, "0")}`,
      });
    return changes.get(name)!;
  };

  const project = async () => {
    write(root, "openspec/config.yaml", "schema: clean-backend\n");
    emitSchema(await loadSchema("clean-backend"), join(root, "openspec/schemas/clean-backend"));
    if (standing.size)
      write(
        root,
        "openspec/adr/product/money.md",
        `${["# money", ...[...standing].map(([slug, origin]) => block("Decision", slug, [`@origin:${origin}`, ...DECISION_TAGS]))].join("\n\n")}\n`,
      );
    for (const [name, c] of changes) {
      const parts: PlanParts = {
        phases: [true],
        decisions: c.decisions.map((d) =>
          block("Decision", d.slug, d.tags, decisionBody(alternativesListed)),
        ),
        procedures: c.procedures,
      };
      writeChange(root, name, {
        parts,
        created: c.created,
        product: c.product,
        deltas: Object.fromEntries(
          Array.from({ length: c.deltas }, (_, i) => [`orders/use-case-${i + 1}`, delta(`use-case-${i + 1}`)]),
        ),
      });
      if (c.evidence !== "absent")
        writeEvidence(root, {
          change: name,
          verdict: c.evidence,
          digest: await digestOf(root, name),
          scenarios: [],
          failing: [],
          review: { state: "skipped", warnings: [] },
          procedures: [],
        });
    }
  };
  const decisions = () => [...readConsolidated(root).decisions.keys()].sort().join(", ") || "none";
  const consolidatedBlock = (slug: string): string => {
    const file = readConsolidated(root).decisions.get(slug)!.file;
    return readFileSync(join(root, file), "utf8")
      .split(/^(?=### Decision: )/m)
      .find((b) => b.startsWith(`### Decision: ${slug} `))!;
  };

  return {
    // Context
    async activeChangeEvidence(change: string, verdict: string): Promise<void> {
      planned(change, verdict as Planned["evidence"]);
    },
    async consolidatedDecisionsBefore(before: string): Promise<void> {
      if (before !== "none") for (const slug of before.split(", ")) standing.set(slug, SEEN);
    },
    async verifiedChangeDecisionTagged(change: string, slug: string, tag: string): Promise<void> {
      const base = tag === "@adds" ? [] : [`@base:${SEEN}`];
      planned(change).decisions.push({
        slug,
        tags: [tag, ...base, "@area:product", "@topic:money", ...DECISION_TAGS],
      });
    },
    async blockListsAlternatives(alternatives: string): Promise<void> {
      alternativesListed = Number(alternatives);
    },
    async consolidatedDecisionWithOrigin(target: string, currentOrigin: string): Promise<void> {
      standing.set(target, currentOrigin);
    },
    async planModifiesAsSeen(change: string, target: string, seenOrigin: string): Promise<void> {
      planned(change).decisions.push({
        slug: target,
        tags: [`@modifies:${target}`, `@base:${seenOrigin}`, "@area:product", "@topic:money", ...DECISION_TAGS],
      });
    },
    async verifiedChangeAddsDecisionIn(
      change: string,
      slug: string,
      area: string,
      topic: string,
    ): Promise<void> {
      planned(change).decisions.push({
        slug,
        tags: ["@adds", `@area:${area}`, `@topic:${topic}`, ...DECISION_TAGS],
      });
    },
    async verifiedChangeAddsProcedureOf(
      change: string,
      slug: string,
      purpose: string,
      topic: string,
      envs: string,
    ): Promise<void> {
      planned(change).procedures.push(
        block(
          "Procedure",
          slug,
          ["@adds", `@purpose:${purpose}`, `@topic:${topic}`, `@env:${envs.replaceAll(", ", ",")}`],
          "**When** Something fails.\n\n**Steps**\n\n1. Look.\n\n**Verification** It shows.",
        ),
      );
    },
    async verifiedChangeWithDeltas(change: string, deltas: string): Promise<void> {
      planned(change).deltas = Number(deltas);
    },
    async verifiedChangesInOrder(verified: string): Promise<void> {
      if (verified !== "none") for (const name of verified.split(", ")) planned(name);
    },
    async unverifiedChanges(unverified: string): Promise<void> {
      if (unverified !== "none")
        for (const name of unverified.split(", ")) planned(name, "not verified");
    },
    async projectDeclaresProducts(products: string): Promise<void> {
      declareProducts(root, products);
    },
    async verifiedChangeOfProductAddsDecisionIn(
      change: string,
      product: string,
      slug: string,
      area: string,
      topic: string,
    ): Promise<void> {
      const c = planned(change);
      c.product = product;
      c.decisions.push({ slug, tags: ["@adds", `@area:${area}`, `@topic:${topic}`, ...DECISION_TAGS] });
    },

    // Action
    async archiveChange(change: string, date: string): Promise<void> {
      await project();
      report = await archive(root, change, { date });
    },
    async archiveEveryChange(date: string): Promise<void> {
      await project();
      report = await archive(root, undefined, { date });
    },

    // Outcome
    async changePlace(change: string, place: string): Promise<void> {
      const mine = report.find((r) => r.change === change)!;
      expect(mine.place, mine.reason).toBe(place);
      expect(activeChanges(root).includes(change)).toBe(place === "still active");
      if (place === "archived")
        expect(existsSync(join(root, "openspec/changes/archive", mine.as!, "plan.md"))).toBe(true);
    },
    async consolidatedDecisionsAfter(after: string): Promise<void> {
      expect(decisions(), report.map((r) => r.reason).join("\n")).toBe(after);
    },
    async questionsAsked(asked: string): Promise<void> {
      expect(Number(asked)).toBe(0);
      expect(report.every((r) => r.place === "archived")).toBe(true);
    },
    async consolidatedDecisionOrigin(slug: string, origin: string): Promise<void> {
      expect(readConsolidated(root).decisions.get(slug)?.origin).toBe(origin);
    },
    async consolidatedDecisionAlternatives(slug: string, consolidatedAlternatives: string): Promise<void> {
      const text = consolidatedBlock(slug);
      expect(text.match(/^- Alternative /gm) ?? []).toHaveLength(Number(consolidatedAlternatives));
      expect(text).toContain("The system SHALL keep this rule.");
      expect(text).toContain("**Why** It was agreed.");
      expect(text).not.toContain("Consequences");
    },
    async archivedPlanAlternatives(change: string, archivedAlternatives: string, slug: string): Promise<void> {
      const as = report.find((r) => r.change === change)!.as!;
      const plan = readFileSync(join(root, "openspec/changes/archive", as, "plan.md"), "utf8");
      const mine = plan.split(/^(?=### Decision: )/m).find((b) => b.startsWith(`### Decision: ${slug} `))!;
      expect(mine.match(/^- Alternative /gm) ?? []).toHaveLength(Number(archivedAlternatives));
    },
    async feedbackNamesBlock(slug: string): Promise<void> {
      expect(raised(root, last)).toMatchObject([{ source: "the archive", names: slug }]);
    },
    async decisionConsolidatedIn(slug: string, path: string): Promise<void> {
      expect(readConsolidated(root).decisions.get(slug)?.file).toBe(path);
    },
    async procedureConsolidatedIn(slug: string, path: string): Promise<void> {
      expect(readConsolidated(root).procedures.get(slug)?.file).toBe(path);
    },
    async consolidatedProcedureEnvs(slug: string, envs: string): Promise<void> {
      const file = readConsolidated(root).procedures.get(slug)!.file;
      const text = readFileSync(join(root, file), "utf8");
      expect(text).toContain(`@env:${envs.replaceAll(", ", ",")}`);
      expect(text).toContain(`@origin:${report[0]!.as}`);
      expect(text).toContain("**Verification** It shows.");
    },
    async consolidatedSpecsCarry(merged: string): Promise<void> {
      const specs = globSync("openspec/specs/*/*/spec.md", { cwd: root }).filter((f) =>
        readFileSync(join(root, f), "utf8").includes("### Requirement: An order is found"),
      );
      expect(specs).toHaveLength(Number(merged));
    },
    async staleGeneratedTests(stale: string): Promise<void> {
      const fresh = self(root, ["generate", "--check"]);
      expect(fresh.status === 0 ? 0 : 1, fresh.output).toBe(Number(stale));
      const generated = globSync("test/acceptance/**/*.feature.test.ts", { cwd: root });
      expect(generated).toHaveLength(changes.get(last)!.deltas);
    },
    async changesArchivedInOrder(archived: string): Promise<void> {
      const done = report.filter((r) => r.place === "archived").map((r) => r.change);
      expect(done.join(", ") || "none").toBe(archived);
    },
    async changesStillActive(active: string): Promise<void> {
      expect(activeChanges(root).join(", ") || "none").toBe(active);
    },
  };
}
