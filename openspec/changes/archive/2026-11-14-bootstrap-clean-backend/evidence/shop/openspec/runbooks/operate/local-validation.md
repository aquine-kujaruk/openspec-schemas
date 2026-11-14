# local-validation

### Procedure: local-checks-and-tests · Run checks and tests locally

@origin:2026-11-14-list-customer-orders @env:local,development

**When** Before handing off a phase or verifying this change.

**Requires** A local checkout, a Node.js version satisfying the installed dependencies' engine requirements, and pnpm. Run commands at the repository root. Acceptance and integration tests need no network, credentials or environment secrets. Development uses `NODE_ENV=development`; an HTTP run instead needs the non-secret service base URL in the local process environment as `ORDERS_API_URL`. No service credentials were specified; none are embedded in code or committed files.

**Steps**

1. Install the locked dependencies: `pnpm install --frozen-lockfile`.
2. Run `pnpm exec factory doctor`; resolve any missing setup through `setup`. Its hook note requires Codex project trust and `/hooks` review, repeated after hook updates.
3. Check planning readiness: `pnpm exec factory validate list-customer-orders` while the change is active.
4. Regenerate acceptance tests from the active change's specs: `pnpm exec factory generate`. Fill generated step adapters during implementation; never edit generated test bodies.
5. For phase 1, run `pnpm exec factory check --workstream app-domain --module orders`, `pnpm exec factory test acceptance`, `pnpm exec vitest run test/order.schema.test.ts`, and `pnpm exec tsc --noEmit`.
6. For phase 2, run `pnpm exec factory check --workstream infrastructure --module orders`, `pnpm exec factory check --workstream adapters --module orders`, `pnpm exec factory test integration`, and `pnpm exec factory test acceptance`.
7. Finish with `pnpm exec factory check` and `pnpm exec tsc --noEmit`. Review the test counts: a successful command with zero tests does not verify an implemented phase.

**Verification** All phase commands exit zero; acceptance scenarios execute, phase 2 integration tests execute, and full checks confirm architecture and generated-test freshness. Planning readiness alone does not establish implementation correctness.
