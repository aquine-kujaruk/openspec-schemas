## Purpose

The client of the core, in React, without its JSX: controllers in `framework/controllers`, queries, mutations, view-models and stores. It decides _when_ and _what_ to show and hands it to the JSX through one controller hook per page; the JSX itself is the `ui` layer. It is thrown away and rebuilt without touching the core. It never imports infrastructure except the repository implementation and the adapter instance it composes, from queries and mutations.

It receives from application the name and `execute` signature of each use case and the exceptions it throws, from infrastructure the name of each `XRepositoryImplementation` and of each `xAdapter` instance, from domain the entities and value objects to read, and from `ui` the stub controllers whose shape the pages destructure. It delivers `use<Name>Controller` in `framework/controllers/<name>.controller.ts`, keeping the shape of the stub it replaces.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## ADDED Requirements

### Requirement: framework-vocabulary · framework is a closed vocabulary

The framework SHALL contain only the folders `ui`, `controllers`, `queries`, `mutations`, `view-models`, `stores` and `bridges`, with files `*.controller.ts`, `*.query.ts`, `*.mutation.ts`, `*.view-model.ts`, `*.store.ts` and `*.bridge.tsx`; `ui` holds pages and components, `.tsx` files without a single suffix. A reusable hook is a controller.

#### Scenario Outline: `<example>` breaks framework-vocabulary

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                 |
  | ------------------------- | -------------------- |
  | folder-outside-vocabulary | framework-vocabulary |
  | wrong-suffix              | framework-vocabulary |
  | controller-inside-ui      | framework-vocabulary |

### Requirement: query-bridges-use-case · framework queries and mutations bridge a use case

Every file in `queries` or `mutations` SHALL do `new XUseCase(new XRepositoryImplementation(xAdapter))`, with `xAdapter` an ACL-typed instance an adapter file exports, and call `useQuery` or `useMutation`, or be a React Query state reader (`useMutationState`, `useIsMutating`, `useIsFetching`) without any `new`. It SHALL NOT do `new XAdapter(`: the hook is the composition root, the adapter file decides which backend answers in each environment, and there is no container.

#### Scenario Outline: `<example>` breaks query-bridges-use-case

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                     | rule                   |
  | --------------------------- | ---------------------- |
  | news-an-adapter             | query-bridges-use-case |
  | no-use-case                 | query-bridges-use-case |
  | imports-repository-instance | query-bridges-use-case |

### Requirement: one-hook-per-file · framework hooks live one per file, named after the hook

Every file in `queries` or `mutations` SHALL export exactly one hook `use<Name>Query` or `use<Name>Mutation`, and SHALL be named `<name>.query.ts` or `<name>.mutation.ts` with `<name>` in kebab case (`useListOrdersQuery` → `list-orders.query.ts`).

#### Scenario Outline: `<example>` breaks one-hook-per-file

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                     | rule              |
  | --------------------------- | ----------------- |
  | two-hooks-in-one-file       | one-hook-per-file |
  | file-name-differs-from-hook | one-hook-per-file |

### Requirement: use-case-bridged-once · framework bridges every use case exactly once

For every `export class XUseCase` in `application/use-cases`, exactly one file in `framework/queries` or `framework/mutations` SHALL do `new XUseCase(`. This is the seam application → framework.

#### Scenario Outline: `<example>` breaks use-case-bridged-once

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                  |
  | ------------------------- | --------------------- |
  | use-case-without-bridge   | use-case-bridged-once |
  | use-case-with-two-bridges | use-case-bridged-once |

### Requirement: controller-exports-no-types · framework controllers and hooks export no types

No file in `framework/controllers` SHALL export a type or interface: the JSX infers the controller's shape, so the stub controller the UI is built against and the controller that replaces it share their shape without naming it.

#### Scenario Outline: `<example>` breaks controller-exports-no-types

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                        |
  | ------------------------- | --------------------------- |
  | controller-exports-a-type | controller-exports-no-types |

### Requirement: query-keys-from-factory · framework query keys come from a factory

No framework file SHALL pass an array literal to `queryKey`, `setQueryData`, `invalidateQueries`, `removeQueries` or `getQueryData`: the key comes from the `xQueryKey(...)` factory the query exports.

#### Scenario Outline: `<example>` breaks query-keys-from-factory

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example           | rule                    |
  | ----------------- | ----------------------- |
  | literal-query-key | query-keys-from-factory |

### Requirement: view-model-imports-only-domain · framework view-models import only domain

A file in `framework/view-models` SHALL import only domain files.

#### Scenario Outline: `<example>` breaks view-model-imports-only-domain

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example             | rule                           |
  | ------------------- | ------------------------------ |
  | imports-application | view-model-imports-only-domain |

### Requirement: no-framework-import · framework view-models import no React

A file in `framework/view-models` SHALL NOT import `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query` or `zustand`.

#### Scenario Outline: `<example>` breaks no-framework-import

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                  | rule                |
  | ------------------------ | ------------------- |
  | view-model-imports-react | no-framework-import |

### Requirement: store-imports-domain-and-view-models · framework stores import only domain and view-models

A file in `framework/stores` SHALL import only domain and view-model files, and SHALL NOT import React Query: two caches never mix.

#### Scenario Outline: `<example>` breaks store-imports-domain-and-view-models

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                                 |
  | ---------------------- | ------------------------------------ |
  | imports-react-query    | store-imports-domain-and-view-models |
  | imports-infrastructure | store-imports-domain-and-view-models |

### Requirement: no-environment · framework queries, mutations, view-models and stores never touch the environment

A file in `framework/controllers`, `framework/queries`, `framework/mutations`, `framework/view-models` or `framework/stores` SHALL NOT use any global the configured platform provides: only infrastructure adapters touch the environment.

#### Scenario Outline: `<example>` breaks no-environment

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                      | rule           |
  | ---------------------------- | -------------- |
  | store-calls-environment      | no-environment |
  | controller-calls-environment | no-environment |

### Requirement: controller-reaches-core-through-queries · framework controllers reach the core only through queries, mutations and stores

A file in `framework/controllers` SHALL import only domain, queries, mutations, stores, view-models and other controllers, and SHALL NOT read or write the query cache itself: cache invalidation goes in the mutation, and the JSX is never a dependency of the controller that feeds it.

#### Scenario Outline: `<example>` breaks controller-reaches-core-through-queries

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                                    |
  | ---------------------- | --------------------------------------- |
  | imports-infrastructure | controller-reaches-core-through-queries |
  | imports-ui             | controller-reaches-core-through-queries |
  | reads-cache-itself     | controller-reaches-core-through-queries |

### Requirement: no-hooks · hooks live only in the framework

No file in `domain`, `application` or `infrastructure` SHALL export or declare a function named `use<Something>`: hooks belong to the framework.

#### Scenario Outline: `<example>` breaks no-hooks

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example             | rule     |
  | ------------------- | -------- |
  | core-exports-a-hook | no-hooks |

### Requirement: A reference module satisfies the whole layer

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
