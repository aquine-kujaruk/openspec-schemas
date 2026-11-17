## ADDED Requirements

### Requirement: The spike workstream builds the approved screens and writes their end-to-end tests

In a change whose schema declares a spike workstream, that workstream SHALL be the first the implementation builds for the screens listed under `## Screens`: it SHALL build each one from its approved spike, against stub controllers that return the spike's literal data, and SHALL write the end-to-end test of every journey the screen lists, under `test/e2e/<module>/`, with the actions in natural language and deterministic checks on what the screen shows, passing against the stubs. When a journey writes, the stub controller behind its screen SHALL keep that literal data in its own local state and apply the write to it, with no store and no query cache, so that the screen shows the result. The workstreams built after it SHALL keep those tests passing as the real controllers, use cases and in-memory adapters take the stubs' place. The first web change of a product SHALL write the end-to-end configuration from the product's local-run procedure.

#### Scenario Outline: the journey `<journey>` is `<state>` once `<workstream>` is built

- **GIVEN** a web change whose screen lists the journey `<journey>` <!-- screenListsJourney -->
- **WHEN** the implementation has built `<workstream>` <!-- implementationBuilt -->
- **THEN** the end-to-end test of `<journey>` is `<state>` <!-- e2eTestState -->

##### Examples:

  | journey                | workstream  | state                                   |
  | ---------------------- | ----------- | --------------------------------------- |
  | cancel a pending order | react-ui    | passing against the stub controllers    |
  | cancel a pending order | react-hooks | passing against the in-memory adapters  |

#### Scenario Outline: the stub behind `<action>` paints `<after>` once the action is done

- **GIVEN** a screen built from its spike that paints `<before>` and offers `<action>` <!-- builtScreenOffersAction -->
- **WHEN** the end-to-end test performs `<action>` against the stub controllers <!-- e2eTestPerformsAction -->
- **THEN** the screen paints `<after>` <!-- screenPaints -->
- **AND** the stub controller keeps the written value in its own local state, with no store and no query cache <!-- stubKeepsWriteLocally -->

##### Examples:

  | before  | action           | after     |
  | ------- | ---------------- | --------- |
  | Pending | pay invoice 2    | Paid      |
  | Pending | cancel order O-1 | Cancelled |
