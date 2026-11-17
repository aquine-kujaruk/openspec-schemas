## MODIFIED Requirements

### Requirement: The plan writes the end-to-end tests and leaves them passing against the spike

For every journey through the screens of a web change, the plan phase SHALL write an end-to-end test under `test/e2e/<module>/`: natural-language actions (`agent.act`) and deterministic checks on what the spike shows, and SHALL run it against the mounted spike until it passes. The data the spike paints SHALL be the data the doubles of the end-to-end environment are seeded with, so that the same test passes once the implementation puts the real controllers, use cases and in-memory adapters behind the screens. When a journey writes, the stub controller behind its screen SHALL keep that literal data in its own local state and apply the write to it, with no store and no query cache, so that the screen shows the result of the action against the spike.

#### Scenario Outline: the journey `<journey>` against the spike leaves its test `<state>`

- **GIVEN** a web change whose approved spike holds the journey `<journey>` <!-- spikeHoldsJourney -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the end-to-end test of `<journey>` exists and is `<state>` against the spike <!-- e2eTestStateAgainstSpike -->

##### Examples:

  | journey             | state   |
  | ------------------- | ------- |
  | cancel a pending order | passing |

#### Scenario Outline: the stub behind `<action>` paints `<after>` once the action is done

- **GIVEN** a spiked screen that paints `<before>` and offers `<action>` <!-- spikedScreenOffersAction -->
- **WHEN** the end-to-end test performs `<action>` against the spike <!-- e2eTestPerformsAction -->
- **THEN** the screen paints `<after>` <!-- screenPaints -->
- **AND** the stub controller keeps the written value in its own local state, with no store and no query cache <!-- stubKeepsWriteLocally -->

##### Examples:

  | before  | action              | after |
  | ------- | ------------------- | ----- |
  | Pending | pay invoice 2       | Paid  |
  | Pending | cancel order O-1    | Cancelled |
