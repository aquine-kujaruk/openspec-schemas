## ADDED Requirements

### Requirement: A change is judged by its own product alone

In a project with products, the gate SHALL judge a change in implementation by the checks of its own product only, so that a failing check in another product SHALL NOT hold it.

#### Scenario Outline: a change of `<product>` finishing while `<failing>` fails is `<verdict>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a change of the product `<product>` in implementation <!-- changeOfProductInImplementation -->
- **AND** the checks of the product `<failing>` fail <!-- productChecksFail -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | products    | product | failing | agentKind | verdict |
  | ----------- | ------- | ------- | --------- | ------- |
  | api, worker | api     | api     | main      | refused |
  | api, worker | api     | worker  | main      | allowed |
