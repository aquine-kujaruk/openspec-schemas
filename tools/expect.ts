import { spawnSync } from "node:child_process";
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { assertRubricCase, expectedRubricVerdict, rubricWarnings } from "../factory/quality/infrastructure/adapters/rubric-case.adapter.ts";
import { basename, dirname, join, relative } from "node:path";
import type { Judgement, Recorded } from "../factory/quality/infrastructure/adapters/sample-file-contract.adapter.ts";
import { judgements, exampleFile as architectureexampleFile } from "../factory/quality.ts";
const { parseExampleText, recordFindings } = architectureexampleFile;
import { examples as architectureexamples } from "../factory/quality.ts";
const { examples } = architectureexamples;
import {
  DEVELOPING,
  PACKAGE_ROOT,
  SOURCE_EXT,
} from "../factory/shared/infrastructure/adapters/paths.adapter.ts";
import { project as architectureproject, schema } from "../factory/engineering.ts";
const { EXAMPLE_FILES, exampleArchitecture } = architectureproject;

/** Use each workstream's own defaults. Catalog order places shared cores before their consumers. */
async function expectAcrossHolders(layers: Set<string>, flags: string[]): Promise<number> {
  const seen = new Set<string>();
  const owners = new Map<string, Set<string>>();
  const available = new Set<string>();
  for (const holder of await schema.holderNames()) {
    const { workstreamDirs } = await schema.loadHolder(holder);
    for (const dir of Object.values(workstreamDirs)) {
      for (const file of globSync(join(dir, "*.examples.md"))) {
        if (seen.has(file)) continue;
        seen.add(file);
        const layer = basename(file, ".examples.md");
        available.add(layer);
        if (layers.size && !layers.has(layer)) continue;
        const group = owners.get(holder) ?? new Set<string>();
        group.add(layer);
        owners.set(holder, group);
      }
    }
  }
  const unknown = [...layers].filter(layer => !available.has(layer));
  if (unknown.length) {
    console.error(`unknown layer: ${unknown.join(", ")}`);
    return 2;
  }
  let status = 0;
  for (const [holder, group] of owners) {
    const args = [join(PACKAGE_ROOT, "factory", "main" + SOURCE_EXT), "expect", ...group];
    args.push(...flags);
    const child = spawnSync(process.execPath, args, { stdio: "inherit", env: { ...process.env, FACTORY_HOLDER: holder } });
    if (child.error) throw child.error;
    status = Math.max(status, child.status ?? 1);
  }
  return status;
}

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
    console.error(
      "factory expect records the example files where the workstreams are developed",
    );
    return 2;
  }
  const changedOnly = args.includes("--changed");
  const attempts = args.includes("--once") ? 1 : 2;
  const flags: string[] = args.filter(arg => arg === "--changed" || arg === "--once");
  const only = new Set(args.filter(arg => !flags.includes(arg)));
  const index = args.indexOf("--case");
  const selected = index >= 0 ? args[index + 1] : undefined;
  if (index >= 0) {
    only.delete("--case");
    if (selected) only.delete(selected);
    if (only.size !== 1 || !selected || !/^S\d{2}\/[\w.-]+$/.test(selected)) {
      console.error("use factory expect <layer> --case Snn/name");
      return 2;
    }
    flags.push("--case", selected);
  }
  if (!process.env.FACTORY_HOLDER) return expectAcrossHolders(only, flags);
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
    const parsed = parseExampleText(text, shown);
    if (selected) {
      const [row, name] = selected.split("/");
      if (!parsed.rubric.get(row)?.has(name)) {
        console.error(`unknown rubric case in ${layer}: ${selected}`);
        return 2;
      }
    }
    for (const [rule, cases] of selected ? [] : parsed.rules) {
      out.set(rule, new Map());
      for (const name of cases.keys()) {
        out.get(rule)!.set(name, await ex.violations(name, rule));
        if (name.startsWith("todo."))
          todos.push(`${layer} · ${rule} · ${name}`);
      }
    }
    const scores = new Map<string, Map<string, Judgement>>();
    try {
      if (parsed.rubric.size) {
        const samples = judgements(layer, dirname(path));
        for (const [row, cases] of parsed.rubric) {
          const accepted = new Map<string, Judgement>();
          scores.set(row, accepted);
          for (const name of cases.keys()) {
            if (selected && selected !== row + "/" + name) continue;
            const expected = expectedRubricVerdict(name);
            for (let attempt = 0; attempt < attempts; attempt++) {
              const result = await samples.judge(row, name, changedOnly && attempt === 0 ? "record-changed" : "record");
              try {
                assertRubricCase(layer, row, name, result, expected);
                for (const warning of rubricWarnings(result)) console.warn(`${layer} ${row}/${name}: ${warning}`);
                accepted.set(name, result);
                break;
              } catch (error) {
                console.error(error instanceof Error ? error.message : String(error));
                if (attempt + 1 === attempts) status = 1;
              }
            }
          }
        }
      }
    } finally {
      writeFileSync(path, recordFindings(text, shown, out, scores));
    }
    console.log(`wrote ${shown}`);
  }
  const layers = new Set(all.map((p) => basename(p, ".examples.md")));
  for (const l of [...only].filter((l) => !layers.has(l))) {
    console.error(`unknown layer: ${l}`);
    status = 2;
  }
  if (todos.length)
    console.log(
      `\nknown gaps (todo.):\n${todos.map((t) => `  ${t}`).join("\n")}`,
    );
  return status;
};
