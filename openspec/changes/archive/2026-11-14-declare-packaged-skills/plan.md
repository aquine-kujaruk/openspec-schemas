---
name: declare-packaged-skills
description: A built package declares the skills of its tools and lets the agent package manager install them, instead of carrying copies
created_at: 2026-11-14
created_by: the person
schema: spec-plan
---

# Declare packaged skills

## Goal

A built package no longer holds a copy of the skills that ship inside its tools. Its manifest for the agent package manager names each one where it lives, at the version of the tool the package already pins, and installing the package puts them in the project. The repository writes nothing new to say which version: the tool's pin is the only one.

## Decisions

- The reference of a skill is derived, never written: the tool's own package says where its repository is, and the tag is `v` followed by the version the package manifest pins for that tool. Discarded: a `ref` field next to each skill, which is a second pin that can disagree with the first.
- A tool that does not say where its repository is stops the build, naming the tool. Discarded: falling back to copying, which leaves two ways for one skill to arrive and hides the missing field.
- Only skills that belong to a pinned tool are covered. A skill from a source no tool of the package comes from needs a place to write its version, and no package has one today.
- Servers are left out. The agent package manager can install a server a package declares (checked on 2026-11-14), and nothing in `backend` needs one. When one does, its configuration file joins the harness of the write guard in the same change.
- `factory proof` keeps both of its ways. With the agent package manager it now needs the network to fetch the two skills; without it the skills are absent from the scratch project, and no step of the proof reads them.
- The package version is raised: what a package carries changes.

## Open questions

## Architecture decisions

### Decision: declare-do-not-carry · A package declares what lives elsewhere

@adds @area:product @topic:packaging @applies:repository @enforced:build-spec

A resource that lives in another repository at a version SHALL reach a project by being declared in the built package, with that version, for the agent package manager to install. The repository and the built package SHALL hold no copy of it.

**Why** A copy has no version of its own and grows the package; a declaration is locked by the agent package manager to one commit and is updated by changing one number.

**Alternatives** Copying from the pinned tool when the package is built, as before: one install with no network, at the price of a second copy of every skill. Keeping the copies in this repository with a lock file: more to maintain for the same content.

**Consequences** Installing a package needs to reach the repositories of its tools. A tool must tag each version it publishes as `v<version>`.

## Procedures

## Phases

### Phase 1: The package declares its tools' skills

**Tests**

The scenarios generated from the new requirement of `repository/build`, on the build's fixture, with a tool whose package says where its repository is. The hand-written build test stops expecting the two skills among the package's files and expects their declarations.

- [x] Copy the delta of `repository/build` into the main spec and regenerate; see the new scenarios fail for lack of code
- [x] Make the build write each skill of the manifest as a dependency in the package's manifest for the agent package manager, from the tool's repository and its pinned version, and stop copying it; fail naming the tool and the skill when the tool's package names no repository
- [x] Update the hand-written build test, the type of the manifest's `skills` field and its comment, and the README where it says what a package carries
- [x] Raise the package version
- [x] Install the built package in a scratch project with the agent package manager and confirm both skills arrive, the lock names each tag and commit, `factory doctor` reports nothing lacking, and the completion gate's harness check still passes and still fails when a file of one of those skills is edited
- [x] Verify `pnpm run check` passes, `factory build backend --check` is fresh after a build, and `factory proof` exits zero with and without the agent package manager

## Feedback

## Next step

Build it through the implement phase. This change has a delta spec, and in this repository `factory verify` cannot yet match a delta's scenarios to their tests: it is verified with `pnpm run check` and archived with the specification tool directly, its delta already copied by the first task.
