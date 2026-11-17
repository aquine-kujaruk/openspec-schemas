## ADDED Requirements

### Requirement: A runbook setup flags as suspect is investigated while planning

For each procedure setup reports as `suspect`, the plan phase SHALL find out when what the runbook runs left the project and what replaced it, and SHALL write it under Findings. When the intention being planned left the runbook stale or touches its topic, the plan SHALL carry the procedure tagged with what the change does to it. When the intention is unrelated and the investigation is conclusive, the plan phase SHALL open a change of its own holding only that procedure, so tagged, with no delta spec and no phase, and SHALL tell the person it is ready. Otherwise it SHALL open no change for it and SHALL tell the person what it found. The plan phase SHALL NOT write the consolidated runbook itself.

#### Scenario Outline: the suspect `<slug>`, found `<finding>`, ends with `<outcome>`

- **GIVEN** the consolidated procedure `<slug>` that setup reports as suspect <!-- suspectProcedure -->
- **AND** the investigation finds that `<finding>` <!-- investigationFinds -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** it ends with `<outcome>` <!-- suspectOutcome -->

##### Examples:

  | slug       | finding                                                   | outcome                                                            |
  | ---------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
  | local-run  | the intention moves the dev server to Vite                | the plan carries the procedure tagged @modifies:local-run          |
  | hot-reload | what it served left with webpack, unrelated to the intent | a change of its own carries the procedure tagged @removes:hot-reload |
  | seed-local | its script was renamed to scripts/load.mjs                | a change of its own carries the procedure tagged @modifies:seed-local |
  | e2e-run    | the script lives in a package setup does not read         | no change touches it and the person is told                        |
