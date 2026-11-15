import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { projectFiles } from "archunit";
import { COVERAGE_RULE, layersOf, oxlintOverrides } from "./compose.ts";
import { withUpstream } from "./graph.ts";
import { cacheDir } from "../core/paths.ts";
import { product } from "./project.ts";
import type { Architecture, Rule } from "../core/types.ts";

/** The product's tsconfig, else the project's, or one composed over the whole project when it has neither. */
const projectTsconfig = (): string => {
  const own = join(product.root, "tsconfig.json");
  if (product.root !== "." && existsSync(own)) return own;
  if (existsSync("tsconfig.json")) return "tsconfig.json";
  const root = process.cwd();
  const path = join(cacheDir(root), "tsconfig.json");
  writeFileSync(
    path,
    JSON.stringify({
      compilerOptions: {
        target: "es2023",
        module: "esnext",
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        noEmit: true,
        skipLibCheck: true,
      },
      include: [`${root}/**/*.ts`],
      exclude: [`${root}/**/node_modules/**`],
    }),
  );
  return path;
};

/** archunit side: every layer's rules over a tsconfig (the project's or an example's). */
export const archunitRules = (
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

/** A message names its rule as `[<slug>]` (oxlint and archunit messages alike). */
const ID_IN_MESSAGE = /\[([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;

/** Every rule id named in a text, in order. */
export const idsInMessages = (text: string): string[] =>
  [...text.matchAll(ID_IN_MESSAGE)].map((m) => m[1]);

/** Rule ids the given workstreams own, across their three tools and their whole-product checks. */
const idsOf = (a: Architecture, ids: Set<string>): Set<string> => {
  const only = { ...a, workstreams: a.workstreams.filter((w) => ids.has(w.id)) };
  const fallow = layersOf(only).flatMap((l) =>
    [...(l.fallow?.boundaries ?? []), ...(l.fallow?.forbiddenCalls ?? [])].flatMap((r) =>
      r.id ? [r.id] : [],
    ),
  );
  const oxlint = idsInMessages(JSON.stringify(oxlintOverrides(only)));
  const archunit = archunitRules(only).flatMap((l) => l.rules.map((r) => r.id));
  const checks = only.workstreams.flatMap((w) => w.checks.map((c) => c.id));
  return new Set([
    ...fallow,
    ...oxlint,
    ...archunit,
    ...checks,
    ...(fallow.length ? [COVERAGE_RULE] : []),
  ]);
};

/** Rule ids a workstream owns itself. */
export const ownRuleIds = (a: Architecture, workstream: string): Set<string> =>
  idsOf(a, new Set([workstream]));

/** Rule ids a workstream's check evaluates: its own and those of every workstream upstream of it. */
export const ruleIds = (a: Architecture, workstream: string): Set<string> =>
  idsOf(a, new Set(withUpstream(a.workstreams, workstream).map((w) => w.id)));
