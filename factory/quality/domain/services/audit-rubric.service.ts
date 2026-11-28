import { QualityException } from "../exceptions/quality.exceptions.ts";
import type { AuditRubric, AuditRow as Row, LoadedAuditRow as LoadedRow } from "../schemas/audit-material.schema.ts";

const CROSS_FILE = "across files";

const VOCABULARY = /^Product vocabulary[^:]*:\s*(.*)$/m;

const RUBRIC_HEADING = /^### Reviewer rubric/m;

const cells = (line: string): string[] | undefined =>
  /^\|(.*)\|\s*$/
    .exec(line)?.[1]
    .split(" | ")
    .map((c) => c.trim());

const firstSentence = (text: string): string => {
  const plain = text.replace(/[*_]/g, "");
  const end = plain.search(/[.;](\s|$)/);

  return end === -1 ? plain : plain.slice(0, end);
};

const terms = (words: string[]): string[] => [
  ...new Set(
    words
      .flatMap((w) => [w, w.replace(/^@[^/]+\//, "")])
      .map((w) => w.toLowerCase()),
  ),
];

const mentions = (question: string, term: string): boolean =>
  new RegExp(
    `(^|[^\\p{L}\\p{N}@/])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "iu",
  ).test(question);

export class AuditRubricService {
  precondition(key: string | undefined, rubrics: string[], keyVariable: string): string | undefined {
    if (!key) return `${keyVariable} is not set: factory review needs the decision model's key in the environment or in .env`;
    if (!rubrics.length) return "the schema this project is checked with has no rubric: there is nothing to review";

    return undefined;
  }

  gaps(rows: LoadedRow[], selected: number, coreFiles: number): string[] {
    return [
      ...rows.filter((row) => row.verdict === "rejected").map((row) => `a row was rejected: ${row.id} ${row.reason}`),
      ...(!selected && coreFiles ? ["no core file selected"] : []),
    ];
  }

  parseRubric(
    markdown: string,
  ): { rows: Row[]; product: string[] } {
    const start = markdown.search(RUBRIC_HEADING);
    const section = start === -1 ? "" : markdown.slice(start);

    const product = [
      ...(VOCABULARY.exec(section)?.[1] ?? "").matchAll(/`([^`]+)`/g),
    ].map((m) => m[1].toLowerCase());

    const rows: Row[] = [];

    for (const line of section.split("\n")) {
      const c = cells(line);
      if (!c || !/^S\d{2}$/.test(c[0])) continue;

      if (c.length < 4)
        throw new QualityException(
          `rubric row ${c[0]}: expected ID, rule, question and layers (${c.length} cells)`,
        );

      const [id, rule, question, layers] = c;
      const crossFile = layers === CROSS_FILE;

      rows.push({
        id,
        title: firstSentence(rule),
        question,
        folders: crossFile
          ? []
          : layers
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean),
        crossFile,
      });
    }

    return { rows, product };
  }

  checkGeneric(
    question: string,
    vocabulary: { packages: string[]; product: string[] },
  ): string | undefined {
    const named = [
      ...terms(vocabulary.packages).filter((t) => mentions(question, t)),
      ...terms(vocabulary.product).filter((t) => mentions(question, t)),
    ];

    return named.length
      ? `names ${named.map((n) => `\`${n}\``).join(", ")}`
      : undefined;
  }

  loadRubric(markdown: string, packages: string[]): LoadedRow[] {
    const { rows, product } = this.parseRubric(markdown);

    return rows.map((row) => {
      const reason = row.question
        ? this.checkGeneric(row.question, { packages, product })
        : "has no question";

      return reason
        ? { ...row, verdict: "rejected", reason }
        : { ...row, verdict: "accepted" };
    });
  }

  loadDocuments(documents: AuditRubric[], packages: string[]): LoadedRow[] {
    const from = new Map<string, string>();
    const rows: LoadedRow[] = [];

    for (const { path, markdown } of documents)
      for (const row of this.loadRubric(markdown, packages)) {
        if (from.has(row.id))
          throw new QualityException(
            `rubric row ${row.id} is in ${from.get(row.id)} and in ${path}: a row id belongs to one rubric`,
          );

        from.set(row.id, path);
        rows.push(row);
      }

    return rows;
  }
}
