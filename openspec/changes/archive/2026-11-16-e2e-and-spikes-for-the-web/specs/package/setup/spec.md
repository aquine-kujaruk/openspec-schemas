## ADDED Requirements

### Requirement: Setup reports the end-to-end tools a web product lacks

For each product whose platform is `web`, setup SHALL report as `missing` each end-to-end package the package pins (`e2e`, `@e2e-dev/web`, `@e2e-dev/acp`) that the project does not declare at that version, naming the version, and SHALL report a Node older than the tool needs. A product of any other platform SHALL NOT be asked for them. Setup SHALL NOT install them.

#### Scenario Outline: a `<platform>` product whose project declares `<declared>` is reported `<report>`

- **GIVEN** a product of platform `<platform>` <!-- productOfPlatform -->
- **AND** the project declares `<declared>` <!-- projectDeclaresPackages -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | platform | declared                                                   | requirement         | report       | status |
  | -------- | ---------------------------------------------------------- | ------------------- | ------------ | ------ |
  | web      | nothing                                                    | the end-to-end tool | missing      | 1      |
  | web      | e2e@0.22.0, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0        | the end-to-end tool | not reported | 0      |
  | web      | e2e@0.23.1, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0        | the end-to-end tool | missing      | 1      |
  | node     | nothing                                                    | the end-to-end tool | not reported | 0      |
