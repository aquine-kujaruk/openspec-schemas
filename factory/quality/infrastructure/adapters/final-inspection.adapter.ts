import { randomUUID } from "node:crypto";
import { AstBuilder, compile, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { cacheDir, capture, runTool, self } from "../../../shared/infrastructure/adapters/paths.adapter.ts";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import { FileGaugeReportSchema } from "../acl/final-inspection.acl.ts";
import type {
  EndToEndRecord, FileGaugeRecord, FinalInspectionAcl, FinalInspectionRecord,
  InspectionCertificateRecord, InspectionFinding,
} from "../acl/final-inspection.acl.ts";
import type { QualityCertificateFileAcl } from "../acl/quality-certificate-file.acl.ts";

export function scenariosOfDelta(file: string) {
  const feature = runTool("opsx-gherkin", [file], { bin: "opsx-to-feature" });
  if (feature.status !== 0) throw new QualityException(`Invalid scenario specification ${file}: ${feature.stderr.trim()}`, { cause: feature });
  const document = new Parser(new AstBuilder(randomUUID), new GherkinClassicTokenMatcher()).parse(feature.stdout);
  const requirements = new Map<string, string>();
  for (const { rule } of document.feature?.children ?? []) {
    if (!rule || rule.tags.some(tag => ["@openspec-removed", "@openspec-renamed"].includes(tag.name))) continue;
    for (const { scenario } of rule.children)
      if (scenario) requirements.set(scenario.id, rule.name);
  }
  return compile(document, file, randomUUID).flatMap(scenario => {
    const requirement = requirements.get(scenario.astNodeIds[0]!);
    return requirement ? [{ requirement, scenario: scenario.name }] : [];
  });
}

export type InspectionResources = {
  snapshot: FinalInspectionRecord;
  line?: string;
  auditEnvironment: NodeJS.ProcessEnv;
  findWorkstream(file: string): string | undefined;
  feedback(name: string, finding: InspectionFinding): void;
};

export class FinalInspectionAdapter implements FinalInspectionAcl {
  private readonly root: string;
  private readonly resources: InspectionResources;
  private readonly certificates: QualityCertificateFileAcl;

  constructor(root: string, resources: InspectionResources, certificates: QualityCertificateFileAcl) {
    this.root = root;
    this.resources = resources;
    this.certificates = certificates;
  }

  load(): Promise<FinalInspectionRecord> {
    return Promise.resolve(this.resources.snapshot);
  }

  private get selection(): string[] {
    return this.resources.line ? ["--product", this.resources.line] : [];
  }

  async gauges(files: string[]): Promise<FileGaugeRecord[]> {
    const report = join(cacheDir(this.root), "evidence.json");
    rmSync(report, { force: true });
    if (this.resources.snapshot.repository)
      capture("pnpm", ["exec", "vitest", "run", ...files, "--reporter=json", `--outputFile=${report}`], { cwd: this.root });
    else
      await this.run(["test", "acceptance", "--report", report]);
    if (!existsSync(report)) return [];
    try {
      const raw: unknown = JSON.parse(readFileSync(report, "utf8"));
      return FileGaugeReportSchema.parse(raw).testResults;
    } catch (cause) {
      throw new QualityException(`Invalid Vitest assertion report in ${report}`, { cause });
    }
  }

  async run(args: string[]) {
    return self(this.root, [...args, ...this.selection]);
  }

  async endToEnd(): Promise<EndToEndRecord[]> {
    const report = join(cacheDir(this.root), "e2e.json");
    rmSync(report, { force: true });
    const result = await this.run(["test", "e2e", "--report", report]);
    if (result.status !== 0 && result.status !== 1)
      return [{ test: "the end-to-end run", result: "failed", output: result.output }];
    return existsSync(report)
      ? (JSON.parse(readFileSync(report, "utf8")) as { tests: EndToEndRecord[] }).tests
      : [];
  }

  async findWorkstream(file: string): Promise<string | undefined> {
    return this.resources.findWorkstream(file);
  }

  async audit(): Promise<string[]> {
    const result = self(this.root, ["review", ...this.selection], this.resources.auditEnvironment);
    if (result.status !== 0)
      throw new QualityException(result.output, { cause: result });
    return result.output.split("\n").filter((line) => /^S\d{2} p=/.test(line));
  }

  digest(name: string): Promise<string> {
    return this.certificates.digestOf(name);
  }

  async save(record: InspectionCertificateRecord): Promise<void> {
    this.certificates.writeEvidence(record);
  }

  async feedback(name: string, finding: InspectionFinding): Promise<void> {
    this.resources.feedback(name, finding);
  }
}
