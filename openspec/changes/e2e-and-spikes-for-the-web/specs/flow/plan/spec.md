## ADDED Requirements

### Requirement: A web change's screens are spiked while planning

When the change's schema declares a spike workstream and the change touches what a user sees, the plan phase SHALL build that workstream's part of the change as the spike, where it will stay, against stub controllers that return the literal data the screens paint, SHALL mount it with the product's local-run procedure, and SHALL list each screen under `## Screens`. A screen is a visual decision: when a convention or a standing screen settles it, the agent SHALL approve it and say so under Decisions; when it is the person's, it SHALL be an open question with the spike mounted, and the person approves it or asks for changes, which the plan phase applies before asking again. The person MAY decline to see it; the screen is then tagged `@approved:declined`.

#### Scenario Outline: a screen `<settledBy>` is approved by `<approver>` and leaves `<open>` open question(s)

- **GIVEN** an intention whose web change adds the screen `<screen>` <!-- intentionAddingScreen -->
- **AND** the screen is settled by `<settledBy>` <!-- screenSettledBy -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the screen is spiked and approved by `<approver>` <!-- screenApprovedBy -->
- **AND** the plan lists `<open>` open question(s) <!-- planListsOpenQuestions -->

##### Examples:

  | screen      | settledBy                         | approver   | open |
  | ----------- | --------------------------------- | ---------- | ---- |
  | orders-list | a standing screen of the product  | the agent  | 0    |
  | orders-list | the person's judgment             | nobody yet | 1    |

### Requirement: The plan writes the end-to-end tests and leaves them passing against the spike

For every journey through the screens of a web change, the plan phase SHALL write an end-to-end test under `test/e2e/<module>/`: natural-language actions (`agent.act`) and deterministic checks on what the spike shows, and SHALL run it against the mounted spike until it passes. The data the spike paints SHALL be the data the doubles of the end-to-end environment are seeded with, so that the same test passes once the implementation puts the real controllers, use cases and in-memory adapters behind the screens.

#### Scenario Outline: the journey `<journey>` against the spike leaves its test `<state>`

- **GIVEN** a web change whose approved spike holds the journey `<journey>` <!-- spikeHoldsJourney -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the end-to-end test of `<journey>` exists and is `<state>` against the spike <!-- e2eTestStateAgainstSpike -->

##### Examples:

  | journey             | state   |
  | ------------------- | ------- |
  | cancel a pending order | passing |
