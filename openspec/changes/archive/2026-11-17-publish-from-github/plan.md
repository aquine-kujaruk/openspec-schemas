---
name: publish-from-github
description: Every package is released from GitHub at its version and installs in another project with one command, and the README is one plain path for whoever uses a package, with the rest in docs
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Install a package from GitHub with one command

## Goal

A project gets a package with one command run in its root: an installer fetched from this repository's GitHub checks the machine, installs the agent package manager when it is missing, installs the package at its latest released version (or the one named) for the agents asked, pins the command and runs setup. Every release publishes the three packages together at the repository's version, built by a command the maintainer can also run by hand. The README tells a user that path and the daily loop (say what you want, review the plan, approve, review, archive) and nothing else; the flow in depth, several products, Codex, upgrades and work on this repository move to their own files.

## Findings

- The built packages are not in git: `.gitignore` lists `dist/`, so a push carries no installable package; the README installs only from `<path to this repository>/dist/backend` (`.gitignore`, `README.md` Install it in a project @81f18b6, seen 2026-11-17).
- The repository has no git remote, and `aquine-kujaruk/openspec-schemas` does not exist on GitHub for either account `gh` holds (`git remote -v` empty; `gh repo view aquine-kujaruk/openspec-schemas` → "Could not resolve to a Repository", as `aquine-kujaruk` and as the active account `eaquine-clb_prisa`, seen 2026-11-17).
- `gh` holds two accounts and the active one is the work account `eaquine-clb_prisa`; the personal account `aquine-kujaruk` answers `gh api user` with its token (`gh auth status`, `GH_TOKEN=$(gh auth token --user aquine-kujaruk) gh api user`, seen 2026-11-17).
- The repositories the packages declare skills from are public and tagged: `aquine-kujaruk/feat2test` (`v4.0.0`) and `aquine-kujaruk/opsx-gherkin`; npm has `feat2test@4.0.0` and `opsx-gherkin@1.0.1`, which the command tarball depends on (`gh repo view … --json visibility`, `gh api repos/aquine-kujaruk/feat2test/tags`, `npm view`, seen 2026-11-17).
- APM installs a package from a subdirectory of a GitHub repository at a ref (`owner/repo/path#ref`); the built packages already declare their tools' skills that way (`aquine-kujaruk/feat2test/skills/gherkin-craft#v4.0.0`) (`microsoft/apm` docs/src/content/docs/consumer/install-packages.md, `dist/backend/apm.yml`, seen 2026-11-17).
- APM 0.35.1 is the latest release (2026-11-11) and installs on Linux and macOS with `curl -sSL https://aka.ms/apm-unix | sh -s -- @v0.35.1` into `~/.local/bin`, without sudo, needing only git (`gh api repos/microsoft/apm/releases`, docs/src/content/docs/getting-started/installation.md, seen 2026-11-17).
- APM can also publish a marketplace whose `.claude-plugin/marketplace.json` Claude Code reads (`/plugin install`) and `.agents/plugins/marketplace.json` Codex reads (`microsoft/apm` docs/src/content/docs/producer/publish-to-a-marketplace.md, seen 2026-11-17).
- APM is not installed on this machine (`which apm` empty, seen 2026-11-17).
- The setup skill pins the command from `assets/factory-<version>.tgz` inside the installed setup skill, whose folder depends on the target (`.claude/skills/setup` for Claude); the README hardcodes `.claude/skills/setup/assets/` (`schemas/shared/skills/setup/SKILL.md`, `README.md` step 2 @81f18b6, seen 2026-11-17).
- Steps 2 and 3 of the README's install already run on their own: every phase skill starts with `pnpm exec factory doctor` and follows the setup skill when it reports anything (`schemas/shared/phases/plan/SKILL.md` step 1 @81f18b6, seen 2026-11-17).
- The README opens with the repository's layout and mixes, under "Install it in a project", the probes, the spikes and end-to-end tests, several products, the 0.3 to 0.4 rename and Codex (`README.md` @81f18b6, seen 2026-11-17).
- Each built package is about 100 KB, most of it the command tarball (`ls -la dist/*/.apm/skills/setup/assets`, seen 2026-11-17).

## Decisions

Asked by the person on 2026-11-17: "lo ideal es apretar un botón y ya", and agreed to the agent's proposal ("Sí, estoy de acuerdo contigo"): a release workflow, a new README and an installer script, with the marketplace left for later.

- The installer is a POSIX shell script at the repository's root, `install.sh`, fetched from `main` with `curl -fsSL https://raw.githubusercontent.com/aquine-kujaruk/openspec-schemas/main/install.sh | sh -s -- <package>`. Discarded: a published npm initializer, which needs a registry account and a scoped name since `factory` is taken. @by:person
- The marketplace is left for a later change. Discarded for now: publishing `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` with `apm pack`. @by:person
- The installer installs the agent package manager at the version the package names when it is missing, with APM's own installer, and keeps one already installed (setup notes a different version). Discarded: refusing until the person installs it. @by:agent
- The installer refuses, naming what to install and at which version, when Node or pnpm is missing or too old: installing a runtime is the person's choice. Discarded: installing Node through a version manager. @by:agent
- The installer resolves the latest version from the release refs with `git ls-remote`, which needs no API token and no rate limit. Discarded: the GitHub API. @by:agent
- The installer finds the command tarball in whichever agent folder APM installed the setup skill into, instead of a fixed `.claude` path. @by:agent
- A release is the command `factory release`, run by a workflow on every pushed tag `v<version>` and runnable by hand with the same result. Discarded: git plumbing written only in the workflow, which cannot be tested or run without GitHub. @by:agent
- The README keeps: what this is, which package to pick, the one-command install (and the prerequisites), the daily loop, and links. The flow in depth goes to `docs/flow.md`, several products to `docs/products.md`, Codex to `docs/codex.md`, upgrades (0.3 to 0.4) to `docs/upgrading.md`, and the repository's layout and how to change it to `CONTRIBUTING.md`. Discarded: one long README with sections. @by:agent
- Version 0.12.0: the command gains `release` and the packages change. @by:agent

Approved by the person on 2026-11-17 with the options the plan proposed ("Vale, implementa ambos en orden"):

- The repository is `aquine-kujaruk/openspec-schemas`, public, so installing needs no token. Creating it and pushing waits for the person's explicit go-ahead, since it publishes the code. Discarded: private. @by:person
- The built packages live on the branch `packages`, one folder per package, each release a commit tagged `packages-v<version>`. Discarded: `dist/` committed to `main`. @by:person

## Open questions

## Architecture decisions

### Decision: release-from-github · Packages are released from GitHub at the repository's version and installed with one command

@adds @area:product @topic:packaging @applies:repository,toolkit @enforced:release-spec,install-spec @by:person

A release SHALL publish every package the repository builds, together, under the ref `packages-v<version>` of this repository's GitHub, each package in a folder named after it at that ref, and SHALL never rewrite a ref it already published. A project SHALL be able to install a package with one command run in its root, the installer, which SHALL install the latest released version unless one is named, for the agents asked, and SHALL pin the command and run setup.

**Why** The person wants installing to be "apretar un botón y ya"; until now a package installed only from a local build of this repository, in four steps.

**Alternatives** Committing `dist/` to `main`: no workflow, at the cost of a tarball per version in the history. A marketplace for Claude Code and Codex: closer to one click inside the agent, left for a later change.

**Consequences** Every release needs a tag `v<version>` pushed to GitHub, and the installer needs git, curl, Node and pnpm on the machine. A version once released cannot be fixed in place: a fix is a new version.

## Procedures

### Procedure: github-personal · Reach this repository's GitHub with the personal account

@adds @purpose:access @topic:github @env:local @probed:2026-11-17 @by:agent

**When** Pushing this repository, its tags or a release, or reading its refs as the maintainer.

**Requires** `gh` logged in with the account `aquine-kujaruk`, kept in the system keyring. The active account may be another one (`eaquine-clb_prisa`); never switch the active account for a single command.

**Steps**

1. `export GH_TOKEN=$(gh auth token --user aquine-kujaruk)` in the shell that runs the command.
2. `gh api user --jq .login`.

**Verification** It prints `aquine-kujaruk`.

### Procedure: release · Release the packages at the repository's version

@adds @purpose:operate @topic:release @env:prod @by:agent

**When** A version of `package.json` is merged into `main` and should reach the projects.

**Requires** The `github-personal` access, and `pnpm run check` passing.

**Steps**

1. `git tag v<version>` on `main`, with the version `package.json` holds, and `git push origin v<version>`.
2. The workflow `.github/workflows/release.yml` runs `pnpm run check` and `pnpm exec factory release`. By hand, without the workflow: `pnpm exec factory release --push origin`.

**Verification** `git ls-remote --tags origin packages-v<version>` prints one ref, and `curl -fsSL https://raw.githubusercontent.com/aquine-kujaruk/openspec-schemas/main/install.sh | sh -s -- backend` in an empty folder with a `package.json` ends with setup's report.

## Screens

## Phases

### Phase 1: a release publishes every package under one ref

**Seams**

```ts
// toolkit/repository/release.ts
export type Release = { version: string; ref: string; packages: string[] };
/** Builds every package and commits them, one folder each, to the `packages` branch tagged `packages-v<version>`; pushes to `push` when given. */
export const release: (root: string, options?: { push?: string }) => Promise<Release>;
export const run: (args: string[]) => Promise<number>; // factory release [--push <remote>]
```

**Tests**

`toolkit/repository/release.feature.steps.ts` adapts `repository/release` over a temporary git repository and a bare remote; the generated test runs it.

- [x] Write `toolkit/repository/release.ts` and register `release` in `toolkit/cli.ts`: build every manifest of `packages/` into a temporary folder, commit the folders onto the `packages` branch (created orphan when absent) with the message `release <version>`, tag it `packages-v<version>`, refuse with status 1 when that tag exists, and push the branch and the tag when `--push` names a remote
- [x] Write the step adapter `toolkit/repository/release.feature.steps.ts` for `repository/release`
- [x] Write `.github/workflows/release.yml`: on a pushed tag `v*`, with Node 22.22.3 and pnpm, `pnpm install --frozen-lockfile`, `pnpm run check`, check the tag equals `v` and the version of `package.json`, then `pnpm exec factory release --push origin` with `contents: write`
- [x] Raise the package and command version to 0.12.0
- [x] Verify the phase: `pnpm run check` passes and the three packages build fresh

### Phase 2: one command installs a package in a project

**Seams**

```sh
# install.sh <package> [--version <x.y.z>] [--agents claude,codex]
#   FACTORY_REPOSITORY overrides the git URL it reads releases from (tests point it at a local repository)
#   APM_INSTALLER overrides the command that installs the agent package manager (tests fake it)
```

**Tests**

`toolkit/package/install.feature.steps.ts` adapts `package/install` by running `install.sh` in a temporary project, with `FACTORY_REPOSITORY` pointing at a local repository released by phase 1's command and `apm`, `node` and `pnpm` faked on `PATH` when a row says the machine lacks them; the generated test runs it.

- [x] Write `install.sh`: check git, curl, Node (22.18 or later) and pnpm and refuse naming what is missing; install the agent package manager at the version the package's manifest names when `apm` is missing; resolve the version from `git ls-remote --tags` (`packages-v*`, highest by version) unless `--version` names one, refusing with the released versions when it is not among them; run `apm install <owner>/openspec-schemas/<package>#packages-v<version> --target <agents>` (the package's agents by default); find `factory-<version>.tgz` under the installed setup skill of any target; `pnpm add -D` it; `pnpm exec factory doctor --fix`; print `pnpm exec factory doctor` and the next step ("open your agent in this folder and say what you want")
- [x] Write the step adapter `toolkit/package/install.feature.steps.ts` for `package/install`
- [x] Verify the phase: `pnpm run check` passes

### Phase 3: the README is one path

**Tests**

No test: the person reads it.

- [x] Rewrite `README.md`: what the packages do in two sentences; which package to pick (backend, frontend, fullstack); the prerequisites (git, curl, Node 22.18 or later, pnpm; Node 22.22.3 for frontend and fullstack); the one-command install with `--version` and `--agents`; the daily loop (say what you want, answer the plan's questions, approve, review, archive) and which skills run on their own (setup, verify, feedback); links to the docs
- [x] Move the flow in depth (the table of skills, scaffolds, probes, spikes and end-to-end tests, the guards) to `docs/flow.md`; several products to `docs/products.md`; Codex to `docs/codex.md`; "From 0.3 to 0.4" to `docs/upgrading.md`; the repository's layout, how to build and release, and "Work on this repository" to `CONTRIBUTING.md`, with the `release` procedure
- [x] Verify the phase: `pnpm run check` passes and every link of the README and the docs resolves

## Feedback

- Built on 2026-11-17 by the agent, after the person approved it ("Vale, implementa ambos en orden").
- Found while building: feat2test reads a backticked value in a step as a literal with no input, so a step that takes a placeholder in one scenario cannot take a literal in another; the specs put every such value in their Examples tables.
- Found while verifying: the release procedure publishes to GitHub, so it is tagged `@env:prod` and not `@env:local`, and verify reviews it by reading. A dry run on 2026-11-17, from a clone with a bare repository as `origin`, ran `factory release --push origin`: `git ls-remote` showed `refs/heads/packages` and `refs/tags/packages-v0.12.0` on the same commit, and a second run refused with "packages-v0.12.0 is already published on origin".
- Found while building: the installer pins the command through a fake pnpm in its tests; the real `pnpm add` of the tarball and APM's install from the `packages` tag are proved by the `release` procedure once the repository is on GitHub.

## Next step

Create the GitHub repository (public) and push `main`, then archive this change and release 0.12.0 with the `release` procedure. It is built before `approve-then-implement`, which also edits the README's flow paragraphs, now in `docs/flow.md`.
