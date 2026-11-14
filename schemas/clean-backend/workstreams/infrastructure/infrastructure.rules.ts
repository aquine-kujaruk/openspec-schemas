import { globSync, readFileSync } from "node:fs";
import {
  type ClassDecl,
  classesOf,
  constructorParams,
  importsOf,
  namesTheRoleRule,
  not,
  throwsDomainExceptionsRule,
  vocabularyRules,
} from "../../../../toolkit/archunit.ts";
import { coreRules, restrictedGlobals, restrictedImports } from "../../../../toolkit/oxlint.ts";
import type { Layer } from "../../../../toolkit/types.ts";
import type { Options } from "../../../../toolkit/types.ts";
import { schemaPackageVeto } from "../../../../toolkit/oxlint.ts";

/** Classes of the module's `infrastructure/repository-implementations` of `path`, by name (the first declaration wins). */
const repositoryClasses = (path: string): Map<string, ClassDecl> => {
  const moduleDir = path.replace(/\/infrastructure\/repository-implementations\/.*$/, "");
  const classes = new Map<string, ClassDecl>();
  for (const file of globSync(
    `${moduleDir}/infrastructure/repository-implementations/**/*.ts`,
  ).sort())
    for (const c of classesOf(readFileSync(file, "utf8")))
      if (!classes.has(c.name)) classes.set(c.name, c);
  return classes;
};

/** A class reaches a repository interface: it implements `XRepositoryInterface`, or extends a class of the set that does. */
const reachesInterface = (
  c: ClassDecl,
  classes: Map<string, ClassDecl>,
  seen = new Set<string>(),
): boolean => {
  if (c.implements.some((n) => /^\w+RepositoryInterface$/.test(n))) return true;
  const base = c.extends === undefined ? undefined : classes.get(c.extends);
  if (!base || seen.has(c.name)) return false;
  seen.add(c.name);
  return reachesInterface(base, classes, seen);
};

/** The subfolder of infrastructure the adapters layer owns; this layer's rules stop there. */
const ADAPTERS = "infrastructure/adapters";

/** Infrastructure: ACL | repository implementation, plus the emergent folders the configuration declares. Implements the application interfaces against the real world through the ACLs; the adapters behind them are a layer of their own. Spec: `openspec/specs/architecture/infrastructure`. */
export const infrastructure = (o: Options): Layer => {
  /** Folder → file suffix (infrastructure-vocabulary); `adapters` is admitted, and the adapters layer names its files. */
  const vocabulary: Record<string, string> = {
    adapters: "",
    acl: "acl.ts",
    "repository-implementations": "repository-implementation.ts",
    ...o.emergent,
  };
  const notAdapters = Object.keys(vocabulary).filter((f) => f !== "adapters");
  return {
    name: "infrastructure",
    fallow: {
      zones: [
        {
          name: "infrastructure",
          patterns: notAdapters.map((f) => `${o.modules}/infrastructure/${f}/**`),
        },
      ],
      boundaries: [
        {
          id: "infrastructure-imports-only-core",
          from: "infrastructure",
          allow: ["application", "domain"],
        },
      ],
      // The environment lives in adapters, a zone of its own; oxlint does only-adapters-touch-environment here.
      forbiddenCalls: [],
    },
    oxlint: (platform) => [
      {
        files: [`${o.modules}/infrastructure/acl/**`],
        rules: restrictedImports(
          "no-framework-import",
          o.frameworks.infrastructure.packages,
          o.frameworks.infrastructure.patterns,
          "infrastructure imports no framework",
        ),
      },
      // schema-package-only-at-boundaries: only acl (and adapters, another layer) declare shapes in infrastructure.
      {
        files: notAdapters
          .filter((f) => f !== "acl")
          .map((f) => `${o.modules}/infrastructure/${f}/**`),
        rules: coreRules(
          o.frameworks.infrastructure,
          { ...platform, all: [] },
          "infrastructure imports no framework",
          [schemaPackageVeto(o)],
        ),
      },
      // only-adapters-touch-environment: the environment (network, storage, browser) lives only in adapters; repositories and ACLs compose adapters.
      {
        files: [
          `${o.modules}/infrastructure/repository-implementations/**`,
          `${o.modules}/infrastructure/acl/**`,
        ],
        rules: restrictedGlobals(
          "only-adapters-touch-environment",
          platform.all,
          "in infrastructure/adapters",
        ),
      },
    ],
    archunit: (ctx) => [
      ...vocabularyRules("infrastructure-vocabulary", "infrastructure", o.modules, vocabulary)(ctx),
      {
        id: "repository-implements-interface",
        title:
          "repository implementation: every class reaches XRepositoryInterface (implements it, or extends a class of repository-implementations that does); a concrete class is XRepositoryImplementation",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/infrastructure/repository-implementations/**`)
            .should()
            .adhereTo((f) => {
              const classes = repositoryClasses(f.path);
              return classesOf(f.content).every(
                (c) =>
                  reachesInterface(c, classes) &&
                  (c.abstract || /^\w+RepositoryImplementation$/.test(c.name)),
              );
            }, "[repository-implements-interface] `class XRepositoryImplementation implements XRepositoryInterface`, or `extends` a class of repository-implementations that does; the technology goes in the adapter, not in the name")
            .check(ctx.opts),
      },
      {
        id: "repository-depends-on-acl",
        title:
          "repository implementation constructor parameters are typed by <Name>Acl and the file imports nothing from adapters",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/infrastructure/repository-implementations/**`)
            .should()
            .adhereTo(
              (f) =>
                importsOf(f).every((i) => !/\/adapters\/[\w-]+\.adapter$/.test(i.resolved)) &&
                constructorParams(f.content).every((params) =>
                  params.every((p) => /^\w+Acl$/.test(p.type ?? "")),
                ),
              "[repository-depends-on-acl] type every constructor parameter as <Name>Acl and import no adapter: the composition root injects the adapter",
            )
            .check(ctx.opts),
      },
      {
        id: "repository-never-news-adapter",
        title: "repository implementations construct no adapter",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/infrastructure/repository-implementations/**`)
            .should()
            .adhereTo(
              not(/\bnew \w+Adapter\(/),
              "[repository-never-news-adapter] no `new XAdapter(` in a repository: the adapter is injected through its ACL",
            )
            .check(ctx.opts),
      },
      namesTheRoleRule("infrastructure", o.modules, ADAPTERS)(ctx),
      throwsDomainExceptionsRule("infrastructure", o.modules, ADAPTERS)(ctx),
    ],
  };
};
