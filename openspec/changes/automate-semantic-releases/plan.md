---
name: automate-semantic-releases
description: Derive the next package version from Conventional Commits and publish it from main.
created_at: 2026-11-28
created_by: Edgar
approved_at: 2026-11-28
schema: spec-plan
---

# Automate semantic releases

## Goal

GitHub Actions derives the version from changes merged to main, stamps the source and publishes all Factory packages at that version. Closing an OpenSpec change ends at the merge. The release job owns version tags.

## Findings

- The current workflow starts on a manual `v*` tag and verifies its version against `package.json`. The v0.17.0 workflow passed that check on 2026-11-28.
- `tools/build.ts` and `tools/release.ts` read the version from `package.json`. The installer consumes `packages-v<version>`. Seen 2026-11-28 in the source and repository release spec.
- GitHub returned no branch rules for main and a read-only default workflow token on 2026-11-28. The existing release job grants `contents: write` explicitly and publishes through the same remote.
- Vite+ [delegates version changes](https://viteplus.dev/guide/package-management/version) to the package manager. [semantic-release derives versions from commit history](https://github.com/semantic-release/semantic-release#readme). Checked 2026-11-28.
- A temporary Node 22.23.2 probe with semantic-release 25.0.9 and conventional-changelog-conventionalcommits 10.4.1 classified `fix(factory)` as patch, `feat(factory)` as minor, `feat(factory)!` as major and `docs` as no release on 2026-11-28. Registry metadata requires Node 26.13 for semantic-release 26.0.1, so the plan pins 25.0.9 for the current Node 22 runner.
- `semantic-release --dry-run --no-ci` against a temporary main and bare remote on 2026-11-28 found v0.17.0 and proposed v0.17.1 for one fix. The existing remote was untouched.
- The first end-to-end test of the new workflow will use a temporary repository or local Git remote in Phase 1, before enabling publishing on main.

## Decisions

- Run semantic-release on main with the Conventional Commits preset. Fixes produce patches, features produce minors and breaking changes produce majors. Keep the existing Factory publisher for the three package bundles. @by:person
- Use v0.17.0 as the starting release and keep historical tags. Stamp the manifest via a release commit before tagging, so checking out the source tag reproduces the package version. Discarded stamping only the runner workspace because the tagged manifest could disagree. @by:agent
- Keep a manual recovery entry that accepts an existing source release tag and resumes its package publication. Discarded recomputing the next version during recovery because the original source tag may already exist. @by:agent

## Open questions

## Architecture decisions

### Decision: main-owns-release-version · Merges drive releases

@adds @area:production @topic:release @applies:repository @enforced:release-workflow @by:person

The release job SHALL derive versions from Conventional Commits on main and publish the source and package refs at a shared version. The source ref SHALL be `v<version>` and the package ref SHALL be `packages-v<version>`.

**Why** One automated sequence keeps the manifest, source tag and installable packages aligned.

## Procedures

### Procedure: release · Publish the next version from main

@modifies:release @base:2026-11-17-publish-from-github @purpose:operate @topic:release @env:prod @by:person

**When** A change lands on main or a prior release needs its package publication retried.

**Requires** The release workflow uses its GitHub Actions token with `contents: write`. A person retrying it follows `github-personal`.

**Steps**

1. Changes land on main with Conventional Commit messages in the retained history.
2. The release workflow tests the source, computes the next version, commits the manifest version and tags that commit. It builds and publishes the Factory packages for the same version.
3. For a source tag whose package publication failed, dispatch the recovery job with that source tag. The job verifies the tag and the manifest version before publishing. An existing package ref is reported as complete and remains immutable.

**Verification** The workflow reports success and the source tag's manifest, the package ref and each packaged manifest agree on the version.

### Procedure: cambio-secuencial · Open, integrate and close one repository change

@modifies:cambio-secuencial @base:2026-11-18-reparar-revision-semantica @purpose:operate @topic:change-delivery @env:local,prod @by:person

**When** Starting a change or resuming an interrupted integration.

**Requires** Git, OpenSpec and the `github-personal` access.

**Steps**

1. Fetch origin. Inspect active changes, worktrees, pull requests to main, the previous closure and pending decisions. Resume the first unfinished delivery. If there is no new intention, propose the first pending decision.
2. Fast-forward local main, confirm it equals origin/main and create a change branch from the clean checkout. Plan the change and obtain approval.
3. Record approval, validate and commit the plan and its artifacts. Start implementation from a clean tree.
4. Implement, verify and archive. Review the consolidated artifacts and update any pending decision the change enforces. Commit the result separately from the approved plan.
5. Push the branch, open or resume its PR and merge with the commits intact when the required checks and approvals hold. Confirm the integration commit is on origin/main.
6. Fetch and fast-forward local main. For package publication follow the release procedure.

**Verification** The PR is merged, the approved plan and the implementation are in history, the OpenSpec change is archived and local main matches origin/main. Review pending decisions at the start of the next session.

## Screens

## Phases

### Phase 1: Version and publish from main

**Tests**

- Exercise the actual semantic-release configuration against a seeded Git remote. Cover a fix, a feature, a breaking change and a documentation-only merge.
- Exercise source and package refs, interrupted publication and recovery. Verify that versions already published stay immutable and that every built package identifies the source release version.
- Run the repository suite and validate the workflow without writing production refs.

- [ ] Pin and configure semantic-release and its Conventional Commits preset
- [ ] Wire the main workflow to verify, stamp and publish with the existing Factory publisher. Serialize production release jobs and support recovery from a source tag
- [ ] Update the release guidance in AGENTS.md and remove manual version bumps from the repository's delivery instructions
- [ ] Verify the phase with the local publishing scenarios and the repository checks

## Feedback

## Next step
