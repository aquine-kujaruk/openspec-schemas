---
change: share-the-clean-core
verdict: verified
digest: 5e5f78250e696458942c409316f05a42a5f41af0114d9248dea7b69b5d7629c7
---

# Evidence of share-the-clean-core

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/linting |  |  | passed, by the person's word |
| flow/plan-validation | A plan with an open question is not ready | a plan listing `0` open question(s) is `ready` | passed |
| flow/plan-validation | A plan with an open question is not ready | a plan listing `1` open question(s) is `not ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `decision` block `money-in-cents` with `1` operation tag(s) makes the change `ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `decision` block `money-in-cents` with `0` operation tag(s) makes the change `not ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `decision` block `money-in-cents` with `2` operation tag(s) makes the change `not ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `procedure` block `prod-logs` with `0` operation tag(s) makes the change `not ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@adds` on `money-in-cents` against the consolidated decisions `none` is `ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@adds` on `money-in-cents` against the consolidated decisions `money-in-cents` is `not ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@replaces:money-in-cents` on `money-as-decimal` against the consolidated decisions `money-in-cents` is `ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@replaces:money-in-cents` on `money-as-decimal` against the consolidated decisions `none` is `not ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@modifies:money-in-cents` on `money-in-cents` against the consolidated decisions `money-in-cents` is `ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@removes:no-router` on `no-router` against the consolidated decisions `none` is `not ready` | passed |
| flow/plan-validation | An operation on a standing block records the origin it saw | `@modifies:money-in-cents` with base `2026-11-01-add-money` on a block of origin `2026-11-01-add-money` is `ready` | passed |
| flow/plan-validation | An operation on a standing block records the origin it saw | `@modifies:money-in-cents` with base `2026-11-01-add-money` on a block of origin `2026-11-08-add-refunds` is `not ready` | passed |
| flow/plan-validation | An operation on a standing block records the origin it saw | `@removes:money-in-cents` with base `none` on a block of origin `2026-11-01-add-money` is `not ready` | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@applies` makes the change not ready | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@enforced` makes the change not ready | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@area` makes the change not ready | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@topic` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure block lacking `@purpose` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure block lacking `@env` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure block lacking `@topic` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure of purpose `diagnose` makes the change `ready` | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure of purpose `setup` makes the change `ready` | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure of purpose `misc` makes the change `not ready` | passed |
| flow/plan-validation | A procedure holds where a secret is kept, never the secret | a procedure step holding `the name of the secret's store` makes the change `ready` | passed |
| flow/plan-validation | A procedure holds where a secret is kept, never the secret | a procedure step holding `a value shaped like an access key` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `app-domain` placed `inside a phase` makes the change `ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `react-ui` placed `inside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `app-domain` placed `outside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `none` placed `inside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `none` placed `inside a phase` makes the change `ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `app-domain` placed `inside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `none` placed `outside a phase` makes the change `not ready` | passed |
| flow/plan-validation | A change without delta specs says so | `1` delta spec(s) with the no-behaviour mark `absent` is `ready` | passed |
| flow/plan-validation | A change without delta specs says so | `0` delta spec(s) with the no-behaviour mark `set` is `ready` | passed |
| flow/plan-validation | A change without delta specs says so | `0` delta spec(s) with the no-behaviour mark `absent` is `not ready` | passed |
| flow/plan-validation | A change without delta specs says so | `1` delta spec(s) with the no-behaviour mark `set` is `not ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `clean-backend` change naming `api` is `ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `spec-plan` change naming `contracts` is `ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `spec-plan` change naming `api` is `not ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `clean-backend` change naming `web` is `not ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `clean-backend` change naming `none` is `not ready` | passed |
| flow/plan-validation | Linked changes name each other | `add-orders-api` linking `add-orders-web`, which links `add-orders-api`, is `ready` | passed |
| flow/plan-validation | Linked changes name each other | `add-orders-api` linking `add-orders-web`, which links `none`, is `not ready` | passed |
| flow/plan-validation | Linked changes name each other | `add-orders-api` linking `missing-change`, which links `none`, is `not ready` | passed |
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

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
