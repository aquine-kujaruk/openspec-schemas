## MODIFIED Requirements

### Requirement: Examples are one Markdown file per layer

The examples of a layer SHALL live in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`, in the folder of the workstream that owns it: a `## reference` section, then one `## <rule-slug>` per rule with one `### <case>` per counterexample. Each file of a case SHALL be a fenced block whose info string is its language and repository path, and the tools SHALL see exactly those files. A case SHALL end with one `expect` block holding its findings; `## reference` has none.

#### Scenario Outline: A case is materialized from its blocks

- **GIVEN** case `<case>` under `<rule>` in `<file>` holds a block at `<path>` that breaks the rule
- **WHEN** rule `<rule>` is checked on case `<case>`
- **THEN** the broken file is `<path>`

##### Examples:

  | file                | rule                       | case                   | path                                         |
  | ------------------- | -------------------------- | ---------------------- | -------------------------------------------- |
  | domain.examples.md  | domain-imports-only-domain | imports-infrastructure | src/module/domain/entities/invoice.entity.ts |
  | modules.examples.md | modules-are-isolated       | imports-another-module | src/module/domain/entities/invoice.entity.ts |

#### Scenario Outline: A case the spec names but the example file lacks

- **GIVEN** the `<layer>` spec has the row `<case> | <rule>` and `<layer>.examples.md` has no such case
- **WHEN** the generated tests run
- **THEN** the test fails naming `<layer>.examples.md`, `<rule>` and `<case>` instead of comparing with an empty expectation

##### Examples:

  | layer  | case    | rule                       |
  | ------ | ------- | -------------------------- |
  | domain | missing | domain-imports-only-domain |

#### Scenario Outline: An expect block where no case can own it

- **GIVEN** `<layer>.examples.md` holds an `expect` block `<place>`
- **WHEN** the example file is read
- **THEN** reading fails naming `<layer>.examples.md` and the line of that block

##### Examples:

  | layer  | place                                  |
  | ------ | -------------------------------------- |
  | domain | inside `## reference`                  |
  | domain | as a second block of case `no-schema`  |
  | domain | before the first `### <case>` heading of `## no-environment` |
