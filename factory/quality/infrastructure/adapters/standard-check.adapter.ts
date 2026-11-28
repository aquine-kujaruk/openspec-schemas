import type { Architecture, Rule } from "../acl/inspection.acl.ts";
import type { RulesPorts } from "./standard-check-contract.adapter.ts";

export const createRules = ({
  workingDirectory,
  existsSync,
  writeFileSync,
  join,
  projectFiles,
  COVERAGE_RULE,
  layersOf,
  oxlintOverrides,
  withUpstream,
  cacheDir,
  product,
  readFileSync,
  digest,
}: RulesPorts): typeof import("./standard-check-contract.adapter.ts") => {
  const projectTsconfig = (): string => {
    const own = join(product.root, "tsconfig.json");
    if (product.root !== "." && existsSync(own)) return own;
    if (existsSync("tsconfig.json")) return "tsconfig.json";
    const root = workingDirectory();
    const path = join(cacheDir(root), "tsconfig.json");

    writeFileSync(
      path,
      JSON.stringify({
        compilerOptions: {
          target: "es2023",
          module: "esnext",
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          jsx: "preserve",
          noEmit: true,
          skipLibCheck: true,
        },
        include: [`${root}/**/*.ts`, `${root}/**/*.tsx`],
        exclude: [`${root}/**/node_modules/**`],
      }),
    );

    return path;
  };

  const archunitRules = (
    a: Architecture,
    tsconfig?: string,
  ): Array<{ layer: string; rules: Rule[] }> =>
    layersOf(a).map((l) => ({
      layer: l.name,
      rules:
        l.archunit?.({
          files: () => projectFiles(tsconfig ?? projectTsconfig()),
          opts: { allowEmptyTests: true },
        }) ?? [],
    }));

  const ID_IN_MESSAGE = /\[([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;

  const idsInMessages = (text: string): string[] =>
    [...text.matchAll(ID_IN_MESSAGE)].map((m) => m[1]);

  const idsOf = (a: Architecture, ids: Set<string>): Set<string> => {
    const only = {
      ...a,
      workstreams: a.workstreams.filter((w) => ids.has(w.id)),
    };

    const fallow = layersOf(only).flatMap((l) =>
      [
        ...(l.fallow?.boundaries ?? []),
        ...(l.fallow?.forbiddenCalls ?? []),
      ].flatMap((r) => (r.id ? [r.id] : [])),
    );

    const oxlint = idsInMessages(JSON.stringify(oxlintOverrides(only)));

    const archunit = archunitRules(only).flatMap((l) =>
      l.rules.map((r) => r.id),
    );

    const checks = only.workstreams.flatMap((w) => w.checks.map((c) => c.id));

    return new Set([
      ...fallow,
      ...oxlint,
      ...archunit,
      ...checks,
      ...(fallow.length ? [COVERAGE_RULE] : []),
    ]);
  };

  const ownRuleIds = (a: Architecture, workstream: string): Set<string> =>
    idsOf(a, new Set([workstream]));

  const ruleIds = (a: Architecture, workstream: string): Set<string> =>
    idsOf(a, new Set(withUpstream(a.workstreams, workstream).map((w) => w.id)));

  const deterministicIds = (a: Architecture): Set<string> =>
    new Set([
      ...idsOf(a, new Set(a.workstreams.map((w) => w.id))),
      ...(a.checks ?? []).map((c) => c.id),
    ]);

  const sections = (text: string): Array<{ heading: string; body: string }> =>
    text.split(/^## /m).slice(1).map((part) => ({
      heading: part.slice(0, part.indexOf("\n")).trim(),
      body: part,
    }));

  const messagesWith = (value: unknown, id: string): string[] => {
    if (typeof value === "string") return value.includes(`[${id}]`) ? [value] : [];
    if (Array.isArray(value)) return value.flatMap((item) => messagesWith(item, id));

    return value && typeof value === "object"
      ? Object.values(value).flatMap((item) => messagesWith(item, id))
      : [];
  };

  const ledger = (
    a: Architecture,
    exampleFiles: string[],
    rubricFiles: string[],
  ): Record<string, string> => {
    const examples = exampleFiles.flatMap((file) => sections(readFileSync(file, "utf8")));

    const casesOf = (id: string) =>
      examples.filter(({ heading }) => heading === id || heading.startsWith(`${id} ·`)).map(({ body }) => body);

    const titles = new Map(
      archunitRules(a).flatMap((l) => l.rules.map((r) => [r.id, r.title] as const)),
    );

    const overrides = oxlintOverrides(a);

    const fallow = new Map(
      layersOf(a).flatMap((l) =>
        [...(l.fallow?.boundaries ?? []), ...(l.fallow?.forbiddenCalls ?? [])]
          .flatMap((r) => (r.id ? [[r.id, JSON.stringify(r)] as const] : [])),
      ),
    );

    const checks = new Map(
      [...a.workstreams.flatMap((w) => w.checks), ...(a.checks ?? [])].map((c) => [c.id, c.args.join(" ")] as const),
    );

    const rules = [...deterministicIds(a)].map((id) => [
      id,
      [titles.get(id), fallow.get(id), checks.get(id), ...messagesWith(overrides, id)].filter(Boolean).join("\n"),
    ] as const);

    const rows = rubricFiles.flatMap((file) =>
      readFileSync(file, "utf8").split("\n").flatMap((line) => {
        const id = /^\|\s*(S\d+)\s*\|/.exec(line)?.[1];

        return id ? [[id, line] as const] : [];
      }),
    );

    return Object.fromEntries(
      [...rules, ...rows]
        .map(([id, definition]) => [id, digest([id, definition, ...casesOf(id)].join("\n"))] as const)
        .sort(([left], [right]) => left.localeCompare(right)),
    );
  };

  return { archunitRules, idsInMessages, ownRuleIds, ruleIds, deterministicIds, ledger };
};
