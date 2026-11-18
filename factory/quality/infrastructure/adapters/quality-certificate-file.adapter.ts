import { createHash } from "node:crypto";
import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { InspectionAuditState, type InspectionCertificateRecord } from "../acl/final-inspection.acl.ts";
import type { QualityCertificateFileAcl } from "../acl/quality-certificate-file.acl.ts";

const table = (head: string[], rows: string[][]): string =>
  rows.length
    ? [head, head.map(() => "---"), ...rows].map((row) => `| ${row.join(" | ")} |`).join("\n")
    : "None.";

export class QualityCertificateFileAdapter implements QualityCertificateFileAcl {
  private readonly root: string;
  private readonly orders: string;
  private readonly productRoots: (name: string) => Promise<string[]>;

  constructor(root: string, orders: string, productRoots: (name: string) => Promise<string[]>) {
    this.root = root;
    this.orders = orders;
    this.productRoots = productRoots;
  }

  async digestOf(name: string): Promise<string> {
    const { root, orders } = this;
    const files = [
      join(orders, name, "plan.md"),
      ...globSync("specs/**/*.md", { cwd: join(root, orders, name) }).map((file) => join(orders, name, file)),
      ...(await this.productRoots(name)).flatMap((dir) =>
        existsSync(join(root, dir))
          ? globSync("**/*", { cwd: join(root, dir), withFileTypes: true })
              .filter((file) => file.isFile())
              .map((file) => join(file.parentPath, file.name).slice(root.length + 1))
          : [],
      ),
    ].sort();
    const digest = createHash("sha256");
    for (const file of files) {
      const contents = readFileSync(join(root, file), "utf8");
      digest.update(`${file}\n${file.endsWith("plan.md") ? contents.replace(/\[[xX ]\]/g, "[]") : contents}\n`);
    }
    return digest.digest("hex");
  }

  private path(name: string): string {
    return join(this.root, this.orders, name, "evidence.md");
  }

  readEvidence(name: string): Pick<InspectionCertificateRecord, "verdict" | "digest"> | undefined {
    const path = this.path(name);
    if (!existsSync(path)) return undefined;
    const metadata = /^---\n([\s\S]*?)\n---/.exec(readFileSync(path, "utf8"))?.[1];
    return metadata ? parse(metadata) as Pick<InspectionCertificateRecord, "verdict" | "digest"> : undefined;
  }

  writeEvidence(record: InspectionCertificateRecord): void {
    const { change, verdict, digest, scenarios, failing, review, procedures, e2e = [] } = record;
    const body = [
      `# Evidence of ${change}`,
      `## Scenarios\n\n${table(
        ["Use case", "Requirement", "Scenario", "Result"],
        scenarios.map((scenario) => [
          scenario.spec,
          scenario.requirement,
          scenario.scenario.replaceAll("|", "\\|"),
          scenario.by ? `${scenario.result}, by the person's word` : scenario.result,
        ]),
      )}`,
      ...(e2e.length ? [
        `## End-to-end tests\n\n${table(
          ["Test", "Result"],
          e2e.map((test) => [test.test.replaceAll("|", "\\|"), test.result]),
        )}`,
      ] : []),
      `## Checks\n\n${failing.length ? failing.map(({ workstream, output }) =>
        `### ${workstream} fails\n\n\`\`\`\n${output}\n\`\`\``,
      ).join("\n\n") : "Every check passes."}`,
      `## Review\n\n${review.state === InspectionAuditState.Run
        ? `Run: ${review.warnings.length} warning(s).${review.warnings.map((warning) => `\n- ${warning}`).join("")}`
        : `${review.state === InspectionAuditState.Incomplete ? "Incomplete" : "Skipped"}: ${review.note ?? "the project configures no key"}.`}`,
      `## Procedures\n\n${table(
        ["Procedure", "Environment", "Treatment", "Outcome"],
        procedures.map(({ slug, env, treatment, outcome }) => [slug, env, treatment, outcome ?? ""]),
      )}`,
    ].join("\n\n");
    writeFileSync(this.path(change), `---\n${stringify({ change, verdict, digest })}---\n\n${body}\n`);
  }
}
