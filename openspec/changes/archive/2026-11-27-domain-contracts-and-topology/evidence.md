---
change: domain-contracts-and-topology
verdict: verified
digest: 734a92b5e501f9992f296543b5f819953a77689c350424f69bc0cfaa15b019c8
---

# Evidence of domain-contracts-and-topology

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/domain | domain-vocabulary · domain is a closed vocabulary | `folder-outside-vocabulary` breaks domain-vocabulary | passed |
| architecture/domain | domain-vocabulary · domain is a closed vocabulary | `wrong-suffix` breaks domain-vocabulary | passed |
| architecture/domain | domain-vocabulary · domain is a closed vocabulary | `rules-folder` breaks domain-vocabulary | passed |
| architecture/domain | entity-validates-with-schema · domain entities, aggregates and value objects validate with their schema | `no-schema` breaks entity-validates-with-schema | passed |
| architecture/domain | entity-validates-with-schema · domain entities, aggregates and value objects validate with their schema | `parses-directly` breaks entity-validates-with-schema | passed |
| architecture/domain | entity-validates-with-schema · domain entities, aggregates and value objects validate with their schema | `validates-elsewhere` breaks entity-validates-with-schema | passed |
| architecture/domain | domain-imports-only-domain · domain imports no other layer | `imports-infrastructure` breaks domain-imports-only-domain | passed |
| architecture/domain | no-framework-import · domain imports no framework package | `imports-framework-package` breaks no-framework-import | passed |
| architecture/domain | no-environment · domain never touches the environment | `calls-environment` breaks no-environment | passed |
| architecture/domain | aggregate-composes-domain-objects · domain aggregates compose entities or value objects | `composes-nothing` breaks aggregate-composes-domain-objects | passed |
| architecture/domain | aggregate-composes-domain-objects · domain aggregates compose entities or value objects | `imports-but-holds-none` breaks aggregate-composes-domain-objects | passed |
| architecture/domain | exception-extends-domain-exception · domain exceptions extend the common base | `extends-error` breaks exception-extends-domain-exception | passed |
| architecture/domain | exception-extends-domain-exception · domain exceptions extend the common base | `extends-nothing` breaks exception-extends-domain-exception | passed |
| architecture/domain | exception-extends-domain-exception · domain exceptions extend the common base | `redeclares-base` breaks exception-extends-domain-exception | passed |
| architecture/domain | exception-extends-domain-exception · domain exceptions extend the common base | `two-module-bases` breaks exception-extends-domain-exception | passed |
| architecture/domain | closed-set-lives-in-schema · domain closed sets are enums declared in schemas | `enum-in-entity` breaks closed-set-lives-in-schema | passed |
| architecture/domain | closed-set-lives-in-schema · domain closed sets are enums declared in schemas | `enum-in-use-case` breaks closed-set-lives-in-schema | passed |
| architecture/domain | closed-set-lives-in-schema · domain closed sets are enums declared in schemas | `enum-in-repository` breaks closed-set-lives-in-schema | passed |
| architecture/domain | no-magic-closed-set-strings · domain compares closed sets through their enum | `compares-status-literal` breaks no-magic-closed-set-strings | passed |
| architecture/domain | no-magic-closed-set-strings · domain compares closed sets through their enum | `switches-on-type-literal` breaks no-magic-closed-set-strings | passed |
| architecture/domain | domain-service-named-by-policy · domain services are named by the policy they implement | `named-helper` breaks domain-service-named-by-policy | passed |
| architecture/domain | domain-service-named-by-policy · domain services are named by the policy they implement | `exports-no-class` breaks domain-service-named-by-policy | passed |
| architecture/domain | A reference module satisfies the whole layer | `reference` breaks no rule | passed |
| architecture/domain | class-name-carries-role · domain classes carry their role in their exported name | `entity-without-role` breaks class-name-carries-role | passed |
| architecture/domain | class-name-carries-role · domain classes carry their role in their exported name | `aggregate-without-role` breaks class-name-carries-role | passed |
| architecture/domain | class-name-carries-role · domain classes carry their role in their exported name | `value-object-without-role` breaks class-name-carries-role | passed |
| architecture/domain | schema-validates-at-runtime · domain schemas export a runtime schema | `type-only-schema` breaks schema-validates-at-runtime | passed |
| architecture/domain | schema-validates-at-runtime · domain schemas export a runtime schema | `interface-schema` breaks schema-validates-at-runtime | passed |
| architecture/domain | value-object-holds-several-values · value objects hold a coherent set of values | `single-value-wrapper` breaks value-object-holds-several-values | passed |
| architecture/domain | Recorded rubric judgements | rubric S06 / literal-currency is yes | passed |
| architecture/domain | Recorded rubric judgements | rubric S06 / reference is no | passed |
| architecture/domain | Recorded rubric judgements | rubric S09 / provider-name is yes | passed |
| architecture/domain | Recorded rubric judgements | rubric S09 / reference is no | passed |
| architecture/domain | Recorded rubric judgements | rubric S11 / aggregate-of-one is yes | passed |
| architecture/domain | Recorded rubric judgements | rubric S11 / reference is no | passed |
| architecture/domain | Recorded rubric judgements | rubric S12 / misplaced-method is yes | passed |
| architecture/domain | Recorded rubric judgements | rubric S12 / reference is no | passed |
| architecture/domain | Recorded rubric judgements | rubric S16 / constructor-mode is yes | passed |
| architecture/domain | Recorded rubric judgements | rubric S16 / reference is no | passed |
| architecture/domain | Recorded rubric judgements | rubric S17 / wrapper-id is yes | passed |
| architecture/domain | Recorded rubric judgements | rubric S17 / reference is no | passed |
| architecture/domain | Recorded rubric judgements | rubric S20 / restated-method is yes | passed |
| architecture/domain | Recorded rubric judgements | rubric S20 / reference is no | passed |

## Checks

Every check passes.

## Review

Run: 56 warning(s).
- S10 p=0.90 factory/change-control/infrastructure/adapters/released-work-order.adapter.ts:3-13 — Raw external data is typed as an unknown record until the ACL validates it
- S20 p=0.91 factory/engineering/domain/aggregates/process.aggregate.ts:93-95 — The why lives in the artifacts (specs, plan)
- S20 p=0.85 factory/engineering/domain/aggregates/process.aggregate.ts:98-100 — The why lives in the artifacts (specs, plan)
- S20 p=0.90 factory/engineering/domain/aggregates/process.aggregate.ts:113-116 — The why lives in the artifacts (specs, plan)
- S20 p=0.99 factory/engineering/infrastructure/adapters/active-project.adapter.ts:87-103 — The why lives in the artifacts (specs, plan)
- S20 p=0.95 factory/engineering/infrastructure/adapters/process-catalog.adapter.ts:54-74 — The why lives in the artifacts (specs, plan)
- S20 p=0.96 factory/engineering/infrastructure/adapters/process-catalog.adapter.ts:143-170 — The why lives in the artifacts (specs, plan)
- S20 p=0.91 factory/engineering/infrastructure/adapters/process-catalog.adapter.ts:294-320 — The why lives in the artifacts (specs, plan)
- S20 p=0.99 factory/engineering/infrastructure/adapters/process-catalog.adapter.ts:377-398 — The why lives in the artifacts (specs, plan)
- S10 p=0.92 factory/engineering/infrastructure/adapters/process.adapter.ts:3-13 — Raw external data is typed as an unknown record until the ACL validates it
- S05 p=0.94 factory/engineering/infrastructure/repository-implementations/plant.repository-implementation.ts:10-41 — A repository returns primitives or schema props
- S05 p=0.99 factory/engineering/infrastructure/repository-implementations/process.repository-implementation.ts:12-47 — A repository returns primitives or schema props
- S18 p=0.91 factory/maintenance/application/repository-interfaces/equipment.repository-interface.ts:11-18 — A use case that only forwards to a repository is still a candidate for an atomic use case, never for an application service
- S19 p=0.85 factory/maintenance/application/use-cases/find-suspect-procedures.use-case.ts:4-16 — The use case hydrates into domain objects what it reads from the repository
- S20 p=0.90 factory/maintenance/domain/services/suspect-procedure.service.ts:45-82 — The why lives in the artifacts (specs, plan)
- S10 p=0.96 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:16-20 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.93 factory/maintenance/infrastructure/adapters/equipment.adapter.ts:21-21 — Raw external data is typed as an unknown record until the ACL validates it
- S18 p=0.91 factory/production/application/repository-interfaces/dispatch.repository-interface.ts:1-6 — A use case that only forwards to a repository is still a candidate for an atomic use case, never for an application service
- S19 p=0.91 factory/production/application/use-cases/assess-work-order.use-case.ts:18-48 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.90 factory/production/application/use-cases/assess-work-order.use-case.ts:50-60 — The use case hydrates into domain objects what it reads from the repository
- S20 p=0.97 factory/production/application/use-cases/assess-work-order.use-case.ts:85-108 — The why lives in the artifacts (specs, plan)
- S19 p=0.88 factory/production/application/use-cases/make-reading-copies.use-case.ts:17-19 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.90 factory/production/application/use-cases/make-reading-copies.use-case.ts:21-42 — The use case hydrates into domain objects what it reads from the repository
- S20 p=0.89 factory/production/application/use-cases/pull-andon.use-case.ts:4-14 — The why lives in the artifacts (specs, plan)
- S20 p=0.94 factory/production/application/use-cases/pull-andon.use-case.ts:17-36 — The why lives in the artifacts (specs, plan)
- S20 p=0.92 factory/production/domain/services/work-order-assessment.service.ts:52-55 — The why lives in the artifacts (specs, plan)
- S20 p=0.93 factory/production/domain/services/work-order-assessment.service.ts:68-74 — The why lives in the artifacts (specs, plan)
- S20 p=0.93 factory/production/domain/services/work-order-assessment.service.ts:111-130 — The why lives in the artifacts (specs, plan)
- S10 p=0.88 factory/production/infrastructure/acl/andon-signal.acl.ts:3-6 — Raw external data is typed as an unknown record until the ACL validates it
- S10 p=0.98 factory/production/infrastructure/adapters/andon-signal.adapter.ts:15-36 — Raw external data is typed as an unknown record until the ACL validates it
- S20 p=0.89 factory/production/infrastructure/adapters/work-order-record.adapter.ts:21-29 — The why lives in the artifacts (specs, plan)
- S05 p=0.90 factory/production/infrastructure/repository-implementations/work-order.repository-implementation.ts:23-56 — A repository returns primitives or schema props
- S18 p=0.93 factory/quality/application/repository-interfaces/final-inspection.repository-interface.ts:5-18 — A use case that only forwards to a repository is still a candidate for an atomic use case, never for an application service
- S19 p=0.96 factory/quality/application/use-cases/hold-stage.use-case.ts:20-59 — The use case hydrates into domain objects what it reads from the repository
- S19 p=0.92 factory/quality/application/use-cases/hold-stage.use-case.ts:63-88 — The use case hydrates into domain objects what it reads from the repository
- S20 p=0.90 factory/quality/domain/services/architecture-standards.service.ts:47-63 — The why lives in the artifacts (specs, plan)
- S20 p=0.89 factory/quality/domain/services/architecture-standards.service.ts:69-90 — The why lives in the artifacts (specs, plan)
- S20 p=0.89 factory/quality/domain/services/architecture-standards.service.ts:121-142 — The why lives in the artifacts (specs, plan)
- S20 p=1.00 factory/quality/domain/services/architecture-standards.service.ts:233-255 — The why lives in the artifacts (specs, plan)
- S20 p=0.88 factory/quality/domain/services/architecture-standards.service.ts:258-294 — The why lives in the artifacts (specs, plan)
- S10 p=0.87 factory/quality/infrastructure/acl/final-inspection.acl.ts:16-16 — Raw external data is typed as an unknown record until the ACL validates it
- S20 p=0.95 factory/quality/infrastructure/adapters/lint-config.adapter.ts:77-84 — The why lives in the artifacts (specs, plan)
- S10 p=0.94 factory/quality/infrastructure/adapters/sample-inspection.adapter.ts:43-52 — Raw external data is typed as an unknown record until the ACL validates it
- S05 p=1.00 factory/quality/infrastructure/repository-implementations/drawing.repository-implementation.ts:7-34 — A repository returns primitives or schema props
- S10 p=0.91 factory/quality/infrastructure/repository-implementations/drawing.repository-implementation.ts:7-34 — Raw external data is typed as an unknown record until the ACL validates it
- S05 p=1.00 factory/quality/infrastructure/repository-implementations/inspection.repository-implementation.ts:7-18 — A repository returns primitives or schema props
- S20 p=0.91 factory/shared/domain/schemas/configuration.schema.ts:25-32 — The why lives in the artifacts (specs, plan)
- S20 p=0.99 factory/shared/domain/schemas/line-types.schema.ts:98-127 — The why lives in the artifacts (specs, plan)
- S20 p=0.87 factory/shared/domain/schemas/line-types.schema.ts:145-157 — The why lives in the artifacts (specs, plan)
- S20 p=0.99 factory/shared/domain/schemas/line-types.schema.ts:179-204 — The why lives in the artifacts (specs, plan)
- S20 p=0.90 factory/shared/domain/schemas/line-types.schema.ts:244-275 — The why lives in the artifacts (specs, plan)
- S20 p=0.90 factory/shared/domain/schemas/review.schema.ts:7-17 — The why lives in the artifacts (specs, plan)
- S10 p=0.88 factory/shared/infrastructure/adapters/cli-contract.adapter.ts:6-6 — Raw external data is typed as an unknown record until the ACL validates it
- S20 p=0.92 factory/shared/infrastructure/adapters/paths.adapter.ts:49-53 — The why lives in the artifacts (specs, plan)
- S20 p=0.97 factory/shared/infrastructure/adapters/testing.adapter.ts:53-59 — The why lives in the artifacts (specs, plan)
- S20 p=0.86 factory/shared/infrastructure/adapters/testing.adapter.ts:139-160 — The why lives in the artifacts (specs, plan)

## Procedures

None.
