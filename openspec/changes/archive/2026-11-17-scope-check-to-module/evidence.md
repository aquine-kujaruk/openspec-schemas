---
change: scope-check-to-module
verdict: verified
digest: 392e3fd415893470efd71f9567db24f9235109e8941562faea76b726f57ab52c
---

# Evidence of scope-check-to-module

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

## Checks

Every check passes.

## Review

Skipped: the project configures no OPENAI_API_KEY.

## Procedures

None.
