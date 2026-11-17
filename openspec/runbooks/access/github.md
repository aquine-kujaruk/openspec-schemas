# github

### Procedure: github-personal · Reach this repository's GitHub with the personal account

@origin:2026-11-17-publish-from-github @env:local @probed:2026-11-17 @by:agent

**When** Pushing this repository, its tags or a release, or reading its refs as the maintainer.

**Requires** `gh` logged in with the account `aquine-kujaruk`, kept in the system keyring. The active account may be another one (`eaquine-clb_prisa`); never switch the active account for a single command.

**Steps**

1. `export GH_TOKEN=$(gh auth token --user aquine-kujaruk)` in the shell that runs the command.
2. `gh api user --jq .login`.

**Verification** It prints `aquine-kujaruk`.
