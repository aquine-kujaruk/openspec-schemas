import type { Started } from "../domain/implement.ts";
import type { ImplementPorts } from "../domain/implement.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createImplement = ({
  writeFileSync,
  join,
  activeChanges,
  CHANGES,
  GATE,
  readChange,
  PROJECT_ROOT,
  self,
  parsePlan,
  loadSchema,
  NotValidatable,
  validateChange,
}: ImplementPorts): Omit<typeof import("../domain/implement.ts"), "run"> => {
  /**
   * Starts the implementation of the change `name`: only when validation reports it ready, on the
   * first phase of its plan that has an unchecked task. The roots are prepared and the tests
   * generated from its delta specs; from then on the change is in implementation.
   */
  const start = async (root: string, name: string): Promise<Started> => {
    const verdict = await validateChange(root, name);
    if (!verdict.ready)
      return {
        state: "not ready",
        findings: verdict.findings.map((f) => `[${f.rule}] ${f.message}`),
      };
    const change = readChange(root, name)!;
    const phase = parsePlan(change.plan!).phases.find((p) =>
      p.tasks.some((t) => !t.done),
    );
    if (!phase) return { state: "nothing to build" };
    // The product's roots are laid only for a schema that builds product code, and with products only
    // those of the change's own product. The tests are generated for every product, so the harness
    // the gate checks stays whole.
    const builds =
      (await loadSchema(verdict.schema)).definition.workstreams.length > 0;
    const over = change.product ? ["--product", change.product] : [];
    const steps = builds
      ? [["prepare", ...over], ["generate"]]
      : [["generate"]];
    for (const step of steps) {
      const r = self(root, step);
      if (r.status !== 0)
        return { state: "cannot start", findings: [r.output] };
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
  return { start };
};
