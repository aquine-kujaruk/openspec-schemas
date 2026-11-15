## ADDED Requirements

### Requirement: A project declares its products by folder

Each entry of `products` in `factory.config.ts` SHALL declare one product with its folder (`root`), its schema and its own settings. A product's configuration SHALL resolve from its schema's defaults, then the project's top level, then its own entry, with its roots relative to its folder. Without `products`, the project SHALL have one product at the repository root.

#### Scenario Outline: the product `<product>` resolves `<setting>` to `<resolved>`

- **GIVEN** the project declares the product `<product>` at `<root>` with the schema `<schema>` <!-- projectDeclaresProduct -->
- **AND** the product `<product>` sets `<setting>` to `<override>` <!-- productSets -->
- **WHEN** the configuration is resolved <!-- configurationResolved -->
- **THEN** `<setting>` of the product `<product>` is `<resolved>` <!-- productSettingResolved -->

##### Examples:

  | product | root        | schema        | setting    | override        | resolved                     |
  | ------- | ----------- | ------------- | ---------- | --------------- | ---------------------------- |
  | api     | apps/api    | clean-backend | modules    | src/*           | apps/api/src/*               |
  | worker  | apps/worker | clean-backend | modules    | lib/*           | apps/worker/lib/*            |
  | api     | apps/api    | clean-backend | acceptance | test/acceptance | apps/api/test/acceptance     |

#### Scenario Outline: without products the project has the one product `<root>`

- **GIVEN** the project configuration declares no products <!-- noProductsDeclared -->
- **WHEN** the configuration is resolved <!-- configurationResolved -->
- **THEN** the project has one product at `<root>` whose `<setting>` is `<resolved>` <!-- singleProductAt -->

##### Examples:

  | root | setting | resolved |
  | ---- | ------- | -------- |
  | .    | modules | src/*    |

### Requirement: Each product's specs and acceptance tests live under that product

In a project with products, the product specs root of a product SHALL default to `openspec/specs/<product>/<module>/<use-case>/spec.md`, and `factory generate` SHALL write the acceptance tests of a product's specs into that product's acceptance root, never into another product's.

#### Scenario Outline: the spec `<spec>` of `<product>` generates `<test>`

- **GIVEN** the project declares the product `<product>` at `<root>` with the schema `<schema>` <!-- projectDeclaresProduct -->
- **AND** the product spec `<spec>` with `<tests>` Examples rows <!-- productSpecWithRows -->
- **WHEN** `factory generate` runs <!-- generateRuns -->
- **THEN** `<test>` holds `<tests>` tests <!-- generatedTestHolds -->

##### Examples:

  | product | root        | schema        | spec                                         | tests | test                                                      |
  | ------- | ----------- | ------------- | -------------------------------------------- | ----- | --------------------------------------------------------- |
  | api     | apps/api    | clean-backend | openspec/specs/api/orders/list/spec.md       | 2     | apps/api/test/acceptance/orders/list.feature.test.ts      |
  | worker  | apps/worker | clean-backend | openspec/specs/worker/billing/charge/spec.md | 1     | apps/worker/test/acceptance/billing/charge.feature.test.ts |

### Requirement: Checks run over each product alone

`factory check` SHALL run each product's rules over that product's folder with that product's schema, and a rule broken in one product SHALL fail only that product.

#### Scenario Outline: a rule broken in `<broken>` fails `<failing>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a file in the product `<broken>` breaks one of its rules <!-- productBreaksRule -->
- **WHEN** `factory check` runs <!-- checkRuns -->
- **THEN** the products that fail are `<failing>` <!-- failingProducts -->

##### Examples:

  | products    | broken | failing |
  | ----------- | ------ | ------- |
  | api, worker | api    | api     |
  | api, worker | worker | worker  |
