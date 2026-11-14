## ADDED Requirements

### Requirement: A change is opened with the schema its intention calls for

The plan phase SHALL open each change with one of the schemas the project has: the one whose stated use covers the intention. When an intention needs more than one schema, the plan phase SHALL open one change per schema, and each plan SHALL name the other changes. When no schema of the project covers the intention, the plan phase SHALL open no change and SHALL tell the person which schemas the project has.

#### Scenario Outline: an intention to `<intention>` opens changes with the schemas `<opened>`

- **GIVEN** a project with the schemas `<schemas>` <!-- projectSchemas -->
- **WHEN** the person states an intention to `<intention>` <!-- stateIntentionTo -->
- **THEN** the changes opened use the schemas `<opened>` <!-- openedChangesUse -->

##### Examples:

  | schemas                                 | intention                                              | opened                        |
  | --------------------------------------- | ------------------------------------------------------ | ----------------------------- |
  | spec-plan, clean-backend                | add a behaviour to the service                         | clean-backend                 |
  | spec-plan, clean-backend                | record how to diagnose an outage                       | spec-plan                     |
  | spec-plan, clean-backend, clean-frontend | add a behaviour to the service and to the application | clean-backend, clean-frontend |
  | legacy-to-specs                         | add a behaviour to the service                         | none                          |
