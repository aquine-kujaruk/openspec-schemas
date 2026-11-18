import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import type { ExampleFile } from "./sample-file-contract.adapter.ts";
import type { Findings } from "./sample-findings.adapter.ts";
import type { ExpectationsPorts } from "./sample-proof-contract.adapter.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createExpectations = ({
  parseExampleFile,
  findingLines,
}: ExpectationsPorts): typeof import("./sample-proof-contract.adapter.ts") => {
  const expectations = (path: string) => {
    let file: ExampleFile | undefined;
    const load = () => (file ??= parseExampleFile(path));
    return {
      check: (name: string, rule: string, reported: Findings): void => {
        const recorded = load().rules.get(rule)?.get(name)?.expected;
        if (!recorded)
          throw new QualityException(`${path} has no expectation for ${name} under ${rule}: run factory expect`, { cause: { path, name, rule } });
        if (
          JSON.stringify(findingLines(reported)) !==
          JSON.stringify(findingLines(recorded))
        )
          throw new QualityException(`${name} under ${rule} differs from ${path}`, { cause: { reported: findingLines(reported), recorded: findingLines(recorded) } });
        if (!recorded.size && !name.startsWith("todo."))
          throw new QualityException(`${name} breaks ${rule} in no file; a counterexample must break its rule (or be prefixed todo.)`, { cause: { name, rule } });
      },
    };
  };
  return { expectations };
};
