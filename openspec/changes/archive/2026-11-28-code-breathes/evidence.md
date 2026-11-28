---
change: code-breathes
verdict: verified
digest: 8c7529895c2505e0a020a2052a9d2f3b1b899e40539d552127126ba17f794b44
---

# Evidence of code-breathes

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/modules | modules-are-isolated · modules do not import one another | `imports-another-module` breaks modules-are-isolated | passed |
| architecture/modules | shared-imports-no-module · shared imports nothing from a module | `shared-imports-module` breaks shared-imports-no-module | passed |
| architecture/modules | no-import-cycles · modules form no import cycles | `import-cycle` breaks no-import-cycles | passed |
| architecture/modules | every-file-in-a-zone · every file of src belongs to a zone | `file-outside-every-zone` breaks every-file-in-a-zone | passed |
| architecture/modules | no-tests-in-src · src holds no test | `test-inside-src` breaks no-tests-in-src | passed |
| architecture/modules | schema-package-only-at-boundaries · the schema package is imported only where shapes are declared | `schema-package-in-entity` breaks schema-package-only-at-boundaries | passed |
| architecture/modules | schema-package-only-at-boundaries · the schema package is imported only where shapes are declared | `schema-package-in-use-case` breaks schema-package-only-at-boundaries | passed |
| architecture/modules | schema-package-only-at-boundaries · the schema package is imported only where shapes are declared | `schema-package-in-repository` breaks schema-package-only-at-boundaries | passed |
| architecture/modules | no-any-in-core · the core declares no any | `any-in-entity` breaks no-any-in-core | passed |
| architecture/modules | no-any-in-core · the core declares no any | `any-in-repository` breaks no-any-in-core | passed |
| architecture/modules | no-any-in-core · the core declares no any | `record-any-in-use-case` breaks no-any-in-core | passed |
| architecture/modules | no-raw-error-in-core · domain and application throw only domain exceptions | `raw-error-in-entity` breaks no-raw-error-in-core | passed |
| architecture/modules | no-raw-error-in-core · domain and application throw only domain exceptions | `raw-error-in-use-case` breaks no-raw-error-in-core | passed |
| architecture/modules | no-harness-escapes · product code never switches the harness off | `lint-rule-disabled` breaks no-harness-escapes | passed |
| architecture/modules | no-harness-escapes · product code never switches the harness off | `type-error-suppressed` breaks no-harness-escapes | passed |
| architecture/modules | no-harness-escapes · product code never switches the harness off | `type-error-expected` breaks no-harness-escapes | passed |
| architecture/modules | no-harness-escapes · product code never switches the harness off | `cast-through-unknown` breaks no-harness-escapes | passed |
| architecture/modules | A reference module satisfies every cross-module rule | `reference` breaks no rule | passed |
| architecture/modules | A module check reports findings on the selected module | the check for `shared` reports `neither the rule violation nor the unused file` | passed |
| architecture/modules | A module check reports findings on the selected module | the check for `production` reports `only the rule violation` | passed |
| architecture/modules | A module check reports findings on the selected module | the check for `whole line` reports `the rule violation and the unused file` | passed |
| architecture/modules | code-breathes · statements are separated by blank lines | `return-glued` breaks code-breathes | passed |
| architecture/modules | code-breathes · statements are separated by blank lines | `multiline-glued` breaks code-breathes | passed |
| architecture/modules | code-breathes · statements are separated by blank lines | `multiline-block-glued` breaks code-breathes | passed |
| architecture/modules | Recorded rubric judgements | rubric S08 / cross-module-import is yes | passed |
| architecture/modules | Recorded rubric judgements | rubric S08 / reference is no | passed |

## Checks

Every check passes.

## Review

Run: 40 warning(s).
- S10 p=0.90 factory/change-control/infrastructure/adapters/released-work-order.adapter.ts:3-13 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.92 factory/engineering/infrastructure/adapters/process.adapter.ts:3-13 — Raw external data is typed as an unknown record until the ACL validates it
- S05 p=0.96 factory/engineering/infrastructure/repository-implementations/plant.repository-implementation.ts:10-42 — A repository returns primitives or schema props
- S05 p=0.96 factory/engineering/infrastructure/repository-implementations/process.repository-implementation.ts:12-48 — A repository returns primitives or schema props
- S18 p=0.91 factory/maintenance/application/repository-interfaces/equipment.repository-interface.ts:11-18 — A use case that only forwards to a repository is still a candidate for an atomic use case, never for an application service
- S19 p=0.87 factory/maintenance/application/use-cases/find-suspect-procedures.use-case.ts:4-17 — The use case hydrates into domain objects what it reads from the repository
- S10 p=0.93 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:17-21 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.94 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:23-23 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.99 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:32-40 — Raw external data is typed as an unknown record until the ACL validates it
- S24 p=0.97 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:125-142 — Separate distinct logical steps with a blank line
- S24 p=0.85 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:143-150 — Separate distinct logical steps with a blank line
- S24 p=0.96 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:166-182 — Separate distinct logical steps with a blank line
- S10 p=0.92 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:186-207 — Raw external data is typed as an unknown record until the ACL validates it
- S18 p=0.91 factory/production/application/repository-interfaces/dispatch.repository-interface.ts:1-6 — A use case that only forwards to a repository is still a candidate for an atomic use case, never for an application service
- S19 p=0.91 factory/production/application/use-cases/assess-work-order.use-case.ts:14-50 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.95 factory/production/application/use-cases/assess-work-order.use-case.ts:52-64 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.91 factory/production/application/use-cases/close-work-order.use-case.ts:39-76 — The use case hydrates into domain objects what it reads from the repository
- S24 p=0.99 factory/production/application/use-cases/dispatch-work-order.use-case.ts:10-46 — Separate distinct logical steps with a blank line
- S19 p=0.92 factory/production/application/use-cases/make-reading-copies.use-case.ts:21-48 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.91 factory/production/application/use-cases/project-drawings.use-case.ts:5-38 — The use case hydrates into domain objects what it reads from the repository
- S24 p=0.88 factory/production/domain/schemas/plan-document.schema.ts:111-147 — Separate distinct logical steps with a blank line
- S10 p=0.88 factory/production/infrastructure/acl/andon-signal.acl.ts:3-6 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.98 factory/production/infrastructure/adapters/andon-signal.adapter.ts:14-36 — Raw external data is typed as an unknown record until the ACL validates it
- S24 p=0.96 factory/production/infrastructure/adapters/dispatch.adapter.ts:5-22 — Separate distinct logical steps with a blank line
- S24 p=0.98 factory/production/infrastructure/adapters/stage-start.adapter.ts:5-42 — Separate distinct logical steps with a blank line
- S18 p=0.93 factory/quality/application/repository-interfaces/final-inspection.repository-interface.ts:5-18 — A use case that only forwards to a repository is still a candidate for an atomic use case, never for an application service
- S19 p=0.86 factory/quality/application/use-cases/audit.use-case.ts:8-8 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.91 factory/quality/application/use-cases/hold-stage.use-case.ts:23-23 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.92 factory/quality/application/use-cases/hold-stage.use-case.ts:25-28 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.94 factory/quality/application/use-cases/inspect-work-order.use-case.ts:201-211 — The use case hydrates into domain objects what it reads from the repository
- S24 p=0.95 factory/quality/domain/services/architecture-standards.service.ts:316-347 — Separate distinct logical steps with a blank line
- S10 p=0.89 factory/quality/infrastructure/acl/gauge-run.acl.ts:11-14 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.95 factory/quality/infrastructure/adapters/gauge-run.adapter.ts:48-52 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.96 factory/quality/infrastructure/adapters/gauge-run.adapter.ts:56-63 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.91 factory/quality/infrastructure/adapters/gauge-run.adapter.ts:66-103 — Raw external data is typed as an unknown record until the ACL validates it
- S24 p=0.91 factory/quality/infrastructure/adapters/inspection.adapter.ts:257-274 — Separate distinct logical steps with a blank line
- S10 p=0.92 factory/quality/infrastructure/adapters/sample-inspection.adapter.ts:37-48 — Raw external data is typed as an unknown record until the ACL validates it
- S05 p=0.99 factory/quality/infrastructure/repository-implementations/drawing.repository-implementation.ts:7-37 — A repository returns primitives or schema props
- S05 p=1.00 factory/quality/infrastructure/repository-implementations/inspection.repository-implementation.ts:7-19 — A repository returns primitives or schema props
- S10 p=0.92 factory/shared/infrastructure/adapters/decision-model.adapter.ts:27-61 — Raw external data is typed as an unknown record until the ACL validates it

## Procedures

None.
