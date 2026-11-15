## ADDED Requirements

### Requirement: A product's folder opens only to that product's change

In a project with products, a path inside a product's folder SHALL be writable only while a change of that product is in implementation, whatever that product's schema. A change in implementation SHALL open no other product's folder.

#### Scenario Outline: with a change of `<changeProduct>` in implementation, writing `<path>` is `<verdict>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a change of the product `<changeProduct>` in implementation <!-- changeOfProductInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | products                                                                       | changeProduct | path                                          | verdict |
  | ------------------------------------------------------------------------------ | ------------- | --------------------------------------------- | ------- |
  | api at apps/api, worker at apps/worker                                         | api           | apps/api/src/orders/domain/order.entity.ts    | allowed |
  | api at apps/api, worker at apps/worker                                         | api           | apps/worker/src/billing/domain/charge.entity.ts | refused |
  | api at apps/api, contracts at packages/contracts with the schema spec-plan     | contracts     | packages/contracts/src/orders.ts              | allowed |
  | api at apps/api, contracts at packages/contracts with the schema spec-plan     | contracts     | apps/api/src/orders/domain/order.entity.ts    | refused |
