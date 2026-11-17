import type { Layout } from "../../repository/domain/generated.ts";
import type {
  E2eResult,
  Evidence,
  ScenarioResult,
} from "../domain/evidence.ts";
import type { Product } from "../../repository/domain/products.ts";
import type { VerifyPorts } from "../domain/verify.ts";

/** Receives the invocation and presents the application's result. */
export const createVerifyCommand =
  ({
    join,
    activeChanges,
    PROJECT_ROOT,
    verify,
  }: VerifyPorts &
    Omit<
      typeof import("../domain/verify.ts"),
      "run"
    >): (typeof import("../domain/verify.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const [name] = args;
    const known = activeChanges(PROJECT_ROOT);
    if (!name || !known.includes(name)) {
      console.error(
        `Name the change to verify. Changes: ${known.join(", ") || "none"}`,
      );
      return 2;
    }
    const procedures: Record<string, "passed" | "failed"> = {};
    const proved = args.flatMap((arg, i) =>
      arg === "--proved" && args[i + 1] ? [args[i + 1]!] : [],
    );
    for (const [i, arg] of args.entries())
      if (arg === "--procedure") {
        const m = /^(.+)=(passed|failed)$/.exec(args[i + 1] ?? "");
        if (!m) {
          console.error(
            "Say how a procedure went as --procedure <slug>@<environment>=<passed|failed>.",
          );
          return 2;
        }
        procedures[m[1]!] = m[2] as "passed" | "failed";
      }
    const e = await verify(PROJECT_ROOT, name, { procedures, proved });
    console.log(`${e.verdict}: ${name}`);
    const passed = e.scenarios.filter((s) => s.result === "passed").length;
    console.log(
      `- scenarios: ${passed} of ${e.scenarios.length} matched to a passing test`,
    );
    for (const s of e.scenarios.filter((s) => s.by))
      console.log(`  by the person's word: ${s.spec}`);
    for (const s of e.scenarios.filter((s) => s.result !== "passed"))
      console.log(
        `  ${s.result}: ${s.spec} · ${s.scenario || "no generated test ran"}`,
      );
    console.log(
      `- checks: ${e.failing.length ? `failing in ${e.failing.map((f) => f.workstream).join(", ")}` : "every check passes"}`,
    );
    console.log(
      `- review: ${e.review.state === "run" ? `run, ${e.review.warnings.length} warning(s)` : `skipped (${e.review.note})`}`,
    );
    if (e.e2e?.length)
      console.log(
        `- end-to-end: ${e.e2e.filter((t) => t.result === "passed").length} of ${e.e2e.length} passing`,
      );
    for (const p of e.procedures)
      console.log(
        `- procedure ${p.slug} in ${p.env}: ${p.treatment}${p.outcome ? `, ${p.outcome}` : ""}`,
      );
    console.log(`- evidence: openspec/changes/${name}/evidence.md`);
    return e.verdict === "verified" ? 0 : 1;
  };
