import { existsSync, readdirSync, readFileSync } from "node:fs";
import {
  classesOf,
  codeOnly,
  constructorParams,
  namesTheRoleRule,
  pascal,
  throwsDomainExceptionsRule,
} from "factory/sdk";
import { restrictedImports } from "factory/sdk";
import type { Layer } from "factory/sdk";
import type { Options } from "factory/sdk";

const EXTERNAL_IMPORT = /^import\s+(?!type\b)[^;]*?from\s+["'](?!\.)[^"']+["']/m;
const PLATFORM_GLOBAL = /\b(?:fetch|process|globalThis|window|document|localStorage|sessionStorage|indexedDB|navigator|location|console|setTimeout|setInterval|crypto|WebSocket|XMLHttpRequest)\b/;
const FUNCTION_TYPE = /^\(|=>|\["\w+"\]$/;

const forwardsAFunction = (content: string): boolean =>
  !EXTERNAL_IMPORT.test(content) &&
  !PLATFORM_GLOBAL.test(codeOnly(content)) &&
  constructorParams(content).flat().some((p) => FUNCTION_TYPE.test(p.type ?? ""));

/** The folder this layer owns, inside each module's infrastructure. */
const FOLDER = "infrastructure/adapters";

/** The ACL interfaces a module declares (`acl/<name>.acl.ts` → `<Name>Acl`), from the path of any of its infrastructure files. */
const aclsOf = (path: string): Set<string> => {
  const dir = `${path.replace(/\/infrastructure\/.*$/, "")}/infrastructure/acl`;
  return new Set(
    existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith(".acl.ts"))
          .map((f) => `${pascal(f.replace(/\.acl\.ts$/, ""))}Acl`)
      : [],
  );
};

/** Adapters: the resource adapters behind the anti-corruption layers, the only place where the environment lives. Built apart from repositories, with the ACL as their seam. Spec: `openspec/specs/architecture/adapters`. */
export const adapters = (o: Options): Layer => {
  const root = o.modules.replace(/\/\*$/, "");
  const at = `${o.modules}/${FOLDER}/**`;
  return {
    name: "adapters",
    fallow: {
      zones: [{ name: "adapters", patterns: [at] }],
      boundaries: [
        {
          id: "infrastructure-imports-only-core",
          from: "adapters",
          allow: ["infrastructure", "application", "domain"],
        },
      ],
      // The environment lives here.
      forbiddenCalls: [],
    },
    oxlint: () => [
      {
        files: [at],
        rules: restrictedImports(
          "no-framework-import",
          o.frameworks.infrastructure.packages,
          o.frameworks.infrastructure.patterns,
          "infrastructure imports no framework",
        ),
      },
    ],
    archunit: (ctx) => [
      {
        id: "infrastructure-vocabulary",
        title: `${FOLDER}: files *.adapter.ts`,
        check: () =>
          ctx
            .files()
            .inFolder(at)
            .should()
            .haveName(/\.adapter\.ts$/)
            .check(ctx.opts),
      },
      {
        id: "acl-adapter-paired",
        title:
          "every acl/<name>.acl.ts exports interface <Name>Acl and an adapter *<name>.adapter.ts of the module implements it",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/infrastructure/acl/**`)
            .should()
            .adhereTo((f) => {
              const name = f.name.replace(/\.acl$/, "");
              const acl = `${pascal(name)}Acl`;
              const declaresAcl = new RegExp(`export interface ${acl}\\b`).test(f.content);
              if (!declaresAcl && new RegExp(`export type ${pascal(name)}Port\\b`).test(f.content)) return true;
              if (!declaresAcl) return false;
              const dir = `${f.path.replace(/\/infrastructure\/acl\/.*$/, "")}/${FOLDER}`;
              return (
                existsSync(dir) &&
                readdirSync(dir)
                  .filter((a) => a.endsWith(`${name}.adapter.ts`))
                  .some((a) =>
                    classesOf(readFileSync(`${dir}/${a}`, "utf8")).some((c) =>
                      c.implements.includes(acl),
                    ),
                  )
              );
            }, "[acl-adapter-paired] `export interface <Name>Acl` in acl/<name>.acl.ts, implemented by an adapter of the module named *<name>.adapter.ts")
            .check(ctx.opts),
      },
      {
        id: "adapter-wraps-external-system",
        title: "every adapter wraps a package, a platform module or global, or holds an in-memory stand-in; none only forwards a function it received",
        check: () =>
          ctx
            .files()
            .inFolder(at)
            .should()
            .adhereTo(
              (f) => !forwardsAFunction(f.content),
              "[adapter-wraps-external-system] an adapter wraps something outside the code (a package, `node:fs`, `fetch`) or holds an in-memory stand-in; another module's operation reaches the consumer as a `<Name>Port` its repository implementation receives",
            )
            .check(ctx.opts),
      },
      {
        id: "adapter-implements-acl",
        title:
          "every class a module's adapter file exports implements an ACL of the module (shared adapters are the bases and are exempt)",
        check: () =>
          ctx
            .files()
            .inFolder(at)
            .should()
            .adhereTo((f) => {
              if (f.path.startsWith(`${root}/shared/`)) return true;
              const acls = aclsOf(f.path);
              return classesOf(f.content)
                .filter((c) => c.exported)
                .every((c) => c.implements.some((n) => acls.has(n)));
            }, "[adapter-implements-acl] `class HttpXAdapter implements XAcl` for an ACL declared in this module's infrastructure/acl")
            .check(ctx.opts),
      },
      {
        id: "adapter-imports-no-domain-schema",
        title: "adapters import no domain schema: the ACL accommodates the resource's shape",
        check: () =>
          ctx
            .files()
            .inFolder(at)
            .shouldNot()
            .dependOnFiles()
            .inFolder(`${o.modules}/domain/schemas/**`)
            .check(ctx.opts),
      },
      namesTheRoleRule(FOLDER, o.modules)(ctx),
      throwsDomainExceptionsRule(FOLDER, o.modules)(ctx),
    ],
  };
};
