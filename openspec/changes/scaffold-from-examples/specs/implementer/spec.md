## ADDED Requirements

### Requirement: Every scaffold renders into a file its layer accepts

A layer's examples MAY hold scaffolds, one per kind, in a section of their own. For every scaffold, this repository's tests SHALL render it with a sample name and module, and SHALL fail naming the scaffold when the rendered file is not at the path its layer's vocabulary gives that kind, or breaks a rule of its layer that reads that file alone.

#### Scenario Outline: the `<kind>` scaffold of `<layer>` renders `<path>`

- **GIVEN** the scaffold of kind `<kind>` in the examples of layer `<layer>` <!-- scaffoldOfKind -->
- **WHEN** it is rendered with name `<name>` in module `<module>` <!-- scaffoldRendered -->
- **THEN** the file `<path>` passes rule `<rule>` <!-- renderedFilePasses -->

##### Examples:

  | kind                 | layer          | name    | module  | path                                                               | rule                         |
  | -------------------- | -------------- | ------- | ------- | ------------------------------------------------------------------ | ---------------------------- |
  | schema               | domain         | Invoice | billing | src/billing/domain/schemas/invoice.schema.ts                       | domain-vocabulary            |
  | entity               | domain         | Invoice | billing | src/billing/domain/entities/invoice.entity.ts                      | entity-validates-with-schema |
  | repository-interface | application    | Invoice | billing | src/billing/application/repository-interfaces/invoice.repository-interface.ts | application-vocabulary |
  | acl                  | infrastructure | Invoice | billing | src/billing/infrastructure/acl/invoice.acl.ts                      | infrastructure-vocabulary    |

#### Scenario Outline: a `<kind>` scaffold that breaks `<rule>` fails the tests

- **GIVEN** the scaffold of kind `<kind>` in the examples of layer `<layer>` renders a file that breaks rule `<rule>` <!-- scaffoldBreaksRule -->
- **WHEN** this repository's tests run <!-- archTestRuns -->
- **THEN** it fails naming the `<kind>` scaffold of `<layer>` <!-- failsNamingScaffold -->

##### Examples:

  | kind   | layer  | rule                         |
  | ------ | ------ | ---------------------------- |
  | entity | domain | entity-validates-with-schema |
