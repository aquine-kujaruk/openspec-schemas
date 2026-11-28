## Purpose

The optional delivery layer of a backend: one controller per module in `framework/controllers`, which composes its use cases and translates what a transport brings (arguments, a hook payload, standard input) into a call to the core, and its result into output and an exit status. A backend without controllers breaks none of these rules.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## ADDED Requirements

### Requirement: controllers-vocabulary · a module's framework holds only controllers

`@by:person`

Every file under a module's `framework` folder SHALL sit in `framework/controllers` and be named `<name>.controller.ts`.

#### Scenario Outline: `<example>` breaks controllers-vocabulary

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                 |
  | ------------------------- | -------------------- |
  | file-outside-controllers  | controllers-vocabulary |

### Requirement: controller-reaches-core-through-use-cases · controllers import only application and domain

`@by:person`

A controller SHALL import only use cases, their exceptions and the domain types they return; it SHALL NOT import infrastructure, since the composition root hands it the use cases already built.

#### Scenario Outline: `<example>` breaks controller-reaches-core-through-use-cases

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                    | rule                                     |
  | -------------------------- | ---------------------------------------- |
  | controller-imports-adapter | controller-reaches-core-through-use-cases |
