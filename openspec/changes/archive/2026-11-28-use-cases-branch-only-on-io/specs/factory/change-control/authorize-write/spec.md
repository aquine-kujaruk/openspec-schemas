## ADDED Requirements

### Requirement: A write the policy already resolved reads no work order

`@by:person`

When the write policy resolves a path as harness or as outside every product, the guard SHALL decide without reading the work orders in implementation; it SHALL read them only for a path that belongs to a product.

#### Scenario Outline: a write to `<path>` reads the work orders `<reads>` time(s)

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->
- **AND** the work orders are read `<reads>` time(s) <!-- workOrdersRead -->

##### Examples:

  | roots  | changes | path                              | verdict | reads |
  | ------ | ------- | --------------------------------- | ------- | ----- |
  | src/*  | 1       | openspec/specs/a.md               | refused | 0     |
  | src/*  | 1       | README.md                         | allowed | 0     |
  | src/*  | 1       | src/orders/domain/order.entity.ts | allowed | 1     |
