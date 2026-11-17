import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect } from "vitest";
import { project as architectureproject } from "../architecture.ts";
const { architecture } = architectureproject;
import { reviewCli as architecturereviewCli } from "../architecture.ts";
const { main } = architecturereviewCli;
import type { DecisionClient } from "./domain/review-client.ts";
import { reviewRecord as architecturereviewRecord } from "../architecture.ts";
const { emptyRecord, recordPass, rubricHash, writeRecord } =
  architecturereviewRecord;
import type { ReviewResult } from "./domain/review-review.ts";
import { reviewReview as architecturereviewReview } from "../architecture.ts";
const { DEFAULTS, review } = architecturereviewReview;
import type { LoadedRow } from "./domain/review-rubric.ts";
import { reviewRubric as architecturereviewRubric } from "../architecture.ts";
const { loadRubric, packagesOf } = architecturereviewRubric;
import {
  constantClient,
  filesAsked,
  markerClient,
} from "./domain/review-fake-client.ts";

/**
 * The review scenarios run the command in a temp repository with a rubric of their own and a
 * client that judges without a model: yes wherever the excerpt holds `SMELL`, or a constant
 * probability. Nothing here calls the real model.
 */
const WARNING = /^S\d{2} p=\d\.\d{2} \S+:\d+-\d+ — /;
const PACKAGES = packagesOf(readFileSync("package.json", "utf8"));

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

/** A temp repository: the rubric, a package.json and the given core files. */
const repo = (rows: RubricRow[], files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), "factory-review-"));
  writeFileSync(join(root, "RUBRIC.md"), rubricMarkdown(rows));
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "fixture", dependencies: {} }),
  );
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
};

const entity = (i: number) =>
  `src/module${i}/domain/entities/order${i}.entity.ts`;

export function createSteps() {
  let root = "";
  let files: Record<string, string> = {};
  let env: Record<string, string | undefined> = { OPENAI_API_KEY: "sk-test" };
  let client = markerClient();
  let rows: LoadedRow[] = [];
  let config = { ...DEFAULTS, spanLines: 4 };
  let exit = -1;
  const output: string[] = [];
  let result: ReviewResult | undefined;
  let file = entity(0);

  let rubrics = ["RUBRIC.md"];
  const runMain = async () => {
    exit = await main({
      root,
      rubric: rubrics.map((r) => join(root, r)),
      env,
      stdout: (l) => output.push(l),
      stderr: (l) => output.push(l),
      client: () => client,
    });
  };
  /** A rubric of generic rows `ids` at `path` inside the temp repository. */
  const writeRubric = (path: string, ids: string) => {
    const rows = ids.split(", ").map((id) => ({
      id,
      rule: `Rule ${id} holds`,
      question: `Does this file break rule ${id}?`,
      layers: "domain",
    }));
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), rubricMarkdown(rows));
  };
  const runReview = async () => {
    result = await review({ root, rows, client, config });
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
      root = repo([S09, S11], files);
    },
    async keyVariableState(key: string): Promise<void> {
      env = key === "present" ? { OPENAI_API_KEY: "sk-test" } : {};
      files[entity(0)] = CLASS.replace("return base;", "return base; // SMELL");
      root = repo([S09, S11], files);
    },
    async lastRecordedPass(previous: string): Promise<void> {
      for (let i = 0; i < 4; i++) files[entity(i)] = CLASS;
      root = repo([S09, S11], files);
      if (previous.startsWith("recorded")) {
        const judged = Object.entries(files).map(([path, content]) => ({
          path,
          content,
        }));
        // The rubric the command will ask is the fixture's; "another rubric" is any other hash.
        const rubric =
          previous === "recorded under another rubric"
            ? "0000000000000000"
            : rubricHash(
                loadRubric(rubricMarkdown([S09, S11]), PACKAGES).filter(
                  (r) => !r.crossFile,
                ),
              );
        writeRecord(root, recordPass(emptyRecord(), judged, "abc123", rubric));
      }
    },
    async filesTouchedSince(touched: string): Promise<void> {
      for (let i = 0; i < Number(touched); i++)
        writeFileSync(join(root, entity(i)), `${CLASS}// touched\n`);
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
      if (!content) throw new Error(`unknown unit: ${unit}`);
      root = repo([S09, S11], { [file]: content });
      rows = loadRubric(rubricMarkdown([S09, S11]), PACKAGES);
    },
    async certaintyThreshold(threshold: string): Promise<void> {
      config = { ...config, threshold: Number(threshold) };
    },
    async modelAnswers(probability: string, row: string): Promise<void> {
      const own = { ...S09, id: row };
      root = repo([own], { [file]: CLASS });
      rows = loadRubric(rubricMarkdown([own]), PACKAGES);
      // The whole class fits one span: a constant answer yields one warning, not one per member.
      config = { ...config, spanLines: DEFAULTS.spanLines };
      client = constantClient(row, Number(probability));
    },
    async rowWorded(row: string, wording: string): Promise<void> {
      rows = loadRubric(
        rubricMarkdown([{ ...S09, id: row, question: `${wording}?` }]),
        PACKAGES,
      );
    },
    async coreRubricRows(coreRows: string): Promise<void> {
      files[entity(0)] = CLASS;
      root = repo([], files);
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
      await runReview();
    },
    async reviewReports(): Promise<void> {
      await runReview();
    },
    async rubricLoaded(): Promise<void> {
      expect(rows).toHaveLength(1);
    },
    async reviewRunsOverProductOf(schema: string): Promise<void> {
      // A product of the schema is asked its core's rubric and its own, never another schema's.
      rubrics = rubrics.filter(
        (r) => r === "core/RUBRIC.md" || r === `${schema}/RUBRIC.md`,
      );
      client = markerClient();
      await runMain();
    },

    // Outcome
    async exitStatus(status: string): Promise<void> {
      expect(exit, output.join("\n")).toBe(Number(status));
    },
    async warningsListed(warnings: string): Promise<void> {
      expect(
        output.filter((l) => WARNING.test(l)),
        output.join("\n"),
      ).toHaveLength(Number(warnings));
    },
    async reviewOutcome(outcome: string): Promise<void> {
      const calls = (client as DecisionClient & { calls: unknown[] }).calls
        .length;
      if (outcome === "the model is called and warnings print") {
        expect(exit).toBe(0);
        expect(calls).toBeGreaterThan(0);
        expect(
          output.some((l) => WARNING.test(l)),
          output.join("\n"),
        ).toBe(true);
      } else if (outcome === "the variable's name prints and status is 2") {
        expect(exit).toBe(2);
        expect(calls).toBe(0);
        expect(output.join("\n")).toContain(
          architecture.review?.keyVariable ?? DEFAULTS.keyVariable,
        );
      } else throw new Error(`unknown outcome: ${outcome}`);
    },
    async filesJudged(judged: string): Promise<void> {
      expect(exit, output.join("\n")).toBe(0);
      const asked = filesAsked(client.calls);
      expect(asked).toHaveLength(
        judged === "all" ? Object.keys(files).length : Number(judged),
      );
    },
    async rangesReported(ranges: string): Promise<void> {
      expect(
        result!.findings.filter((f) => f.file === file),
        result!.lines.join("\n"),
      ).toHaveLength(Number(ranges));
    },
    async warningPrinted(printed: string): Promise<void> {
      const warnings = result!.lines.filter((l) => WARNING.test(l));
      if (printed === "nothing") expect(warnings).toEqual([]);
      else {
        const m =
          /^(S\d{2}) p=(\d\.\d{2}) at the file and lines of the span$/.exec(
            printed,
          );
        if (!m) throw new Error(`unknown wording: ${printed}`);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(
          new RegExp(`^${m[1]} p=${m[2]} ${file}:\\d+-\\d+ — `),
        );
      }
    },
    async rowVerdict(verdict: string): Promise<void> {
      expect(rows[0].verdict, rows[0].reason).toBe(verdict);
    },
    async rowsAsked(asked: string): Promise<void> {
      expect(exit, output.join("\n")).toBe(0);
      const ids = client.calls.flatMap((c) =>
        c.questions.map((q) => q.name.split("_")[0]!),
      );
      expect([...new Set(ids)].join(", ")).toBe(asked);
    },
  };
}
