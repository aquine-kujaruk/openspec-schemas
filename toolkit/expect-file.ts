import type { Findings, Tool } from "./examples.ts";

export const NO_FINDINGS = "(no findings)";
const TOOLS = new Set<string>(["fallow", "oxlint", "archunit"]);
const FINDING = /^- (\S+) \(([a-z]+(?:, [a-z]+)*)\)$/;

/**
 * The lines of a case's `expect` block: one per finding, `- <path> (<tool>[, <tool>])`, sorted,
 * tools in the order the engine runs them; `(no findings)` when there is none.
 */
export const findingLines = (findings: Findings): string[] =>
  findings.size
    ? [...findings].map(([path, tools]) => `- ${path} (${[...tools].join(", ")})`).sort()
    : [NO_FINDINGS];

/**
 * Reads the lines of one `expect` block. `name` and `first` (the line number, in that file, of the
 * line after the opening fence) only label errors. Any other line, a repeated path or an empty block throws.
 */
export const parseFindingLines = (lines: string[], name: string, first: number): Findings => {
  const findings: Findings = new Map();
  let empty = false;
  for (const [i, line] of lines.entries()) {
    const fail = (why: string): never => {
      throw new Error(`${name}:${first + i}: ${why}: ${JSON.stringify(line)}`);
    };
    const finding = FINDING.exec(line);
    if (line === NO_FINDINGS) {
      if (findings.size || empty) fail("misplaced (no findings)");
      empty = true;
    } else if (finding) {
      if (empty) fail("finding after (no findings)");
      const tools = finding[2].split(", ");
      if (tools.some((tool) => !TOOLS.has(tool))) fail("unknown tool");
      if (findings.has(finding[1])) fail("path repeated");
      findings.set(finding[1], new Set(tools as Tool[]));
    } else fail("not a finding or (no findings)");
  }
  if (!empty && !findings.size)
    throw new Error(`${name}:${first - 1}: the expect block records nothing; write ${NO_FINDINGS}`);
  return findings;
};
