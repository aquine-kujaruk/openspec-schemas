## ADDED Requirements

### Requirement: Main determines the next package release

`@by:person`

A merge to the primary branch SHALL derive the next version from the changes since the last source release. A fix SHALL increment the patch, a feature SHALL increment the minor version and a breaking change SHALL increment the major version. A merge with documentation changes alone SHALL leave the released version unchanged. A release SHALL identify one version in the tagged source, the tagged manifest and every package it publishes.

#### Scenario Outline: Merging `<change>` after `<previous>` yields `<result>`

- **GIVEN** the latest source release is `<previous>` <!-- latestSourceRelease -->
- **WHEN** a change classified as `<change>` is merged to the primary branch <!-- classifiedChangeMerged -->
- **THEN** the release outcome is `<result>` <!-- automaticReleaseOutcome -->

##### Examples:

  | previous | change        | result                              |
  | 0.17.0   | fix           | v0.17.1 and packages-v0.17.1        |
  | 0.17.0   | feature       | v0.18.0 and packages-v0.18.0        |
  | 0.17.0   | breaking      | v1.0.0 and packages-v1.0.0          |
  | 0.17.0   | documentation | the released version stays at 0.17.0 |
