---
name: the-reference-writes
description: The reference module writes as well as reads, a pending invoice paid from its detail, so a mutation, a store and a bridge have a correct example, the clean core's examples write too, and the page store becomes doctrine
created_at: 2026-11-16
created_by: the person
schema: spec-plan
---

# The reference module writes

## Goal

The reference module the agent reads before building a layer shows a write from end to end: on the sample invoices the examples already use, a list filtered by status, an invoice's detail reached through the URL, and a Pay button that runs a use case and refreshes what it changed. A mutation, a store and a bridge each get a correct example, and every layer of the clean core shows its part of the write, so `clean-backend` gains it too. The doctrine of the React layer says where the state of a page lives: in that page's store while implementing, in the stub's local state while spiking.

## Findings

- Every reference module only reads: the use cases `ListInvoicesUseCase` and `GetInvoiceUseCase`, the repository methods `listInvoices` and `findInvoice`, and no file under `framework/mutations`, `framework/stores` or `framework/bridges` (`application.examples.md`, `framework.examples.md`, `ui.examples.md` @695e2b7, seen 2026-11-16).
- `get-invoice.query.ts` is in the reference of `react-hooks` and no controller uses it (`schemas/clean-react/workstreams/react-hooks/framework.examples.md` @695e2b7, seen 2026-11-16).
- A workstream's reference is its own `## reference` plus those of its upstream workstreams; a file present in two of them with different content throws, naming both (`toolkit/architecture/examples.ts:74-85` @695e2b7, seen 2026-11-16). Adding a method to `invoice.repository-interface.ts` in a React example therefore changes the core's example as well.
- The rules already cover what this change adds, each with a counterexample: a mutation composes its use case like a query (`query-bridges-use-case`), keys come from a factory (`query-keys-from-factory`, case `literal-query-key` on a `pay-invoice.mutation.ts`), a store imports only domain and view-models, a page never imports a store, and a bridge may import the core and `ui` but not a controller (`framework.rules.ts`, `ui.rules.ts` @695e2b7, seen 2026-11-16).
- `listInvoicesQueryKey()` is `["invoices"]` and `getInvoiceQueryKey(id)` is `["invoices", id]`: the list's key is a prefix of the detail's (`framework.examples.md` @695e2b7, seen 2026-11-16).
- `HttpApiAdapter` has `get` and `find` only; `InMemoryInvoiceAdapter` returns a module-level `SEED` and cannot write (`adapters.examples.md` @695e2b7, seen 2026-11-16).
- The source of the React layer has a store per page (`src/orders/framework/stores/orders-list.store.ts`, `create` of `zustand`) and a bridge that routes by hand with the History API (`src/orders/framework/bridges/orders-route.bridge.tsx`), and no mutation (`arch-linter-poc@827d7a8`, seen 2026-11-16).
- `factory proof` type-checks the framework's reference files and what they import; the core's references are proved by their rules and tests (`toolkit/package/proof.ts:117-174` @695e2b7, seen 2026-11-16).
- Rubric row S02 of `clean-react` ends with "A one-component ephemeral draft is local state", and no rule or row asks about local component state (`schemas/clean-react/review/RUBRIC.md` @695e2b7, seen 2026-11-16).
- The package and the command are at 0.7.0 (`package.json` @695e2b7, seen 2026-11-16).

## Decisions

Agreed with the person in the Easel session of 2026-11-16:

- The write the reference teaches is paying an invoice from its detail: a list filtered by status, the detail at `/invoices/<id>`, and a Pay button. It reuses the invoice and its `paid` / `pending` states. Discarded: creating an invoice through a form (a form view-model and a second use case), and both stories (twice the reference to read before every layer). The person asked whether the invoice was hypothetical; it is the sample domain every `*.examples.md` already uses, and a project that installs the package copies the shape, not the invoice.
- The write enters the clean core's examples: each layer shows its part (the entity's `pay()`, `PayInvoiceUseCase`, `saveInvoice` on the repository interface, its implementation and the ACL, `HttpApiAdapter.post`, an in-memory adapter that keeps what it writes), so `clean-backend` gains the same example. Discarded: a separate payment resource only in the React examples (two repositories for one invoice, which a project would copy without needing it).
- After paying, the mutation invalidates the list and the detail through their key factories, and both are read again from the server. Discarded: writing the POST's response into the detail by hand (it trusts the response to be complete), and an optimistic update with rollback (three times the code, taught as the norm).
- The store keeps the list's status filter, which stays set after visiting a detail. The person: "las stores son por página, pero por página de URL [...] para guardar todos esos estados que van cambiando, ni tener useReducer ni nada de eso, para lo que se usa un store". Discarded: the payment's confirmation step, and the result message.
- After paying, the user stays on the detail, which paints Paid once it is read again. Discarded: going back to the list through a callback the bridge hands down.
- A stub controller behind a journey that writes keeps its literal data in local state and the action changes it, so the journey's end-to-end test passes against the spike. The person: "si estamos en el spike, lo mínimo posible: useState sin store [...] sin React Query, sin nada. Simplemente lo mínimo para probar el test [...] con valores hardcodeados". Discarded: a stub that does nothing and a test completed during implementation.
- While implementing, `useState` and `useReducer` are avoided wherever the page's store can hold the state, and the review judges it, not a lint rule. The person: "en la implementación, sí, como te decía, tratar de evitar useState y useReducer si se puede utilizar un store". Discarded: a lint rule on `framework/ui` (no room for a justified exception), and guidance in the skills only.

Taken from the code and conventions, and shown to the person in the approved synthesis:

- This repository's own change, opened with `spec-plan` (`README.md`, Work on this repository).
- The bridge routes by hand with the History API, as the source's orders bridge does: `clean-react` agreed that the schema prescribes no router library, and a reference that imports one would prescribe it.
- The store uses `create` of `zustand`, the package the schema already names and the source uses.
- One store per URL page, named after the page, holds every state that changes on it; the reference's is `invoices.store.ts`, for `invoices.page.tsx`. Rubric row S02 and the skills say so.
- A mutation scaffold joins the query's (composition root, `useMutation`, invalidation through the key factories): the decision `scaffold-first` covers short, rule-fixed files, and a mutation obeys the same rules as a query. It overturns an assumption of `clean-react` that mutations get none.
- No new lint rule: the rules of mutations, stores and bridges exist with their counterexamples; what was missing is the correct example, which must break none of them.
- A new rubric row, S23, asks whether a page, a component or a controller keeps in `useState` or `useReducer` a state the page's store could hold (layers `framework/ui` and `framework/controllers`); S02 loses its sentence on local state. Review runs in verify, once the stubs are gone.
- The spike uses no store and no query cache: only the stub controller holds state; pages hold none.
- The detail controller exposes `isPaying` from the mutation's pending state, never copied to the store (S02).
- The detail page reads the invoice through the existing `get-invoice.query.ts`.
- Routes `/invoices` and `/invoices/<id>`; the entry mounts the invoices bridge inside the query client's provider.
- The rule of the write lives in the domain: `InvoiceEntity.pay()` returns the paid invoice and throws `InvoiceAlreadyPaidException` when it already was; `PayInvoiceUseCase` finds it, pays it and saves it. The repository throws no business exception (S01).
- `HttpApiAdapter` gains `post` beside `get` and `find`; `HttpInvoiceAdapter` sends `POST /invoices/<id>/payment` and parses the answer with the record's schema.
- The acceptance reference gains the specification of paying an invoice, and the integration reference exercises `saveInvoice`.
- The in-memory adapter copies its seed per instance and applies every write to that copy, so a later read sees it: the `e2e` environment runs on in-memory adapters.
- Verify runs `factory proof` for `backend` and for `frontend`: both packages carry the core's examples.
- Version 0.8.0: examples, skills, a scaffold and a rubric row the packages carry change.

Assumptions of mine, not agreed one by one:

- The filter is applied by the list controller to the entities the list query returns; `ListInvoicesUseCase` keeps its signature. The store holds `status: InvoiceStatus | null` and `setStatus`.
- The bridge decides which page to mount from the path (a bridge is not held by `jsx-neither-compares-nor-counts`) and hands each page its links (`href` and `onClick`), as the source's bridge does.
- The detail is `ui/invoice-detail/invoice-detail.page.tsx` with `useInvoiceDetailController(invoiceId)` and `invoiceDetailViewModel`; the controller returns `canPay` from the entity's `isPaid`, `isPaying`, `onPay` and `isMissing` from `InvoiceNotFoundException`.
- The use case returns the paid invoice; under the agreed invalidation the mutation does not use it.
- The reference carries no end-to-end test: the plan skill already says how to write one, and `factory proof` does not mount the reference.
- The README gains no section: its paragraph on `clean-react` names mutations, stores and bridges already. It names the version.

## Open questions

## Architecture decisions

### Decision: page-store · The state of a page lives in its store

@adds @area:product @topic:implementer @applies:schemas @enforced:review

In a schema whose framework layer has stores, every state that changes on a URL page SHALL live in that page's store, one store per page named after it, and what comes from a fetch or a mutation SHALL live in the query cache, never in a store. Once implemented, pages, components and controllers SHALL NOT keep such state in local component state where the page's store can hold it. A stub controller of the spike is the exception: it keeps its literal data in local state, with no store and no query cache.

**Why** The person: "las stores son por página, pero por página de URL [...] para guardar todos esos estados que van cambiando, ni tener useReducer ni nada de eso, para lo que se usa un store". A page's state then survives its components and the page's own unmount, and one file per page says where to look for it. The spike stays the minimum that passes its tests.

**Alternatives** Local state for a one-component draft, as S02 said, discarded by the person. A lint rule on `framework/ui`, discarded because the person wants it avoided "si se puede", which leaves room for a justified exception that a reviewer judges.

**Consequences** S02 loses its sentence on local state and S23 asks the question in `factory review`. Even a dropdown's open state belongs in the page store unless the reviewer accepts the exception. A rule never catches it: it is found at verify.

## Procedures

## Screens

## Phases

### Phase 1: the clean core's examples write

**Tests**

The generated tests of every core layer still pass: each case against its recorded expectation, and each workstream's reference breaking no rule. `toolkit/architecture/examples.test.ts` (or the generated reference tests) fails while a seam file differs between two references. `factory proof backend` writes the reference out, generates its tests and passes its rules, acceptance and integration tests.

- [x] Add `pay()` to `InvoiceEntity` and `InvoiceAlreadyPaidException` to the module's exceptions in `domain.examples.md`
- [x] Add `saveInvoice` to `InvoiceRepositoryInterface` and `PayInvoiceUseCase` (find, pay, save, return the paid invoice) in `application.examples.md`
- [x] Add `saveInvoice` to `InvoiceAcl` and `InvoiceRepositoryImplementation` in `infrastructure.examples.md`, and exercise it in the integration reference
- [x] Add `post` to `HttpApiAdapter`, `POST /invoices/<id>/payment` to `HttpInvoiceAdapter`, and a per-instance copy of the seed that `saveInvoice` writes to in `InMemoryInvoiceAdapter`, in `adapters.examples.md`
- [x] Add the specification of paying an invoice to the acceptance reference
- [x] Copy every changed seam file, byte for byte, into the references of `react-hooks` and `react-ui` that carry it
- [x] Verify `pnpm run check` passes and `factory proof backend` exits zero

### Phase 2: the React reference writes

**Tests**

The generated tests of `architecture/framework` and `architecture/ui`: every case against its recorded expectation, and the reference module breaking no rule, with `clean-react`'s defaults. `toolkit/architecture/scaffolds.test.ts` renders the mutation scaffold into a file the framework layer accepts (the row added to `implementer`). `factory proof frontend` type-checks the new reference.

- [x] Write `framework/mutations/pay-invoice.mutation.ts` in `framework.examples.md`: the composition root once, `useMutation`, and on success the invalidation of `listInvoicesQueryKey()` and `getInvoiceQueryKey(id)`
- [x] Write `framework/stores/invoices.store.ts` (status filter) and make `invoices.controller.ts` filter the list through it, exposing the filter, its options and `onFilter`
- [x] Write `invoice-detail.controller.ts` and `invoice-detail.view-model.ts` over `get-invoice.query.ts` and the mutation, exposing `canPay`, `isPaying`, `onPay` and `isMissing`
- [x] Write in `ui.examples.md` the list page with its filter and links, `ui/invoice-detail/invoice-detail.page.tsx`, `framework/bridges/invoices-route.bridge.tsx` routing `/invoices` and `/invoices/<id>` with the History API, and `src/main.tsx` mounting the bridge inside the query client's provider
- [x] Add the mutation scaffold to `## scaffolds` of `framework.examples.md`, and its render command as the first step for a mutation in the `react-hooks` skill
- [x] Re-record with `factory expect` any case whose expectation the new seam files change, and regenerate the tests
- [x] Verify `pnpm run check` passes and `factory proof frontend` exits zero

### Phase 3: the doctrine says where a page's state lives

**Tests**

The generated tests of the requirements modified in `flow/plan` (no step adapter: proved by the person's word) and `implementer` (the scaffold row, proved by `toolkit/architecture/scaffolds.test.ts`). `toolkit/architecture/review/rubric.test.ts` parses `clean-react`'s rubric with S23 and finds no id both rubrics carry. `factory build backend --check`, `factory build frontend --check` and `factory build fullstack --check` are fresh after a build.

- [x] Rewrite S02 without its sentence on local state and add S23 to `schemas/clean-react/review/RUBRIC.md`, as yes/no questions with their layers
- [x] Tell the `react-ui` skill that a stub behind a journey that writes keeps its literal data in local state and the action changes it, with no store and no query cache; its stub imports only React
- [x] Tell the `react-hooks` skill: one store per URL page, named after it, holds every state that changes on that page; local state is avoided where that store can hold it; a mutation invalidates through the key factories
- [x] Tell the plan skill's spike step that a stub of a journey that writes applies the write to its literal data
- [x] Raise the package and command version to 0.8.0 and name it in the README
- [x] Verify `pnpm run check` passes, the three packages build fresh, `factory proof` exits zero for `backend` and `frontend`, and `factory verify the-reference-writes --proved flow/plan --proved implementer` records the evidence

## Feedback

- Easel session on 2026-11-16 with the person: the seven decisions listed as agreed came from there, with the person's notes quoted; the person approved a synthesis that listed the rest as taken from the code. The assumptions above were not part of it.

- Built on 2026-11-16 by the agent, the three phases in one run, at the person's request ("implementa todas las fases [...] hasta la tres").
- Found while building (phase 1): saving the invoice the domain paid is a `PUT /invoices/<id>` of the record, and `HttpApiAdapter` gained `put`, not `post`: the use case pays in the domain and the repository stores the result, so the adapter's verb is a save, not a payment action. The decision listed `post` and `POST /invoices/<id>/payment`; nothing else changes.
- Found while building (phase 1): the in-memory adapter's seed gained a pending invoice (`2`, 25), so that the reference has one to pay. The scaffold of the shared HTTP adapter is a copy of its reference and was updated with it.
- Found while building (phase 2): the status labels live in `invoice-status.view-model.ts`, which the row and detail view-models import; the detail controller exposes `notice`, the message of the module's exception (not found, already paid, unavailable), instead of `isMissing`, so the page writes no error text (S03).
- Found while building (phase 2): the mutation scaffold takes two more placeholders, `query` and `queryCamel`, the query whose key factory it invalidates; the scaffold test's sample names them.
- Found while building (phase 2): `factory proof frontend` failed to type-check the new entry, which imports `react-dom/client`; proof now adds `@types/react-dom` whenever the reference imports `react-dom`.
- Found while building (phase 3): `toolkit/architecture/review/rubric.test.ts` lists `clean-react`'s rows and now expects S23.
- Found at verify: `implementer` has no step adapter, so no generated test proves its scaffold row; as in `clean-react` and `e2e-and-spikes-for-the-web`, it is proved by `toolkit/architecture/scaffolds.test.ts` and passed with `--proved implementer`. The verify task named only `flow/plan`.

## Next step

Build this change through the implement phase, phase by phase, then verify and archive it.
