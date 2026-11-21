import { globSync, readFileSync } from "node:fs";
import { not, vocabularyRules } from "factory/sdk";
import { restrictedGlobals, restrictedImports } from "factory/sdk";
import type { Layer } from "factory/sdk";
import type { Options } from "factory/sdk";

/** Folder → file suffix (framework-vocabulary). ui holds only JSX: pages and components. */
const VOCABULARY = {
  ui: "tsx",
  controllers: "controller.ts",
  queries: "query.ts",
  mutations: "mutation.ts",
  "view-models": "view-model.ts",
  stores: "store.ts",
  bridges: "bridge.tsx",
};
const CORE = ["application", "infrastructure", "adapters", "domain"];
const REACT_PACKAGES = [
  "react",
  "react-dom",
  "react-router-dom",
  "@tanstack/react-query",
  "zustand",
];
const REACT_PATTERNS = ["react/*", "react-dom/*", "zustand/react*", "@tanstack/*"];

/** React framework without its JSX: controllers, queries, mutations, view-models and stores. Spec: `openspec/specs/architecture/framework`. */
export const framework = (o: Options): Layer => {
  const at = (f: string) => `${o.modules}/framework/${f}/**`;
  return {
    name: "framework",
    fallow: {
      zones: Object.keys(VOCABULARY)
        .filter((f) => f !== "ui" && f !== "bridges")
        .map((f) => ({ name: `framework-${f}`, patterns: [at(f)] })),
      boundaries: [
        { id: "view-model-imports-only-domain", from: "framework-view-models", allow: ["domain"] },
        {
          id: "store-imports-domain-and-view-models",
          from: "framework-stores",
          allow: ["domain", "framework-view-models"],
        },
        { from: "framework-queries", allow: CORE },
        { from: "framework-mutations", allow: [...CORE, "framework-queries"] },
        {
          id: "controller-reaches-core-through-queries",
          from: "framework-controllers",
          allow: [
            "domain",
            "framework-queries",
            "framework-mutations",
            "framework-stores",
            "framework-view-models",
          ],
        },
      ],
      forbiddenCalls: ["controllers", "queries", "mutations", "view-models", "stores"].map((f) => ({
        id: "no-environment",
        from: `framework-${f}`,
        what: "all" as const,
      })),
    },
    oxlint: (platform) => [
      // no-framework-import/view-model-imports-only-domain: ViewModels know neither React nor the environment.
      {
        files: [at("view-models")],
        rules: {
          ...restrictedImports(
            "no-framework-import",
            REACT_PACKAGES,
            REACT_PATTERNS,
            "ViewModels do not import React",
          ),
          ...restrictedGlobals("no-environment", platform.all),
        },
      },
      {
        files: [at("controllers"), at("queries"), at("mutations"), at("stores")],
        rules: restrictedGlobals("no-environment", platform.all),
      },
      // store-imports-domain-and-view-models: the store does not read from React Query (two caches never mix).
      {
        files: [at("stores")],
        rules: restrictedImports(
          "store-imports-domain-and-view-models",
          ["@tanstack/react-query"],
          ["@tanstack/*"],
          "the store does not import React Query",
        ),
      },
      {
        files: [at("controllers")],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@tanstack/react-query",
                  importNames: [
                    "useQuery",
                    "useMutation",
                    "useInfiniteQuery",
                    "useQueryClient",
                    "useQueries",
                    "useSuspenseQuery",
                  ],
                  message:
                    "[controller-reaches-core-through-queries] a controller does not talk to React Query; use queries/ and mutations/ (invalidation goes in the mutation)",
                },
              ],
            },
          ],
        },
      },
    ],
    archunit: (ctx) => [
      ...vocabularyRules("framework-vocabulary", "framework", o.modules, VOCABULARY)(ctx),
      {
        id: "query-bridges-use-case",
        title:
          "queries and mutations compose `new XUseCase(new XRepositoryImplementation(xAdapter))` with the adapter instance infrastructure exports (no new XAdapter, no container)",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/framework/{queries,mutations}/**`)
            .should()
            .adhereTo((f) => {
              if (/\bnew \w+Adapter\(/.test(f.content)) return false;
              // The hook is the composition root: every argument of the use case is a repository implementation over an injected adapter.
              const composed =
                /\bnew \w+UseCase\((\s*new \w+RepositoryImplementation\([^()]*\)\s*,?)*\s*\)/.test(
                  f.content,
                );
              const bridge =
                composed && /use(Query|Mutation|InfiniteQuery|SuspenseQuery)\(/.test(f.content);
              // A React Query state reader (useMutationState, useIsMutating, useIsFetching): no use case, no repository.
              const stateReader =
                /use(MutationState|IsMutating|IsFetching)\(/.test(f.content) &&
                !/\bnew \w+\(/.test(f.content);
              return bridge || stateReader;
            }, "[query-bridges-use-case] `new XUseCase(new XRepositoryImplementation(xAdapter))` with the ACL-typed instance an adapter file exports, and useQuery/useMutation; or a state reader (useMutationState) without new")
            .check(ctx.opts),
      },
      {
        id: "one-hook-per-file",
        title:
          "one query or mutation per file, named after its hook (useListOrdersQuery → list-orders.query.ts)",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/framework/{queries,mutations}/**`)
            .should()
            .adhereTo((f) => {
              const hooks = [
                ...f.content.matchAll(/^export (?:const|function) (use[A-Z]\w*)/gm),
              ].map((m) => m[1]!);
              if (hooks.length !== 1) return false;
              const kebab = hooks[0]!
                .replace(/^use/, "")
                .replace(/(Query|Mutation)$/, "")
                .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                .toLowerCase();
              return f.name === `${kebab}.query` || f.name === `${kebab}.mutation`;
            }, "[one-hook-per-file] export exactly one hook use<Name>Query|Mutation and name the file <name>.query.ts | <name>.mutation.ts")
            .check(ctx.opts),
      },
      {
        id: "use-case-bridged-once",
        title:
          "seam application → framework: every use case is instantiated by exactly one query or mutation",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/application/use-cases/**`)
            .should()
            .adhereTo((f) => {
              const name = /export class (\w+UseCase)\b/.exec(f.content)?.[1];
              if (!name) return true;
              const moduleDir = f.path.replace(/\/application\/use-cases\/.*$/, "");
              const bridges = globSync(`${moduleDir}/framework/{queries,mutations}/*.ts`).filter(
                (b) => new RegExp(`new ${name}\\(`).test(readFileSync(b, "utf8")),
              );
              return bridges.length === 1;
            }, "[use-case-bridged-once] the bridge is missing (or duplicated): exactly one file in framework/queries|mutations does `new XUseCase(`")
            .check(ctx.opts),
      },
      {
        id: "controller-exports-no-types",
        title: "controllers declare no separate types: the return type is inferred",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/framework/controllers/**`)
            .should()
            .adhereTo(
              not(/export (type|interface) \w+/),
              "[controller-exports-no-types] no `export type/interface` in a controller; the JSX uses ReturnType<typeof useX>",
            )
            .check(ctx.opts),
      },
      {
        id: "no-hooks",
        title: "hooks live only in the framework: domain, application and infrastructure define no use*",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/{domain,application,infrastructure}/**`)
            .should()
            .adhereTo(
              not(/\b(export )?(const|function) use[A-Z]\w*/),
              "[no-hooks] domain, application and infrastructure define no hooks; a hook belongs to the framework",
            )
            .check(ctx.opts),
      },
      {
        id: "query-keys-from-factory",
        title: "React Query keys come from a factory the query exports, never from a literal",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/framework/**`)
            .should()
            .adhereTo(
              not(
                /(queryKey|setQueryData|invalidateQueries|removeQueries|getQueryData)\s*[:(]\s*(\{\s*queryKey:\s*)?\[/,
              ),
              "[query-keys-from-factory] use the xQueryKey(...) factory the query exports, not an array literal",
            )
            .check(ctx.opts),
      },
    ],
  };
};
