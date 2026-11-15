## ADDED Requirements

### Requirement: A change names one declared product of its schema

In a project with products, validation SHALL report a change not ready when it names no product, names a product the project does not declare, or names a product whose schema is not the change's schema.

#### Scenario Outline: a `<schema>` change naming `<named>` is `<readiness>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a change made with the schema `<schema>` that names the product `<named>` <!-- changeNamesProduct -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | products                                                 | schema        | named     | readiness |
  | -------------------------------------------------------- | ------------- | --------- | --------- |
  | api with clean-backend, contracts with spec-plan         | clean-backend | api       | ready     |
  | api with clean-backend, contracts with spec-plan         | spec-plan     | contracts | ready     |
  | api with clean-backend, contracts with spec-plan         | spec-plan     | api       | not ready |
  | api with clean-backend, contracts with spec-plan         | clean-backend | web       | not ready |
  | api with clean-backend, contracts with spec-plan         | clean-backend | none      | not ready |

### Requirement: Linked changes name each other

A change MAY link the other changes of its intention. Validation SHALL report a change not ready when a change it links does not exist, active or archived, or does not link it back.

#### Scenario Outline: `<change>` linking `<linked>`, which links `<back>`, is `<readiness>`

- **GIVEN** the change `<change>` links the changes `<linked>` <!-- changeLinks -->
- **AND** the change `<linked>` links back the changes `<back>` <!-- linkedChangeLinksBack -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | change         | linked         | back           | readiness |
  | -------------- | -------------- | -------------- | --------- |
  | add-orders-api | add-orders-web | add-orders-api | ready     |
  | add-orders-api | add-orders-web | none           | not ready |
  | add-orders-api | missing-change | none           | not ready |
