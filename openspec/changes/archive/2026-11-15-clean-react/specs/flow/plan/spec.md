## MODIFIED Requirements

### Requirement: A change is opened with the schema its intention calls for

The plan phase SHALL open each change with one of the schemas the project has: the one whose stated use covers the intention. When an intention needs more than one schema, the plan phase SHALL open one change per schema, and each change SHALL link the others. In a project with products, the plan phase SHALL open one change per product the intention touches, each named with its product and made with that product's schema, and each change SHALL link the others. When no schema of the project covers the intention, the plan phase SHALL open no change and SHALL tell the person which schemas the project has.

#### Scenario Outline: an intention to `<intention>` opens changes with the schemas `<opened>`

- **GIVEN** a project with the schemas `<schemas>` <!-- projectSchemas -->
- **WHEN** the person states an intention to `<intention>` <!-- stateIntentionTo -->
- **THEN** the changes opened use the schemas `<opened>` <!-- openedChangesUse -->

##### Examples:

  | schemas                               | intention                                             | opened                     |
  | ------------------------------------- | ----------------------------------------------------- | -------------------------- |
  | spec-plan, clean-backend              | add a behaviour to the service                        | clean-backend              |
  | spec-plan, clean-backend              | record how to diagnose an outage                      | spec-plan                  |
  | spec-plan, clean-backend, clean-react | add a behaviour to the service and to the application | clean-backend, clean-react |
  | legacy-to-specs                       | add a behaviour to the service                        | none                       |

#### Scenario Outline: an intention to `<intention>` opens linked changes for the products `<opened>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **WHEN** the person states an intention to `<intention>` <!-- stateIntentionTo -->
- **THEN** the changes opened are for the products `<opened>` and link each other <!-- openedChangesForProducts -->

##### Examples:

  | products                                                                    | intention                                        | opened                 |
  | --------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------- |
  | api with clean-backend, worker with clean-backend                           | add a behaviour to the api                       | api                    |
  | api with clean-backend, worker with clean-backend, contracts with spec-plan | add a field the api returns and the worker reads | contracts, api, worker |
