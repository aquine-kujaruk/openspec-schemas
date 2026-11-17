---
change: accept-explicit-import-extensions
verdict: verified
digest: 8bcd21c3c9f2f7836399d98667c7dc9493096ea9a54c52d8846b74e82e6ef333
---

# Evidence of accept-explicit-import-extensions

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

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
