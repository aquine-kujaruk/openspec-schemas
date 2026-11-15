import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The reviewer rubric (`RUBRIC.md`): one row per judgement rule (S05…), each carrying the
 * yes/no question the decision model is asked and the layer folders it applies to. A row marked
 * `across files` needs more than one file to be judged and is skipped by the command. The rubric
 * is the only source: a row added there is asked without touching code.
 */
export type Row = {
  id: string;
  /** The first sentence of the rule, for the warning line. */
  title: string;
  question: string;
  /** Layer folders (`domain`, `application`, …); empty when cross-file. */
  folders: string[];
  crossFile: boolean;
};

export type Verdict = "accepted" | "rejected";
export type LoadedRow = Row & { verdict: Verdict; reason?: string };

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

/** The rows of the rubric table and the product vocabulary its header lists. */
export const parseRubric = (markdown: string): { rows: Row[]; product: string[] } => {
  const start = markdown.search(RUBRIC_HEADING);
  const section = start === -1 ? "" : markdown.slice(start);
  const product = [...(VOCABULARY.exec(section)?.[1] ?? "").matchAll(/`([^`]+)`/g)].map((m) =>
    m[1].toLowerCase(),
  );
  const rows: Row[] = [];
  for (const line of section.split("\n")) {
    const c = cells(line);
    if (!c || !/^S\d{2}$/.test(c[0])) continue;
    if (c.length < 4)
      throw new Error(
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
};

/** `@scope/name` is also matched by its bare `name`. Every term matches at the start of a word. */
const terms = (words: string[]): string[] => [
  ...new Set(words.flatMap((w) => [w, w.replace(/^@[^/]+\//, "")]).map((w) => w.toLowerCase())),
];

const mentions = (question: string, term: string): boolean =>
  new RegExp(`(^|[^\\p{L}\\p{N}@/])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "iu").test(
    question,
  );

/**
 * A question is generic when it names no package of the harness and no word of the product
 * vocabulary; it then reads the same in every application built with the package.
 */
export const checkGeneric = (
  question: string,
  vocabulary: { packages: string[]; product: string[] },
): string | undefined => {
  const named = [
    ...terms(vocabulary.packages).filter((t) => mentions(question, t)),
    ...terms(vocabulary.product).filter((t) => mentions(question, t)),
  ];
  return named.length ? `names ${named.map((n) => `\`${n}\``).join(", ")}` : undefined;
};

/** Every row with its verdict: a row that is not generic, or has no question, is rejected and never asked. */
export const loadRubric = (markdown: string, packages: string[]): LoadedRow[] => {
  const { rows, product } = parseRubric(markdown);
  return rows.map((row) => {
    const reason = row.question
      ? checkGeneric(row.question, { packages, product })
      : "has no question";
    return reason ? { ...row, verdict: "rejected", reason } : { ...row, verdict: "accepted" };
  });
};

/** Package names of a `package.json`: dependencies and devDependencies alike. */
export const packagesOf = (packageJson: string): string[] => {
  const pkg = JSON.parse(packageJson) as Record<string, Record<string, string> | undefined>;
  return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
};

/** The rubric checked against the project's `package.json`, so no question names one of its packages. */
export const readRubric = (root: string, rubric: string | string[]): LoadedRow[] => {
  const packages = packagesOf(readFileSync(join(root, "package.json"), "utf8"));
  const rows: LoadedRow[] = [];
  const from = new Map<string, string>();
  for (const file of [rubric].flat())
    for (const row of loadRubric(readFileSync(file, "utf8"), packages)) {
      if (from.has(row.id))
        throw new Error(`rubric row ${row.id} is in ${from.get(row.id)} and in ${file}: a row id belongs to one rubric`);
      from.set(row.id, file);
      rows.push(row);
    }
  return rows;
};
