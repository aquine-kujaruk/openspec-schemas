import { existsSync, globSync } from "node:fs";
import {
  classesOf,
  codeOnly,
  constructorParams,
  importsOf,
  pascal,
  throws,
} from "../../../../toolkit/archunit.ts";
import type { Layer } from "../../../../toolkit/types.ts";
import type { Options } from "../../../../toolkit/types.ts";
import { deltaSpecGlob, productSpecPath } from "../../../../toolkit/paths.ts";

/**
 * Acceptance: black box against the use cases, generated from the product specs. No layers inside:
 * only the contexts and their use cases. The implementer writes the step adapter, with the
 * repository double in it. Spec: `openspec/specs/architecture/acceptance`.
 */
export const acceptance = (o: Options): Layer => ({
  name: "acceptance",
  fallow: {
    zones: [{ name: "acceptance", patterns: [`${o.acceptance}/**`] }],
    // Black box: may import anything from the product.
    boundaries: [{ from: "acceptance", allow: "*" }],
    forbiddenCalls: [],
  },
  oxlint: () => [{ files: [`${o.acceptance}/**`], rules: { "no-console": "off" } }],
  archunit: (ctx) => {
    const root = o.modules.replace(/\/\*$/, "");
    const behavior = new RegExp(`^${o.acceptance}/([^/]+)/([^/]+)\\.feature\\.(steps|test)\\.ts$`);
    const repository = new RegExp(
      `^${o.acceptance}/([^/]+)/repositories/in-memory-([a-z0-9-]+)\\.repository\\.ts$`,
    );
    const targets = (path: string) => {
      if (repository.test(path)) return true;
      const m = behavior.exec(path);
      return (
        !!m &&
        (existsSync(productSpecPath(o.productSpecs, m[1]!, m[2]!)) ||
          globSync(deltaSpecGlob(o.productSpecs, m[1]!, m[2]!)).length > 0) &&
        existsSync(`${root}/${m[1]}/application/use-cases/${m[2]}.use-case.ts`)
      );
    };
    return [
      {
        id: "acceptance-test-targets-use-case",
        title: `every acceptance file targets a specified use case or is a repository of its module: ${o.acceptance}/<module>/<x>.feature.{steps,test}.ts ↔ ${productSpecPath(o.productSpecs, "<module>", "<x>")} ↔ ${root}/<module>/application/use-cases/<x>.use-case.ts`,
        check: () =>
          ctx
            .files()
            .inFolder(`${o.acceptance}/**`)
            .should()
            .adhereTo(
              (f) => targets(f.path),
              `[acceptance-test-targets-use-case] the path is ${o.acceptance}/<module>/<use-case>.feature.steps.ts (or its generated .feature.test.ts, or repositories/in-memory-<name>.repository.ts), and both its spec (${productSpecPath(o.productSpecs, "<module>", "<use-case>")}, or the delta spec of an active change) and the use case in ${root} exist`,
            )
            .check(ctx.opts),
      },
      {
        id: "acceptance-repository-is-a-repository",
        title: `every file in ${o.acceptance}/<module>/repositories is in-memory-<name>.repository.ts declaring InMemory<Name>Repository implements <Name>RepositoryInterface of its module, with no constructor parameter`,
        check: () =>
          ctx
            .files()
            .inFolder(`${o.acceptance}/*/repositories/**`)
            .should()
            .adhereTo((f) => {
              const m = repository.exec(f.path);
              if (!m) return false;
              const [, module, name] = m;
              const contract = `${pascal(name!)}RepositoryInterface`;
              const imported = importsOf(f).some(
                (i) =>
                  i.names.includes(contract) &&
                  i.resolved.endsWith(
                    `${root}/${module}/application/repository-interfaces/${name}.repository-interface`,
                  ),
              );
              const declared = classesOf(f.content).some(
                (c) =>
                  c.name === `InMemory${pascal(name!)}Repository` &&
                  c.implements.includes(contract),
              );
              return imported && declared && constructorParams(f.content).every((p) => !p.length);
            }, `[acceptance-repository-is-a-repository] ${o.acceptance}/<module>/repositories/in-memory-<name>.repository.ts declares \`class InMemory<Name>Repository implements <Name>RepositoryInterface\`, the interface imported from ${root}/<module>/application/repository-interfaces, and a constructor without parameters`)
            .check(ctx.opts),
      },
      {
        id: "acceptance-throws-domain-exceptions",
        title: `no \`throw new Error(\` under ${o.acceptance}, and a test repository throws only exceptions of its module`,
        check: () =>
          ctx
            .files()
            .inFolder(`${o.acceptance}/**`)
            .should()
            .adhereTo((f) => {
              if (/\bthrow\s+new\s+Error\s*\(/.test(codeOnly(f.content))) return false;
              const m = repository.exec(f.path);
              if (!m) return true;
              const own = new Set(
                importsOf(f)
                  .filter((i) =>
                    new RegExp(`${root}/${m[1]}/domain/exceptions/[\\w-]+\\.exceptions$`).test(
                      i.resolved,
                    ),
                  )
                  .flatMap((i) => i.names),
              );
              return throws(f.content).every((t) => own.has(t.name));
            }, `[acceptance-throws-domain-exceptions] check step data with assertions (expect), never \`throw new Error(\`; a test repository throws the exceptions of its module, imported from ${root}/<module>/domain/exceptions`)
            .check(ctx.opts),
      },
    ];
  },
});
