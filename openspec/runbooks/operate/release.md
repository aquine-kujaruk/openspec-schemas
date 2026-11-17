# release

### Procedure: release · Release the packages at the repository's version

@origin:2026-11-17-publish-from-github @env:prod @by:agent

**When** A version of `package.json` is merged into `main` and should reach the projects.

**Requires** The `github-personal` access, and `pnpm run check` passing.

**Steps**

1. `git tag v<version>` on `main`, with the version `package.json` holds, and `git push origin v<version>`.
2. The workflow `.github/workflows/release.yml` runs `pnpm run check` and `pnpm exec factory release`. By hand, without the workflow: `pnpm exec factory release --push origin`.

**Verification** `git ls-remote --tags origin packages-v<version>` prints one ref, and `curl -fsSL https://raw.githubusercontent.com/aquine-kujaruk/openspec-schemas/main/install.sh | sh -s -- backend` in an empty folder with a `package.json` ends with setup's report.
