## MODIFIED Requirements

### Requirement: A web change's screens are spiked while planning

When the change's schema declares a spike workstream and the change touches what a user sees, the plan phase SHALL spike its screens as throwaway HTML files under the change's `spikes/` folder: each one self-contained, opened without a build, a server or the product, painting the literal data the screens show in the product's own words, and walking through each journey. The plan phase SHALL list each screen under `## Screens`, naming its spike and the page the implementation will build, with every journey through it written in plain words. The plan phase SHALL NOT write the product's code: a product with no source yet is spiked like any other. A screen is a visual decision: when a convention or a standing screen settles it, the agent SHALL approve it from a spike with one variant and say so under Decisions; when it is the person's, its spike SHALL offer several structurally different variants and it SHALL be an open question; the person picks one or asks for changes, which the plan phase applies before asking again, and once approved the spike keeps only the variant the person approved. The person MAY decline to see it; the screen is then tagged `@approved:declined`. The data a spike paints SHALL be the data the in-memory adapters of the end-to-end environment are seeded with.

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

#### Scenario Outline: a screen settled by `<settledBy>` is spiked with `<variants>` variant(s), and `<kept>` kept once approved

- **GIVEN** an intention whose web change adds the screen `<screen>` <!-- intentionAddingScreen -->
- **AND** the screen is settled by `<settledBy>` <!-- screenSettledBy -->
- **WHEN** the screen is approved <!-- screenIsApproved -->
- **THEN** its spike offered `<variants>` variant(s) <!-- spikeOfferedVariants -->
- **AND** its spike keeps `<kept>` <!-- spikeKeeps -->

##### Examples:

  | screen      | settledBy                         | variants | kept                       |
  | ----------- | --------------------------------- | -------- | -------------------------- |
  | orders-list | a standing screen of the product  | 1        | that variant               |
  | orders-list | the person's judgment             | 3        | the variant the person chose |

#### Scenario Outline: spiking `<screen>` in a product that `<product>` writes `<spike>` and no product file

- **GIVEN** an intention whose web change adds the screen `<screen>` <!-- intentionAddingScreen -->
- **AND** a product that `<product>` <!-- productThat -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the change holds the spike `<spike>` <!-- changeHoldsSpike -->
- **AND** no file of the product was written <!-- noProductFileWritten -->
- **AND** the screen lists `<journeys>` journey(s) in plain words <!-- screenListsJourneys -->

##### Examples:

  | screen        | product                          | spike                    | journeys |
  | ------------- | -------------------------------- | ------------------------ | -------- |
  | orders-list   | already serves other screens     | spikes/orders.html       | 2        |
  | invoices-list | has no source yet                | spikes/invoices.html     | 1        |

## REMOVED Requirements

### Requirement: The plan writes the end-to-end tests and leaves them passing against the spike

**Reason**: The plan writes no product code, and a test recorded against a throwaway page would check a DOM that is thrown away. The end-to-end tests are written while implementing, by the spike workstream, from the journeys each screen lists.

**Migration**: See `flow/implement`, requirement "The spike workstream builds the approved screens and writes their end-to-end tests".
