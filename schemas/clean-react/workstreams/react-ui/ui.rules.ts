import { not } from "../../../../toolkit/architecture/archunit.ts";
import { restrictedGlobals } from "../../../../toolkit/architecture/oxlint.ts";
import type { Layer, Options } from "../../../../toolkit/core/types.ts";

const CORE = ["application", "infrastructure", "adapters", "domain"];
const REACT_QUERY_HOOKS = [
  "useQuery",
  "useMutation",
  "useInfiniteQuery",
  "useQueryClient",
  "useQueries",
  "useSuspenseQuery",
];

/** React UI: the JSX of the framework. Pages and components, bridges and the entry. The entry is a zone of the core's `modules` layer; this layer reaches it through the configured entry. Spec: `openspec/specs/architecture/ui`. */
export const ui = (o: Options): Layer => {
  const root = o.modules.replace(/\/\*$/, "");
  const at = (f: string) => `${o.modules}/framework/${f}/**`;
  return {
    name: "ui",
    fallow: {
      zones: [
        { name: "framework-ui", patterns: [at("ui")] },
        { name: "framework-bridges", patterns: [at("bridges")] },
      ],
      boundaries: [
        { from: "framework-bridges", allow: [...CORE, "framework-ui"] },
        {
          id: "ui-reaches-core-through-controllers",
          from: "framework-ui",
          allow: ["domain", "framework-controllers", "framework-view-models"],
        },
      ],
      forbiddenCalls: ["framework-ui", "framework-bridges", "entry"].map((from) => ({
        id: "ui-never-persists",
        from,
        what: "persistence" as const,
      })),
    },
    oxlint: (platform) => [
      {
        files: [at("ui"), at("bridges"), ...o.entry],
        rules: restrictedGlobals(
          "ui-never-persists",
          platform.persistence,
          "in infrastructure/adapters",
        ),
      },
      {
        files: [at("ui")],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@tanstack/react-query",
                  importNames: REACT_QUERY_HOOKS,
                  message:
                    "[ui-reaches-core-through-controllers] ui does not talk to React Query; its controller does",
                },
              ],
            },
          ],
        },
      },
    ],
    archunit: (ctx) => [
      {
        id: "jsx-only-in-ui",
        title: "JSX (.tsx) only in framework/ui, framework/bridges or the entry",
        check: () =>
          ctx
            .files()
            .inFolder(`${root}/**`)
            .withName(/\.tsx$/)
            .should()
            .beInPath(/(\/framework\/(ui|bridges)\/|^[^/]+\/[^/]+\.tsx$)/)
            .check(ctx.opts),
      },
      {
        id: "jsx-neither-compares-nor-counts",
        title:
          "the JSX neither compares nor counts: comparisons and .length live in the controller or the ViewModel",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/framework/ui/**`)
            .withName(/\.tsx$/)
            .should()
            .adhereTo(
              not(/(===|!==|>=|<=|\.length\b)/),
              "[jsx-neither-compares-nor-counts] expose isSelected/isEmpty/count from the controller or the ViewModel",
            )
            .check(ctx.opts),
      },
    ],
  };
};
