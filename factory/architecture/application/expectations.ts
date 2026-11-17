import type { ExampleFile } from "../domain/example-file.ts";
import type { Findings } from "../domain/findings.ts";
import type { ExpectationsPorts } from "../domain/expectations.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createExpectations = ({
  deepStrictEqual,
  parseExampleFile,
  findingLines,
}: ExpectationsPorts): typeof import("../domain/expectations.ts") => {
  /**
   * The recorded findings of one layer (the `expect` blocks of `<layer>.examples.md`), read once,
   * and the comparison a scenario's outcome step makes: the case must be recorded, what the tools
   * report now must equal the record, and a case that is not `todo.` must break its rule in at least
   * one file.
   */
  const expectations = (path: string) => {
    let file: ExampleFile | undefined;
    const load = () => (file ??= parseExampleFile(path));
    return {
      check: (name: string, rule: string, reported: Findings): void => {
        const recorded = load().rules.get(rule)?.get(name)?.expected;
        if (!recorded)
          throw new Error(
            `${path} has no expectation for ${name} under ${rule}: run factory expect`,
          );
        if (
          JSON.stringify(findingLines(reported)) !==
          JSON.stringify(findingLines(recorded))
        )
          throw new Error(`${name} under ${rule} differs from ${path}`);
        if (!recorded.size && !name.startsWith("todo."))
          throw new Error(
            `${name} breaks ${rule} in no file; a counterexample must break its rule (or be prefixed todo.)`,
          );
      },
    };
  };
  return { expectations };
};
