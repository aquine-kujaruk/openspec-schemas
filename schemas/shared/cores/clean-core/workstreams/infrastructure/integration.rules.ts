import { existsSync } from "node:fs";
import type { Layer } from "../../../../../../toolkit/core/types.ts";
import type { Options } from "../../../../../../toolkit/core/types.ts";

/** Integration: one test per repository implementation, over an in-memory adapter typed by the real ACL. Spec: `openspec/specs/architecture/integration`. */
export const integration = (o: Options): Layer => ({
  name: "integration",
  fallow: {
    zones: [{ name: "integration", patterns: [`${o.integration}/**`] }],
    // Black box over the core: it composes the repository implementation with an adapter.
    boundaries: [{ from: "integration", allow: "*" }],
    forbiddenCalls: [],
  },
  oxlint: () => [{ files: [`${o.integration}/**`], rules: { "no-console": "off" } }],
  archunit: (ctx) => {
    const root = o.modules.replace(/\/\*$/, "");
    const path = new RegExp(`^${o.integration}/([^/]+)/([^/]+)-repository\\.test\\.ts$`);
    return [
      {
        id: "integration-test-targets-repository-implementation",
        title: `every integration test targets an existing repository implementation: ${o.integration}/<module>/<x>-repository.test.ts ↔ ${root}/<module>/infrastructure/repository-implementations/<x>.repository-implementation.ts`,
        check: () =>
          ctx
            .files()
            .inFolder(`${o.integration}/**`)
            .should()
            .adhereTo((f) => {
              const m = path.exec(f.path);
              return (
                !!m &&
                existsSync(
                  `${root}/${m[1]}/infrastructure/repository-implementations/${m[2]}.repository-implementation.ts`,
                )
              );
            }, `[integration-test-targets-repository-implementation] the path is ${o.integration}/<module>/<x>-repository.test.ts and that repository implementation exists in ${root}`)
            .check(ctx.opts),
      },
    ];
  },
});
