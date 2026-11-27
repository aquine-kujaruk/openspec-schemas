import { existsSync, readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { type Block, deltaRequirementsOf, operationsOf, type Tag, tagOf } from "factory/sdk";
import type { Standing } from "factory/sdk";
import type { Candidate, Finding, JudgementRequest, Validator } from "factory/sdk";

type Rule = (candidate: Candidate) => Finding[];
type Kind = "decision" | "procedure";
type Durable = { kind: Kind; block: Block; standing: Map<string, Standing> };

const PURPOSES = ["setup", "access", "diagnose", "operate"];
const AREAS = ["product", "production"];

/** What a value shaped like a credential looks like: the prefixes providers issue, a private key, a signed token. */
const CREDENTIAL_SHAPES = [
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\bsk[-_](?:(?:live|test|proj)[-_])?[A-Za-z0-9]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
];
const ASSIGNED = /\b(?:password|passwd|secret|token|api[_-]?key)\b\s*[:=]\s*["'`]?([A-Za-z0-9+_=-]{12,})/gi;
const mixed = (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

const holdsCredential = (text: string): boolean =>
  CREDENTIAL_SHAPES.some((shape) => shape.test(text)) ||
  [...text.matchAll(ASSIGNED)].some((m) => mixed(m[1]!));

const durables = (c: Candidate): Durable[] => [
  ...c.plan.decisions.map((block) => ({
    kind: "decision" as const,
    block,
    standing: c.consolidated.decisions,
  })),
  ...c.plan.procedures.map((block) => ({
    kind: "procedure" as const,
    block,
    standing: c.consolidated.procedures,
  })),
];

/** The one operation a block declares; a block that declares none or several has no operation to check. */
const operationOf = (block: Block) => {
  const operations = operationsOf(block);
  return operations.length === 1 ? operations[0]! : undefined;
};

const noOpenQuestions: Rule = (c) =>
  c.plan.openQuestions.length
    ? [
        {
          rule: "no-open-questions",
          message: `the plan lists ${c.plan.openQuestions.length} open question(s): the person answers them before the change is ready`,
        },
      ]
    : [];

const oneOperationTag: Rule = (c) =>
  durables(c).flatMap(({ kind, block }) => {
    const found = operationsOf(block).map((t) => `@${t.name}`);
    return found.length === 1
      ? []
      : [
          {
            rule: "one-operation-tag",
            block: block.slug,
            message: `the ${kind} ${block.slug} carries ${found.length ? found.join(" and ") : "no operation tag"}: tag it with exactly one of @adds, @modifies, @replaces, @renames, @removes`,
          },
        ];
  });

const operationTagHolds: Rule = (c) =>
  durables(c).flatMap(({ kind, block, standing }) => {
    const operation = operationOf(block);
    if (!operation) return [];
    const fail = (message: string): Finding[] => [
      { rule: "operation-tag-holds", block: block.slug, tag: `@${operation.name}`, message },
    ];
    if (operation.name === "adds")
      return standing.has(block.slug)
        ? fail(
            `the ${kind} ${block.slug} is tagged @adds, but ${standing.get(block.slug)!.file} already has it: tag it @modifies:${block.slug} or @replaces:${block.slug}`,
          )
        : [];
    const named = operation.value;
    if (!named || !standing.has(named))
      return fail(
        `the ${kind} ${block.slug} is tagged @${operation.name}${named ? `:${named}` : ""}, which names no consolidated ${kind}`,
      );
    const keepsSlug = operation.name === "modifies" || operation.name === "removes";
    if (keepsSlug && named !== block.slug)
      return fail(
        `the ${kind} ${block.slug} is tagged @${operation.name}:${named}: a block that ${operation.name} another keeps its slug`,
      );
    if (!keepsSlug && named !== block.slug && standing.has(block.slug))
      return fail(
        `the ${kind} ${block.slug} is tagged @${operation.name}:${named}, but ${standing.get(block.slug)!.file} already has a ${kind} ${block.slug}`,
      );
    return [];
  });

const operationRecordsBase: Rule = (c) =>
  durables(c).flatMap(({ kind, block, standing }) => {
    const operation = operationOf(block);
    const named = operation?.value ? standing.get(operation.value) : undefined;
    if (!operation || operation.name === "adds" || !named) return [];
    const base = tagOf(block, "base")?.value;
    if (base && base === named.origin) return [];
    return [
      {
        rule: "operation-records-base",
        block: block.slug,
        tag: "@base",
        message: base
          ? `the ${kind} ${block.slug} records @base:${base}, but ${operation.value} was last written by ${named.origin ?? "no recorded change"}: read it again and plan against what it says now`
          : `the ${kind} ${block.slug} is tagged @${operation.name}:${operation.value} without @base: copy the @origin of ${operation.value} from ${named.file}`,
      },
    ];
  });

/** The tags a block must carry with a value, once it declares an operation that leaves a block standing. */
const carries =
  (kind: Kind, rule: string, required: string[], allowed: Record<string, string[]>): Rule =>
  (c) =>
    durables(c)
      .filter((d) => d.kind === kind)
      .flatMap(({ block }) => {
        const operation = operationOf(block);
        if (!operation || operation.name === "removes") return [];
        return required.flatMap((name): Finding[] => {
          const value = tagOf(block, name)?.value;
          const choices = allowed[name];
          if (value && (!choices || choices.includes(value))) return [];
          return [
            {
              rule,
              block: block.slug,
              tag: `@${name}`,
              message: value
                ? `the ${kind} ${block.slug} carries @${name}:${value}: it is one of ${choices!.join(", ")}`
                : `the ${kind} ${block.slug} lacks @${name}`,
            },
          ];
        });
      });

/** A probe is recorded with the day it ran, or `declined` when the person chose not to configure the access. */
const PROBED = /^(?:\d{4}-\d{2}-\d{2}|declined)$/;

const procedureProbed: Rule = (c) =>
  c.plan.procedures.flatMap((block) => {
    const operation = operationOf(block);
    if (tagOf(block, "purpose")?.value !== "access" || !operation || operation.name === "removes") return [];
    const probed = tagOf(block, "probed")?.value;
    if (probed && PROBED.test(probed)) return [];
    return [
      {
        rule: "procedure-probed",
        block: block.slug,
        tag: "@probed",
        message: probed
          ? `the procedure ${block.slug} carries @probed:${probed}: it is the date of the probe (YYYY-MM-DD) or declined`
          : `the procedure ${block.slug} gives access and lacks @probed: probe it while planning and tag it with the date, or with declined when the person chose not to configure it`,
      },
    ];
  });

const APPROVED = /^(?:\d{4}-\d{2}-\d{2}|declined)$/;

/** Whether `path`, relative to the change's folder `dir`, is an HTML file of the change's `spikes/` folder that exists. */
const isSpike = (dir: string, path: string): boolean => {
  const at = normalize(path).split("\\").join("/");
  if (!at.startsWith("spikes/") || !at.endsWith(".html")) return false;
  const file = join(dir, at);
  return existsSync(file) && statSync(file).isFile();
};

/**
 * A web change lists its screens, and each one is approved by whoever could decide it, names the
 * page the implementation builds, and names its spike, a throwaway HTML file in the change.
 */
const screenApproved: Rule = (c) => {
  if (!c.spike) return [];
  const spiked = c.plan.phases.some((p) => p.tasks.some((t) => t.workstream === c.spike));
  const found: Finding[] = spiked && !c.plan.screens.length
    ? [
        {
          rule: "screen-approved",
          message: `the plan has tasks of ${c.spike}, the spike workstream, and lists no screen: list each screen under ## Screens, spiked under spikes/ and approved while planning`,
        },
      ]
    : [];
  for (const screen of c.plan.screens) {
    const approved = tagOf(screen, "approved")?.value;
    if (!approved || !APPROVED.test(approved))
      found.push({
        rule: "screen-approved",
        block: screen.slug,
        tag: "@approved",
        message: approved
          ? `the screen ${screen.slug} carries @approved:${approved}: it is the date it was approved (YYYY-MM-DD) or declined`
          : `the screen ${screen.slug} lacks @approved: show its spike to whoever decides it and tag it with the date, or with declined when the person chose not to see it`,
      });
    if (!tagOf(screen, "page")?.value)
      found.push({
        rule: "screen-approved",
        block: screen.slug,
        tag: "@page",
        message: `the screen ${screen.slug} names no page: tag it with @page:<path of the page the implementation builds>`,
      });
    const spike = tagOf(screen, "spike")?.value;
    if (!spike || !isSpike(c.change.dir, spike))
      found.push({
        rule: "screen-approved",
        block: screen.slug,
        tag: "@spike",
        message: spike
          ? `the screen ${screen.slug} names the spike ${spike}, which is not an HTML file under the change's spikes/ folder: write it there, or name the one that holds the screen`
          : `the screen ${screen.slug} names no spike: tag it with @spike:spikes/<name>.html, the throwaway page that shows it`,
      });
  }
  return found;
};

const noCredentialInProcedure: Rule = (c) =>
  c.plan.procedures
    .filter((block) => holdsCredential(block.body))
    .map((block) => ({
      rule: "no-credential-in-procedure",
      block: block.slug,
      message: `the procedure ${block.slug} holds a value shaped like a credential: name where the secret is kept and remove the value`,
    }));

const tasksBelong: Rule = (c) => [
  ...c.plan.strayTasks.map((t) => ({
    rule: "task-in-a-phase",
    message: `the task "${t.text}" sits outside every phase: only the tasks of a phase are checkboxes`,
  })),
  ...c.plan.phases.flatMap((phase) =>
    phase.tasks
      .filter((t) =>
        c.workstreams.length
          ? !t.workstream || !c.workstreams.includes(t.workstream)
          : t.workstream !== undefined,
      )
      .map((t) => ({
        rule: "task-names-a-workstream",
        message: c.workstreams.length
          ? `the task "${t.text}" of ${phase.title} names no workstream of the schema: start it with one of ${c.workstreams.join(", ")} and a colon`
          : `the task "${t.text}" of ${phase.title} names the workstream ${t.workstream} and the schema of this change has none: write the task without it`,
      })),
  ),
];

const deltaSpecsOrNoBehaviour: Rule = (c) => {
  const specs = c.change.deltaSpecs.length;
  if (specs && !c.change.noBehaviour) return [];
  if (!specs && c.change.noBehaviour) return [];
  return [
    {
      rule: "delta-specs-or-no-behaviour",
      message: specs
        ? `the change holds ${specs} delta spec(s) and is marked as changing no behaviour: remove skip_specs from its .openspec.yaml`
        : "the change holds no delta spec: write one per use case it touches, or mark it with skip_specs: true in its .openspec.yaml",
    },
  ];
};

/** Who took a decision: the person, or the agent alone. */
const AUTHORS = ["person", "agent"];

/**
 * Every decision the change writes says who took it, with exactly one `@by:person` or `@by:agent`:
 * the lines under Decisions, the durable blocks, the screens, and each requirement a delta spec
 * adds or modifies, on the first line of its text.
 */
const decisionAuthored: Rule = (c) => {
  const judge = (what: string, tags: Tag[], block?: string): Finding[] => {
    const by = tags.filter((t) => t.name === "by");
    if (by.length === 1 && AUTHORS.includes(by[0]!.value ?? "")) return [];
    return [
      {
        rule: "decision-authored",
        ...(block ? { block } : {}),
        tag: "@by",
        message: by.length
          ? `${what} carries ${by.map((t) => `@by${t.value ? `:${t.value}` : ""}`).join(" and ")}: tag it with exactly one of @by:person, @by:agent`
          : `${what} does not say who took it: tag it with @by:person when the person decided it, @by:agent when you did`,
      },
    ];
  };
  const requirements = c.change.deltaSpecs.flatMap((spec) =>
    deltaRequirementsOf(readFileSync(join(c.change.dir, spec), "utf8")).map((r) => ({ spec, ...r })),
  );
  return [
    ...c.plan.changeDecisions.flatMap((d) => judge(`the decision "${d.text.slice(0, 60)}"`, d.tags)),
    ...c.plan.decisions.flatMap((b) => judge(`the decision ${b.slug}`, b.tags, b.slug)),
    ...c.plan.procedures.flatMap((b) => judge(`the procedure ${b.slug}`, b.tags, b.slug)),
    ...c.plan.screens.flatMap((b) => judge(`the screen ${b.slug}`, b.tags, b.slug)),
    ...requirements.flatMap((r) =>
      judge(`the requirement "${r.name}" of ${r.spec} (on the first line of its text)`, r.tags),
    ),
  ];
};

/**
 * An architecture decision the agent took alone says why it was the agent's: a consolidated
 * decision already settled the same kind of choice (`@basis:precedent:<slug>`), or no option it
 * weighs changes what the product can do or for whom (`@basis:no-fork`). One that forks on intent
 * is the person's, asked under Open questions and tagged `@by:person`.
 */
/** The basis an agent's architecture decision states, when it states exactly one valid basis. */
const basisOf = (c: Pick<Candidate, "consolidated">, b: Block): { precedent?: string } | undefined => {
  if (tagOf(b, "by")?.value !== "agent") return undefined;
  const bases = b.tags.filter((t) => t.name === "basis");
  if (bases.length !== 1) return undefined;
  const value = bases[0]!.value ?? "";
  if (value === "no-fork") return {};
  const precedent = /^precedent:(.+)$/.exec(value)?.[1];
  return precedent && c.consolidated.decisions.has(precedent) ? { precedent } : undefined;
};

const ASK = "or, when an option changes what the product can do or for whom, ask the person under Open questions and tag it @by:person";

const decisionBasis: Rule = (c) =>
  c.plan.decisions.flatMap((b) => {
    if (tagOf(b, "by")?.value !== "agent" || basisOf(c, b)) return [];
    const bases = b.tags.filter((t) => t.name === "basis");
    const fail = (message: string): Finding[] => [{ rule: "decision-basis", block: b.slug, tag: "@basis", message }];
    if (bases.length !== 1)
      return fail(
        bases.length
          ? `the architecture decision ${b.slug} carries ${bases.length} @basis tags: keep exactly one`
          : `the architecture decision ${b.slug} was taken by the agent and states no basis: tag it @basis:precedent:<slug> when a consolidated decision settled the same kind of choice, @basis:no-fork when no option changes what the product can do or for whom, ${ASK}`,
      );
    const value = bases[0]!.value ?? "";
    const precedent = /^precedent:(.+)$/.exec(value)?.[1];
    return fail(
      precedent
        ? `the architecture decision ${b.slug} names the precedent ${precedent}, which is no consolidated decision: name one under openspec/adr, ${ASK}`
        : `the architecture decision ${b.slug} carries @basis:${value}: its basis is precedent:<slug> or no-fork, ${ASK}`,
    );
  });

const NO_FORK =
  "An agent took the architecture decision below without asking the person, on the grounds that no option it weighs changes what the product can do or for whom. Does that hold: none of the options it chose or discarded changes where the person's data lives, whether the product works locally or online, on which devices or for how many people it works, which outside services it needs, or what it costs?";
const PRECEDENT =
  "An agent took the architecture decision below without asking the person, following the earlier decision quoted after it. Does the earlier decision settle the same kind of choice, so that this decision follows it rather than opening a new one?";

const stateOf = (b: Block) => `### Decision: ${b.slug} · ${b.title}\n\n${b.body}`;

/** One question to the decision model per architecture decision the agent took with a basis. */
const judgements = (c: Omit<Candidate, "judged">): JudgementRequest[] =>
  c.plan.decisions.flatMap((b) => {
    const basis = basisOf(c, b);
    if (!basis) return [];
    if (basis.precedent === undefined) return [{ block: b.slug, state: stateOf(b), instructions: NO_FORK }];
    const earlier = c.consolidated.decisions.get(basis.precedent)!;
    return [
      {
        block: b.slug,
        state: `${stateOf(b)}\n\nEarlier decision, ${basis.precedent}:\n\n${earlier.body}`,
        instructions: PRECEDENT,
      },
    ];
  });

/** The decision model holds an agent's basis at this probability or more; below it, the person decides. */
const SURE = 0.9;

const decisionBasisHolds: Rule = (c) =>
  c.judged.configured
    ? judgements(c).flatMap(({ block }) => {
        const answer = c.judged.answers.get(block);
        const fail = (message: string): Finding[] => [{ rule: "decision-basis-holds", block, tag: "@basis", message }];
        if (answer === undefined) return fail(`the decision model did not judge the architecture decision ${block}: validate again`);
        if (typeof answer !== "number")
          return fail(`the decision model could not judge the basis of the architecture decision ${block} (${answer.error}): validate again, or ask the person under Open questions and tag it @by:person`);
        return answer >= SURE
          ? []
          : fail(`the decision model is ${Math.round(answer * 100)} % sure the basis of the architecture decision ${block} holds: it may fork on what the person wants, so ask them under Open questions and tag it @by:person`);
      })
    : [];

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The person approved the plan: its front matter records the day as `approved_at`. */
const planApproved: Rule = (c) =>
  c.plan.approvedAt && DAY.test(c.plan.approvedAt)
    ? []
    : [
        {
          rule: "plan-approved",
          message: c.plan.approvedAt
            ? `the plan records approved_at: ${c.plan.approvedAt}: it is the day the person approved it (YYYY-MM-DD)`
            : "the person has not approved the plan: ask for the approval as the last open question, with links to its artifacts, and record approved_at: <YYYY-MM-DD> in its front matter",
        },
      ];

const RULES: Rule[] = [
  noOpenQuestions,
  oneOperationTag,
  operationTagHolds,
  operationRecordsBase,
  carries("decision", "decision-tags", ["area", "topic", "applies", "enforced"], { area: AREAS }),
  carries("procedure", "procedure-tags", ["purpose", "topic", "env"], { purpose: PURPOSES }),
  procedureProbed,
  screenApproved,
  noCredentialInProcedure,
  tasksBelong,
  deltaSpecsOrNoBehaviour,
  decisionAuthored,
  decisionBasis,
  decisionBasisHolds,
  planApproved,
];

/** Spec: `flow/plan-validation`. A change is ready when no rule finds anything. */
export default { ready: (c) => RULES.flatMap((rule) => rule(c)), judgements } satisfies Validator;
