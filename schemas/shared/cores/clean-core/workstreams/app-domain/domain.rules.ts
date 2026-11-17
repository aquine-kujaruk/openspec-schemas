import { sourceStem } from "../../source-path.ts";
import { globSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  classesOf,
  constructorBody,
  has,
  importsOf,
  not,
  vocabularyRules,
} from "factory/sdk";
import { coreRules } from "factory/sdk";
import type { Layer } from "factory/sdk";
import type { Options } from "factory/sdk";
import { schemaPackageVeto } from "factory/sdk";

/** Folder → file suffix (domain-vocabulary). */
const VOCABULARY = {
  entities: "entity.ts",
  aggregates: "aggregate.ts",
  "value-objects": "value-object.ts",
  schemas: "schema.ts",
  exceptions: "exceptions.ts",
  services: "service.ts",
};

/** Property names that hold a closed set: compared through their enum, never with a literal (no-magic-closed-set-strings). */
const CLOSED_SET = "(status|type|kind|mode|state|code)";
const MAGIC = [
  new RegExp(`\\.${CLOSED_SET}\\s*[!=]==?\\s*["'\`]`),
  new RegExp(`["'\`][^"'\`\\n]*["'\`]\\s*[!=]==?\\s*[\\w$.]+\\.${CLOSED_SET}\\b`),
  new RegExp(`switch\\s*\\(\\s*[\\w$.]+\\.${CLOSED_SET}\\s*\\)\\s*\\{[\\s\\S]*?case\\s*["'\`]`),
];

/** Domain: entity | aggregate | value object | schema | exception | service. Imports nothing. Spec: `openspec/specs/architecture/domain`. */
export const domain = (o: Options): Layer => {
  const root = o.modules.replace(/\/\*$/, "");
  const inShared = (path: string) => path.startsWith(`${root}/shared/`);
  /** The resolved import that binds `name` from a `shared/domain/<folder>` file of the given kind. */
  const fromShared = (f: { path: string; content: string }, name: string, folder: string) =>
    importsOf(f).some(
      (i) =>
        i.names.includes(name) &&
        new RegExp(`^${root}/shared/domain/${folder}/[\\w-]+\\.[\\w-]+$`).test(sourceStem(i.resolved)),
    );
  return {
    name: "domain",
    fallow: {
      zones: [
        {
          name: "domain",
          patterns: Object.keys(VOCABULARY).map((f) => `${o.modules}/domain/${f}/**`),
        },
      ],
      boundaries: [{ id: "domain-imports-only-domain", from: "domain", allow: [] }],
      forbiddenCalls: [{ id: "no-environment", from: "domain", what: "all" }],
    },
    oxlint: (platform) => [
      {
        files: [`${o.modules}/domain/schemas/**`],
        rules: coreRules(o.frameworks.core, platform, "domain imports no framework"),
      },
      {
        files: Object.keys(VOCABULARY)
          .filter((f) => f !== "schemas")
          .map((f) => `${o.modules}/domain/${f}/**`),
        rules: coreRules(o.frameworks.core, platform, "domain imports no framework", [
          schemaPackageVeto(o),
        ]),
      },
    ],
    archunit: (ctx) => [
      ...vocabularyRules("domain-vocabulary", "domain", o.modules, VOCABULARY)(ctx),
      {
        id: "entity-validates-with-schema",
        title:
          "entities, aggregates and value objects validate in the constructor with validateSchema(this, XSchema, props) from shared/domain/schemas",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/domain/{entities,aggregates,value-objects}/**`)
            .should()
            .adhereTo(
              (f) =>
                importsOf(f).some(({ specifier }) =>
                  /^\.\.\/schemas\/[\w-]+\.schema$/.test(sourceStem(specifier)),
                ) &&
                fromShared(f, "validateSchema", "schemas") &&
                /\bvalidateSchema\(\s*this\s*,\s*\w+Schema\s*,/.test(
                  constructorBody(f.content) ?? "",
                ),
              "[entity-validates-with-schema] import your schema from `../schemas/*.schema` and call `validateSchema(this, XSchema, props)` from shared/domain/schemas in the constructor",
            )
            .check(ctx.opts),
      },
      {
        id: "aggregate-composes-domain-objects",
        title: "aggregates import an entity or value object and hold it as a property",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/domain/aggregates/**`)
            .should()
            .adhereTo((f) => {
              const composed = importsOf(f)
                .filter((i) =>
                  /\/(entities|value-objects)\/[\w-]+\.(entity|value-object)$/.test(sourceStem(i.resolved)),
                )
                .flatMap((i) => i.names);
              return composed.some((name) =>
                new RegExp(
                  `^\\s+(?:(?:public|private|protected|readonly|override)\\s+)*\\w+\\s*[?!]?:\\s*[^;=\\n]*\\b${name}\\b`,
                  "m",
                ).test(f.content),
              );
            }, "[aggregate-composes-domain-objects] an aggregate composes: import an entity or value object of the module (or of shared) and hold it as a property")
            .check(ctx.opts),
      },
      {
        id: "exception-extends-domain-exception",
        title:
          "every module has one base exception extending DomainException from shared/domain/exceptions, and every other exception class of the module reaches it; only shared declares DomainException",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/domain/exceptions/**`)
            .should()
            .adhereTo((f) => {
              if (inShared(f.path))
                return classesOf(f.content).every(
                  (c) => c.name === "DomainException" || c.extends === "DomainException",
                );
              const folder = dirname(f.path);
              const files = globSync(`${folder}/*.exceptions.ts`).map((path) => ({
                path,
                content: path === f.path ? f.content : readFileSync(path, "utf8"),
              }));
              const declared = files.flatMap((file) =>
                classesOf(file.content).map((c) => ({
                  ...c,
                  base: fromShared(file, "DomainException", "exceptions"),
                })),
              );
              const byName = new Map(declared.map((c) => [c.name, c]));
              const bases = declared.filter((c) => c.extends === "DomainException" && c.base);
              const reaches = (name: string, seen = new Set<string>()): boolean => {
                const c = byName.get(name);
                if (!c?.extends || seen.has(name)) return false;
                if (c.extends === "DomainException") return c.base;
                seen.add(name);
                return reaches(c.extends, seen);
              };
              return (
                bases.length === 1 &&
                classesOf(f.content).every((c) => c.name !== "DomainException" && reaches(c.name))
              );
            }, "[exception-extends-domain-exception] the module declares one base `class XException extends DomainException` (DomainException imported from shared/domain/exceptions) and every other exception class of the module extends it, directly or through another of the module's exceptions")
            .check(ctx.opts),
      },
      {
        id: "closed-set-lives-in-schema",
        title:
          "enums of the core are declared in domain/schemas (an external contract's enum may live in infrastructure/acl)",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/{domain,application,infrastructure}/**`)
            .should()
            .adhereTo(
              (f) =>
                /\/(domain\/schemas|infrastructure\/acl)\//.test(f.path) ||
                !/^\s*(?:export\s+)?(?:declare\s+)?(?:const\s+)?enum\s+\w+/m.test(f.content),
              "[closed-set-lives-in-schema] declare the enum in domain/schemas next to the schema that validates it",
            )
            .check(ctx.opts),
      },
      {
        id: "no-magic-closed-set-strings",
        title:
          "no core file compares status|type|kind|mode|state|code with a string literal nor switches over it with literal cases",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/{domain,application,infrastructure}/**`)
            .should()
            .adhereTo(
              (f) => !MAGIC.some((re) => re.test(f.content)),
              "[no-magic-closed-set-strings] compare with the enum member (`x.status === OrderStatus.PAID`), never with a literal",
            )
            .check(ctx.opts),
      },
      {
        id: "domain-service-named-by-policy",
        title:
          "domain services export one class XService named by the policy it implements (never Helper, Util, Manager, Common, Rules, Filters)",
        check: () =>
          ctx
            .files()
            .inFolder(`${o.modules}/domain/services/**`)
            .should()
            .adhereTo(
              (f) =>
                has(/export class \w+Service\b/)(f) &&
                not(/export class \w*(Helper|Utils?|Manager|Common|Rules|Filters)\w*\b/)(f),
              "[domain-service-named-by-policy] `export class XService` where X names the business policy",
            )
            .check(ctx.opts),
      },
    ],
  };
};
