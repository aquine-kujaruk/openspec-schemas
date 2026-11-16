## ADDED Requirements

### Requirement: A change being planned opens the paths of its spike workstream

While a change is active and not in implementation, the guard SHALL allow writes to the paths its schema's spike workstream owns (for `clean-react`, the pages, components and bridges of `react-ui`, the stub controllers it fakes and the entry), in that change's product folder, so that the plan builds the spike where it will stay. Every other product path SHALL stay refused until the change is in implementation. A schema that declares no spike workstream SHALL open no product path while planning.

#### Scenario Outline: planning a `<schema>` change, writing `<path>` is `<verdict>`

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** an active change made with the schema `<schema>`, not in implementation <!-- plannedChangeWithSchema -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | roots | schema        | path                                                      | verdict |
  | ----- | ------------- | --------------------------------------------------------- | ------- |
  | src/* | clean-react   | src/orders/framework/ui/orders-list/orders-list.page.tsx  | allowed |
  | src/* | clean-react   | src/orders/framework/controllers/orders-list.controller.ts | allowed |
  | src/* | clean-react   | src/main.tsx                                              | allowed |
  | src/* | clean-react   | src/orders/domain/order.entity.ts                         | refused |
  | src/* | clean-react   | src/orders/framework/queries/orders.query.ts              | refused |
  | src/* | clean-backend | src/orders/domain/order.entity.ts                         | refused |
