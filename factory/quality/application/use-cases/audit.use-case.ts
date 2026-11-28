import type { Review } from "../../../shared/domain/schemas/line-types.schema.ts";
import { AuditFunnelService } from "../../domain/services/audit-funnel.service.ts";
import { AuditRecordService } from "../../domain/services/audit-record.service.ts";
import { AuditRubricService } from "../../domain/services/audit-rubric.service.ts";
import type { AuditFindingValueObject } from "../../domain/value-objects/audit-finding.value-object.ts";
import type { AuditRepositoryInterface } from "../repository-interfaces/audit.repository-interface.ts";

export type AuditInput = { root: string; modules: string; config: Review; rubrics: string[]; key?: string };

export type AuditReport =
  | { code: 0; findings: AuditFindingValueObject[]; lines: string[] }
  | { code: 2 | 3; issue: string }
  | { code: 4; incomplete: string[]; findings: AuditFindingValueObject[]; lines: string[] };

const byRange = (a: AuditFindingValueObject, b: AuditFindingValueObject): number =>
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

  async execute({ root, modules, config, rubrics, key }: AuditInput): Promise<AuditReport> {
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

    const incomplete: string[] = [];

    const reportIncomplete = (findings: AuditFindingValueObject[] = [], coverage?: string): AuditReport => ({
      code: 4, incomplete, findings,
      lines: [
        ...findings.map(finding => finding.format()),
        ...(coverage ? [coverage] : []),
        ...incomplete.map(reason => `incomplete: ${reason}`),
      ],
    });

    try {
      const rows = this.rubric.loadDocuments(
        this.repository.listRubrics(root, rubrics),
        this.repository.listPackageNames(root),
      );

      const accepted = rows.filter((row) => row.verdict === "accepted");
      const asked = accepted.filter((row) => !row.crossFile);
      const folders = [...new Set(asked.flatMap((row) => row.folders))];
      const all = this.repository.listCoreFiles(root, modules, folders);

      for (const row of rows.filter((row) => row.verdict === "rejected"))
        incomplete.push(`a row was rejected: ${row.id} ${row.reason}`);

      if (!all.length && this.repository.listCoreFiles(root, modules, ["domain", "application", "infrastructure", "framework"]).length)
        incomplete.push("no core file selected");

      if (incomplete.length) return reportIncomplete();
      const record = this.repository.readPass(root);
      const fingerprint = this.records.rubricHash(asked);
      const files = this.records.touched(all, record, fingerprint);

      const findings = (await this.funnel.inspect({
        ask: async (state, questions, locations) => {
          try {
            const answers = await this.repository.askQuestions(state, questions);

            for (const [index, question] of questions.entries()) {
              if (!answers.has(question.name))
                incomplete.push(`the model failed: missing answer for ${question.name} at ${locations[index]}`);
            }

            return answers;
          } catch (error) {
            incomplete.push(`the model failed: ${error instanceof Error ? error.message : String(error)}`);

            throw error;
          }
        },
        outline: (file) => this.repository.outlineSource(file),
        rows: asked,
        files,
        threshold: config.threshold,
        spanLines: config.spanLines,
        batch: config.batch,
      })).sort(byRange);

      const crossFile = accepted.filter((row) => row.crossFile).map((row) => row.id);
      const judged = new Set(files.map((file) => file.path));
      const selected = new Set(all.map((file) => file.path));

      if (incomplete.length) return reportIncomplete(findings,
        `${findings.length} partial warnings; ${judged.size} of ${selected.size} distinct core files submitted`);

      this.repository.savePass(root, this.records.recordPass(
        record, files, this.repository.findCommit(root), fingerprint,
      ));

      return {
        code: 0,
        findings,
        lines: [
          ...findings.map((finding) => finding.format()),
          `${findings.length} warnings; ${judged.size} of ${selected.size} core files judged (${
            record.rubric && record.rubric !== fingerprint
              ? "the rubric changed: every file judged again"
              : "touched since the last pass"
          })`,
          ...(crossFile.length ? [`skipped as cross-file (for the human reviewer): ${crossFile.join(", ")}`] : []),
        ],
      };
    } catch (cause) {
      if (incomplete.length) return reportIncomplete();

      return { code: 3, issue: cause instanceof Error ? cause.message : String(cause) };
    }
  }
}
