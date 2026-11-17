// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { CloseWorkOrderUseCase } from "../../../factory/production/application/use-cases/close-work-order.use-case.ts";
import {
  InMemoryClosingRepository,
  type ClosingOrderFixture,
} from "./repositories/in-memory-closing.repository.ts";

const ORIGIN = "2026-11-01-add-money";
const DECISION_TAGS = ["@applies:domain", "@enforced:review"];
type Verdict = "verified" | "not verified" | "absent";
type Decision = { slug: string; tags: string[] };
type Planned = {
  verdict: Verdict;
  decisions: Decision[];
  procedures: string[];
  drawings: Record<string, string>;
  deltas: number;
  created: string;
  product?: string;
};

const block = (kind: "Decision" | "Procedure", slug: string, tags: string[], body: string): string =>
  [`### ${kind}: ${slug} · A standing rule`, tags.join(" "), body].join("\n\n");

const decisionBody = (alternatives: number): string =>
  [
    "The system SHALL keep this rule.",
    "**Why** It was agreed.",
    [
      "**Alternatives**",
      ...Array.from(
        { length: alternatives },
        (_, i) => `- Alternative ${i + 1}: something else.`,
      ),
    ].join("\n"),
    "**Consequences** It costs something.",
  ].join("\n\n");

const procedureBody =
  "**When** Something fails.\n\n**Steps**\n\n1. Look.\n\n**Verification** It shows.";

const blockAt = (text: string, kind: "Decision" | "Procedure" | "Requirement", slug: string): string =>
  text.split(/^### /m).slice(1)
    .find((block) => block.startsWith(`${kind}: ${slug} `) || block.startsWith(`${kind}: ${slug}\n`)) ?? "";

const withoutNone = (names: string): string[] => names === "none" ? [] : names.split(", ");

export function createSteps() {
  const repository = new InMemoryClosingRepository();
  const close = new CloseWorkOrderUseCase(repository);
  const changes = new Map<string, Planned>();
  const standing = new Map<string, string>();
  let alternativesListed = 0;
  let declared: string[] = [];
  let report: Awaited<ReturnType<CloseWorkOrderUseCase["execute"]>> = [];
  let last = "";

  const planned = (name: string, verdict: Verdict = "verified"): Planned => {
    last = name;
    const current = changes.get(name);
    if (current) return current;
    const order: Planned = {
      verdict, decisions: [], procedures: [], drawings: {}, deltas: 0,
      created: `2026-11-${String(10 + changes.size).padStart(2, "0")}`,
    };
    changes.set(name, order);
    return order;
  };

  type Finding = ClosingOrderFixture["findings"][number];

  const standingFindings = (decisions: Decision[]): Finding[] =>
    decisions.flatMap(({ slug, tags }): Finding[] => {
      const operation = tags
        .map((tag) => /^@(adds|modifies|replaces|renames|removes)(?::(\S+))?$/.exec(tag))
        .find((match) => match !== null);
      const base = tags.find((tag) => tag.startsWith("@base:"))?.slice(6);
      const target = operation?.[2] ?? slug;
      const recordedOrigin = standing.get(target);
      if (operation?.[1] === "adds") {
        return standing.has(slug)
          ? [{ rule: "operation-tag-holds", block: slug, message: `${slug} already stands` }]
          : [];
      }
      if (recordedOrigin === undefined) {
        return [{ rule: "operation-tag-holds", block: slug, message: `${target} no longer stands` }];
      }
      return recordedOrigin !== base
        ? [{ rule: "operation-records-base", block: slug, message: `${target} has changed` }]
        : [];
    });

  const prepare = (): void => {
    if (standing.size) {
      repository.seedStanding(
        "openspec/adr/product/money.md",
        ["# money", ...[...standing].map(([slug, origin]) =>
          block("Decision", slug, [`@origin:${origin}`, ...DECISION_TAGS], decisionBody(0)),
        )].join("\n\n"),
      );
    }
    repository.seed([...changes].map(([name, order]) => ({
      name,
      created: order.created,
      product: order.product,
      verdict: order.verdict === "absent" ? undefined : order.verdict,
      findings: standingFindings(order.decisions),
      plan: [
        `---\nname: ${name}\napproved_at: 2026-11-10\n---`,
        "# Work order",
        "## Architecture decisions",
        ...order.decisions.map(({ slug, tags }) =>
          block("Decision", slug, tags, decisionBody(alternativesListed)),
        ),
        "## Procedures",
        ...order.procedures,
        "## Phases",
        "### Phase 1: Step 1 works",
        "- [x] app-domain: build step",
        "- [x] modules: verify the phase",
      ].join("\n\n"),
      drawings: {
        ...Object.fromEntries(Array.from({ length: order.deltas }, (_, i) => [
          `orders/use-case-${i + 1}`,
          `### Requirement: An order is found (${i + 1})\n\nThe system SHALL find the order.\n`,
        ])),
        ...order.drawings,
      },
    })));
  };

  const decision = async (slug: string): Promise<string> => {
    const file = (await repository.listStanding()).decisions.get(slug)?.file;
    expect(file, slug).toBeDefined();
    return blockAt((await repository.readStandingFile(file!)) ?? "", "Decision", slug);
  };

  const procedure = async (slug: string): Promise<string> => {
    const file = (await repository.listStanding()).procedures.get(slug)?.file;
    expect(file, slug).toBeDefined();
    return blockAt((await repository.readStandingFile(file!)) ?? "", "Procedure", slug);
  };

  const addDecision = (order: Planned, slug: string, area: string, topic: string, tag = "@adds"): void => {
    order.decisions.push({
      slug,
      tags: [tag, `@area:${area}`, `@topic:${topic}`, ...DECISION_TAGS],
    });
  };

  return {
    // Context
    activeChangeEvidence(change: string, verdict: string): void {
      expect(["verified", "not verified", "absent"]).toContain(verdict);
      planned(change, verdict as Verdict);
    },
    consolidatedDecisionsBefore(before: string): void {
      for (const slug of withoutNone(before)) standing.set(slug, ORIGIN);
    },
    verifiedChangeDecisionTagged(change: string, slug: string, tag: string): void {
      const order = planned(change);
      addDecision(order, slug, "product", "money", tag);
      if (tag !== "@adds") order.decisions.at(-1)!.tags.push(`@base:${ORIGIN}`);
    },
    blockListsAlternatives(alternatives: string): void {
      alternativesListed = Number(alternatives);
    },
    consolidatedDecisionWithOrigin(target: string, currentOrigin: string): void {
      standing.set(target, currentOrigin);
    },
    planModifiesAsSeen(change: string, target: string, seenOrigin: string): void {
      const order = planned(change);
      addDecision(order, target, "product", "money", `@modifies:${target}`);
      order.decisions.at(-1)!.tags.push(`@base:${seenOrigin}`);
    },
    verifiedChangeAddsDecisionIn(change: string, slug: string, area: string, topic: string): void {
      addDecision(planned(change), slug, area, topic);
    },
    verifiedChangeAddsProcedureOf(change: string, slug: string, purpose: string, topic: string, envs: string): void {
      planned(change).procedures.push(block(
        "Procedure", slug, ["@adds", `@purpose:${purpose}`, `@topic:${topic}`, `@env:${envs.replaceAll(", ", ",")}`],
        procedureBody,
      ));
    },
    verifiedChangeWithDeltas(change: string, deltas: string): void {
      planned(change).deltas = Number(deltas);
    },
    verifiedChangesInOrder(verified: string): void {
      for (const name of withoutNone(verified)) planned(name);
    },
    unverifiedChanges(unverified: string): void {
      for (const name of withoutNone(unverified)) planned(name, "not verified");
    },
    projectDeclaresProducts(products: string): void {
      expect(withoutNone(products)).not.toHaveLength(0);
      declared = withoutNone(products);
    },
    verifiedChangeOfProductAddsDecisionIn(
      change: string, product: string, slug: string, area: string, topic: string,
    ): void {
      expect(declared).toContain(product);
      const order = planned(change);
      order.product = product;
      addDecision(order, slug, area, topic);
    },
    verifiedChangeWithKindTaggedBy(change: string, kind: string, name: string, by: string): void {
      const order = planned(change);
      if (kind === "decision") {
        addDecision(order, name, "product", "money");
        order.decisions.at(-1)!.tags.push(by);
      } else if (kind === "procedure") {
        order.procedures.push(block(
          "Procedure", name, ["@adds", "@purpose:diagnose", "@topic:logs", "@env:prod", by], procedureBody,
        ));
      } else {
        expect(kind).toBe("requirement");
        order.drawings["orders/list-orders"] =
          `### Requirement: ${name}\n\n\`${by}\`\n\nThe system SHALL list the orders of a customer.\n`;
      }
    },

    // Action
    async archiveChange(change: string, date: string): Promise<void> {
      prepare();
      report = await close.execute(change, { date });
    },
    async archiveEveryChange(date: string): Promise<void> {
      prepare();
      report = await close.execute(undefined, { date });
    },

    // Outcome
    async changePlace(change: string, place: string): Promise<void> {
      const row = report.find((entry) => entry.change === change);
      expect(row?.place, row?.reason).toBe(place);
      expect((await repository.listOrders()).some((order) => order.name === change)).toBe(place === "still active");
      if (place === "archived") expect(repository.readClosedPlan(row!.as!)).toBeDefined();
    },
    async consolidatedDecisionsAfter(after: string): Promise<void> {
      const { decisions } = await repository.listStanding();
      expect([...decisions.keys()].sort().join(", ") || "none", report.map((entry) => entry.reason).join("\n")).toBe(after);
    },
    questionsAsked(asked: string): void {
      expect(Number(asked)).toBe(0);
      expect(report.every((entry) => entry.place === "archived")).toBe(true);
    },
    async consolidatedDecisionOrigin(slug: string, origin: string): Promise<void> {
      expect(await decision(slug)).toContain(`@origin:${origin}`);
    },
    async consolidatedDecisionAlternatives(slug: string, consolidatedAlternatives: string): Promise<void> {
      const text = await decision(slug);
      expect(text.match(/^- Alternative /gm) ?? []).toHaveLength(Number(consolidatedAlternatives));
      expect(text).toContain("The system SHALL keep this rule.");
      expect(text).toContain("**Why** It was agreed.");
      expect(text).not.toContain("Consequences");
    },
    archivedPlanAlternatives(change: string, archivedAlternatives: string, slug: string): void {
      const row = report.find((entry) => entry.change === change);
      const text = blockAt(repository.readClosedPlan(row!.as!) ?? "", "Decision", slug);
      expect(text.match(/^- Alternative /gm) ?? []).toHaveLength(Number(archivedAlternatives));
    },
    feedbackNamesBlock(slug: string): void {
      expect(repository.recordedFindings).toMatchObject([{ name: last, block: slug }]);
    },
    async decisionConsolidatedIn(slug: string, path: string): Promise<void> {
      expect((await repository.listStanding()).decisions.get(slug)?.file).toBe(path);
    },
    async procedureConsolidatedIn(slug: string, path: string): Promise<void> {
      expect((await repository.listStanding()).procedures.get(slug)?.file).toBe(path);
    },
    async consolidatedProcedureEnvs(slug: string, envs: string): Promise<void> {
      const text = await procedure(slug);
      expect(text).toContain(`@env:${envs.replaceAll(", ", ",")}`);
      expect(text).toContain(`@origin:${report[0]!.as}`);
      expect(text).toContain("**Verification** It shows.");
    },
    consolidatedSpecsCarry(merged: string): void {
      expect(repository.drawingCount()).toBe(Number(merged));
    },
    staleGeneratedTests(stale: string): void {
      expect(repository.staleGaugeCount()).toBe(Number(stale));
      expect(repository.gaugeCount()).toBe(changes.get(last)!.deltas);
    },
    changesArchivedInOrder(archived: string): void {
      expect(report.filter((entry) => entry.place === "archived").map((entry) => entry.change)).toEqual(withoutNone(archived));
    },
    async changesStillActive(active: string): Promise<void> {
      expect((await repository.listOrders()).map((entry) => entry.name).sort()).toEqual(withoutNone(active));
    },
    async consolidatedKindTagged(kind: string, name: string, consolidated: string): Promise<void> {
      if (kind === "requirement") {
        const text = blockAt(repository.readDrawing("orders/list-orders") ?? "", "Requirement", name);
        expect(text.split("\n").filter((line) => line.trim())[1]).toBe(`\`${consolidated}\``);
        return;
      }
      const text = kind === "decision" ? await decision(name) : await procedure(name);
      expect(text.split("\n").filter((line) => line.trim())[1]?.split(" ")).toContain(consolidated);
    },
  };
}
