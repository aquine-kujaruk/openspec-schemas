## Purpose

Archiving changes: a verified change has its spec deltas merged, what its plan declares applied to the consolidated decisions and procedures, and is then kept as immutable history. Archiving applies what was decided while planning; it decides nothing and asks nothing.

## ADDED Requirements

### Requirement: Only a verified change is archived

`@by:agent`

Archiving SHALL move a change to the archive only when its evidence reports it verified. A change whose evidence reports it not verified, or that has no evidence, SHALL stay active.

#### Scenario Outline: `<change>` with evidence `<verdict>` is `<place>`

- **GIVEN** an active change `<change>` whose evidence is `<verdict>` <!-- activeChangeEvidence -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the change `<change>` is `<place>` <!-- changePlace -->

##### Examples:

  | change     | verdict      | date       | place        |
  | ---------- | ------------ | ---------- | ------------ |
  | add-orders | verified     | 2026-11-20 | archived     |
  | add-orders | not verified | 2026-11-20 | still active |
  | add-orders | absent       | 2026-11-20 | still active |

### Requirement: The plan's tags are applied to the consolidated decisions

`@by:agent`

Archiving SHALL apply, to the consolidated decisions, the operation each decision block of the plan is tagged with: `@adds` adds the block, `@modifies` replaces the block of the same slug, `@replaces` removes the named block and adds the new one, `@renames` gives the named block its new slug, `@removes` removes the named block. It SHALL do so without asking the person anything.

#### Scenario Outline: `<tag>` on `<slug>` turns the decisions `<before>` into `<after>`

- **GIVEN** the consolidated decisions `<before>` <!-- consolidatedDecisionsBefore -->
- **AND** a verified change `<change>` whose plan has the decision block `<slug>` tagged `<tag>` <!-- verifiedChangeDecisionTagged -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the consolidated decisions are `<after>` <!-- consolidatedDecisionsAfter -->
- **AND** the person was asked `<asked>` question(s) <!-- questionsAsked -->

##### Examples:

  | before                    | change       | slug             | tag                      | date       | after            | asked |
  | ------------------------- | ------------ | ---------------- | ------------------------ | ---------- | ---------------- | ----- |
  | none                      | add-orders   | money-in-cents   | @adds                    | 2026-11-20 | money-in-cents   | 0     |
  | money-in-cents            | tune-money   | money-in-cents   | @modifies:money-in-cents | 2026-12-01 | money-in-cents   | 0     |
  | money-in-cents            | use-decimals | money-as-decimal | @replaces:money-in-cents | 2026-12-01 | money-as-decimal | 0     |
  | money-in-cents            | rename-money | integer-money    | @renames:money-in-cents  | 2026-12-01 | integer-money    | 0     |
  | money-in-cents, no-router | add-router   | no-router        | @removes:no-router       | 2026-12-01 | money-in-cents   | 0     |

### Requirement: Every consolidated block names the change that last wrote it

`@by:agent`

Archiving SHALL stamp each consolidated block it adds or rewrites with its origin: the name under which the change was archived. Nothing else SHALL write an origin.

#### Scenario Outline: `<slug>` written by `<change>` on `<date>` has the origin `<origin>`

- **GIVEN** the consolidated decisions `<before>` <!-- consolidatedDecisionsBefore -->
- **AND** a verified change `<change>` whose plan has the decision block `<slug>` tagged `<tag>` <!-- verifiedChangeDecisionTagged -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the consolidated decision `<slug>` has the origin `<origin>` <!-- consolidatedDecisionOrigin -->

##### Examples:

  | before         | change     | slug           | tag                      | date       | origin                |
  | -------------- | ---------- | -------------- | ------------------------ | ---------- | --------------------- |
  | none           | add-orders | money-in-cents | @adds                    | 2026-11-20 | 2026-11-20-add-orders |
  | money-in-cents | tune-money | money-in-cents | @modifies:money-in-cents | 2026-12-01 | 2026-12-01-tune-money |

### Requirement: Consolidation keeps the decision and leaves the narrative in the change

`@by:agent`

A consolidated decision SHALL hold its statement, where it applies, what enforces it and a short reason. The alternatives and consequences the plan lists SHALL stay in the archived plan and SHALL NOT be copied to the consolidated block.

#### Scenario Outline: a block listing `<alternatives>` alternative(s) consolidates with `<consolidatedAlternatives>`

- **GIVEN** the consolidated decisions `<before>` <!-- consolidatedDecisionsBefore -->
- **AND** a verified change `<change>` whose plan has the decision block `<slug>` tagged `<tag>` <!-- verifiedChangeDecisionTagged -->
- **AND** that block lists `<alternatives>` alternative(s) <!-- blockListsAlternatives -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the consolidated decision `<slug>` lists `<consolidatedAlternatives>` alternative(s) <!-- consolidatedDecisionAlternatives -->
- **AND** the archived plan of `<change>` lists `<archivedAlternatives>` alternative(s) for `<slug>` <!-- archivedPlanAlternatives -->

##### Examples:

  | before | change     | slug           | tag   | alternatives | date       | consolidatedAlternatives | archivedAlternatives |
  | ------ | ---------- | -------------- | ----- | ------------ | ---------- | ------------------------ | -------------------- |
  | none   | add-orders | money-in-cents | @adds | 2            | 2026-11-20 | 0                        | 2                    |

### Requirement: A tag that no longer holds stops the archive and raises feedback

`@by:agent`

When a tag of the plan does not hold against the consolidated tree at the moment of archiving, archiving SHALL write nothing, SHALL leave the change active, and SHALL raise feedback naming the block.

#### Scenario Outline: `<tag>` on `<slug>` against `<before>` leaves `<change>` `<place>`

- **GIVEN** the consolidated decisions `<before>` <!-- consolidatedDecisionsBefore -->
- **AND** a verified change `<change>` whose plan has the decision block `<slug>` tagged `<tag>` <!-- verifiedChangeDecisionTagged -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the change `<change>` is `<place>` <!-- changePlace -->
- **AND** the consolidated decisions are `<after>` <!-- consolidatedDecisionsAfter -->
- **AND** feedback is raised naming the block `<slug>` <!-- feedbackNamesBlock -->

##### Examples:

  | before         | change       | slug             | tag                      | date       | place        | after          |
  | -------------- | ------------ | ---------------- | ------------------------ | ---------- | ------------ | -------------- |
  | none           | use-decimals | money-as-decimal | @replaces:money-in-cents | 2026-12-01 | still active | none           |
  | money-in-cents | add-orders   | money-in-cents   | @adds                    | 2026-12-01 | still active | money-in-cents |

### Requirement: A block another change rewrote since the plan saw it stops the archive

`@by:agent`

A plan that modifies, replaces, renames or removes a consolidated block records the origin it saw on that block. When the block's origin is no longer that one at the moment of archiving, archiving SHALL leave the change active.

#### Scenario Outline: `<target>` seen as `<seenOrigin>` and now `<currentOrigin>` leaves `<change>` `<place>`

- **GIVEN** the consolidated decision `<target>` whose origin is `<currentOrigin>` <!-- consolidatedDecisionWithOrigin -->
- **AND** a verified change `<change>` whose plan modifies `<target>` as seen with the origin `<seenOrigin>` <!-- planModifiesAsSeen -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the change `<change>` is `<place>` <!-- changePlace -->

##### Examples:

  | target         | currentOrigin         | change     | seenOrigin            | date       | place        |
  | -------------- | --------------------- | ---------- | --------------------- | ---------- | ------------ |
  | money-in-cents | 2026-11-20-add-orders | tune-money | 2026-11-20-add-orders | 2026-12-01 | archived     |
  | money-in-cents | 2026-11-25-add-prices | tune-money | 2026-11-20-add-orders | 2026-12-01 | still active |

### Requirement: Decisions consolidate by area and topic

`@by:agent`

A decision SHALL be consolidated in the file of its area and topic, the area being `product` or `production`.

#### Scenario Outline: `<slug>` of area `<area>` and topic `<topic>` is consolidated in `<path>`

- **GIVEN** a verified change `<change>` whose plan adds the decision `<slug>` in the area `<area>` and topic `<topic>` <!-- verifiedChangeAddsDecisionIn -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the decision `<slug>` is consolidated in `<path>` <!-- decisionConsolidatedIn -->

##### Examples:

  | change     | slug           | area       | topic    | date       | path                                 |
  | ---------- | -------------- | ---------- | -------- | ---------- | ------------------------------------ |
  | add-orders | money-in-cents | product    | money    | 2026-11-20 | openspec/adr/product/money.md        |
  | add-ci     | ci-runs-checks | production | delivery | 2026-11-21 | openspec/adr/production/delivery.md  |

### Requirement: Procedures consolidate by purpose and topic

`@by:agent`

A procedure SHALL be consolidated in the file of its purpose and topic, keeping the environments it is tagged with.

#### Scenario Outline: `<slug>` of purpose `<purpose>` and topic `<topic>` is consolidated in `<path>`

- **GIVEN** a verified change `<change>` whose plan adds the procedure `<slug>` of purpose `<purpose>` and topic `<topic>` for the environments `<envs>` <!-- verifiedChangeAddsProcedureOf -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the procedure `<slug>` is consolidated in `<path>` <!-- procedureConsolidatedIn -->
- **AND** the consolidated procedure `<slug>` is tagged for the environments `<envs>` <!-- consolidatedProcedureEnvs -->

##### Examples:

  | change            | slug        | purpose  | topic | envs           | date       | path                               |
  | ----------------- | ----------- | -------- | ----- | -------------- | ---------- | ---------------------------------- |
  | diagnose-checkout | prod-logs   | diagnose | logs  | prod           | 2026-11-22 | openspec/runbooks/diagnose/logs.md |
  | add-orders        | local-setup | setup    | local | local, sandbox | 2026-11-20 | openspec/runbooks/setup/local.md   |

### Requirement: Spec deltas are merged and the generated tests follow them

`@by:agent`

Archiving SHALL merge every delta spec of the change into the consolidated specs and SHALL leave no generated test older than the spec it comes from.

#### Scenario Outline: `<change>` with `<deltas>` delta spec(s) leaves `<merged>` merged and `<stale>` stale test(s)

- **GIVEN** a verified change `<change>` with `<deltas>` delta spec(s) <!-- verifiedChangeWithDeltas -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** `<merged>` consolidated spec(s) carry its requirements <!-- consolidatedSpecsCarry -->
- **AND** `<stale>` generated test(s) are older than their spec <!-- staleGeneratedTests -->

##### Examples:

  | change            | deltas | date       | merged | stale |
  | ----------------- | ------ | ---------- | ------ | ----- |
  | add-orders        | 2      | 2026-11-20 | 2      | 0     |
  | diagnose-checkout | 0      | 2026-11-22 | 0      | 0     |

### Requirement: Archiving with no change named archives every verified change, oldest first

`@by:agent`

When no change is named, archiving SHALL archive every active change whose evidence reports it verified, in the order they were created, and SHALL leave the others active.

#### Scenario Outline: archiving everything archives `<archived>` and leaves `<active>`

- **GIVEN** the verified active changes `<verified>` in order of creation <!-- verifiedChangesInOrder -->
- **AND** the active changes not verified `<unverified>` <!-- unverifiedChanges -->
- **WHEN** every change is archived on `<date>` <!-- archiveEveryChange -->
- **THEN** the changes archived, in order, are `<archived>` <!-- changesArchivedInOrder -->
- **AND** the changes still active are `<active>` <!-- changesStillActive -->

##### Examples:

  | verified               | unverified  | date       | archived               | active      |
  | ---------------------- | ----------- | ---------- | ---------------------- | ----------- |
  | add-orders, tune-money | add-refunds | 2026-12-01 | add-orders, tune-money | add-refunds |
  | none                   | add-refunds | 2026-12-01 | none                   | add-refunds |

### Requirement: With products, decisions consolidate under their product

`@by:agent`

In a project with products, a decision SHALL be consolidated in the file of its area and topic under the folder of the product its change builds.

#### Scenario Outline: `<slug>` of the product `<product>` is consolidated in `<path>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a verified change `<change>` of the product `<product>` whose plan adds the decision `<slug>` in the area `<area>` and topic `<topic>` <!-- verifiedChangeOfProductAddsDecisionIn -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the decision `<slug>` is consolidated in `<path>` <!-- decisionConsolidatedIn -->

##### Examples:

  | products    | change         | product | slug           | area    | topic | date       | path                              |
  | ----------- | -------------- | ------- | -------------- | ------- | ----- | ---------- | --------------------------------- |
  | api, worker | add-orders-api | api     | money-in-cents | product | money | 2026-11-20 | openspec/adr/api/product/money.md |

### Requirement: A consolidated decision keeps who took it

`@by:agent`

Archiving SHALL keep on each consolidated decision and procedure, and on each merged requirement, the `@by` its change gave it.

#### Scenario Outline: a `<kind>` tagged `<by>` consolidates tagged `<consolidated>`

- **GIVEN** a verified change `<change>` whose `<kind>` `<name>` is tagged `<by>` <!-- verifiedChangeWithKindTaggedBy -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the consolidated `<kind>` `<name>` is tagged `<consolidated>` <!-- consolidatedKindTagged -->

##### Examples:

  | kind        | name              | by         | consolidated | change     | date       |
  | ----------- | ----------------- | ---------- | ------------ | ---------- | ---------- |
  | decision    | money-in-cents    | @by:person | @by:person   | add-orders | 2026-11-20 |
  | procedure   | prod-logs         | @by:agent  | @by:agent    | add-orders | 2026-11-20 |
  | requirement | Orders are listed | @by:person | @by:person   | add-orders | 2026-11-20 |
