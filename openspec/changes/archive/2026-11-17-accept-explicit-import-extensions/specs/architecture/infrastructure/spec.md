## MODIFIED Requirements

### Requirement: repository-depends-on-acl · infrastructure repositories receive their adapters typed by the anti-corruption layer

`@by:person`

Every constructor parameter of a class in `infrastructure/repository-implementations` SHALL be typed by an `<Name>Acl` interface, and the file SHALL import nothing from `infrastructure/adapters`: a repository is a pure function of its ACLs, so a test replaces them with fakes.

#### Scenario Outline: `<example>` breaks repository-depends-on-acl

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                      |
  | ---------------------- | ------------------------- |
  | typed-by-adapter-class | repository-depends-on-acl |
  | imports-adapter-file   | repository-depends-on-acl |
  | imports-adapter-with-extension | repository-depends-on-acl |
