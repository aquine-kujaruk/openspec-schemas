import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, relative } from "node:path";
import { parseExampleText, type Recorded, recordFindings } from "./example-file.ts";
import { examples } from "./examples.ts";
import { DEVELOPING, PACKAGE_ROOT } from "./paths.ts";
import { EXAMPLE_FILES, exampleArchitecture } from "./project.ts";

/**
 * `factory expect [layer…]`: records what the linter says about every case. For each
 * `workstreams/<workstream>/<layer>.examples.md` (all, or only the named layers), every case under
 * every rule is checked against that rule alone and the files reported, with their tools, are
 * written into the case's `expect` block; no other line of the file changes, and a file that does
 * not parse is not written. The generated tests compare with these blocks; review the diff.
 * Cases prefixed `todo.` are known gaps and are listed at the end. The example files are sources of
 * the repository that develops the workstreams, so the command runs only there.
 */
export const expect = async (args: string[]): Promise<number> => {
  if (!DEVELOPING) {
    console.error("factory expect records the example files where the workstreams are developed");
    return 2;
  }
  const only = new Set(args);
  const todos: string[] = [];
  const all = EXAMPLE_FILES;
  let status = 0;

  for (const path of all) {
    const layer = basename(path, ".examples.md");
    if (only.size && !only.has(layer)) continue;
    const shown = relative(PACKAGE_ROOT, path);
    const text = readFileSync(path, "utf8");
    const ex = examples(exampleArchitecture, dirname(path), layer);
    const out: Recorded = new Map();
    for (const [rule, cases] of parseExampleText(text, shown).rules) {
      out.set(rule, new Map());
      for (const name of cases.keys()) {
        out.get(rule)!.set(name, await ex.violations(name, rule));
        if (name.startsWith("todo.")) todos.push(`${layer} · ${rule} · ${name}`);
      }
    }
    writeFileSync(path, recordFindings(text, shown, out));
    console.log(`wrote ${shown}`);
  }
  const layers = new Set(all.map((p) => basename(p, ".examples.md")));
  for (const l of [...only].filter((l) => !layers.has(l))) {
    console.error(`unknown layer: ${l}`);
    status = 2;
  }
  if (todos.length) console.log(`\nknown gaps (todo.):\n${todos.map((t) => `  ${t}`).join("\n")}`);
  return status;
};
