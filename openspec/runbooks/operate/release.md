# release

### Procedure: release · Publish the next version from main

@origin:2026-11-28-automate-semantic-releases @env:prod @by:person

**When** A change lands on main or a prior release needs its package publication retried.

**Requires** The release workflow uses its GitHub Actions token with `contents: write`. A person retrying it follows `github-personal`.

**Steps**

1. Changes land on main with Conventional Commit messages in the retained history.
2. The release workflow tests the source, computes the next version, commits the manifest version and tags that commit. It builds and publishes the Factory packages for the same version.
3. For a source tag whose package publication failed, dispatch the recovery job with that source tag. The job verifies the tag and the manifest version before publishing. An existing package ref is reported as complete and remains immutable.

**Verification** The workflow reports success and the source tag's manifest, the package ref and each packaged manifest agree on the version.
