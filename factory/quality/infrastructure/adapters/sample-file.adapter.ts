import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import type {
  Files,
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
            current!.case.expected = parseFindingLines(
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
      const heading = /^(#{2,3}) (\S+)\s*$/.exec(line);
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
        if (!PLACES.has(section)) file.rules.set(section, new Map());
      } else if (heading?.[1] === "###") {
        const c: Case = { files: new Map(), expected: undefined };
        const rule = file.rules.get(section);
        target = c.files;
        current = rule && {
          case: c,
          span: { rule: section, name: heading[2], end: i },
        };
        if (current) {
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

  /**
   * Writes the recorded findings into an example file's text: the lines between a case's `expect`
   * fences are replaced, and a case without a block gets a blank line and one after its last
   * non-blank line. Every other line is kept as is; a text that does not parse throws.
   */
  const recordFindings = (
    text: string,
    name: string,
    recorded: Recorded,
  ): string => {
    const lines = text.split("\n");
    for (const span of scan(lines, name).spans.reverse()) {
      const findings = recorded.get(span.rule)?.get(span.name);
      if (!findings) continue;
      const body = findingLines(findings);
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
