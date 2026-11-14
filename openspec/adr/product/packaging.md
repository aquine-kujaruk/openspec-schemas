# packaging

### Decision: declare-do-not-carry · A package declares what lives elsewhere

@origin:2026-11-14-declare-packaged-skills @applies:repository @enforced:build-spec

A resource that lives in another repository at a version SHALL reach a project by being declared in the built package, with that version, for the agent package manager to install. The repository and the built package SHALL hold no copy of it.

**Why** A copy has no version of its own and grows the package; a declaration is locked by the agent package manager to one commit and is updated by changing one number.

**Alternatives** Copying from the pinned tool when the package is built, as before: one install with no network, at the price of a second copy of every skill. Keeping the copies in this repository with a lock file: more to maintain for the same content.

**Consequences** Installing a package needs to reach the repositories of its tools. A tool must tag each version it publishes as `v<version>`.
