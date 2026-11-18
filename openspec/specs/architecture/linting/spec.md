# Enforce and verify the architecture rules

## Purpose

How the architecture rules are enforced on the product and verified on themselves. The rules of each layer live in `architecture/<layer>`; this capability says what the linting pipeline does with them: which findings it reports, how a layer is checked alone, and how the linter's own tests are derived from the specs.

## Requirements

### Requirement: Every finding names its rule

Every finding the architecture linting reports on the product SHALL carry the slug of the rule it enforces, so a reader can look the rule up in its layer spec and its example file.

#### Scenario: A finding from a package or global check

- **WHEN** a domain file imports a package the architecture configuration vetoes as framework for the core
- **THEN** the finding's message starts with `[no-framework-import]`

#### Scenario: A finding from a shape check

- **WHEN** an entity file imports no schema
- **THEN** the finding's message starts with `[entity-validates-with-schema]`

#### Scenario: A finding from an import boundary

- **WHEN** an application file imports an infrastructure file
- **THEN** the finding reports the source zone `application` and the target zone `infrastructure`

### Requirement: The architecture pipeline fails on any violation

`factory check` SHALL run every architecture rule over the product and exit non-zero when any rule is broken, and zero when none is.

#### Scenario: A clean product

- **WHEN** no file in `src` or `test/acceptance` breaks a rule
- **THEN** `factory check` exits with status 0

#### Scenario: One violation anywhere

- **WHEN** one file in `src` breaks one rule
- **THEN** `factory check` exits with a non-zero status and the output names the file and the rule

### Requirement: A layer can be checked alone

`factory check --layer <layer> [--module <module>]` SHALL run only the rules of that layer, optionally restricted to one module, so a layer builder verifies their work without the rest of the product.

#### Scenario: Checking one layer of one module

- **WHEN** `factory check --layer domain --module billing` runs
- **THEN** only domain rules are evaluated and only files under `src/billing` are reported

#### Scenario: Unknown layer

- **WHEN** `factory check --layer nothing` runs
- **THEN** the command exits with status 2 and lists the known layers

### Requirement: Linter tests are generated from the layer specs

The tests that verify each rule SHALL be generated from `openspec/specs/architecture/<layer>/spec.md`. Every requirement's scenarios become test cases over the cases of the layer's example file, and each case is checked against the findings recorded inside it. `factory generate --check` SHALL fail when the generated tests are older than the specs. In a project, which holds no layer specs, `factory generate` SHALL generate only the acceptance tests of its product specs.

#### Scenario: A rule gains a counterexample in its spec

- **WHEN** a new Examples row `<case> | <rule-slug>` is added to a layer spec and `factory generate` runs
- **THEN** a test case named after that row exists and fails until the case `### <case>` under `## <rule-slug>` exists in `<layer>.examples.md` and its `expect` block records at least one file

#### Scenario: Stale generated tests

- **WHEN** a layer spec changes and the tests are not regenerated
- **THEN** `factory generate --check` exits non-zero naming the stale file

### Requirement: A rule is verified by counterexample and by reference

For every rule in a layer spec there SHALL be at least one case in the layer's example file that breaks that rule, and a reference module of the workstream that owns the layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, that breaks none; a seam file MAY appear in the references of several of those workstreams only with identical content; a file SHALL appear once in the expectation of a case, with every tool that reported it.

#### Scenario: A rule enforced by two tools

- **WHEN** a domain entity uses a global of the configured platform and both the call-boundary tool and the globals tool report it
- **THEN** the expectation of that case under `no-environment` lists the entity file once, naming both tools

#### Scenario: A rule that is silent on correct code

- **WHEN** every rule of a workstream is checked against its reference module
- **THEN** no file breaks any rule

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

### Requirement: Rule slugs are explicit and agree between spec and code

Every rule SHALL be identified by a kebab-case slug written before ` · ` in its requirement title. Every slug a tool enforces SHALL name a requirement in some layer spec, and every slug in a layer spec SHALL be enforced by some tool.

#### Scenario Outline: A slug on one side only

- **GIVEN** the slug `<slug>` exists only in the `<side>`
- **WHEN** this repository's tests run
- **THEN** it fails naming `<slug>` and the side that lacks it

##### Examples:

  | slug           | side       |
  | -------------- | ---------- |
  | no-globals     | linters    |
  | domain-is-pure | layer spec |

### Requirement: Expectations are recorded inside each case

The findings of a case SHALL be recorded in its `expect` block, written only by `factory expect` and committed: one sorted line per file the rule's tools report, `- <path> (<tool>[, <tool>])`, or `(no findings)`. `factory expect` SHALL replace the content of each case's `expect` block, or append the block at the end of a case that lacks one, and SHALL leave every other line of the example file unchanged.

#### Scenario Outline: A case gets its findings recorded

- **GIVEN** case `<case>` under `<rule>` in `<layer>.examples.md` with `<before>`
- **WHEN** `factory expect` runs
- **THEN** the last block of the case is an `expect` block holding `<line>`

##### Examples:

  | layer  | rule              | case                      | before                         | line                                                            |
  | ------ | ----------------- | ------------------------- | ------------------------------ | --------------------------------------------------------------- |
  | domain | no-environment    | calls-environment         | no expect block                | - src/module/domain/entities/invoice.entity.ts (fallow, oxlint) |
  | domain | domain-vocabulary | folder-outside-vocabulary | an expect block with old lines | - src/module/domain/helpers/format.ts (archunit)                |

#### Scenario Outline: Recording leaves the rest of the file alone

- **GIVEN** `<layer>.examples.md` with prose, code blocks and `expect` blocks
- **WHEN** `factory expect` runs
- **THEN** the file without its `expect` blocks is identical, byte for byte, to the file before without its `expect` blocks

##### Examples:

  | layer          |
  | -------------- |
  | domain         |
  | infrastructure |

### Requirement: A case is verified against its expect block

The generated test of a case SHALL compare the files the rule reports now with the ones its `expect` block records and fail naming the case, the rule and the difference. A case whose block records no file SHALL fail, unless its name starts with `todo.`: a todo case is a known gap, compared like any other and exempt only from that rule.

#### Scenario Outline: The findings drift from the expect block

- **GIVEN** the `expect` block of case `<case>` under `<rule>` records `<recorded>`
- **WHEN** the generated tests run and the rule reports `<reported>`
- **THEN** the test fails naming `<case>`, `<rule>` and the lines that differ

##### Examples:

  | rule     | case           | recorded                                                  | reported                                                  |
  | -------- | -------------- | --------------------------------------------------------- | --------------------------------------------------------- |
  | entity-validates-with-schema | no-schema | - src/module/domain/entities/invoice.entity.ts (archunit) | (no findings)                                             |
  | entity-validates-with-schema | no-schema | - src/module/domain/entities/invoice.entity.ts (archunit) | - src/module/domain/schemas/invoice.schema.ts (archunit) |

#### Scenario Outline: A case without an expect block

- **GIVEN** case `<case>` under `<rule>` in `<layer>.examples.md` has no `expect` block
- **WHEN** the generated tests run
- **THEN** the test fails naming `<case>` and asking for `factory expect`

##### Examples:

  | layer  | rule                         | case      |
  | ------ | ---------------------------- | --------- |
  | domain | entity-validates-with-schema | no-schema |

#### Scenario Outline: A counterexample the rule does not catch

- **GIVEN** the `expect` block of case `<case>` under `<rule>` records `(no findings)`
- **WHEN** the generated tests run
- **THEN** the test fails saying `<case>` breaks `<rule>` in no file

##### Examples:

  | rule                         | case      |
  | ---------------------------- | --------- |
  | entity-validates-with-schema | no-schema |

#### Scenario Outline: A known gap is kept as a todo case

- **GIVEN** the `expect` block of case `todo.<case>` under `<rule>` records `<recorded>`
- **WHEN** the generated tests run and the rule reports `<reported>`
- **THEN** the test `<outcome>`

##### Examples:

  | rule                         | case                | recorded      | reported                                                  | outcome                                                                                                   |
  | ---------------------------- | ------------------- | ------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
  | entity-validates-with-schema | schema-via-reexport | (no findings) | (no findings)                                             | passes                                                                                                    |
  | entity-validates-with-schema | schema-via-reexport | (no findings) | - src/module/domain/entities/invoice.entity.ts (archunit) | fails naming todo.schema-via-reexport and the difference, so the prefix is dropped and the block rewritten |

#### Scenario Outline: A case no spec row names

- **GIVEN** `<layer>.examples.md` holds case `<case>` under `<rule>` and the `<layer>` spec has no row `<case> | <rule>`
- **WHEN** this repository's tests run
- **THEN** it fails naming `<layer>.examples.md`, `<rule>` and `<case>`

##### Examples:

  | layer  | rule     | case          |
  | ------ | -------- | ------------- |
  | domain | no-environment | reads-environment |

### Requirement: Files that carry markup are checked like any other source file

`factory check` SHALL run the rules over every source file of the product, the ones that carry markup included, and SHALL report a rule broken in one of them as it reports any other.

#### Scenario Outline: the rule `<rule>` broken in `<file>` is reported

- **GIVEN** a product whose file `<file>` breaks the rule `<rule>` <!-- productFileBreaksRule -->
- **WHEN** `factory check` runs <!-- checkRuns -->
- **THEN** the output names `<file>` and `<rule>` <!-- outputNamesFileAndRule -->

##### Examples:

  | file                                           | rule           |
  | ---------------------------------------------- | -------------- |
  | src/billing/domain/entities/invoice.entity.ts  | no-environment |
  | src/billing/domain/entities/invoice.entity.tsx | no-environment |

### Requirement: The examples of a layer are verified with the defaults of whoever holds its workstream

In the repository, the tests of a layer's examples SHALL run with the defaults of the schema whose folder holds the layer's workstream, and with the defaults of the core when a core holds it. One run of the repository's check SHALL verify every schema and every core, however many schemas build product code.

#### Scenario Outline: the examples of `<layer>` are verified with the defaults of `<holder>`

- **GIVEN** the repository defines the schemas `<schemas>`, which name the core `<core>` <!-- repositoryDefinesSchemasNamingCore -->
- **AND** the workstream that owns the layer `<layer>` is held by `<holder>` <!-- layerWorkstreamHeldBy -->
- **WHEN** the repository's tests run <!-- repositoryTestsRun -->
- **THEN** the examples of `<layer>` are verified with the defaults of `<holder>` <!-- examplesVerifiedWithDefaultsOf -->

##### Examples:

  | schemas                    | core       | layer  | holder                 |
  | -------------------------- | ---------- | ------ | ---------------------- |
  | clean-backend, clean-react | clean-core | domain | the core clean-core    |
  | clean-backend, clean-react | clean-core | ui     | the schema clean-react |

### Requirement: A rubric row is verified by counterexample and by reference

`@by:person`

A rubric row SHALL have a counterexample expecting yes and a closely matched reference expecting no under `## <row> · <slug>` in the layer's `examples.md`. `factory expect` SHALL submit every file of the case together. With model probability p for yes, confidence SHALL equal p for an expected yes and 1−p for an expected no. At 95% or above the case SHALL pass. At 90% up to but excluding 95% it SHALL pass with a warning. Below 90% it SHALL fail and SHALL NOT record a new expectation. Every accepted block SHALL include verdict, raw score, model and a fingerprint covering model, question and files.

#### Scenario Outline: Recording <case> at <score> produces <state>

- **GIVEN** rubric case `<case>` expects `<expected>` <!-- rubricCaseIn -->
- **AND** the model returns probability `<score>` for yes <!-- modelScores -->
- **WHEN** its judgement is recorded <!-- expectRuns -->
- **THEN** its confidence classification is `<state>` <!-- confidenceIs -->
- **AND** its expectation records `<recorded>` <!-- expectBlockRecords -->

##### Examples:

  | case | expected | score | state | recorded |
  | --- | --- | --- | --- | --- |
  | wrapper-id | yes | 0.95 | target | yes |
  | wrapper-id | yes | 0.90 | warning | yes |
  | wrapper-id | yes | 0.8999 | failed | nothing |
  | wrapper-id | yes | 0.01 | failed | nothing |
  | reference | no | 0.05 | target | no |
  | reference | no | 0.10 | warning | no |
  | reference | no | 0.1001 | failed | nothing |
  | reference | no | 0.99 | failed | nothing |

### Requirement: A recorded judgement is replayed without the model

`@by:person`

A generated test SHALL replay a matching recording without a model call. A changed question, model or case file SHALL require a fresh judgement, and without the configured key the test SHALL fail naming the case and `factory expect`. Recording with `--changed` SHALL reuse the latest real observation of the matching version, including when the expectation is missing. Replay SHALL leave the history intact.

#### Scenario Outline: Replaying <change> with key <key> makes <calls> calls

- **GIVEN** a recorded case with change `<change>` <!-- recordedRubricCase -->
- **AND** the key is `<key>` <!-- reviewKeyIs -->
- **WHEN** its judgement is requested <!-- generatedTestsRun -->
- **THEN** the model is called `<calls>` times <!-- modelCalled -->
- **AND** the result is `<result>` <!-- testResult -->

##### Examples:

  | change | key | calls | result |
  | --- | --- | --- | --- |
  | none | absent | 0 | replayed |
  | case | present | 1 | live |
  | question | present | 1 | live |
  | model | present | 1 | live |
  | case | absent | 0 | missing |
  | question | absent | 0 | missing |
  | model | absent | 0 | missing |

### Requirement: Every judgement joins a history the report reads

`@by:person`

Each live judgement SHALL append its probability, timestamp, model and fingerprints to the layer's score history. The Vitest report SHALL show the case, expected verdict, raw score, confidence, classification, history, difference from the mean of all preceding scores, version changes and live or replay status. An absolute difference of at least 20 percentage points SHALL raise an independent warning. The expected-verdict confidence SHALL determine whether the case passes. One policy SHALL apply to every version of every case.

#### Scenario Outline: History <history> followed by <score> yields <state> with drift <drift>

- **GIVEN** a counterexample with historical scores `<history>` <!-- scoreHistory -->
- **WHEN** the model scores it `<score>` <!-- modelScores -->
- **THEN** the report classifies it as `<state>` <!-- reportShows -->
- **AND** the historical warning is `<drift>` <!-- historicalWarningIs -->
- **AND** the test `<result>` <!-- testResult -->

##### Examples:

  | history | score | state | drift | result |
  | --- | --- | --- | --- | --- |
  | none | 0.95 | target | absent | passes |
  | 0.97 0.96 0.97 | 0.95 | target | absent | passes |
  | 0.75 | 0.95 | target | present | passes |
  | 0.72 | 0.91 | warning | absent | passes |
  | 0.70 | 0.90 | warning | present | passes |
  | 0.92 0.91 0.93 | 0.64 | failed | present | fails |
