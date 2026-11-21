## MODIFIED Requirements

### Requirement: A schema's own workstreams join its core's in one topology

`@by:person`

The workstreams a schema adds SHALL be ordered together with the workstreams of its core: each one waits for the workstreams the schema's defaults name, and a workstream of the core waits, besides its own dependencies, for the ones the schema adds to it. Every layer a schema adds SHALL be owned by exactly one of the schema's own workstreams, and a schema that adds a framework SHALL add it as one workstream that owns every layer of it.

#### Scenario Outline: in `<schema>`, `<workstream>` waits for `<dependency>`

- **GIVEN** the default workstreams of the schema `<schema>` <!-- defaultWorkstreamsOfSchema -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` starts only after `<dependency>` has finished <!-- startsAfter -->

##### Examples:

  | schema      | workstream  | dependency  |
  | ----------- | ----------- | ----------- |
  | clean-react | modules     | app-domain  |

#### Scenario Outline: in `<schema>`, `<workstream>` and `<other>` may run at the same time

- **GIVEN** the default workstreams of the schema `<schema>` <!-- defaultWorkstreamsOfSchema -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` and `<other>` may run at the same time <!-- mayRunTogether -->

##### Examples:

  | schema      | workstream | other          |
  | ----------- | ---------- | -------------- |
  | clean-react | react      | app-domain     |
  | clean-react | react      | infrastructure |
  | clean-react | react      | adapters       |
  | clean-react | react      | modules        |

#### Scenario Outline: in `<schema>`, layer `<layer>` belongs to `<workstream>`

- **GIVEN** the default workstreams of the schema `<schema>` <!-- defaultWorkstreamsOfSchema -->
- **WHEN** the owner of layer `<layer>` is looked up <!-- layerOwnerLookedUp -->
- **THEN** its owner is workstream `<workstream>` <!-- layerOwner -->

##### Examples:

  | schema      | layer     | workstream  |
  | ----------- | --------- | ----------- |
  | clean-react | ui        | react       |
  | clean-react | framework | react       |
  | clean-react | domain    | app-domain  |
  | clean-react | modules   | modules     |
