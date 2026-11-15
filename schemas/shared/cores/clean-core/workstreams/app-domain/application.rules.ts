import {
  constructorParams,
  has,
  pascal,
  vocabularyRules,
} from "../../../../../../toolkit/architecture/archunit.ts";
import { coreRules } from "../../../../../../toolkit/architecture/oxlint.ts";
import type { Layer } from "../../../../../../toolkit/core/types.ts";
import type { Options } from "../../../../../../toolkit/core/types.ts";
import { schemaPackageVeto } from "../../../../../../toolkit/architecture/oxlint.ts";

/** Folder → file suffix (application-vocabulary). */
const VOCABULARY = {
  "use-cases": "use-case.ts",
  "repository-interfaces": "repository-interface.ts",
};

/** The bodies of every `export interface XRepositoryInterface { … }` of a file. */
const interfaceBodies = (content: string): string[] =>
  [...content.matchAll(/export interface \w+RepositoryInterface\b[^{]*\{([^}]*)\}/g)].map(
    (m) => m[1]!,
  );

/** A method of an interface body: `name(params): ReturnType;`. */
const METHOD = /^\s*(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*:\s*([^;]+);/gm;

/** Application: use case | repository interface. The entry to the core; decides *what happens*. Only imports domain. Spec: `openspec/specs/architecture/application`. */
export const application = (o: Options): Layer => ({
  name: "application",
  fallow: {
    zones: [
      {
        name: "application",
        patterns: Object.keys(VOCABULARY).map((f) => `${o.modules}/application/${f}/**`),
      },
    ],
    boundaries: [{ id: "application-imports-only-domain", from: "application", allow: ["domain"] }],
    forbiddenCalls: [{ id: "no-environment", from: "application", what: "all" }],
  },
  oxlint: (platform) => [
    {
      files: [`${o.modules}/application/**`],
      rules: coreRules(o.frameworks.core, platform, "application imports no framework", [
        schemaPackageVeto(o),
      ]),
    },
  ],
  archunit: (ctx) => [
    ...vocabularyRules("application-vocabulary", "application", o.modules, VOCABULARY)(ctx),
    {
      id: "use-case-is-class-with-execute",
      title: "use case: class *UseCase with execute()",
      check: () =>
        ctx
          .files()
          .inFolder(`${o.modules}/application/use-cases/**`)
          .should()
          .adhereTo(
            (f) => /export class \w+UseCase\b/.test(f.content) && /\bexecute\(/.test(f.content),
            "[use-case-is-class-with-execute] `export class XUseCase { execute() }`",
          )
          .check(ctx.opts),
    },
    {
      id: "repository-contract-is-interface",
      title:
        "repository interface in application: export interface XRepositoryInterface, named after its file, no I prefix",
      check: () =>
        ctx
          .files()
          .inFolder(`${o.modules}/application/repository-interfaces/**`)
          .should()
          .adhereTo(
            (f) =>
              has(
                new RegExp(
                  `export interface ${pascal(f.name.replace(/\.repository-interface$/, ""))}RepositoryInterface\\b`,
                ),
              )(f),
            "[repository-contract-is-interface] `export interface XRepositoryInterface` in x.repository-interface.ts (no `I` prefix)",
          )
          .check(ctx.opts),
    },
    {
      id: "repository-method-naming",
      title:
        "repository interface methods are <verb><Noun>, never fetch; get never returns null, find does",
      check: () =>
        ctx
          .files()
          .inFolder(`${o.modules}/application/repository-interfaces/**`)
          .should()
          .adhereTo(
            (f) =>
              interfaceBodies(f.content).every((body) =>
                [...body.matchAll(METHOD)].every(([, name, returns]) => {
                  const verb = /^[a-z]+/.exec(name!)?.[0];
                  const nullable = /\b(null|undefined)\b/.test(returns!);
                  if (!/^[a-z]+[A-Z]\w*$/.test(name!) || verb === "fetch") return false;
                  if (verb === "get") return !nullable;
                  if (verb === "find") return nullable;
                  return true;
                }),
              ),
            "[repository-method-naming] name methods <verb><Noun> (never fetch); `getX` never returns null|undefined, `findX` does",
          )
          .check(ctx.opts),
    },
    {
      id: "use-case-depends-on-contracts",
      title:
        "use case constructor parameters are typed by XRepositoryInterface or another XUseCase",
      check: () =>
        ctx
          .files()
          .inFolder(`${o.modules}/application/use-cases/**`)
          .should()
          .adhereTo(
            (f) =>
              constructorParams(f.content).every((params) =>
                params.every((p) => /^\w+(RepositoryInterface|UseCase)$/.test(p.type ?? "")),
              ),
            "[use-case-depends-on-contracts] type every constructor parameter as XRepositoryInterface or XUseCase: never an adapter, an implementation or a platform object",
          )
          .check(ctx.opts),
    },
  ],
});
