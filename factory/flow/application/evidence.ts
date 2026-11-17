import type {
  ScenarioResult,
  E2eResult,
  Evidence,
} from "../domain/evidence.ts";
import type { EvidencePorts } from "../domain/evidence.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createEvidence = ({
  createHash,
  existsSync,
  globSync,
  readFileSync,
  writeFileSync,
  join,
  parse,
  stringify,
  CHANGES,
  readChange,
  productRoots,
  productOf,
}: EvidencePorts): typeof import("../domain/evidence.ts") => {
  const EVIDENCE = "evidence.md";

  /** One end-to-end test of a web product, as verify ran it. */

  /** What verifying a change found, and the state of the project it was found in. */

  /** A digest of the change's plan and delta specs and of every file under the roots of its product. */
  const digestOf = async (root: string, change: string): Promise<string> => {
    const product = await productOf(root, readChange(root, change)?.product);
    // A declared product is its whole folder; the product of a project that declares none, its roots.
    const roots = product.name ? [product.root] : productRoots(product.config);
    const files = [
      join(CHANGES, change, "plan.md"),
      ...globSync("specs/**/*.md", { cwd: join(root, CHANGES, change) }).map(
        (f) => join(CHANGES, change, f),
      ),
      ...roots.flatMap((dir) =>
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
      hash.update(
        `${file}\n${file.endsWith("plan.md") ? content.replace(/\[[xX ]\]/g, "[]") : content}\n`,
      );
    }
    return hash.digest("hex");
  };

  const table = (head: string[], rows: string[][]): string =>
    rows.length
      ? [head, head.map(() => "---"), ...rows]
          .map((r) => `| ${r.join(" | ")} |`)
          .join("\n")
      : "None.";

  const writeEvidence = (root: string, evidence: Evidence): void => {
    const {
      change,
      verdict,
      digest,
      scenarios,
      failing,
      review,
      procedures,
      e2e = [],
    } = evidence;
    const body = [
      `# Evidence of ${change}`,
      `## Scenarios\n\n${table(
        ["Use case", "Requirement", "Scenario", "Result"],
        scenarios.map((s) => [
          s.spec,
          s.requirement,
          s.scenario.replaceAll("|", "\\|"),
          s.by ? `${s.result}, by the person's word` : s.result,
        ]),
      )}`,
      ...(e2e.length
        ? [
            `## End-to-end tests\n\n${table(
              ["Test", "Result"],
              e2e.map((t) => [t.test.replaceAll("|", "\\|"), t.result]),
            )}`,
          ]
        : []),
      `## Checks\n\n${
        failing.length
          ? failing
              .map(
                (f) =>
                  `### ${f.workstream} fails\n\n\`\`\`\n${f.output}\n\`\`\``,
              )
              .join("\n\n")
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
  const readEvidence = (
    root: string,
    change: string,
  ): Pick<Evidence, "verdict" | "digest"> | undefined => {
    const path = join(root, CHANGES, change, EVIDENCE);
    if (!existsSync(path)) return undefined;
    const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(path, "utf8"))?.[1];
    return front
      ? (parse(front) as Pick<Evidence, "verdict" | "digest">)
      : undefined;
  };
  return { EVIDENCE, digestOf, writeEvidence, readEvidence };
};
