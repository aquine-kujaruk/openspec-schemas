---
change: clean-react
verdict: verified
digest: 5f4586eebfc640d7259ba8a721ff4a8e3436589009f273bd5af1d62a2d8d08d7
---

# Evidence of clean-react

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/framework | framework-vocabulary · framework is a closed vocabulary | `folder-outside-vocabulary` breaks framework-vocabulary | passed |
| architecture/framework | framework-vocabulary · framework is a closed vocabulary | `wrong-suffix` breaks framework-vocabulary | passed |
| architecture/framework | framework-vocabulary · framework is a closed vocabulary | `controller-inside-ui` breaks framework-vocabulary | passed |
| architecture/framework | query-bridges-use-case · framework queries and mutations bridge a use case | `news-an-adapter` breaks query-bridges-use-case | passed |
| architecture/framework | query-bridges-use-case · framework queries and mutations bridge a use case | `no-use-case` breaks query-bridges-use-case | passed |
| architecture/framework | query-bridges-use-case · framework queries and mutations bridge a use case | `imports-repository-instance` breaks query-bridges-use-case | passed |
| architecture/framework | one-hook-per-file · framework hooks live one per file, named after the hook | `two-hooks-in-one-file` breaks one-hook-per-file | passed |
| architecture/framework | one-hook-per-file · framework hooks live one per file, named after the hook | `file-name-differs-from-hook` breaks one-hook-per-file | passed |
| architecture/framework | use-case-bridged-once · framework bridges every use case exactly once | `use-case-without-bridge` breaks use-case-bridged-once | passed |
| architecture/framework | use-case-bridged-once · framework bridges every use case exactly once | `use-case-with-two-bridges` breaks use-case-bridged-once | passed |
| architecture/framework | controller-exports-no-types · framework controllers and hooks export no types | `controller-exports-a-type` breaks controller-exports-no-types | passed |
| architecture/framework | query-keys-from-factory · framework query keys come from a factory | `literal-query-key` breaks query-keys-from-factory | passed |
| architecture/framework | view-model-imports-only-domain · framework view-models import only domain | `imports-application` breaks view-model-imports-only-domain | passed |
| architecture/framework | no-framework-import · framework view-models import no React | `view-model-imports-react` breaks no-framework-import | passed |
| architecture/framework | store-imports-domain-and-view-models · framework stores import only domain and view-models | `imports-react-query` breaks store-imports-domain-and-view-models | passed |
| architecture/framework | store-imports-domain-and-view-models · framework stores import only domain and view-models | `imports-infrastructure` breaks store-imports-domain-and-view-models | passed |
| architecture/framework | no-environment · framework queries, mutations, view-models and stores never touch the environment | `store-calls-environment` breaks no-environment | passed |
| architecture/framework | no-environment · framework queries, mutations, view-models and stores never touch the environment | `controller-calls-environment` breaks no-environment | passed |
| architecture/framework | controller-reaches-core-through-queries · framework controllers reach the core only through queries, mutations and stores | `imports-infrastructure` breaks controller-reaches-core-through-queries | passed |
| architecture/framework | controller-reaches-core-through-queries · framework controllers reach the core only through queries, mutations and stores | `imports-ui` breaks controller-reaches-core-through-queries | passed |
| architecture/framework | controller-reaches-core-through-queries · framework controllers reach the core only through queries, mutations and stores | `reads-cache-itself` breaks controller-reaches-core-through-queries | passed |
| architecture/framework | no-hooks · hooks live only in the framework | `core-exports-a-hook` breaks no-hooks | passed |
| architecture/framework | A reference module satisfies the whole layer | `reference` breaks no rule | passed |
| architecture/review | review-apart-from-verdict · review exits zero and runs after the deterministic tools | the review prints `0` warnings and exits zero | passed |
| architecture/review | review-apart-from-verdict · review exits zero and runs after the deterministic tools | the review prints `3` warnings and exits zero | passed |
| architecture/review | review-needs-configured-key · review refuses to run without the configured key | a `present` key leads to `the model is called and warnings print` | passed |
| architecture/review | review-needs-configured-key · review refuses to run without the configured key | a `absent` key leads to `the variable's name prints and status is 2` | passed |
| architecture/review | review-scopes-touched-files · review judges only the files touched since its last pass | `2` touched files after `none` are judged | passed |
| architecture/review | review-scopes-touched-files · review judges only the files touched since its last pass | `2` touched files after `recorded` are judged | passed |
| architecture/review | review-scopes-touched-files · review judges only the files touched since its last pass | `0` touched files after `recorded` are judged | passed |
| architecture/review | review-scopes-touched-files · review judges only the files touched since its last pass | `0` touched files after `recorded under another rubric` are judged | passed |
| architecture/review | review-narrows-to-lines · review narrows every finding from files to lines | a row found in `one method` is reported as `1` ranges | passed |
| architecture/review | review-narrows-to-lines · review narrows every finding from files to lines | a row found in `two methods` is reported as `2` ranges | passed |
| architecture/review | review-narrows-to-lines · review narrows every finding from files to lines | a row found in `the whole class header` is reported as `1` ranges | passed |
| architecture/review | review-finding-names-row-and-certainty · every review warning names its row, certainty, file and lines | probability `0.93` against threshold `0.85` prints `S09 p=0.93 at the file and lines of the span` | passed |
| architecture/review | review-finding-names-row-and-certainty · every review warning names its row, certainty, file and lines | probability `0.60` against threshold `0.85` prints `nothing` | passed |
| architecture/review | review-finding-names-row-and-certainty · every review warning names its row, certainty, file and lines | probability `0.85` against threshold `0.85` prints `S05 p=0.85 at the file and lines of the span` | passed |
| architecture/review | review-rows-are-generic · rubric questions name no product | the row `S09` worded as `this domain file names a technology, library or provider` is `accepted` | passed |
| architecture/review | review-rows-are-generic · rubric questions name no product | the row `S09` worded as `this domain file names the payment provider of the product` is `rejected` | passed |
| architecture/review | review-asks-core-and-schema-rows · review asks the rows of the core and the rows of the schema | a product of `clean-backend` is asked the rows `S05, S06` | passed |
| architecture/review | review-asks-core-and-schema-rows · review asks the rows of the core and the rows of the schema | a product of `clean-react` is asked the rows `S05, S06, S01, S02` | passed |
| architecture/ui | ui-reaches-core-through-controllers · framework ui reaches the core only through controllers | `imports-query` breaks ui-reaches-core-through-controllers | passed |
| architecture/ui | ui-reaches-core-through-controllers · framework ui reaches the core only through controllers | `imports-store` breaks ui-reaches-core-through-controllers | passed |
| architecture/ui | ui-reaches-core-through-controllers · framework ui reaches the core only through controllers | `imports-infrastructure` breaks ui-reaches-core-through-controllers | passed |
| architecture/ui | ui-reaches-core-through-controllers · framework ui reaches the core only through controllers | `reads-cache-itself` breaks ui-reaches-core-through-controllers | passed |
| architecture/ui | jsx-only-in-ui · framework keeps JSX in ui, bridges and the entry | `jsx-outside-ui` breaks jsx-only-in-ui | passed |
| architecture/ui | jsx-neither-compares-nor-counts · framework JSX neither compares nor counts | `jsx-compares-and-counts` breaks jsx-neither-compares-nor-counts | passed |
| architecture/ui | ui-never-persists · framework ui, bridges and the entry navigate but never persist | `ui-persists` breaks ui-never-persists | passed |
| architecture/ui | A reference module satisfies the whole layer | `reference` breaks no rule | passed |
| flow/plan |  |  | passed, by the person's word |
| implementer |  |  | passed, by the person's word |
| repository/build | A package carries the schemas its manifest lists | the built `backend` holds the schema `clean-backend` as `present` | passed |
| repository/build | A package carries the schemas its manifest lists | the built `backend` holds the schema `legacy-to-specs` as `absent` | passed |
| repository/build | A package carries the schemas its manifest lists | the built `both` holds the schema `legacy-to-specs` as `present` | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `workstream` `billing` stops the build | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `validator` `strictest` stops the build | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `question policy` `never-ask` stops the build | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `core` `onion` stops the build | passed |
| repository/build | A variant differs only in what it overrides | `clean-backend-strict` overrides the `validator` of `clean-backend` and keeps its `question policy` | passed |
| repository/build | A variant differs only in what it overrides | `clean-backend-quiet` overrides the `question policy` of `clean-backend` and keeps its `validator` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `fresh` when `schemas/clean-backend/workstreams/app-domain/SKILL.md` is `unchanged` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `stale` when `schemas/clean-backend/workstreams/app-domain/SKILL.md` is `edited` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `stale` when `schemas/spec-plan/questions/ask-on-commitment.md` is `edited` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `stale` when `schemas/shared/phases/plan/SKILL.md` is `edited` | passed |
| repository/build | A built package pins every tool it runs | the built `backend` runs `specification tool` at exactly `2.0.0` | passed |
| repository/build | A built package pins every tool it runs | the built `backend` runs `linter` at exactly `1.93.0` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `validator` `standard` held in `spec-plan` is accepted when `clean-backend extends spec-plan` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `delivery` held in `clean-backend` is accepted when `no other definition names it` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `reporting` held in `shared` is accepted when `neither extends the other` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `app-domain` held in `shared/cores/clean-core` is accepted when `the core they both name lists it` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `validator` `standard` held in `shared` is refused when `clean-backend extends spec-plan` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `reporting` held in `clean-backend` is refused when `neither extends the other` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `app-domain` held in `clean-backend` is refused when `the core they both name lists it` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `app-domain` held in `shared` is refused when `the core they both name lists it` | passed |
| repository/build | A package declares the skills of its tools instead of carrying them | the skill `spec-writing` of `specification tool` at `2.0.0` is declared as `acme/specification/skills/spec-writing#v2.0.0` | passed |
| repository/build | A package declares the skills of its tools instead of carrying them | the skill `lint-reading` of `linter` at `1.93.0` is declared as `acme/linter/skills/lint-reading#v1.93.0` | passed |
| repository/build | A package declares the skills of its tools instead of carrying them | a skill taken from `linter`, which names no repository, stops the build | passed |
| repository/build | A schema builds through the workstreams of its core and its own | `clean-backend` naming the core `clean-core` and its own `none` builds through `app-domain, infrastructure, adapters, modules, integrate` | passed |
| repository/build | A schema builds through the workstreams of its core and its own | `clean-react` naming the core `clean-core` and its own `react-ui, react-hooks` builds through `app-domain, infrastructure, adapters, modules, integrate, react-ui, react-hooks` | passed |
| repository/build | A schema builds through the workstreams of its core and its own | `clean-backend` naming `modules`, which its core `clean-core` already lists, stops the build | passed |
| repository/build | A package declares a skill that lives in a repository of its own | the skill `component-patterns` of the repository `acme/agent-skills` at `1a2c79d` is declared as `acme/agent-skills/skills/component-patterns#1a2c79d` | passed |
| repository/build | A package declares a skill that lives in a repository of its own | the skill `interface-review` of the repository `acme/agent-skills` at `1a2c79d` is declared as `acme/agent-skills/skills/interface-review#1a2c79d` | passed |
| repository/build | A package declares a skill that lives in a repository of its own | the skill `component-patterns` taken from `acme/agent-skills` with no commit stops the build | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
