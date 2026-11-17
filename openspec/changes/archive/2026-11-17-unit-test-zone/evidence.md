---
change: unit-test-zone
verdict: verified
digest: d44bba0e9aa01f5b5625eeb73cc1083888202c0ef574c590ebb547a240de1801
---

# Evidence of unit-test-zone

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/unit | unit-test-targets-core-file · unit tests target an existing file of the domain or the application | `test-without-target` breaks unit-test-targets-core-file | passed |
| architecture/unit | unit-test-targets-core-file · unit tests target an existing file of the domain or the application | `test-outside-module-folder` breaks unit-test-targets-core-file | passed |
| architecture/unit | unit-test-targets-core-file · unit tests target an existing file of the domain or the application | `test-of-infrastructure` breaks unit-test-targets-core-file | passed |
| architecture/unit | unit-imports-only-the-core · unit tests import only the domain and the application | `test-imports-adapter` breaks unit-imports-only-the-core | passed |
| architecture/unit | unit-imports-only-the-core · unit tests import only the domain and the application | `test-imports-repository-implementation` breaks unit-imports-only-the-core | passed |
| architecture/unit | A reference module satisfies the unit rules | `reference` breaks no rule | passed |
| implementer |  |  | passed, by the person's word |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
