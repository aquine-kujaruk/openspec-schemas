import type { LintRules, Platform, Vetoed } from "../acl/inspection.acl.ts";

export type ImportVeto = {
  id: string;
  names: string[];
  patterns: string[];
  message: string;
};

export const restrictedImportsOf = (vetoes: ImportVeto[]): LintRules => ({
  "no-restricted-imports": [
    "error",
    {
      paths: vetoes.flatMap((v) =>
        v.names.map((name) => ({ name, message: `[${v.id}] ${v.message}` })),
      ),
      patterns: vetoes.flatMap((v) =>
        v.patterns.length
          ? [{ group: v.patterns, message: `[${v.id}] ${v.message}` }]
          : [],
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
    ...names.map((name) => ({
      name,
      message: `[${id}] ${name} only ${where}`,
    })),
  ],
});

export const coreRules = (
  vetoed: Vetoed,
  platform: Platform,
  message: string,
  more: ImportVeto[] = [],
): LintRules => ({
  ...restrictedImportsOf([
    {
      id: "no-framework-import",
      names: vetoed.packages,
      patterns: vetoed.patterns,
      message,
    },
    ...more,
  ]),
  ...restrictedGlobals("no-environment", platform.all),
});

export const schemaPackageVeto = (o: {
  schemaPackage: string;
}): ImportVeto => ({
  id: "schema-package-only-at-boundaries",
  names: [o.schemaPackage],
  patterns: [`${o.schemaPackage}/*`],
  message: `${o.schemaPackage} is imported only in domain/schemas, infrastructure/acl and infrastructure/adapters`,
});
