import { canRecordRubricScore, expectedRubricVerdict } from "./rubric-case.adapter.ts";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import type {
  Files,
  Judgement,
  Case,
  ExampleFile,
  Recorded,
} from "./sample-file-contract.adapter.ts";
import type { Findings } from "./sample-findings.adapter.ts";
import type { ExampleFilePorts } from "./sample-file-contract.adapter.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createExampleFile = ({
  readFileSync,
  findingLines,
  parseFindingLines,
}: ExampleFilePorts): typeof import("./sample-file-contract.adapter.ts") => {
  /** The sections of an example file that are not rules. */
  const PLACES = new Set(["reference", "scaffolds"]);

  /** Where a case sits in the file: its `expect` block's fences and its last non-blank line (0-based). */
  type Span = {
    rule: string;
    name: string;
    block?: { open: number; close: number };
    end: number;
  };

  const FENCE = /^(`{3,})\S*\s+(\S+)\s*$/;

  const EXPECT = /^(`{3,})expect\s*$/;

  /**
   * Reads an example file. Headings outside fences give the place (`##` rule, `reference` or
   * `scaffolds`, `###` case); every file is a fence with `<lang> <path>` in its info string that
   * holds that file verbatim, and a case ends with at most one fence whose info string is `expect`,
   * holding its recorded findings. Prose between them is ignored. A fence closes on a line of at
   * least as many backticks, so a block can contain a shorter fence.
   */
  const scan = (lines: string[], name: string) => {
    const file: ExampleFile = {
      reference: new Map(),
      scaffolds: new Map(),
      rules: new Map(),
      rubric: new Map(),
    };
    const spans: Span[] = [];
    let section = "";
    let target: Files | undefined;
    let current: { case: Case; span: Span } | undefined;
    let open:
      | { ticks: string; path?: string; at: number; lines: string[] }
      | undefined;
    for (const [i, line] of lines.entries()) {
      const fail = (why: string): never => {
        throw new QualityException(`${name}:${i + 1}: ${why}`, { cause: line });
      };
      if (open) {
        if (line.startsWith(open.ticks) && /^`+\s*$/.test(line)) {
          if (open.path) target!.set(open.path, open.lines.join("\n") + "\n");
          else {
            if (file.rubric.has(section)) {
              const match = /^(?:- \S+|\(no findings\)) \((\S+) (yes|no) ([\d.e+-]+) · ([a-f0-9]+)\)$/.exec(open.lines.join("\n"));
              if (!match) throw new QualityException(`${name}:${open.at + 2}: invalid recorded judgement`, { cause: open.lines });
              const score = Number(match[3]);
              const verdict = match[2] as "yes" | "no";
              if (!Number.isFinite(score) || score < 0 || score > 1 || (verdict === "yes" ? score < 0.85 : score > 0.15))
                fail("score does not support the recorded verdict");
              current!.case.judgement = { model: match[1], verdict, score, fingerprint: match[4] };
            } else current!.case.expected = parseFindingLines(
              open.lines,
              name,
              open.at + 2,
            );
            current!.span.block = { open: open.at, close: i };
          }
          if (current) current.span.end = i;
          open = undefined;
        } else open.lines.push(line);
        continue;
      }
      const semantic = /^## (S\d{2}) · ([a-z0-9-]+)\s*$/.exec(line);
      const heading = semantic ? ["", "##", semantic[1]] : /^(#{2,3}) (\S+)\s*$/.exec(line);
      const expect = EXPECT.exec(line);
      if (heading?.[1] === "##") {
        section = heading[2];
        target =
          section === "reference"
            ? file.reference
            : section === "scaffolds"
              ? file.scaffolds
              : undefined;
        current = undefined;
        if (semantic) {
          if (file.rubric.has(section)) fail(`repeated rubric row ${section}`);
          file.rubric.set(section, new Map());
        } else if (!PLACES.has(section)) file.rules.set(section, new Map());
      } else if (heading?.[1] === "###") {
        const c: Case = { files: new Map(), expected: undefined };
        const rule = file.rubric.get(section) ?? file.rules.get(section);
        target = c.files;
        current = rule && {
          case: c,
          span: { rule: section, name: heading[2], end: i },
        };
        if (current) {
          if (rule!.has(heading[2])) fail(`repeated case ${section}/${heading[2]}`);
          rule!.set(heading[2], c);
          spans.push(current.span);
        }
      } else if (expect) {
        if (!current)
          fail(
            `an expect block belongs to a case; ${section ? `## ${section}` : "this place"} has none`,
          );
        if (current!.span.block)
          fail(`case ${current!.span.name} already has an expect block`);
        current!.span.block = { open: i, close: -1 };
        open = { ticks: expect![1], at: i, lines: [] };
      } else if (line.startsWith("```")) {
        const fence = FENCE.exec(line);
        if (!fence || !target)
          fail(
            "a block needs `<lang> <path>` inside a case, the reference or the scaffolds",
          );
        if (current?.span.block)
          fail(
            `the expect block must be the last block of case ${current.span.name}`,
          );
        open = { ticks: fence![1], path: fence![2], at: i, lines: [] };
      } else if (current && line.trim()) current.span.end = i;
    }
    if (open)
      throw new QualityException(`${name}:${open.at + 1}: block ${open.path ?? "expect"} is not closed`, { cause: lines[open.at] });
    return { file, spans };
  };

  /** Reads an example file from its text; `name` only labels errors. */
  const parseExampleText = (text: string, name: string): ExampleFile =>
    scan(text.split("\n"), name).file;

  const parseExampleFile = (path: string): ExampleFile =>
    parseExampleText(readFileSync(path, "utf8"), path);

  const recordFindings = (
    text: string,
    name: string,
    recorded: Recorded,
    judgements: Map<string, Map<string, Judgement>> = new Map(),
  ): string => {
    const lines = text.split("\n");
    const { file, spans } = scan(lines, name);
    for (const span of spans.reverse()) {
      const findings = recorded.get(span.rule)?.get(span.name);
      const judgement = judgements.get(span.rule)?.get(span.name);
      if (!findings && !judgement) continue;
      if (judgement && (judgement.verdict !== expectedRubricVerdict(span.name) || !canRecordRubricScore(span.name, judgement.score))) continue;
      const path = file.rubric.get(span.rule)?.get(span.name)?.files.keys().next().value;
      const body = judgement
        ? [`${judgement.verdict === "yes" ? "- " + path : "(no findings)"} (${judgement.model} ${judgement.verdict} ${judgement.score} · ${judgement.fingerprint})`]
        : findingLines(findings!);
      if (span.block)
        lines.splice(
          span.block.open + 1,
          span.block.close - span.block.open - 1,
          ...body,
        );
      else lines.splice(span.end + 1, 0, "", "```expect", ...body, "```");
    }
    return lines.join("\n");
  };
  return { parseExampleText, parseExampleFile, recordFindings };
};
