## ADDED Requirements

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
