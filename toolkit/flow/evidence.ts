import { createHash } from "node:crypto";
import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { CHANGES } from "./change.ts";
import { productRoots } from "../package/guard.ts";
import { projectConfig } from "../repository/schema.ts";

export const EVIDENCE = "evidence.md";

export type ScenarioResult = {
  /** The use case, as `<module>/<use-case>`. */
  spec: string;
  requirement: string;
  scenario: string;
  result: "passed" | "failed" | "missing";
};

/** What verifying a change found, and the state of the project it was found in. */
export type Evidence = {
  change: string;
  verdict: "verified" | "not verified";
  /** What the change and the product were when it was verified: evidence of any other state proves nothing. */
  digest: string;
  scenarios: ScenarioResult[];
  /** The workstreams whose check or tests fail, with what they printed. */
  failing: Array<{ workstream: string; output: string }>;
  review: { state: "run" | "skipped"; warnings: string[]; note?: string };
  procedures: Array<{
    slug: string;
    env: string;
    treatment: "executed" | "reviewed only" | "not executed";
    outcome?: "passed" | "failed";
  }>;
};

/** A digest of the change's plan and delta specs and of every file under the product roots. */
export const digestOf = async (root: string, change: string): Promise<string> => {
  const config = await projectConfig(root);
  const files = [
    join(CHANGES, change, "plan.md"),
    ...globSync("specs/**/*.md", { cwd: join(root, CHANGES, change) }).map((f) =>
      join(CHANGES, change, f),
    ),
    ...productRoots(config).flatMap((dir) =>
      existsSync(join(root, dir))
        ? globSync("**/*", { cwd: join(root, dir), withFileTypes: true })
            .filter((f) => f.isFile())
            .map((f) => join(f.parentPath, f.name).slice(root.length + 1))
        : [],
    ),
  ].sort();
  const hash = createHash("sha256");
  for (const file of files) {
    // Ticking a task is not a change to what was verified.
    const content = readFileSync(join(root, file), "utf8");
    hash.update(`${file}\n${file.endsWith("plan.md") ? content.replace(/\[[xX ]\]/g, "[]") : content}\n`);
  }
  return hash.digest("hex");
};

const table = (head: string[], rows: string[][]): string =>
  rows.length
    ? [head, head.map(() => "---"), ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n")
    : "None.";

export const writeEvidence = (root: string, evidence: Evidence): void => {
  const { change, verdict, digest, scenarios, failing, review, procedures } = evidence;
  const body = [
    `# Evidence of ${change}`,
    `## Scenarios\n\n${table(
      ["Use case", "Requirement", "Scenario", "Result"],
      scenarios.map((s) => [s.spec, s.requirement, s.scenario.replaceAll("|", "\\|"), s.result]),
    )}`,
    `## Checks\n\n${
      failing.length
        ? failing.map((f) => `### ${f.workstream} fails\n\n\`\`\`\n${f.output}\n\`\`\``).join("\n\n")
        : "Every check passes."
    }`,
    `## Review\n\n${
      review.state === "run"
        ? `Run: ${review.warnings.length} warning(s).${review.warnings.map((w) => `\n- ${w}`).join("")}`
        : `Skipped: ${review.note ?? "the project configures no key"}.`
    }`,
    `## Procedures\n\n${table(
      ["Procedure", "Environment", "Treatment", "Outcome"],
      procedures.map((p) => [p.slug, p.env, p.treatment, p.outcome ?? ""]),
    )}`,
  ].join("\n\n");
  writeFileSync(
    join(root, CHANGES, change, EVIDENCE),
    `---\n${stringify({ change, verdict, digest })}---\n\n${body}\n`,
  );
};

/** What the evidence of `change` says, when it has one. */
export const readEvidence = (
  root: string,
  change: string,
): Pick<Evidence, "verdict" | "digest"> | undefined => {
  const path = join(root, CHANGES, change, EVIDENCE);
  if (!existsSync(path)) return undefined;
  const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(path, "utf8"))?.[1];
  return front ? (parse(front) as Pick<Evidence, "verdict" | "digest">) : undefined;
};
