## ADDED Requirements

### Requirement: With products, decisions consolidate under their product

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
