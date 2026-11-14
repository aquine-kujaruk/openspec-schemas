import { globSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { clearGraphCache } from "archunit";
import { COVERAGE_RULE, fallowConfig, layersOf, oxlintConfig, oxlintOverrides } from "./compose.ts";
import { withUpstream } from "./graph.ts";
import type { Architecture } from "./types.ts";
import { archunitRules, idsInMessages } from "./rules.ts";
import { type Files, parseExampleFile } from "./example-file.ts";
import { jsonOf, runTool } from "./paths.ts";

type Hits = Map<string, Set<string>>;
const hit = (hits: Hits, id: string | undefined, file: string) =>
  id && (hits.get(id) ?? hits.set(id, new Set()).get(id)!).add(file);

/** Files that break a rule, each with the tools that reported it. */
export type Findings = Map<string, Set<Tool>>;

/**
 * The file an archunit violation points at, whatever its kind (custom condition, dependency, cycle,
 * path or name pattern). Anything else throws: a finding without a path cannot be recorded.
 */
export const fileOf = (v: any): string => {
  const file =
    v.fileInfo?.path ??
    v.dependency?.sourceLabel ??
    v.cycle?.[0]?.sourceLabel ??
    v.projectedNode?.label;
  if (typeof file !== "string")
    throw new Error(`archunit violation without a file: ${JSON.stringify(v)}`);
  return file;
};

const TOOLS = ["fallow", "oxlint", "archunit"] as const;
export type Tool = (typeof TOOLS)[number];

const TEMPLATE = {
  "package.json": { name: "architecture-example", private: true, type: "module" },
  "tsconfig.json": {
    compilerOptions: {
      target: "es2023",
      module: "esnext",
      moduleResolution: "bundler",
      strict: false,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["src", "test"],
  },
};

/**
 * Examples of one layer: `<dir>/<layer>.examples.md` holds a case per way of breaking each rule.
 * `dir` is a workstream folder; the `## reference` sections of every `*.examples.md` in it and in
 * the folders of the workstreams upstream of it form the workstream's reference module. A seam file
 * may be in several of them only with identical content. A case (or the reference) is written to a
 * temp directory with the configs composed from the architecture, and each tool reports the files
 * that violate each rule. A tool runs at most once per case, and only when a rule it owns is asked for.
 */
export const examples = (a: Architecture, dir: string, layer: string) => {
  const root = mkdtempSync(join(tmpdir(), "architecture-examples-"));
  const name = `${layer}.examples.md`;
  const parse = (d: string) =>
    new Map(globSync("*.examples.md", { cwd: d }).map((f) => [f, parseExampleFile(join(d, f))]));
  const parsed = parse(dir);
  const known = a.workstreams.some((w) => w.id === basename(dir));
  const dirs = known
    ? withUpstream(a.workstreams, basename(dir)).map((w) => join(dirname(dir), w.id))
    : [dir];
  const reference: Files = new Map();
  const from = new Map<string, string>();
  for (const d of dirs)
    for (const [f, { reference: own }] of d === dir ? parsed : parse(d))
      for (const [path, content] of own) {
        const where = join(basename(d), f);
        if (reference.has(path) && reference.get(path) !== content)
          throw new Error(
            `${where}: reference file ${path} differs from its copy in ${from.get(path)}`,
          );
        if (!reference.has(path)) from.set(path, where);
        reference.set(path, content);
      }
  const filesOf = (example: string, rule?: string): Files => {
    if (example === "reference") return reference;
    const files = rule && parsed.get(name)?.rules.get(rule)?.get(example)?.files;
    if (!files) throw new Error(`${name} has no case \`${example}\` under \`## ${rule}\``);
    return files;
  };
  const fallows = layersOf(a).flatMap((l) => (l.fallow ? [l.fallow] : []));
  const byZone = (kind: "boundaries" | "forbiddenCalls") =>
    new Map(fallows.flatMap((f) => f[kind].map((r) => [r.from, r.id] as const)));
  const boundaryIds = byZone("boundaries");
  const callIds = byZone("forbiddenCalls");
  const owners = {
    fallow: new Set([...boundaryIds.values(), ...callIds.values(), COVERAGE_RULE]),
    oxlint: new Set(idsInMessages(JSON.stringify(oxlintOverrides(a)))),
    archunit: new Set(archunitRules(a).flatMap((l) => l.rules.map((r) => r.id))),
  };
  const config = fallowConfig(a);
  const json = (cwd: string, cmd: string, args: string[]) =>
    jsonOf(runTool(cmd, args, { cwd }).stdout);

  const tools: Record<Tool, (cwd: string) => Hits | Promise<Hits>> = {
    fallow: (cwd: string): Hits => {
      const hits: Hits = new Map();
      const r = json(cwd, "fallow", ["architecture", "--format", "json", "--quiet"]);
      for (const v of r.boundary_violations) hit(hits, boundaryIds.get(v.from_zone), v.from_path);
      for (const v of r.boundary_call_violations) hit(hits, callIds.get(v.zone), v.path);
      for (const v of r.boundary_coverage_violations) hit(hits, COVERAGE_RULE, v.path);
      return hits;
    },
    oxlint: (cwd: string): Hits => {
      const hits: Hits = new Map();
      const r = json(cwd, "oxlint", ["-c", ".oxlintrc.json", "-f", "json", "src", "test"]);
      for (const d of r.diagnostics)
        hit(hits, idsInMessages(`${d.message} ${d.help ?? ""}`)[0], d.filename);
      return hits;
    },
    archunit: async (cwd: string): Promise<Hits> => {
      const hits: Hits = new Map();
      const back = process.cwd();
      process.chdir(cwd);
      clearGraphCache(); // archunit caches the graph by tsconfig path, and every example has "tsconfig.json".
      try {
        for (const { rules } of archunitRules(a))
          for (const rule of rules)
            for (const v of await rule.check()) hit(hits, rule.id, fileOf(v));
      } finally {
        process.chdir(back);
      }
      return hits;
    },
  };

  const prepared = new Map<string, { cwd: string; ran: Map<Tool, Hits> }>();
  const prepare = (example: string, rule?: string) => {
    const key = example === "reference" ? example : `${rule}/${example}`;
    if (!prepared.has(key)) {
      const cwd = join(root, key.replaceAll("/", "__"));
      for (const [path, content] of filesOf(example, rule)) {
        mkdirSync(dirname(join(cwd, path)), { recursive: true });
        writeFileSync(join(cwd, path), content);
      }
      const { ignorePatterns: _ignored, ...boundaries } = config;
      const files = {
        ...TEMPLATE,
        ".fallowrc.json": boundaries,
        ".oxlintrc.json": oxlintConfig(oxlintOverrides(a)),
      };
      for (const [name, body] of Object.entries(files))
        writeFileSync(join(cwd, name), JSON.stringify(body, null, 2));
      prepared.set(key, { cwd, ran: new Map() });
    }
    return prepared.get(key)!;
  };
  const run = async (tool: Tool, example: string, rule?: string): Promise<Hits> => {
    const p = prepare(example, rule);
    if (!p.ran.has(tool)) p.ran.set(tool, await tools[tool](p.cwd));
    return p.ran.get(tool)!;
  };

  return {
    /** Files of case `example` (under `## rule`) that violate `rule`, each with the owning tools that reported it. */
    violations: async (example: string, rule: string): Promise<Findings> => {
      const found: Findings = new Map();
      for (const tool of TOOLS)
        if (owners[tool].has(rule))
          for (const f of (await run(tool, example, rule)).get(rule) ?? [])
            (found.get(f) ?? found.set(f, new Set()).get(f)!).add(tool);
      return new Map([...found].sort(([a], [b]) => a.localeCompare(b)));
    },
    /** Every violation of the reference module, restricted to the given rule ids: `{ rule: [files] }`. */
    all: async (example: string, rules: Set<string>): Promise<Record<string, string[]>> => {
      const out: Record<string, string[]> = {};
      for (const tool of TOOLS)
        for (const [id, files] of await run(tool, example))
          if (rules.has(id)) out[id] = [...new Set([...(out[id] ?? []), ...files])].sort();
      return out;
    },
  };
};
