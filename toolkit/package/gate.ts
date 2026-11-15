import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { CHANGES, GATE } from "../flow/change.ts";
import { PLACES, readInstalled, schemaLinkHolds, unwiredGuards } from "./doctor.ts";
import { hookInput, projectOf } from "./guard.ts";
import { capture, self } from "../core/paths.ts";
import { loadSchema } from "../repository/schema.ts";
import { productOf } from "../repository/products.ts";
import { type Building, changesInImplementation } from "../flow/validate.ts";

/** How many failed attempts in a row hand a change to the person. */
export const ATTEMPTS = 3;


/** Where a change stands with the gate: how often finishing failed in a row, and who it waits for. */
export type GateRecord = {
  /** The phase the implement phase started. */
  phase?: string;
  failures: number;
  waitingFor: "the agent" | "the person";
  findings: string[];
};

export type Verdict = { allowed: boolean; findings: string[] };

export type GateOptions = {
  /** The agent finishing is a helper of the one that builds: its passing ends nothing. */
  helper?: boolean;
  /** The findings of the checks of the phase `change` is building; the real checks by default. */
  checks?: (root: string, change: Building) => Promise<string[]>;
  /** Runs one of the command's own checks; the real command by default. */
  run?: Runner;
};

type Runner = (root: string, args: string[]) => { status: number | null; output: string };

const recordPath = (root: string, change: string) => join(root, CHANGES, change, GATE);

export const readGate = (root: string, change: string): GateRecord =>
  existsSync(recordPath(root, change))
    ? (JSON.parse(readFileSync(recordPath(root, change), "utf8")) as GateRecord)
    : { failures: 0, waitingFor: "the agent", findings: [] };

const command = (root: string, ...args: string[]) => self(root, args);

/**
 * The parts of the harness that differ from what was installed or generated, each as a finding that
 * names its part.
 */
export const alteredHarness = (root: string): string[] => {
  const found: string[] = [];
  const fresh = command(root, "generate", "--check");
  if (fresh.status !== 0)
    found.push(
      `generated tests: they differ from what their specs generate; run \`pnpm exec factory generate\` and leave them as it writes them\n${fresh.output}`,
    );
  const installed = readInstalled(root)?.installed;
  for (const schema of installed?.schemas ?? [])
    if (!schemaLinkHolds(root, schema))
      found.push(
        `installed schemas: openspec/schemas/${schema} no longer leads to the schema inside the installed command; run \`pnpm exec factory doctor --fix\``,
      );
  const status = capture("git", ["status", "--porcelain", "--", "factory.config.ts"], { cwd: root });
  if (status.status === 0 && status.stdout.trim())
    found.push(
      "factory configuration: factory.config.ts differs from what is committed; the person edits and commits it, an agent restores it",
    );
  const lock = join(root, "apm.lock.yaml");
  if (existsSync(lock)) {
    const skills = Object.values(PLACES).map((place) => `${place.skills}/`);
    const { dependencies = [] } = (parse(readFileSync(lock, "utf8")) ?? {}) as {
      dependencies?: Array<{ deployed_file_hashes?: Record<string, string> }>;
    };
    const altered = dependencies
      .flatMap((d) => Object.entries(d.deployed_file_hashes ?? {}))
      .filter(([path]) => skills.some((folder) => path.startsWith(folder)))
      .filter(([path, hash]) => {
        const file = join(root, path);
        const now = existsSync(file)
          ? `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`
          : "absent";
        return now !== hash;
      })
      .map(([path]) => path);
    if (altered.length)
      found.push(
        `agent skills: ${altered.slice(0, 5).join(", ")}${altered.length > 5 ? ` and ${altered.length - 5} more` : ""} differ from what was installed; install the package again`,
      );
  }
  if (installed?.guards.length)
    for (const agent of installed.agents) {
      const unwired = unwiredGuards(root, agent);
      if (unwired.length)
        found.push(
          `agent guards: ${PLACES[agent]?.hooks} no longer calls ${unwired.join(" or ")}; install the package again`,
        );
    }
  return found;
};

/**
 * The checks of the phase a change is building, which is the one the implement phase started: the
 * rules of the workstreams its tasks name, with those upstream of them, and the product tests those
 * workstreams are proved by. The workstreams are those of the change's own schema, so a change
 * whose schema has none is checked by nothing here; in a project with products, they run over the
 * change's own product only.
 */
export const phaseChecks = async (
  root: string,
  change: Building,
  run: Runner = (at, args) => self(at, args),
): Promise<string[]> => {
  const started = readGate(root, change.name).phase;
  const phase =
    change.plan.phases.find((p) => p.title === started) ??
    change.plan.phases.find((p) => p.tasks.some((t) => !t.done));
  if (!phase) return [];
  // In a project with products, the change is judged by its own product alone.
  const [config, schema] = [
    (await productOf(root, change.product)).config,
    await loadSchema(change.schema),
  ];
  const product = change.product ? ["--product", change.product] : [];
  const upstream = (id: string, seen = new Set<string>()): Set<string> => {
    for (const d of config.workstreams[id]?.dependsOn ?? [])
      if (!seen.has(d)) upstream(d, seen.add(d));
    return seen;
  };
  const named = [
    ...new Set(phase.tasks.flatMap((t) => (t.workstream ? [t.workstream] : []))),
  ].filter((id) => id in schema.workstreams);
  const covered = new Set(named.flatMap((id) => [...upstream(id)]));
  const found: string[] = [];
  for (const id of named.filter((id) => !covered.has(id))) {
    const r = run(root, ["check", "--workstream", id, ...product]);
    if (r.status !== 0) found.push(`the check of ${id} fails:\n${r.output}`);
  }
  const kinds = new Set(
    [...new Set([...named, ...covered])].flatMap((id) => schema.workstreams[id]?.tests ?? []),
  );
  for (const kind of kinds) {
    const r = run(root, ["test", kind, ...product]);
    if (r.status !== 0) found.push(`the ${kind} tests fail:\n${r.output}`);
  }
  return found;
};

/**
 * Judges an agent's attempt to finish in the project at `root`. With no change in implementation it
 * holds nobody. Otherwise the harness must be as installed and generated and the checks of the phase
 * must pass; a failure sends the agent back, and the third in a row lets it finish with the change
 * recorded as waiting for the person.
 */
export const gate = async (
  root: string,
  { run, checks = (at, change) => phaseChecks(at, change, run), helper = false }: GateOptions = {},
): Promise<Verdict> => {
  const building = await changesInImplementation(root);
  if (!building.length) return { allowed: true, findings: [] };
  const altered = alteredHarness(root);
  const refused: string[] = [];
  const handed: string[] = [];
  for (const change of building) {
    const findings = altered.length ? altered : await checks(root, change);
    const path = recordPath(root, change.name);
    const { phase } = readGate(root, change.name);
    if (!findings.length) {
      // The builder's pass ends the implementation it started; a helper's pass only clears the count.
      if (helper)
        writeFileSync(path, `${JSON.stringify({ phase, failures: 0, waitingFor: "the agent", findings: [] }, null, 2)}\n`);
      else rmSync(path, { force: true });
      continue;
    }
    const failures = readGate(root, change.name).failures + 1;
    const record: GateRecord = {
      phase,
      failures,
      waitingFor: failures >= ATTEMPTS ? "the person" : "the agent",
      findings,
    };
    writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
    if (failures >= ATTEMPTS)
      handed.push(
        `${change.name} failed to finish ${failures} times in a row and now waits for the person: ${join(CHANGES, change.name, GATE)} holds what was found`,
      );
    else
      refused.push(
        `${change.name} is in implementation and cannot be left like this (attempt ${failures} of ${ATTEMPTS}):`,
        ...findings,
      );
  }
  return { allowed: refused.length === 0, findings: refused.length ? refused : handed };
};

/**
 * `factory gate [--helper]`: judges an agent's attempt to finish, read from the hook's input. Exit
 * status 2 with the findings on standard error sends the agent back; 0 lets it finish.
 */
export const run = async (args: string[]): Promise<number> => {
  const cwd = hookInput().cwd ?? process.cwd();
  const verdict = await gate(projectOf(process.env.CLAUDE_PROJECT_DIR || cwd), {
    helper: args.includes("--helper"),
  });
  for (const finding of verdict.findings) console.error(finding);
  return verdict.allowed ? 0 : 2;
};
