# factory/maintenance/maintain-equipment Specification

## Purpose
Setting a project up after a built package is installed: the command pinned in the project, every packaged schema resolvable, and a report of what the flow needs and the project lacks. Setup repairs what the package owns and only reports what the project must supply.

## Requirements

### Requirement: Setup pins the command at the version the skills name

`@by:agent`

When setup runs with repair, the project SHALL depend on the command, as a development dependency recorded in its lockfile, at exactly the version the installed skills name. When it already does, setup SHALL leave the dependency as it is.

#### Scenario Outline: the command goes from `<before>` to `<after>` when the skills name `<skillsVersion>`

- **GIVEN** a project whose installed skills name the command version `<skillsVersion>` <!-- skillsNameCommandVersion -->
- **AND** the project depends on the command at `<before>` <!-- commandDependencyBefore -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** the project depends on the command at `<after>` <!-- commandDependencyAfter -->
- **AND** its lockfile records the command at `<after>` <!-- lockfileRecordsCommand -->

##### Examples:

  | skillsVersion | before | after |
  | ------------- | ------ | ----- |
  | 1.2.0         | none   | 1.2.0 |
  | 1.2.0         | 1.2.0  | 1.2.0 |
  | 1.3.0         | 1.2.0  | 1.3.0 |

### Requirement: Setup makes every packaged schema resolvable

`@by:agent`

After setup with repair, the project SHALL resolve every schema the installed package holds. When the project has no default schema, setup SHALL make the package's first schema the default; when it has one, setup SHALL keep it.

#### Scenario Outline: `<schema>` resolves and the default goes from `<defaultBefore>` to `<defaultAfter>`

- **GIVEN** a project with an installed package holding the schemas `<schemas>` <!-- installedPackageHolds -->
- **AND** the project's default schema is `<defaultBefore>` <!-- defaultSchemaBefore -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** the project resolves the schema `<schema>` to the installed package <!-- projectResolvesSchema -->
- **AND** the project's default schema is `<defaultAfter>` <!-- defaultSchemaAfter -->

##### Examples:

  | schemas                        | defaultBefore | schema          | defaultAfter  |
  | ------------------------------ | ------------- | --------------- | ------------- |
  | clean-backend                  | none          | clean-backend   | clean-backend |
  | clean-backend, legacy-to-specs | none          | legacy-to-specs | clean-backend |
  | clean-backend, legacy-to-specs | spec-driven   | legacy-to-specs | spec-driven   |

### Requirement: Setup without repair reports and changes nothing

`@by:agent`

When setup runs without repair, it SHALL report each thing the flow needs and the project lacks, SHALL exit with status 1 when it reports any, and SHALL change no file of the project.

#### Scenario Outline: a project lacking `<requirement>` is reported and left as it was

- **GIVEN** a project lacking `<requirement>` <!-- projectLacking -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->
- **AND** `<changedFiles>` file(s) of the project changed <!-- projectFilesChanged -->

##### Examples:

  | requirement        | report  | status | changedFiles |
  | ------------------ | ------- | ------ | ------------ |
  | the pinned command | missing | 1      | 0            |
  | a schema link      | missing | 1      | 0            |
  | a test runner      | missing | 1      | 0            |
  | a type checker     | missing | 1      | 0            |

### Requirement: Setup repairs only what the package owns

`@by:agent`

When setup runs with repair, it SHALL repair the pinned command, the schema links, the consolidated roots and the flow instruction's section, and SHALL still report as missing what the project must supply itself: its test runner and its type checker.

#### Scenario Outline: `<requirement>` is `<report>` after setup with repair

- **GIVEN** a project lacking `<requirement>` <!-- projectLacking -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | requirement            | report   | status |
  | ---------------------- | -------- | ------ |
  | the pinned command     | repaired | 0      |
  | a schema link          | repaired | 0      |
  | the consolidated roots | repaired | 0      |
  | a test runner          | missing  | 1      |
  | a type checker         | missing  | 1      |

### Requirement: Setup adds the flow instruction to an instruction file the project wrote

`@by:agent`

For an agent that reads one instruction file, when the project already wrote that file, setup with repair SHALL add the flow instruction to it as one marked section and SHALL keep every line the project wrote. Running setup again SHALL NOT add the section a second time.

#### Scenario Outline: a file with `<ownLines>` own line(s) holds the flow instruction `<copies>` time(s)

- **GIVEN** a project whose instruction file for the agent `<agent>` holds `<ownLines>` line(s) of its own <!-- instructionFileWithOwnLines -->
- **AND** setup with repair ran `<earlierRuns>` time(s) before <!-- setupRanBefore -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** that file holds the flow instruction `<copies>` time(s) <!-- instructionFileHoldsFlowInstruction -->
- **AND** that file holds `<ownLinesAfter>` line(s) of the project's own <!-- instructionFileOwnLines -->

##### Examples:

  | agent | ownLines | earlierRuns | copies | ownLinesAfter |
  | ----- | -------- | ----------- | ------ | ------------- |
  | codex | 3        | 0           | 1      | 3             |
  | codex | 3        | 1           | 1      | 3             |
  | codex | 0        | 0           | 1      | 0             |

### Requirement: Skills and command of different versions are reported as drift

`@by:agent`

When the installed skills name a version of the command other than the one the project depends on, setup without repair SHALL report the drift naming both versions.

#### Scenario Outline: skills at `<skillsVersion>` and the command at `<before>` are reported as drift

- **GIVEN** a project whose installed skills name the command version `<skillsVersion>` <!-- skillsNameCommandVersion -->
- **AND** the project depends on the command at `<before>` <!-- commandDependencyBefore -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports the drift from `<before>` to `<skillsVersion>` <!-- reportsDrift -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | skillsVersion | before | status |
  | ------------- | ------ | ------ |
  | 1.3.0         | 1.2.0  | 1      |

### Requirement: Every agent the package names has the flow

`@by:agent`

For each agent the installed package names, the project SHALL have the phase skills, the flow instruction and the guards in the place that agent reads. Setup SHALL report, per agent, each of those it does not find.

#### Scenario Outline: `<piece>` missing for `<agent>` is reported

- **GIVEN** a project with an installed package naming the agents `<agents>` <!-- installedPackageNamesAgents -->
- **AND** the project lacks `<piece>` for the agent `<agent>` <!-- projectLacksPieceForAgent -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports `<piece>` as missing for the agent `<agent>` <!-- reportsPieceMissingForAgent -->

##### Examples:

  | agents        | piece                | agent  |
  | ------------- | -------------------- | ------ |
  | claude, codex | the phase skills     | codex  |
  | claude, codex | the flow instruction | claude |
  | claude, codex | the guards           | codex  |

### Requirement: Setup notes a key a runbook needs and the environment lacks

`@by:agent`

Setup SHALL report as a note each key that a consolidated procedure names in its keys and that neither the process environment nor the project's `.env` holds, naming the procedure. A note SHALL NOT change the exit status. Setup SHALL NOT repair a missing key.

#### Scenario Outline: the key `<key>` of `<slug>`, `<presence>`, is reported `<report>` without repair

- **GIVEN** a consolidated procedure `<slug>` needing the key `<key>` <!-- runbookNeedsKey -->
- **AND** the key `<key>` is `<presence>` <!-- keyPresence -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | slug            | key              | presence           | requirement          | report       | status |
  | --------------- | ---------------- | ------------------ | -------------------- | ------------ | ------ |
  | invoices-access | INVOICES_API_KEY | absent             | the key of a runbook | note         | 0      |
  | invoices-access | INVOICES_API_KEY | in .env            | the key of a runbook | not reported | 0      |
  | invoices-access | INVOICES_API_KEY | in the environment | the key of a runbook | not reported | 0      |

#### Scenario Outline: the key `<key>` of `<slug>`, `<presence>`, is reported `<report>` after repair

- **GIVEN** a consolidated procedure `<slug>` needing the key `<key>` <!-- runbookNeedsKey -->
- **AND** the key `<key>` is `<presence>` <!-- keyPresence -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | slug            | key              | presence | requirement          | report | status |
  | --------------- | ---------------- | -------- | -------------------- | ------ | ------ |
  | invoices-access | INVOICES_API_KEY | absent   | the key of a runbook | note   | 0      |

### Requirement: Setup reports the end-to-end tools a web product lacks

`@by:agent`

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

### Requirement: Setup flags a runbook that runs what the project no longer has

`@by:agent`

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
