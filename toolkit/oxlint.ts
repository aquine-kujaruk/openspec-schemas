import type { LintRules, Platform, Vetoed } from "./types.ts";

/** Packages a zone may not import, under one rule id: exact names and patterns (`express/*`). */
export type ImportVeto = { id: string; names: string[]; patterns: string[]; message: string };

/**
 * Several vetoes in one `no-restricted-imports` entry: oxlint keeps one configuration of a rule per
 * file, so two overrides on the same files would replace each other. Every message starts with
 * `[<id>]`: that prefix is how the spec counts the rule's violations.
 */
export const restrictedImportsOf = (vetoes: ImportVeto[]): LintRules => ({
  "no-restricted-imports": [
    "error",
    {
      paths: vetoes.flatMap((v) =>
        v.names.map((name) => ({ name, message: `[${v.id}] ${v.message}` })),
      ),
      patterns: vetoes.flatMap((v) =>
        v.patterns.length ? [{ group: v.patterns, message: `[${v.id}] ${v.message}` }] : [],
      ),
    },
  ],
});

export const restrictedImports = (
  id: string,
  names: string[],
  patterns: string[],
  message: string,
): LintRules => restrictedImportsOf([{ id, names, patterns, message }]);

export const restrictedGlobals = (
  id: string,
  names: string[],
  where = "in infrastructure/adapters",
): LintRules => ({
  "no-restricted-globals": [
    "error",
    ...names.map((name) => ({ name, message: `[${id}] ${name} only ${where}` })),
  ],
});

/** What holds for the whole core: no framework (no-framework-import), nothing from the environment (no-environment), plus any further import veto of the zone. */
export const coreRules = (
  vetoed: Vetoed,
  platform: Platform,
  message: string,
  more: ImportVeto[] = [],
): LintRules => ({
  ...restrictedImportsOf([
    { id: "no-framework-import", names: vetoed.packages, patterns: vetoed.patterns, message },
    ...more,
  ]),
  ...restrictedGlobals("no-environment", platform.all),
});

/**
 * schema-package-only-at-boundaries: the package the configuration names is imported only in
 * domain/schemas, infrastructure/acl and infrastructure/adapters. Each layer merges this veto into
 * its own `no-restricted-imports` entry for the folders it covers.
 */
export const schemaPackageVeto = (o: { schemaPackage: string }): ImportVeto => ({
  id: "schema-package-only-at-boundaries",
  names: [o.schemaPackage],
  patterns: [`${o.schemaPackage}/*`],
  message: `${o.schemaPackage} is imported only in domain/schemas, infrastructure/acl and infrastructure/adapters`,
});
