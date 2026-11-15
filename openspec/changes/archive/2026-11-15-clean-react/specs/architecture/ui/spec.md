## Purpose

The JSX of the framework: pages and components in `framework/ui`, the bridges in `framework/bridges` and the entry (`src/main.tsx`: providers, bridges and routing). It paints what a controller gives it and asks nothing else: a page destructures one controller hook, and that hook is the seam this layer is built against, faked by a stub controller that returns literal data until the controllers are written. It navigates but never persists, and it neither compares nor counts.

It receives from the framework the controllers (`framework/controllers/<name>.controller.ts`, `use<Name>Controller`, whose return type the JSX infers) and the view-models it reads, from domain the entities and value objects it paints, and from the problem the screen. It delivers to the entry `export const XPage` in `framework/ui/<page>/<page>.page.tsx` and, when there is one, `export const XBridge` in `framework/bridges/x.bridge.tsx`.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## ADDED Requirements

### Requirement: ui-reaches-core-through-controllers · framework ui reaches the core only through controllers

A file in `framework/ui` SHALL import only domain, controllers, view-models and other `ui` files, and SHALL NOT read or write the query cache itself: everything a page needs arrives through one controller hook, so the page is built and shown against a stub of it.

#### Scenario Outline: `<example>` breaks ui-reaches-core-through-controllers

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                                |
  | ---------------------- | ----------------------------------- |
  | imports-query          | ui-reaches-core-through-controllers |
  | imports-store          | ui-reaches-core-through-controllers |
  | imports-infrastructure | ui-reaches-core-through-controllers |
  | reads-cache-itself     | ui-reaches-core-through-controllers |

### Requirement: jsx-only-in-ui · framework keeps JSX in ui, bridges and the entry

Every `.tsx` file SHALL live in `framework/ui`, `framework/bridges` or be the entry.

#### Scenario Outline: `<example>` breaks jsx-only-in-ui

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example        | rule           |
  | -------------- | -------------- |
  | jsx-outside-ui | jsx-only-in-ui |

### Requirement: jsx-neither-compares-nor-counts · framework JSX neither compares nor counts

No `.tsx` file in `framework/ui` SHALL contain `===`, `!==`, `>=`, `<=` or `.length`: the controller or the ViewModel expose `isSelected`, `isEmpty`, `count`.

#### Scenario Outline: `<example>` breaks jsx-neither-compares-nor-counts

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                 | rule                            |
  | ----------------------- | ------------------------------- |
  | jsx-compares-and-counts | jsx-neither-compares-nor-counts |

### Requirement: ui-never-persists · framework ui, bridges and the entry navigate but never persist

A file in `framework/ui`, `framework/bridges` or the entry SHALL NOT use the persistence or network globals of the configured platform: they belong to `infrastructure/adapters`; navigation globals stay allowed.

#### Scenario Outline: `<example>` breaks ui-never-persists

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example     | rule              |
  | ----------- | ----------------- |
  | ui-persists | ui-never-persists |

### Requirement: A reference module satisfies the whole layer

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
