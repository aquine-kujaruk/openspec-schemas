---
change: adapters-wrap-external-systems
verdict: verified
digest: 5175a67f73843cd17da3d9dd35c80296e79f816a59efe4c03ce6d13a16727e65
---

# Evidence of adapters-wrap-external-systems

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/adapters | infrastructure-vocabulary · adapter files are named by their suffix | `wrong-suffix` breaks infrastructure-vocabulary | passed |
| architecture/adapters | acl-adapter-paired · adapters implement every anti-corruption layer | `acl-without-adapter` breaks acl-adapter-paired | passed |
| architecture/adapters | acl-adapter-paired · adapters implement every anti-corruption layer | `acl-exports-class` breaks acl-adapter-paired | passed |
| architecture/adapters | adapter-implements-acl · resource adapters implement an anti-corruption layer | `adapter-without-acl` breaks adapter-implements-acl | passed |
| architecture/adapters | adapter-implements-acl · resource adapters implement an anti-corruption layer | `implements-other-module-acl` breaks adapter-implements-acl | passed |
| architecture/adapters | adapter-imports-no-domain-schema · adapters import no domain schema | `imports-domain-schema` breaks adapter-imports-no-domain-schema | passed |
| architecture/adapters | infrastructure-imports-only-core · adapters import only infrastructure, application and domain | `imports-entry` breaks infrastructure-imports-only-core | passed |
| architecture/adapters | no-framework-import · adapters import no framework package | `imports-framework-package` breaks no-framework-import | passed |
| architecture/adapters | infrastructure-names-the-role · adapters are named by their role | `class-named-helper` breaks infrastructure-names-the-role | passed |
| architecture/adapters | infrastructure-names-the-role · adapters are named by their role | `file-named-util` breaks infrastructure-names-the-role | passed |
| architecture/adapters | infrastructure-throws-domain-exceptions · adapters throw only domain exceptions | `throws-raw-error` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/adapters | infrastructure-throws-domain-exceptions · adapters throw only domain exceptions | `throws-own-exception-class` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/adapters | infrastructure-throws-domain-exceptions · adapters throw only domain exceptions | `throws-without-cause` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/adapters | infrastructure-throws-domain-exceptions · adapters throw only domain exceptions | `throws-shared-exception` breaks infrastructure-throws-domain-exceptions | passed |
| architecture/adapters | A reference module satisfies the whole layer | `reference` breaks no rule | passed |
| architecture/adapters | adapter-wraps-external-system · adapters wrap something outside the code | `adapter-forwards-callback` breaks adapter-wraps-external-system | passed |

## Checks

Every check passes.

## Review

Skipped: the project configures no OPENAI_API_KEY.

## Procedures

None.
