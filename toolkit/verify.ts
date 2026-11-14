import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "./review/env.ts";
import { activeChanges, readChange } from "./change.ts";
import { digestOf, type Evidence, type ScenarioResult, writeEvidence } from "./evidence.ts";
import { raise } from "./feedback.ts";
import { cacheDir, PROJECT_ROOT, self } from "./paths.ts";
import { parsePlan, tagOf } from "./plan.ts";
import { loadSchema, projectConfig, projectSchemaName, schemaNames } from "./schema.ts";

/** The environments a procedure is executed in while verifying; in any other it is only reviewed. */
export const SAFE = ["local", "sandbox"];

type Failing = Evidence["failing"];

export type VerifyOptions = {
  env?: Record<string, string | undefined>;
  /** The result of each scenario of the change; by default, its generated acceptance tests are run. */
  scenarios?: (root: string, specs: string[]) => Promise<ScenarioResult[]>;
  /** The workstreams whose check or tests fail; by default, the real checks. */
  checks?: (root: string) => Promise<Failing>;
  /** The warnings of the rubric review, given its key; by default, the real review. */
  review?: (root: string, key: string) => Promise<string[]>;
  /** How each procedure went where it was executed, by `<slug>@<environment>`. */
  procedures?: Record<string, "passed" | "failed">;
};

type TestReport = {
  testResults: Array<{
    name: string;
    assertionResults: Array<{ ancestorTitles: string[]; title: string; status: string }>;
  }>;
};

/** Runs the generated acceptance tests of the use cases `specs` name and reads each scenario's result. */
const acceptance = async (root: string, specs: string[]): Promise<ScenarioResult[]> => {
  if (!specs.length) return [];
  const { acceptance: folder } = await projectConfig(root);
  const report = join(cacheDir(root), "evidence.json");
  self(root, ["test", "acceptance", "--report", report]);
  const files = existsSync(report)
    ? (JSON.parse(readFileSync(report, "utf8")) as TestReport).testResults
    : [];
  return specs.flatMap((spec): ScenarioResult[] => {
    const file = files.find((f) => f.name.endsWith(join(folder, `${spec}.feature.test.ts`)));
    if (!file?.assertionResults.length)
      return [{ spec, requirement: "", scenario: "", result: "missing" }];
    return file.assertionResults.map((t) => ({
      spec,
      requirement: (t.ancestorTitles.at(-1) ?? "").replace(/^Rule: /, ""),
      scenario: t.title,
      result: t.status === "passed" ? "passed" : "failed",
    }));
  });
};

/**
 * Checks each workstream of the change's schema after those it waits for, so a failure is named by
 * the workstream that owns it: one whose upstream fails is not checked. Then the product tests each
 * is proved by. A schema with no workstreams leaves only the freshness of the generated tests.
 */
const realChecks = async (root: string, made: string): Promise<Failing> => {
  const [config, schema] = [await projectConfig(root), await loadSchema(made)];
  const failing: Failing = [];
  const failed = new Set<string>();
  const done = new Set<string>();
  const ids = Object.keys(schema.workstreams);
  while (done.size < ids.length) {
    const next = ids.find(
      (id) => !done.has(id) && (config.workstreams[id]?.dependsOn ?? []).every((d) => done.has(d)),
    );
    if (!next) break;
    done.add(next);
    if ((config.workstreams[next]?.dependsOn ?? []).some((d) => failed.has(d))) {
      failed.add(next);
      continue;
    }
    const check = self(root, ["check", "--workstream", next]);
    const tests = (schema.workstreams[next]?.tests ?? [])
      .filter((kind) => kind !== "acceptance")
      .map((kind) => self(root, ["test", kind]))
      .find((r) => r.status !== 0);
    const broken = check.status !== 0 ? check : tests;
    if (broken) {
      failed.add(next);
      failing.push({ workstream: next, output: broken.output });
    }
  }
  const fresh = self(root, ["generate", "--check"]);
  if (fresh.status !== 0 && !failing.length)
    failing.push({ workstream: ids[0] ?? "generated tests", output: `the generated tests are not fresh:\n${fresh.output}` });
  return failing;
};

const realReview = async (root: string, key: string): Promise<string[]> => {
  const { review } = await projectConfig(root);
  const r = self(root, ["review"], { ...process.env, [review.keyVariable]: key });
  if (r.status !== 0) throw new Error(r.output);
  return r.output.split("\n").filter((line) => /^S\d{2} p=/.test(line));
};

/**
 * Verifies the change `name` of the project at `root` and writes its evidence: every scenario
 * matched to its test, every check, the review when its key is configured, and each procedure in
 * the environments where executing it is safe. What fails is raised as feedback; nothing is fixed.
 */
export const verify = async (
  root: string,
  name: string,
  options: VerifyOptions = {},
): Promise<Evidence> => {
  const change = readChange(root, name);
  if (!change) throw new Error(`no active change is called ${name}`);
  if (!change.schema || !schemaNames().includes(change.schema))
    throw new Error(
      `the change ${name} was made with the schema ${change.schema ?? "(none)"}, which this package does not define; schemas: ${schemaNames().join(", ")}`,
    );
  const made = change.schema;
  const plan = parsePlan(change.plan ?? "");
  const specs = change.deltaSpecs.map((f) => f.replace(/^specs\//, "").replace(/\/spec\.md$/, ""));

  const scenarios = await (options.scenarios ?? acceptance)(root, specs);
  const failing = await (options.checks ? options.checks(root) : realChecks(root, made));

  const config = await projectConfig(root);
  const key = (options.env ?? loadEnv(root, process.env))[config.review.keyVariable];
  let review: Evidence["review"] = {
    state: "skipped",
    warnings: [],
    note: `the project configures no ${config.review.keyVariable}`,
  };
  const { rubric } = await loadSchema(await projectSchemaName(root));
  if (!rubric) review.note = "the schema this project is checked with has no rubric";
  else if (key)
    try {
      review = { state: "run", warnings: await (options.review ?? realReview)(root, key) };
    } catch (e) {
      review.note = `the review could not run: ${e instanceof Error ? e.message : String(e)}`;
    }

  const procedures: Evidence["procedures"] = plan.procedures.flatMap((block) =>
    (tagOf(block, "env")?.value ?? "").split(",").filter(Boolean).map((env) => {
      const outcome = options.procedures?.[`${block.slug}@${env}`];
      return !SAFE.includes(env)
        ? { slug: block.slug, env, treatment: "reviewed only" as const }
        : outcome
          ? { slug: block.slug, env, treatment: "executed" as const, outcome }
          : { slug: block.slug, env, treatment: "not executed" as const };
    }),
  );

  const unproved = scenarios.filter((s) => s.result !== "passed");
  const unexercised = procedures.filter(
    (p) => p.treatment === "not executed" || p.outcome === "failed",
  );
  const evidence: Evidence = {
    change: name,
    verdict:
      unproved.length || failing.length || unexercised.length ? "not verified" : "verified",
    digest: await digestOf(root, name),
    scenarios,
    failing,
    review,
    procedures,
  };
  writeEvidence(root, evidence);

  const says = "the verify phase";
  for (const f of failing) raise(root, name, { source: says, names: f.workstream, findings: [f.output] });
  if (unproved.length && !failing.some((f) => f.workstream === "app-domain"))
    raise(root, name, {
      source: says,
      names: "app-domain",
      findings: unproved.map((s) => `${s.spec}: ${s.scenario || "no generated test ran"} ${s.result}`),
    });
  for (const p of unexercised)
    raise(root, name, {
      source: says,
      names: p.slug,
      findings: [
        p.outcome === "failed"
          ? `the procedure ${p.slug} failed its verification step in ${p.env}`
          : `the procedure ${p.slug} was not executed in ${p.env}`,
      ],
    });
  return evidence;
};

/**
 * `factory verify <change> [--procedure <slug>@<environment>=<passed|failed>]…`: verifies the
 * change and writes its evidence. Exit status 0 when it is verified, 1 when it is not, 2 when the
 * change does not exist.
 */
export const run = async (args: string[]): Promise<number> => {
  const [name] = args;
  const known = activeChanges(PROJECT_ROOT);
  if (!name || !known.includes(name)) {
    console.error(`Name the change to verify. Changes: ${known.join(", ") || "none"}`);
    return 2;
  }
  const procedures: Record<string, "passed" | "failed"> = {};
  for (const [i, arg] of args.entries())
    if (arg === "--procedure") {
      const m = /^(.+)=(passed|failed)$/.exec(args[i + 1] ?? "");
      if (!m) {
        console.error("Say how a procedure went as --procedure <slug>@<environment>=<passed|failed>.");
        return 2;
      }
      procedures[m[1]!] = m[2] as "passed" | "failed";
    }
  const e = await verify(PROJECT_ROOT, name, { procedures });
  console.log(`${e.verdict}: ${name}`);
  const passed = e.scenarios.filter((s) => s.result === "passed").length;
  console.log(`- scenarios: ${passed} of ${e.scenarios.length} matched to a passing test`);
  for (const s of e.scenarios.filter((s) => s.result !== "passed"))
    console.log(`  ${s.result}: ${s.spec} · ${s.scenario || "no generated test ran"}`);
  console.log(
    `- checks: ${e.failing.length ? `failing in ${e.failing.map((f) => f.workstream).join(", ")}` : "every check passes"}`,
  );
  console.log(
    `- review: ${e.review.state === "run" ? `run, ${e.review.warnings.length} warning(s)` : `skipped (${e.review.note})`}`,
  );
  for (const p of e.procedures)
    console.log(`- procedure ${p.slug} in ${p.env}: ${p.treatment}${p.outcome ? `, ${p.outcome}` : ""}`);
  console.log(`- evidence: openspec/changes/${name}/evidence.md`);
  return e.verdict === "verified" ? 0 : 1;
};
