import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { activeChanges, CHANGES, GATE, readChange } from "./change.ts";
import { PROJECT_ROOT, self } from "../core/paths.ts";
import { parsePlan } from "./plan.ts";
import { loadSchema } from "../repository/schema.ts";
import { NotValidatable, validateChange } from "./validate.ts";

export type Started =
  | { state: "started"; phase: string; tasks: string[] }
  | { state: "not ready" | "cannot start"; findings: string[] }
  | { state: "nothing to build" };

/**
 * Starts the implementation of the change `name`: only when validation reports it ready, on the
 * first phase of its plan that has an unchecked task. The roots are prepared and the tests
 * generated from its delta specs; from then on the change is in implementation.
 */
export const start = async (root: string, name: string): Promise<Started> => {
  const verdict = await validateChange(root, name);
  if (!verdict.ready)
    return { state: "not ready", findings: verdict.findings.map((f) => `[${f.rule}] ${f.message}`) };
  const phase = parsePlan(readChange(root, name)!.plan!).phases.find((p) =>
    p.tasks.some((t) => !t.done),
  );
  if (!phase) return { state: "nothing to build" };
  // The product's roots are laid only for a schema that builds product code.
  const builds = (await loadSchema(verdict.schema)).definition.workstreams.length > 0;
  for (const step of builds ? ["prepare", "generate"] : ["generate"]) {
    const r = self(root, [step]);
    if (r.status !== 0) return { state: "cannot start", findings: [r.output] };
  }
  writeFileSync(
    join(root, CHANGES, name, GATE),
    `${JSON.stringify({ phase: phase.title, failures: 0, waitingFor: "the agent", findings: [] }, null, 2)}\n`,
  );
  return {
    state: "started",
    phase: phase.title,
    tasks: phase.tasks.filter((t) => !t.done).map((t) => t.text),
  };
};

/**
 * `factory implement <change>`: starts building the next phase of a ready change. Exit status 0
 * when it is started or has nothing left to build, 1 when it cannot be started, 2 when the change
 * cannot be judged.
 */
export const run = async (args: string[]): Promise<number> => {
  const [name] = args;
  const known = activeChanges(PROJECT_ROOT);
  if (!name || !known.includes(name)) {
    console.error(`Name the change to implement. Changes: ${known.join(", ") || "none"}`);
    return 2;
  }
  try {
    const started = await start(PROJECT_ROOT, name);
    if (started.state === "started") {
      console.log(`in implementation: ${name} — ${started.phase}`);
      for (const task of started.tasks) console.log(`- [ ] ${task}`);
      return 0;
    }
    if (started.state === "nothing to build") {
      console.log(`every task of ${name} is done: the verify phase is next`);
      return 0;
    }
    console.log(`${started.state}: ${name}`);
    for (const finding of started.findings) console.log(`- ${finding}`);
    return 1;
  } catch (e) {
    if (!(e instanceof NotValidatable)) throw e;
    console.error(e.message);
    return 2;
  }
};
