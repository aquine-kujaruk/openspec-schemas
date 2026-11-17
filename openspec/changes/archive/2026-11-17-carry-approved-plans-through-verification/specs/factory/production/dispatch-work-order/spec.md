## ADDED Requirements

### Requirement: Implementation starts in the checkout that owns the plan

`@by:agent`

A handoff SHALL identify the checkout containing the approved change. A local runner SHALL start there. When the runner launches a new agent session it SHALL bind the session to that checkout before implementation. If the current session belongs to a different checkout, the handoff SHALL direct the launcher to the correct one before any product edit. The receiving agent SHALL confirm the approved change and the project's expected instructions and hooks there.

#### Scenario Outline: handing off from `<session>` to `<checkout>` gives `<action>`

- **GIVEN** the approved change lives in `<checkout>` <!-- approvedCheckout -->
- **AND** the receiving session is attached to `<session>` <!-- receivingSessionCheckout -->
- **WHEN** the checkout for implementation is selected <!-- selectImplementationCheckout -->
- **THEN** the handoff calls for `<action>` <!-- checkoutHandoffAction -->

##### Examples:

  | session         | checkout        | action                                     |
  | --------------- | --------------- | ------------------------------------------ |
  | project root    | project root    | continue in this session                   |
  | change worktree | change worktree | continue in this session                   |
  | project root    | change worktree | bind the implementation to change worktree |
