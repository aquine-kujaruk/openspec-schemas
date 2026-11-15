import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect } from "vitest";
import { loadSchema } from "../../../../toolkit/repository/schema.ts";
import { validateChange, type Verdict } from "../../../../toolkit/flow/validate.ts";
import { declareProducts } from "../../../../toolkit/core/testing.ts";

/**
 * Each scenario validates one change of a temp project. The change starts ready: a plan with one
 * phase, one delta spec, no durable block and no open question; every Given bends one thing.
 */
const CHANGE = "add-orders";
const ORIGIN = "2026-11-01-add-money";

const DECISION_TAGS = ["@area:product", "@topic:money", "@applies:domain", "@enforced:review"];
const PROCEDURE_TAGS = ["@purpose:diagnose", "@topic:logs", "@env:prod"];
const without = (tags: string[], name: string) => tags.filter((t) => !t.startsWith(`${name}:`));

const decision = (slug: string, tags: string[]) =>
  `### Decision: ${slug} · A rule about money\n\n${tags.join(" ")}\n\nThe system SHALL keep this rule.\n\n**Why** It was agreed.\n`;

const procedure = (slug: string, tags: string[], step = "Open the log group of the service.") =>
  `### Procedure: ${slug} · Read the logs\n\n${tags.join(" ")}\n\n**When** A request fails.\n\n**Requires** Access to the account.\n\n**Steps**\n\n1. ${step}\n\n**Verification** The failing request shows up.\n`;

const standing = (slug: string, origin: string) =>
  `# Money\n\n### Decision: ${slug} · A rule about money\n\n@origin:${origin} @applies:domain @enforced:review\n\nThe system SHALL keep this rule.\n`;

export function createSteps() {
  const root = mkdtempSync(join(tmpdir(), "plan-validation-"));
  const files: Record<string, string> = {};
  let openQuestions = 0;
  const decisions: string[] = [];
  const procedures: string[] = [];
  let made = "clean-backend";
  let phaseTasks = ["app-domain: write the use case", "integrate: verify the phase"];
  let strayTasks: string[] = [];
  let specCount = 1;
  let noBehaviour = false;
  let verdict: Verdict | undefined;
  let name = CHANGE;
  let product: string | undefined;
  let links: string[] = [];
  const list = (names: string) => (names === "none" ? [] : names.split(",").map((n) => n.trim()));

  const plan = () =>
    [
      `---\nname: ${CHANGE}\ndescription: Orders can be listed\nschema: ${made}\n---`,
      "# Add orders",
      "## Goal\n\nOrders can be listed.",
      "## Decisions",
      ["## Open questions", ...Array.from({ length: openQuestions }, (_, i) => `- Question ${i + 1}?`)].join("\n\n"),
      ["## Architecture decisions", ...decisions].join("\n\n"),
      ["## Procedures", ...procedures].join("\n\n"),
      "## Phases",
      "### Phase 1: Orders are listed",
      "**Seams**\n\n```ts\nexport interface OrderRepositoryInterface {}\n```",
      ["**Tests**", phaseTasks.map((t) => `- [ ] ${t}`).join("\n")].join("\n\n"),
      ["## Feedback", strayTasks.map((t) => `- [ ] ${t}`).join("\n")].join("\n\n"),
      "## Next step",
    ].join("\n\n");

  const write = () => {
    const change = `openspec/changes/${name}`;
    files[`${change}/.openspec.yaml`] =
      `schema: ${made}\ncreated: 2026-11-13\n${noBehaviour ? "skip_specs: true\n" : ""}` +
      `${product ? `x-product: ${product}\n` : ""}${links.length ? `x-linked: [${links.join(", ")}]\n` : ""}`;
    files[`${change}/plan.md`] = plan();
    for (let i = 0; i < specCount; i++)
      files[`${change}/specs/orders/use-case-${i}/spec.md`] = "## ADDED Requirements\n";
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
  };

  return {
    // Context
    async planListingOpenQuestions(open: string): Promise<void> {
      openQuestions = Number(open);
    },
    async blockCarryingOperationTags(kind: string, slug: string, tagCount: string): Promise<void> {
      const operations = ["@adds", `@modifies:${slug}`].slice(0, Number(tagCount));
      if (kind === "decision") decisions.push(decision(slug, [...operations, ...DECISION_TAGS]));
      else procedures.push(procedure(slug, [...operations, ...PROCEDURE_TAGS]));
    },
    async consolidatedDecisions(consolidated: string): Promise<void> {
      if (consolidated !== "none")
        files["openspec/adr/product/money.md"] = standing(consolidated, ORIGIN);
    },
    async decisionBlockTagged(slug: string, tag: string): Promise<void> {
      const base = tag === "@adds" ? [] : [`@base:${ORIGIN}`];
      decisions.push(decision(slug, [tag, ...base, ...DECISION_TAGS]));
    },
    async consolidatedDecisionOfOrigin(slug: string, origin: string): Promise<void> {
      files["openspec/adr/product/money.md"] = standing(slug, origin);
    },
    async decisionBlockTaggedWithBase(slug: string, tag: string, base: string): Promise<void> {
      const recorded = base === "none" ? [] : [`@base:${base}`];
      decisions.push(decision(slug, [tag, ...recorded, ...DECISION_TAGS]));
    },
    async decisionBlockLackingTag(slug: string, missing: string): Promise<void> {
      decisions.push(decision(slug, ["@adds", ...without(DECISION_TAGS, missing)]));
    },
    async procedureBlockLackingTag(slug: string, missing: string): Promise<void> {
      procedures.push(procedure(slug, ["@adds", ...without(PROCEDURE_TAGS, missing)]));
    },
    async procedureBlockOfPurpose(slug: string, purpose: string): Promise<void> {
      procedures.push(
        procedure(slug, ["@adds", `@purpose:${purpose}`, ...without(PROCEDURE_TAGS, "@purpose")]),
      );
    },
    async procedureStepHolding(slug: string, content: string): Promise<void> {
      const step = {
        "the name of the secret's store": "Read the token from the secrets store, under orders/logs.",
        "a value shaped like an access key": `Export the key ${"AKIA"}${"Q".repeat(16)} before calling.`,
      }[content];
      if (!step) throw new Error(`unknown content: ${content}`);
      procedures.push(procedure(slug, ["@adds", ...PROCEDURE_TAGS], step));
    },
    async schemaWorkstreams(workstreams: string): Promise<void> {
      if (workstreams === "none") {
        made = "spec-plan";
        phaseTasks = ["write the use case", "verify the phase"];
      }
      expect((await loadSchema(made)).definition.workstreams.join(", ") || "none").toBe(
        workstreams,
      );
    },
    async taskNamingWorkstreamPlaced(workstream: string, placement: string): Promise<void> {
      const task = workstream === "none" ? "write the use case" : `${workstream}: write the use case`;
      if (placement === "inside a phase") phaseTasks = [task];
      else if (placement === "outside a phase") strayTasks = [task];
      else throw new Error(`unknown placement: ${placement}`);
    },
    async changeDeltaSpecsAndMark(deltaSpecs: string, marked: string): Promise<void> {
      specCount = Number(deltaSpecs);
      noBehaviour = marked === "set";
    },
    async projectDeclaresProducts(products: string): Promise<void> {
      declareProducts(root, products);
    },
    async changeNamesProduct(schema: string, named: string): Promise<void> {
      made = schema;
      if ((await loadSchema(made)).definition.workstreams.length === 0)
        phaseTasks = ["write the use case", "verify the phase"];
      product = named === "none" ? undefined : named;
    },
    async changeLinks(change: string, linked: string): Promise<void> {
      name = change;
      links = list(linked);
    },
    // A linked change whose name starts with `missing` is left unwritten: it does not exist.
    async linkedChangeLinksBack(linked: string, back: string): Promise<void> {
      if (linked.startsWith("missing")) return;
      files[`openspec/changes/${linked}/.openspec.yaml`] =
        `schema: ${made}\ncreated: 2026-11-13\n${back === "none" ? "" : `x-linked: [${list(back).join(", ")}]\n`}`;
    },

    // Action
    async validateChange(): Promise<void> {
      write();
      verdict = await validateChange(root, name);
    },

    // Outcome
    async changeReportedAs(readiness: string): Promise<void> {
      const found = verdict!.findings.map((f) => `[${f.rule}] ${f.message}`).join("\n");
      expect(verdict!.ready ? "ready" : "not ready", found).toBe(readiness);
    },
    async findingsNameBlock(findings: string, slug: string): Promise<void> {
      expect(verdict!.findings.filter((f) => f.block === slug)).toHaveLength(Number(findings));
    },
    async findingNamesMissingTag(missing: string): Promise<void> {
      expect(verdict!.findings.map((f) => f.tag)).toContain(missing);
    },
  };
}
