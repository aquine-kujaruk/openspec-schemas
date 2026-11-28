import { globSync, statSync } from "node:fs";
import { basename } from "node:path";
import { codeOnly, glued, not } from "factory/sdk";
import type { Layer } from "factory/sdk";
import type { Options } from "factory/sdk";

/** Where the core declares no `any`: adapters and the entry are the boundary and keep their freedom. */
const NO_ANY_FOLDERS = [
  "domain",
  "application",
  "infrastructure/repository-implementations",
  "infrastructure/acl",
];

/** A comment that switches a rule of the linter or of the boundary tool off, or suppresses or expects a type error. */
const DIRECTIVE =
  /(?:\/\/|\/\*)[^\n]*(?:\b(?:eslint|oxlint)-disable\b|\bfallow-ignore\b|@ts-(?:ignore|nocheck|expect-error)\b)/;
const CAST_THROUGH_UNKNOWN = /\bas\s+unknown\s+as\b/;

/** Cross-module rules: isolation between modules, cycles, no tests inside the product, and what holds for the whole core. Spec: `openspec/specs/architecture/modules`. */
export const modules = (o: Options): Layer => ({
  name: "modules",
  fallow: {
    zones: [{ name: "entry", patterns: o.entry }],
    boundaries: [{ from: "entry", allow: "*" }],
    forbiddenCalls: [],
  },
  archunit: (ctx) => {
    const root = o.modules.replace(/\/\*$/, "");
    // The modules are read when a rule is checked, not when the rules are built: the rule ids exist
    // whatever the root holds (empty, one module, many), and each check sees the folder it runs in.
    const present = () =>
      globSync(o.modules)
        .filter((d) => statSync(d).isDirectory())
        .map((d) => basename(d));
    const features = () => present().filter((m) => m !== "shared");
    const noImport = (from: string, to: string) =>
      ctx
        .files()
        .inFolder(`${root}/${from}/**`)
        .shouldNot()
        .dependOnFiles()
        .inFolder(`${root}/${to}/**`)
        .check(ctx.opts);
    const all = async (checks: Promise<unknown[]>[]) => (await Promise.all(checks)).flat();
    return [
      {
        id: "modules-are-isolated",
        title: `a module in ${root} imports no other module (only shared)`,
        check: () =>
          all(
            features().flatMap((from) =>
              features()
                .filter((to) => to !== from)
                .map((to) => noImport(from, to)),
            ),
          ),
      },
      {
        id: "shared-imports-no-module",
        title: `${root}/shared imports no module`,
        check: () =>
          all(present().includes("shared") ? features().map((to) => noImport("shared", to)) : []),
      },
      {
        id: "no-import-cycles",
        title: `no cycles in ${root}`,
        check: () => ctx.files().inFolder(`${root}/**`).should().haveNoCycles().check(ctx.opts),
      },
      {
        id: "no-tests-in-src",
        title: `no test inside ${root}: testing lives in test/ by kind`,
        check: () =>
          ctx
            .files()
            .inFolder(`${root}/**`)
            .shouldNot()
            .haveName(/\.(test|spec)\.tsx?$/)
            .check(ctx.opts),
      },
      {
        id: "code-breathes",
        title: `statements in ${root} leave a blank line around blocks and before returns or throws`,
        check: () =>
          ctx
            .files()
            .inFolder(`${root}/**`)
            .should()
            .adhereTo(
              (file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file.name) || glued(file.content, file.path).length === 0,
              "[code-breathes] leave a blank line between statements when either takes multiple lines or the latter is a return or throw",
            )
            .check(ctx.opts),
      },
      {
        id: "no-any-in-core",
        title: `no \`any\` in ${NO_ANY_FOLDERS.join(", ")}`,
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/{${NO_ANY_FOLDERS.join(",")}}/**`)
            .should()
            .adhereTo(
              (f) => !/\bany\b/.test(codeOnly(f.content)),
              "[no-any-in-core] raw data enters typed as an unknown record in an adapter and leaves the ACL validated; the core declares no any",
            )
            .check(ctx.opts),
      },
      {
        id: "no-harness-escapes",
        title: "product code switches off no lint rule and no type error, and casts through no unknown",
        check: () =>
          all(
            [`${root}/**`, `${o.acceptance}/**`, `${o.integration}/**`].map((folder) =>
              ctx
                .files()
                .inFolder(folder)
                .should()
                .adhereTo(
                  (f) => !DIRECTIVE.test(f.content) && !CAST_THROUGH_UNKNOWN.test(codeOnly(f.content)),
                  "[no-harness-escapes] fix what the linter or the type checker reports: no directive that disables a lint rule, no comment that suppresses or expects a type error, no cast through unknown",
                )
                .check(ctx.opts),
            ),
          ),
      },
      {
        id: "no-raw-error-in-core",
        title: "domain and application throw no raw Error",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/{domain,application}/**`)
            .should()
            .adhereTo(
              not(/\bthrow new Error\(/),
              "[no-raw-error-in-core] throw a domain exception that extends DomainException and carries its cause, never `new Error(`",
            )
            .check(ctx.opts),
      },
    ];
  },
});
