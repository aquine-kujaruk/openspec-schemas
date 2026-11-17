import type { Review } from "../../../shared/domain/schemas/line-types.schema.ts";
import { AuditFunnelService } from "../../domain/services/audit-funnel.service.ts";
import { AuditRecordService } from "../../domain/services/audit-record.service.ts";
import { AuditRubricService } from "../../domain/services/audit-rubric.service.ts";
import type { AuditFinding } from "../../domain/value-objects/audit-finding.value-object.ts";
import type { AuditRepositoryInterface } from "../repository-interfaces/audit.repository-interface.ts";

export type AuditInput = { root: string; config: Review; rubrics: string[]; key?: string };
export type AuditReport =
  | { code: 0; findings: AuditFinding[]; lines: string[] }
  | { code: 2 | 3; issue: string };

const byRange = (a: AuditFinding, b: AuditFinding): number =>
  a.file.localeCompare(b.file) ||
  a.from - b.from ||
  a.to - b.to ||
  a.row.localeCompare(b.row);

export class AuditUseCase {
  private readonly repository: AuditRepositoryInterface;
  private readonly funnel = new AuditFunnelService();
  private readonly rubric = new AuditRubricService();
  private readonly records: AuditRecordService;

  constructor(repository: AuditRepositoryInterface) {
    this.repository = repository;
    this.records = new AuditRecordService((content) => repository.hashContent(content));
  }

  async execute({ root, config, rubrics, key }: AuditInput): Promise<AuditReport> {
    if (!key) {
      return {
        code: 2,
        issue: `${config.keyVariable} is not set: factory review needs the decision model's key in the environment or in .env`,
      };
    }
    if (!rubrics.length) {
      return {
        code: 2,
        issue: "the schema this project is checked with has no rubric: there is nothing to review",
      };
    }
    const rows = this.rubric.loadDocuments(
      this.repository.listRubrics(root, rubrics),
      this.repository.listPackageNames(root),
    );
    try {
      const accepted = rows.filter((row) => row.verdict === "accepted");
      const asked = accepted.filter((row) => !row.crossFile);
      const folders = [...new Set(asked.flatMap((row) => row.folders))];
      const all = this.repository.listCoreFiles(root, config.modules, folders);
      const record = this.repository.readPass(root);
      const fingerprint = this.records.rubricHash(asked);
      const files = this.records.touched(all, record, fingerprint);
      const findings = (await this.funnel.inspect({
        ask: (state, questions) => this.repository.askQuestions(state, questions),
        outline: (file) => this.repository.outlineSource(file),
        rows: asked,
        files,
        threshold: config.threshold,
        spanLines: config.spanLines,
        batch: config.batch,
      })).sort(byRange);
      const crossFile = accepted.filter((row) => row.crossFile).map((row) => row.id);
      const rejected = rows.filter((row) => row.verdict === "rejected")
        .map((row) => `${row.id} ${row.reason}`);
      const judged = new Set(files.map((file) => file.path));
      this.repository.savePass(root, this.records.recordPass(
        record, files, this.repository.findCommit(root), fingerprint,
      ));
      return {
        code: 0,
        findings,
        lines: [
          ...findings.map((finding) => finding.format()),
          `${findings.length} warnings; ${judged.size} of ${all.length} core files judged (${
            record.rubric && record.rubric !== fingerprint
              ? "the rubric changed: every file judged again"
              : "touched since the last pass"
          })`,
          ...(crossFile.length ? [`skipped as cross-file (for the human reviewer): ${crossFile.join(", ")}`] : []),
          ...(rejected.length ? [`skipped as not generic: ${rejected.join("; ")}`] : []),
        ],
      };
    } catch (cause) {
      return { code: 3, issue: cause instanceof Error ? cause.message : String(cause) };
    }
  }
}
