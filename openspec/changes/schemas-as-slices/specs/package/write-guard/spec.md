## ADDED Requirements

### Requirement: Product code opens only to a change whose schema builds it

A product path SHALL be writable only while a change is in implementation whose schema has workstreams. A change in implementation whose schema has none SHALL open no product path.

#### Scenario Outline: with a `<schema>` change in implementation, writing `<path>` is `<verdict>`

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** a change in implementation made with the schema `<schema>` <!-- changeInImplementationWithSchema -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | roots | schema        | path                              | verdict |
  | ----- | ------------- | --------------------------------- | ------- |
  | src/* | clean-backend | src/orders/domain/order.entity.ts | allowed |
  | src/* | spec-plan     | src/orders/domain/order.entity.ts | refused |
  | src/* | spec-plan     | docs/outage.md                    | allowed |
