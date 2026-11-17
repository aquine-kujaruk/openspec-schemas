## ADDED Requirements

### Requirement: Setup flags a runbook that runs what the project no longer has

Setup SHALL report as `suspect` each consolidated procedure whose inline or fenced code runs a package script, a binary or a file the project does not have, naming the procedure, its file, the command and what is missing. It SHALL judge a script run through `pnpm run`, `pnpm`, `npm run` or `yarn` against the scripts of the root's and every product's `package.json`, a binary run through `pnpm exec` or `npx` against their installed binaries, and a file run by relative path or given to `node`, `tsx`, `bash` or `sh` against the repository. It SHALL NOT judge a package fetched at a version (`npx <package>@<version>`, `pnpm dlx`), nor any other tool. A suspect SHALL NOT change the exit status, and setup SHALL NOT repair it.

#### Scenario Outline: a runbook that runs `<command>` where the project holds `<holding>` is reported `<report>`

- **GIVEN** a consolidated procedure `<slug>` whose steps run `<command>` <!-- runbookRuns -->
- **AND** the project holds `<holding>` <!-- projectHolds -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | slug       | command                       | holding                         | requirement       | report       | status |
  | ---------- | ----------------------------- | ------------------------------- | ----------------- | ------------ | ------ |
  | local-run  | pnpm run start                | the script dev                  | a suspect runbook | suspect      | 0      |
  | local-run  | pnpm run dev                  | the script dev                  | a suspect runbook | not reported | 0      |
  | local-run  | pnpm dev                      | the script dev                  | a suspect runbook | not reported | 0      |
  | local-run  | pnpm exec react-scripts start | the binary vite                 | a suspect runbook | suspect      | 0      |
  | local-run  | pnpm exec vite                | the binary vite                 | a suspect runbook | not reported | 0      |
  | local-run  | npx create-vite@5.5.0 web     | nothing                         | a suspect runbook | not reported | 0      |
  | seed-local | node scripts/seed.mjs         | the file scripts/load.mjs       | a suspect runbook | suspect      | 0      |
  | seed-local | ./scripts/seed.sh             | the file scripts/seed.sh        | a suspect runbook | not reported | 0      |
  | prod-logs  | kubectl logs deploy/api       | nothing                         | a suspect runbook | not reported | 0      |

#### Scenario Outline: a runbook that runs `<command>` is still reported `<report>` after repair

- **GIVEN** a consolidated procedure `<slug>` whose steps run `<command>` <!-- runbookRuns -->
- **AND** the project holds `<holding>` <!-- projectHolds -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | slug      | command        | holding        | requirement       | report  | status |
  | --------- | -------------- | -------------- | ----------------- | ------- | ------ |
  | local-run | pnpm run start | the script dev | a suspect runbook | suspect | 0      |
