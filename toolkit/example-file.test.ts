import { describe, expect, it } from "vitest";
import { parseExampleText } from "./example-file.ts";

const SAMPLE = `# domain

## reference

\`\`\`ts src/a.ts
export const a = 1;
\`\`\`

## no-environment

### calls-environment

\`\`\`ts src/b.ts
export const useB = () => 1;
\`\`\`

\`\`\`expect
- src/b.ts (archunit)
\`\`\`

### todo.no-block

\`\`\`ts src/c.ts
export const c = 1;
\`\`\`
`;

const BLOCK = "```expect\n(no findings)\n```\n";

describe("example file", () => {
  it("attaches a case's expect block to the case and leaves it out of its files", () => {
    const file = parseExampleText(SAMPLE, "sample");
    const call = file.rules.get("no-environment")!.get("calls-environment")!;
    expect([...call.files.keys()]).toEqual(["src/b.ts"]);
    expect(call.expected).toEqual(new Map([["src/b.ts", new Set(["archunit"])]]));
    expect(file.rules.get("no-environment")!.get("todo.no-block")!.expected).toBeUndefined();
    expect([...file.reference.keys()]).toEqual(["src/a.ts"]);
  });
  it.each([
    [
      "an expect block in ## reference",
      SAMPLE.replace("\n## no-environment", `\n${BLOCK}\n## no-environment`),
      "sample:9: an expect block belongs to a case; ## reference has none",
    ],
    [
      "an expect block before the first ### of a rule",
      SAMPLE.replace("\n### calls-environment", `\n${BLOCK}\n### calls-environment`),
      "sample:11: an expect block belongs to a case; ## no-environment has none",
    ],
    [
      "a second expect block in a case",
      SAMPLE.replace("\n### todo.no-block", `\n${BLOCK}\n### todo.no-block`),
      "sample:21: case calls-environment already has an expect block",
    ],
    [
      "a file block after the expect block",
      SAMPLE.replace("\n### todo.no-block", "\n```ts src/d.ts\n```\n\n### todo.no-block"),
      "sample:21: the expect block must be the last block of case calls-environment",
    ],
    [
      "a malformed line in an expect block",
      SAMPLE.replace("- src/b.ts (archunit)", "- src/b.ts"),
      "sample:18: not a finding",
    ],
    [
      "an unclosed expect block",
      `${SAMPLE}\n\`\`\`expect\n(no findings)\n`,
      "sample:27: block expect is not closed",
    ],
  ])("throws naming file and line on %s", (_, text, message) => {
    expect(() => parseExampleText(text, "sample")).toThrow(message);
  });
});
