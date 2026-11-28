# release

### Decision: main-owns-release-version · Merges drive releases

@origin:2026-11-28-automate-semantic-releases @applies:repository @enforced:release-workflow @by:person

The release job SHALL derive versions from Conventional Commits on main and publish the source and package refs at a shared version. The source ref SHALL be `v<version>` and the package ref SHALL be `packages-v<version>`.

**Why** One automated sequence keeps the manifest, source tag and installable packages aligned.
