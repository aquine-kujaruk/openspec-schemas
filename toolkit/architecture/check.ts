import { globSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COVERAGE_RULE, fallowConfig, oxlintConfig } from "./compose.ts";
import { fileOf } from "./examples.ts";
import { generate } from "./generate.ts";
import { withUpstream } from "./graph.ts";
import { cacheDir, jsonOf, PROJECT_ROOT, runTool } from "../core/paths.ts";
import { architecture, config, product } from "./project.ts";
import { archunitRules } from "./rules.ts";
import type { Check, Layer } from "../core/types.ts";

type Selection = { layers: Layer[]; checks: Check[]; whole: boolean };

const option = (args: string[], name: string): string | undefined => {
  const at = args.indexOf(name);
  return at === -1 ? undefined : args[at + 1];
};

/**
 * `factory check`: every rule over the product, the whole-product checks and the freshness of the
 * generated tests. `--layer <layer>` keeps the rules of one layer; `--workstream <workstream>` keeps
 * the rules of the layers that workstream owns, its whole-product checks, and those of every
 * workstream upstream of it. `--module <module>` reports only that module's files.
 *
 * fallow (imports and calls) reports only the zones of the selected layers, oxlint lints the files
 * of their overrides, archunit runs only their rules.
 */
/** A whole-product check's configuration that leaves the other products' folders alone. */
const leaveOthers = (body: unknown): unknown => {
  if (!product.elsewhere.length || typeof body !== "object" || body === null) return body;
  const { ignorePatterns = [] } = body as { ignorePatterns?: string[] };
  return { ...body, ignorePatterns: [...ignorePatterns, ...product.elsewhere] };
};

export const check = async (args: string[]): Promise<number> => {
  const all = architecture.workstreams;
  const layer = option(args, "--layer");
  const workstream = option(args, "--workstream");
  const onlyModule = option(args, "--module");

  const select = (): Selection | undefined => {
    if (args.includes("--layer")) {
      const found = all.flatMap((w) => w.layers).find((l) => l.name === layer);
      if (found) return { layers: [found], checks: [], whole: false };
      const known = all.flatMap((w) => w.layers.map((l) => l.name));
      console.error(`Unknown layer: ${layer}. Layers: ${known.join(", ")}`);
      return undefined;
    }
    if (args.includes("--workstream")) {
      if (all.some((w) => w.id === workstream)) {
        const ws = withUpstream(all, workstream!);
        return {
          layers: ws.flatMap((w) => w.layers),
          checks: ws.flatMap((w) => w.checks),
          whole: false,
        };
      }
      console.error(
        `Unknown workstream: ${workstream}. Workstreams: ${all.map((w) => w.id).join(", ")}`,
      );
      return undefined;
    }
    return {
      layers: all.flatMap((w) => w.layers),
      checks: all.flatMap((w) => w.checks),
      whole: true,
    };
  };
  const selected = select();
  if (!selected) return 2;
  const { layers, checks, whole } = selected;

  const cache = cacheDir(PROJECT_ROOT);
  const inModule = (f: string) => !onlyModule || f.includes(`/${onlyModule}/`);
  const compose = (name: string, body: unknown): string => {
    const path = join(cache, name);
    writeFileSync(path, JSON.stringify(body, null, 2));
    return path;
  };
  let failed = false;

  const zones = new Set(layers.flatMap((l) => l.fallow?.zones.map((z) => z.name) ?? []));
  if (zones.size) {
    console.log(`\n▶ fallow (imports, calls, coverage) in zones ${[...zones].join(", ")}`);
    const { stdout } = runTool("fallow", [
      "architecture",
      "--format",
      "json",
      "--quiet",
      "--config",
      compose("fallow.json", fallowConfig(architecture)),
    ]);
    const r = jsonOf(stdout);
    const found = [
      ...r.boundary_violations
        .filter((v: any) => zones.has(v.from_zone) && inModule(v.from_path))
        .map((v: any) => `${v.from_path}: ${v.from_zone} → ${v.to_zone}`),
      ...r.boundary_call_violations
        .filter((v: any) => zones.has(v.zone) && inModule(v.path))
        .map((v: any) => `${v.path}: forbidden call in ${v.zone}`),
      ...r.boundary_coverage_violations
        .filter((v: any) => inModule(v.path))
        .map((v: any) => `${v.path}: [${COVERAGE_RULE}]`),
    ];
    for (const f of found) console.log(`  ${f}`);
    if (found.length) failed = true;
    else console.log("  no violations");
  }

  const overrides = layers.flatMap((l) => l.oxlint?.(architecture.platform) ?? []);
  const lintFiles = [
    ...new Set(
      overrides
        .flatMap((o) => o.files ?? [])
        .flatMap((p) => globSync(p, { exclude: (f) => f.includes("node_modules") })),
    ),
  ].filter((f) => f.endsWith(".ts") && inModule(f));
  if (lintFiles.length) {
    console.log(`\n▶ oxlint (packages and globals) over ${lintFiles.length} files`);
    const r = runTool(
      "oxlint",
      ["-c", compose("oxlint.json", oxlintConfig(overrides, PROJECT_ROOT)), ...lintFiles],
      { show: true },
    );
    if (r.status !== 0) failed = true;
  } else console.log("\n▶ oxlint: no files");

  if (layers.length) {
    console.log("\n▶ archunit (names and shape)");
    const only = { ...architecture, workstreams: [{ id: "", layers, checks: [], dependsOn: [] }] };
    let broken = 0;
    for (const { rules } of archunitRules(only))
      for (const rule of rules) {
        const violations = (await rule.check()).filter((v) => inModule(JSON.stringify(v)));
        if (!violations.length) continue;
        broken += violations.length;
        console.log(`  ${rule.id} · ${rule.title}`);
        for (const v of violations)
          console.log(`    ${fileOf(v)}${(v as any).message ? `: ${(v as any).message}` : ""}`);
      }
    if (broken) failed = true;
    else console.log("  no violations");
  }

  for (const c of checks) {
    console.log(`\n▶ ${c.id} (whole product)`);
    const r = runTool(
      "fallow",
      [...c.args, "--config", compose(`${c.id}.json`, leaveOthers(c.config(config)))],
      { show: true },
    );
    if (r.status !== 0) failed = true;
  }

  if (whole) {
    console.log("\n▶ generated tests are fresh");
    if ((await generate(["--check"])) !== 0) failed = true;
  }

  return failed ? 1 : 0;
};
