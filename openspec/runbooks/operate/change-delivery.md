# change-delivery

### Procedure: cambio-secuencial · Open, integrate and close one repository change

@origin:2026-11-28-automate-semantic-releases @env:local,prod @by:person

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
