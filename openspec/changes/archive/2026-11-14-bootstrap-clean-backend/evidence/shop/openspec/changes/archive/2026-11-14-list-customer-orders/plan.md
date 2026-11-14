---
name: list-customer-orders
description: List a customer's orders newest first through a use case backed by HTTP or in-memory orders.
created_at: 2026-11-14
created_by: user
schema: clean-backend
---

# List customer orders

## Goal

Provide a query returning a customer's orders with id, customer id, total in cents and placement date, newest first. Deliver the use case and domain with acceptance coverage first; then connect the repository, anti-corruption layer, HTTP and development adapters, and entry.

## Decisions

- Use the `orders` module and `ListCustomerOrdersUseCase.execute(customerId)` returning order props, rather than introducing an inbound web server the request does not require.
- The application sorts by placement instant descending, rather than relying on backend ordering; equal instants have no additional public ordering guarantee.
- Return a complete array without pagination, rather than inventing a paging protocol absent from the service contract.
- Keep placement dates as validated ISO timestamp strings in props and compare their parsed instants, rather than comparing strings or exposing mutable Date objects.
- Map resource records to domain props in the repository; retain snake_case only in the ACL and adapters, rather than letting the service vocabulary enter the use case.
- Use `NODE_ENV=development` for the in-memory backend (empty by default, constructor-seedable); all other environments use HTTP and require `ORDERS_API_URL`, rather than silently falling back to development data.
- Translate invalid records to `ValidationException` and resource/configuration failures to `OrdersUnavailableException` with the original error as cause; reject the query rather than returning partial data or disguising failure as an empty list. No retry policy or public HTTP error status is introduced.
- Use generated acceptance tests with a fake repository in phase 1 and repository integration tests with an ACL-typed in-memory adapter in phase 2, rather than real network calls in local tests.
- The cents architecture decision below is explicitly requested by the user; it is already authorized.

## Open questions




## Architecture decisions

### Decision: money-in-integer-cents · Money amounts use integer cents

@adds @area:product @topic:money @applies:domain,application,infrastructure,adapters @enforced:domain-and-acl-schemas,integration-tests,review

Money amounts SHALL be represented as integers in cents across the product. `OrderProps.totalCents` and service `total_cents` SHALL carry the same cents value without division, rounding or conversion into floating-point major currency units. JavaScript number values SHALL pass safe-integer validation so the representation preserves exact cents.

**Why** The user explicitly requires integer cents; retaining that unit avoids rounding and unit ambiguity at boundaries.

**Alternatives** Decimal major units and floating-point currency values are discarded because they weaken the required representation.

**Consequences** Future money fields must preserve this unit. Values outside the safe-integer range are rejected, not rounded. Currency, sign restrictions and exchange rates are outside this decision.

## Procedures

### Procedure: local-checks-and-tests · Run checks and tests locally

@adds @purpose:operate @topic:local-validation @env:local,development

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

## Phases

### Phase 1: The customer-order query works against a fake repository

**Seams**

```ts
// app-domain owns src/orders/domain/schemas/order.schema.ts.
// Export OrderSchema and its inferred OrderProps with this validated shape:
// validateOrder(props: OrderProps): OrderProps validates and throws ValidationException.
export interface OrderProps {
  id: string;
  customerId: string;
  totalCents: number; // safe integer cents
  placedAt: string; // ISO timestamp with explicit UTC offset
}
// src/orders/application/repository-interfaces/order.repository-interface.ts
export interface OrderRepositoryInterface {
  listByCustomerId(customerId: string): Promise<OrderProps[]>;
}
// src/orders/application/use-cases/list-customer-orders.use-case.ts
export class ListCustomerOrdersUseCase {
  constructor(repository: OrderRepositoryInterface);
  execute(customerId: string): Promise<OrderProps[]>;
}
// app-domain owns src/shared/domain/exceptions/domain.exceptions.ts
export class DomainException extends Error {
  constructor(message: string, options?: { cause?: unknown });
}
// app-domain owns src/shared/domain/exceptions/validation.exceptions.ts
export class ValidationException extends DomainException {
  constructor(source: string, cause: unknown);
}
// app-domain owns src/orders/domain/exceptions/orders.exceptions.ts
export class OrdersException extends DomainException {}
export class OrdersUnavailableException extends OrdersException {
  constructor(options?: { cause?: unknown });
}
// app-domain owns test/acceptance/orders/repositories/in-memory-order.repository.ts
// Acceptance-only fake: no infrastructure imports, no constructor arguments.
export class InMemoryOrderRepository implements OrderRepositoryInterface {
  seed(orders: OrderProps[]): void;
  listByCustomerId(customerId: string): Promise<OrderProps[]>;
}
```

The repository contract returns only the requested customer's validated orders, possibly empty and in any order. The use case sorts a copy newest first and returns every field unchanged. Define domain schemas in `domain/schemas` for nonempty ids, safe-integer cents, and valid timestamp instants with offsets; avoid inventing positive-only totals. The fake repository applies the same customer filter and props validation as the eventual implementation.

**Tests**

Generate `test/acceptance/orders/list-customer-orders.feature.test.ts` and fill `test/acceptance/orders/list-customer-orders.feature.steps.ts` against the fake repository. Cover mixed customers, exact field preservation, unsorted input with three distinct dates, one order, and the confirmed empty result. Include different totals to detect accidental unit conversion. Use domain schema tests for fractional/unsafe cents and malformed dates; do not add new business rules through those tests.

- [x] app-domain: Generate acceptance tests from the delta spec and implement Given/When/Then adapters over `InMemoryOrderRepository` with seed data.
- [x] app-domain: Build order props, schemas, module exceptions, repository interface and `ListCustomerOrdersUseCase` with descending instant ordering.
- [x] app-domain: Verify the phase with app-domain checks, acceptance tests, domain schema tests and TypeScript checking.

### Phase 2: The query is connected to HTTP and development backends

**Seams**

```ts
// src/orders/infrastructure/acl/orders.acl.ts
// Export orderRecordSchema and orderRecordsSchema using the schema package.
export interface OrderRecord {
  id: string;
  customer_id: string;
  total_cents: number;
  placed_at: string;
}
export interface OrdersAcl {
  listCustomerOrders(customerId: string): Promise<OrderRecord[]>;
}
// src/orders/infrastructure/repository-implementations/order.repository-implementation.ts
export class OrderRepositoryImplementation implements OrderRepositoryInterface {
  constructor(orders: OrdersAcl);
  listByCustomerId(customerId: string): Promise<OrderProps[]>;
}
// adapters owns src/orders/infrastructure/adapters/http-orders.adapter.ts
export class HttpOrdersAdapter implements OrdersAcl {
  constructor(baseUrl: string);
  listCustomerOrders(customerId: string): Promise<OrderRecord[]>;
}
// adapters owns src/orders/infrastructure/adapters/in-memory-orders.adapter.ts
export class InMemoryOrdersAdapter implements OrdersAcl {
  constructor(records?: OrderRecord[]);
  listCustomerOrders(customerId: string): Promise<OrderRecord[]>;
}
// adapters owns src/orders/infrastructure/adapters/orders.adapter.ts
// Selects by environment and exports:
export const ordersAdapter: OrdersAcl;
// clean-architecture owns src/main.ts: composition root and public callable entry.
export const listCustomerOrders: (customerId: string) => Promise<OrderProps[]>;
```

The ACL schemas validate the actual JSON array and required fields, including safe-integer cents and valid timestamps. Extra service attributes need no domain equivalent. Record → props mapping is explicit:

- `id` → `id`, unchanged.
- `customer_id` → `customerId`, unchanged.
- `total_cents` → `totalCents`, unchanged integer cents.
- `placed_at` → `placedAt`, unchanged timestamp.

The repository receives only `OrdersAcl`, imports no adapter, maps validated records, validates props, and filters by requested customer id so another customer's orders cannot escape the query. The HTTP adapter requests `GET <baseUrl>/customers/<encodedCustomerId>/orders`, safely joins trailing slashes while retaining any base path, checks success, decodes JSON, and validates through ACL schemas. Network, non-success status and invalid configuration produce `OrdersUnavailableException`; JSON decoding and record-shape failures produce `ValidationException`; both retain the original cause. There is no empty-list fallback on failure. The in-memory adapter validates and returns seeded resource records for the customer; it is distinct from the acceptance repository fake. Environment reads and backend selection live only in adapters. The entry injects the selected adapter into the repository and the repository into the use case, without reading environment variables.

**Tests**

`test/integration/orders/order-repository.test.ts` constructs the real repository over `InMemoryOrdersAdapter` implementing the real ACL. Verify every field mapping, unchanged cents, mixed-customer isolation, empty records, schema validation failures and propagation of module resource exceptions with causes; use a small failing ACL double for resource failures. Acceptance tests continue proving ordering through the same application seam. Adapter work uses the workstream's structural checks; real HTTP contract tests are deferred, not represented as covered by repository tests.

- [x] infrastructure: Define the Orders ACL and resource schemas; implement the injected order repository with explicit mapping and customer isolation.
- [x] adapters: Implement HTTP and in-memory Orders ACL adapters and environment-based selection using `ORDERS_API_URL` for HTTP.
- [x] infrastructure: Add repository integration coverage over the real ACL and in-memory adapter, including every mapped field and declared failure category.
- [x] clean-architecture: Wire the callable entry in `src/main.ts`, join app-domain, infrastructure and adapters, and run cross-module checks.
- [x] integrate: Ensure both backend implementations are reachable from `src/main.ts`, and verify the phase with full factory checks, acceptance and integration tests, and TypeScript checking.

## Feedback

- **the person**: Confirmed empty list for a customer without orders. Correct the signed seam folders and file names to the workstream Owns and reference examples; retain both unimplemented phases.
- **the completion gate**: Generated acceptance tests stale or missing; run factory generate and preserve its generated test output.
- **the completion gate**: Executed factory generate; its nested Node spawnSync reports EPERM and passes empty converter output to feat2test, causing INVALID_GHERKIN. Direct execution of the identical tools over factory merged specs generated 1 Feature, 3 scenarios, 4 steps; direct freshness check passes. Factory generate --check remains blocked by the subprocess environment. Generated tests and scaffold left as written; no implementation task completed.
- **the completion gate**: Generation now passes in the gate. Complete phase 1: missing use case and pending acceptance steps fail app-domain checks and acceptance tests.
- **the implement phase**: Phase 1 use case, schemas, exceptions, repository fake and step adapters are implemented. Acceptance 3/3 and tsc pass. Verification blocked by acceptance-test-targets-use-case requiring the new use case consolidated spec before archive; generation instead merges active deltas only temporarily. Harness correction needed outside this change; no premature consolidation or harness edit performed.
- **the verify phase**: Local procedure failed: pnpm install --frozen-lockfile exits ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK because the pnpm store operation lock is on a read-only filesystem. No product phase is invalidated: planning validation, generation, all workstream/full checks, 3 acceptance tests, 22 integration tests, 18 schema tests and TypeScript pass. Repeat the complete local procedure with writable pnpm store access, then verify again.
- **the person**: The person ran the complete local procedure on this machine outside the agent sandbox: pnpm install --frozen-lockfile, checks, acceptance and integration tests, and TypeScript checking all pass. The earlier pnpm store lock failure is a sandbox write restriction; the procedure remains correct as written. Accept local execution as passed on the person’s explicit attestation, resolve the open question, and rerun verify. No implementation phase is invalidated.

## Next step

Phase 2 is complete: Orders ACL schemas, injected repository with explicit field mapping and customer isolation, HTTP and constructor-seeded in-memory adapters, environment selection, and the callable `listCustomerOrders` entry are connected. Development uses an empty in-memory backend; other environments require a valid HTTP(S) `ORDERS_API_URL`.

All workstream and full factory checks pass, including generated-test freshness. Integration passes 22/22, acceptance 3/3, domain tests 18/18, and `pnpm exec tsc --noEmit` passes. Repository tests cover field mapping, exact cents, customer isolation, invalid records and propagated failures with causes. Real HTTP contract tests remain deferred as planned. No generated tests or harness files were edited.

No implementation tasks remain. The person confirms the complete local procedure passed on this machine outside the agent sandbox, including locked installation, checks, acceptance and integration tests, and TypeScript checking. This is person-attested execution, not agent-observed execution. The earlier pnpm store lock failure was a sandbox write restriction; the procedure remains unchanged. The open question is resolved. Rerun the verify skill with local execution recorded as passed on that explicit attestation; development remains read-only review under the verify environment policy.
