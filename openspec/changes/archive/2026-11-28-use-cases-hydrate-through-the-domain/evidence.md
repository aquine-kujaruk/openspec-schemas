---
change: use-cases-hydrate-through-the-domain
verdict: verified
digest: 2dc7053f956dc9298396565bdf9a7f8c8ad6dfb39b9c6eeb02241163ec89625b
---

# Evidence of use-cases-hydrate-through-the-domain

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/application | application-vocabulary · application is a closed vocabulary | `folder-outside-vocabulary` breaks application-vocabulary | passed |
| architecture/application | application-vocabulary · application is a closed vocabulary | `wrong-suffix` breaks application-vocabulary | passed |
| architecture/application | application-vocabulary · application is a closed vocabulary | `services-folder` breaks application-vocabulary | passed |
| architecture/application | use-case-is-class-with-execute · application use cases are classes with execute() | `no-use-case-class` breaks use-case-is-class-with-execute | passed |
| architecture/application | repository-contract-is-interface · application repository contracts are exported interfaces | `no-interface` breaks repository-contract-is-interface | passed |
| architecture/application | repository-contract-is-interface · application repository contracts are exported interfaces | `prefixed-with-i` breaks repository-contract-is-interface | passed |
| architecture/application | application-imports-only-domain · application imports only domain | `imports-infrastructure` breaks application-imports-only-domain | passed |
| architecture/application | no-framework-import · application imports no framework package | `imports-framework-package` breaks no-framework-import | passed |
| architecture/application | no-environment · application never touches the environment | `calls-environment` breaks no-environment | passed |
| architecture/application | repository-method-naming · application repository methods say verb plus noun | `fetch-verb` breaks repository-method-naming | passed |
| architecture/application | repository-method-naming · application repository methods say verb plus noun | `bare-verb` breaks repository-method-naming | passed |
| architecture/application | repository-method-naming · application repository methods say verb plus noun | `get-returns-null` breaks repository-method-naming | passed |
| architecture/application | repository-method-naming · application repository methods say verb plus noun | `find-never-null` breaks repository-method-naming | passed |
| architecture/application | use-case-depends-on-contracts · application use cases depend only on repository interfaces and use cases | `depends-on-implementation` breaks use-case-depends-on-contracts | passed |
| architecture/application | use-case-depends-on-contracts · application use cases depend only on repository interfaces and use cases | `depends-on-adapter` breaks use-case-depends-on-contracts | passed |
| architecture/application | A reference module satisfies the whole layer | `reference` breaks no rule | passed |
| architecture/application | required-part-throws-in-domain · a missing required part fails in the domain | `use-case-throws-on-missing` breaks required-part-throws-in-domain | passed |
| architecture/application | Recorded rubric judgements | rubric S13 / vague-operation is yes | passed |
| architecture/application | Recorded rubric judgements | rubric S13 / reference is no | passed |
| architecture/application | Recorded rubric judgements | rubric S15 / field-copy is yes | passed |
| architecture/application | Recorded rubric judgements | rubric S15 / reference is no | passed |
| architecture/application | Recorded rubric judgements | rubric S18 / unrelated-methods is yes | passed |
| architecture/application | Recorded rubric judgements | rubric S18 / reference is no | passed |
| architecture/application | Recorded rubric judgements | rubric S19 / raw-props is yes | passed |
| architecture/application | Recorded rubric judgements | rubric S19 / reference is no | passed |
| architecture/infrastructure | infrastructure-vocabulary · infrastructure folders form a closed vocabulary | `folder-outside-vocabulary` breaks infrastructure-vocabulary | passed |
| architecture/infrastructure | infrastructure-vocabulary · infrastructure folders form a closed vocabulary | `wrong-suffix` breaks infrastructure-vocabulary | passed |
| architecture/infrastructure | infrastructure-vocabulary · infrastructure folders form a closed vocabulary | `emergent-wrong-suffix` breaks infrastructure-vocabulary | passed |
| architecture/infrastructure | repository-implements-interface · infrastructure repositories implement their interface | `no-implements` breaks repository-implements-interface | passed |
| architecture/infrastructure | repository-implements-interface · infrastructure repositories implement their interface | `extends-base-without-interface` breaks repository-implements-interface | passed |
| architecture/infrastructure | repository-implements-interface · infrastructure repositories implement their interface | `named-by-technology` breaks repository-implements-interface | passed |
| architecture/infrastructure | infrastructure-imports-only-core · infrastructure imports only application and domain | `imports-entry` breaks infrastructure-imports-only-core | passed |
| architecture/infrastructure | infrastructure-imports-only-core · infrastructure imports only application and domain | `imports-adapter` breaks infrastructure-imports-only-core | passed |
| architecture/infrastructure | no-framework-import · infrastructure files import no framework package | `imports-framework-package` breaks no-framework-import | passed |
| architecture/infrastructure | only-adapters-touch-environment · infrastructure adapters alone talk to the environment | `uses-platform-global` breaks only-adapters-touch-environment | passed |
| architecture/infrastructure | repository-depends-on-acl · infrastructure repositories receive their adapters typed by the anti-corruption layer | `typed-by-adapter-class` breaks repository-depends-on-acl | passed |
| architecture/infrastructure | repository-depends-on-acl · infrastructure repositories receive their adapters typed by the anti-corruption layer | `imports-adapter-file` breaks repository-depends-on-acl | passed |
| architecture/infrastructure | repository-depends-on-acl · infrastructure repositories receive their adapters typed by the anti-corruption layer | `imports-adapter-with-extension` breaks repository-depends-on-acl | passed |
| architecture/infrastructure | repository-never-news-adapter · infrastructure repositories construct no adapter | `news-adapter-in-default` breaks repository-never-news-adapter | passed |
| architecture/infrastructure | repository-never-news-adapter · infrastructure repositories construct no adapter | `news-adapter-in-method` breaks repository-never-news-adapter | passed |
| architecture/infrastructure | infrastructure-names-the-role · infrastructure names every object by its role | `class-named-helper` breaks infrastructure-names-the-role | passed |
| architecture/infrastructure | infrastructure-names-the-role · infrastructure names every object by its role | `file-named-util` breaks infrastructure-names-the-role | passed |
| architecture/infrastructure | infrastructure-throws-domain-exceptions · infrastructure throws only domain exceptions | `throws-raw-error` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/infrastructure | infrastructure-throws-domain-exceptions · infrastructure throws only domain exceptions | `throws-own-exception-class` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/infrastructure | infrastructure-throws-domain-exceptions · infrastructure throws only domain exceptions | `throws-without-cause` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/infrastructure | infrastructure-throws-domain-exceptions · infrastructure throws only domain exceptions | `throws-shared-exception` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/infrastructure | A reference module satisfies the whole layer | `reference` breaks no rule | passed |
| architecture/infrastructure | repository-returns-records · infrastructure repositories return records, not domain objects | `repository-builds-entity` breaks repository-returns-records | passed |
| architecture/infrastructure | repository-returns-records · infrastructure repositories return records, not domain objects | `repository-imports-entity` breaks repository-returns-records | passed |
| architecture/infrastructure | Recorded rubric judgements | rubric S05 / domain-return is yes | passed |
| architecture/infrastructure | Recorded rubric judgements | rubric S05 / reference is no | passed |
| architecture/infrastructure | Recorded rubric judgements | rubric S10 / unparsed-record is yes | passed |
| architecture/infrastructure | Recorded rubric judgements | rubric S10 / reference is no | passed |
| architecture/infrastructure | Recorded rubric judgements | rubric S14 / three-resource-clients is yes | passed |
| architecture/infrastructure | Recorded rubric judgements | rubric S14 / reference is no | passed |

## Checks

Every check passes.

## Review

Skipped: the project configures no OPENAI_API_KEY.

## Procedures

None.
