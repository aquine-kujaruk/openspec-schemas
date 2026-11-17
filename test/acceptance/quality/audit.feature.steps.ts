// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { AuditUseCase, type AuditReport } from "../../../factory/quality/application/use-cases/audit.use-case.ts";
import type { LoadedAuditRow } from "../../../factory/quality/domain/schemas/audit-material.schema.ts";
import { DEFAULTS } from "../../../factory/quality/domain/schemas/audit-settings.schema.ts";
import { AuditRecordService } from "../../../factory/quality/domain/services/audit-record.service.ts";
import { AuditRubricService } from "../../../factory/quality/domain/services/audit-rubric.service.ts";
import { InMemoryAuditRepository } from "./repositories/in-memory-audit.repository.ts";

const WARNING = /^S\d{2} p=\d\.\d{2} \S+:\d+-\d+ — /;

type RubricRow = { id: string; rule: string; question: string; layers: string };
const rubricMarkdown = (rows: RubricRow[]): string =>
  [
    "# Fixture",
    "",
    "### Reviewer rubric (not lintable)",
    "",
    "Product vocabulary (start of a word): `payment`, `cart`.",
    "",
    "| ID | Rule | Question | Layers |",
    "| --- | --- | --- | --- |",
    ...rows.map((r) => `| ${r.id} | ${r.rule} | ${r.question} | ${r.layers} |`),
    "",
  ].join("\n");

const S09: RubricRow = {
  id: "S09",
  rule: "A domain name says what happens in the business, never which technology does it",
  question: "Does this file name a technology, library or provider?",
  layers: "domain",
};
const S11: RubricRow = {
  id: "S11",
  rule: "An aggregate exists only by need",
  question: "Does an aggregate exist by obligation?",
  layers: "across files",
};

const CLASS = `export class Order {
  constructor(private readonly props: { id: string; total: number }) {
    this.props = props;
  }

  total(): number {
    const base = this.props.total;
    return base;
  }

  isEmpty(): boolean {
    return this.props.total === 0;
  }
}
`;

const entity = (i: number) =>
  `src/module${i}/domain/entities/order${i}.entity.ts`;

export function createSteps() {
  const repository = new InMemoryAuditRepository();
  const rubric = new AuditRubricService();
  const records = new AuditRecordService((content) => repository.hashContent(content));
  const audit = new AuditUseCase(repository);
  const files: Record<string, string> = {};
  let credential: string | undefined = "sk-test";
  let rows: LoadedAuditRow[] = [];
  let config = { ...DEFAULTS };
  let report: AuditReport | undefined;
  const output: string[] = [];
  const file = entity(0);
  let rubrics = ["RUBRIC.md"];

  const seed = (activeRows: RubricRow[], sourceFiles: Record<string, string>) => {
    repository.seed({ files: sourceFiles, rubric: { path: "RUBRIC.md", markdown: rubricMarkdown(activeRows) } });
  };

  const runMain = async () => {
    report = await audit.execute({ root: "", key: credential, config, rubrics });
    if (report.code === 0) output.push(...report.lines);
    else output.push(report.issue);
  };

  const writeRubric = (path: string, ids: string) => {
    const rows = ids.split(", ").map((id) => ({
      id,
      rule: `Rule ${id} holds`,
      question: `Does this file break rule ${id}?`,
      layers: "domain",
    }));
    repository.seed({ rubric: { path, markdown: rubricMarkdown(rows) } });
  };
  return {
    // Context
    async touchedFilesRaise(warnings: string): Promise<void> {
      for (let i = 0; i < Number(warnings); i++)
        files[entity(i)] = CLASS.replace(
          "return base;",
          "return base; // SMELL",
        );
      files[entity(9)] = CLASS;
      seed([S09, S11], files);
    },
    async keyVariableState(key: string): Promise<void> {
      credential = key === "present" ? "sk-test" : undefined;
      files[entity(0)] = CLASS.replace("return base;", "return base; // SMELL");
      seed([S09, S11], files);
    },
    async lastRecordedPass(previous: string): Promise<void> {
      for (let i = 0; i < 4; i++) files[entity(i)] = CLASS;
      seed([S09, S11], files);
      if (previous.startsWith("recorded")) {
        const judged = Object.entries(files).map(([path, content]) => ({
          path,
          content,
        }));
        // The rubric the command will ask is the fixture's; "another rubric" is any other hash.
        const fingerprint =
          previous === "recorded under another rubric"
            ? "0000000000000000"
            : records.rubricHash(
                rubric.loadRubric(rubricMarkdown([S09, S11]), []).filter(
                  (r) => !r.crossFile,
                ),
              );
        repository.seed({ pass: records.recordPass({ files: {} }, judged, "abc123", fingerprint) });
      }
    },
    async filesTouchedSince(touched: string): Promise<void> {
      for (let i = 0; i < Number(touched); i++)
        repository.seed({ files: { [entity(i)]: `${CLASS}// touched\n` } });
    },
    async unitCarriesFinding(unit: string): Promise<void> {
      const content = {
        "one method": CLASS.replace("return base;", "return base; // SMELL"),
        "two methods": CLASS.replace(
          "return base;",
          "return base; // SMELL",
        ).replace("=== 0;", "=== 0; // SMELL"),
        "the whole class header": CLASS.replace(
          "class Order {",
          "class Order { // SMELL",
        ),
      }[unit];
      expect(content).toBeDefined();
      seed([S09, S11], { [file]: content! });
      config = { ...config, spanLines: 4 };
    },
    async certaintyThreshold(threshold: string): Promise<void> {
      config = { ...config, threshold: Number(threshold) };
    },
    async modelAnswers(probability: string, row: string): Promise<void> {
      const own = { ...S09, id: row };
      seed([own], { [file]: CLASS });
      // The whole class fits one span: a constant answer yields one warning, not one per member.
      config = { ...config, spanLines: DEFAULTS.spanLines };
      repository.seed({ judge: (question) => question.name.startsWith(`${row}_`) ? Number(probability) : 0 });
    },
    async rowWorded(row: string, wording: string): Promise<void> {
      rows = rubric.loadRubric(
        rubricMarkdown([{ ...S09, id: row, question: `${wording}?` }]),
        [],
      );
    },
    async coreRubricRows(coreRows: string): Promise<void> {
      files[entity(0)] = CLASS;
      seed([], files);
      writeRubric("core/RUBRIC.md", coreRows);
      rubrics = ["core/RUBRIC.md"];
    },
    async schemaAddsRows(schema: string, schemaRows: string): Promise<void> {
      if (schemaRows === "none") return;
      writeRubric(`${schema}/RUBRIC.md`, schemaRows);
      rubrics = [...rubrics, `${schema}/RUBRIC.md`];
    },

    // Action
    async reviewRuns(): Promise<void> {
      await runMain();
    },
    async reviewNarrows(): Promise<void> {
      await runMain();
    },
    async reviewReports(): Promise<void> {
      await runMain();
    },
    async rubricLoaded(): Promise<void> {
      expect(rows).toHaveLength(1);
    },
    async reviewRunsOverProductOf(schema: string): Promise<void> {
      // A product of the schema is asked its core's rubric and its own, never another schema's.
      rubrics = rubrics.filter(
        (r) => r === "core/RUBRIC.md" || r === `${schema}/RUBRIC.md`,
      );
      await runMain();
    },

    // Outcome
    async exitStatus(status: string): Promise<void> {
      expect(report?.code, output.join("\n")).toBe(Number(status));
    },
    async warningsListed(warnings: string): Promise<void> {
      expect(
        output.filter((l) => WARNING.test(l)),
        output.join("\n"),
      ).toHaveLength(Number(warnings));
    },
    async reviewOutcome(outcome: string): Promise<void> {
      const calls = repository.calls.length;
      if (outcome === "the model is called and warnings print") {
        expect(report?.code).toBe(0);
        expect(calls).toBeGreaterThan(0);
        expect(
          output.some((l) => WARNING.test(l)),
          output.join("\n"),
        ).toBe(true);
      } else if (outcome === "the variable's name prints and status is 2") {
        expect(report?.code).toBe(2);
        expect(calls).toBe(0);
        expect(output.join("\n")).toContain(
          config.keyVariable,
        );
      } else expect.fail(`unknown outcome: ${outcome}`);
    },
    async filesJudged(judged: string): Promise<void> {
      expect(report?.code, output.join("\n")).toBe(0);
      const asked = [...new Set(repository.calls.flatMap((questions) => questions.flatMap(
        (question) => /^Consider only the file (\S+)\./.exec(question.instructions)?.[1] ?? [],
      )))];
      expect(asked).toHaveLength(
        judged === "all" ? Object.keys(files).length : Number(judged),
      );
    },
    async rangesReported(ranges: string): Promise<void> {
      expect(
        report?.code === 0 && report.findings.filter((finding) => finding.file === file),
        output.join("\n"),
      ).toHaveLength(Number(ranges));
    },
    async warningPrinted(printed: string): Promise<void> {
      const warnings = output.filter((l) => WARNING.test(l));
      if (printed === "nothing") expect(warnings).toEqual([]);
      else {
        const m =
          /^(S\d{2}) p=(\d\.\d{2}) at the file and lines of the span$/.exec(
            printed,
          );
        expect(m, printed).not.toBeNull();
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(
          new RegExp(`^${m![1]} p=${m![2]} ${file}:\\d+-\\d+ — `),
        );
      }
    },
    async rowVerdict(verdict: string): Promise<void> {
      expect(rows[0].verdict, rows[0].reason).toBe(verdict);
    },
    async rowsAsked(asked: string): Promise<void> {
      expect(report?.code, output.join("\n")).toBe(0);
      const ids = repository.calls.flatMap((questions) => questions.map((question) => question.name.split("_")[0]!));
      expect([...new Set(ids)].join(", ")).toBe(asked);
    },
  };
}
