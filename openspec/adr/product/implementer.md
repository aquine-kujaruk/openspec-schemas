# implementer

### Decision: scaffold-first · A scaffolded kind starts from its scaffold

@origin:2026-11-15-scaffold-from-examples @applies:schemas @enforced:scaffold-test

A workstream skill SHALL make the scaffold's render command the first step for every file of a kind its layer scaffolds, and the agent SHALL fill that file afterwards instead of writing it from nothing. A scaffold SHALL live in the `## scaffolds` section of its layer's examples, and it SHALL render into a file that its layer's vocabulary and single-file shape rules accept.

**Why** A scaffold saves the tokens of boilerplate the agent would otherwise emit, and starts every such file in the shape the rules check. Keeping it in the examples means each layer has one file to read and maintain.

### Decision: verify-joins-the-product · Workstreams stay decoupled and verify proves they work together

@origin:2026-11-16-e2e-and-spikes-for-the-web @applies:schemas,toolkit @enforced:verify,implementer-spec

No workstream SHALL own the checks that need the whole product joined. A core SHALL list only workstreams that own layers. Verify SHALL run the whole-product checks and, for a web product, its end-to-end tests, and SHALL raise each failure on the workstream that owns the file, which the next implement run fixes.

**Why** The person wants every workstream decoupled and one place that proves the parts fit; a reduce workstream that only checks duplicated what verify already does.

### Decision: page-store · The state of a page lives in its store

@origin:2026-11-17-the-reference-writes @applies:schemas @enforced:review

In a schema whose framework layer has stores, every state that changes on a URL page SHALL live in that page's store, one store per page named after it, and what comes from a fetch or a mutation SHALL live in the query cache, never in a store. Once implemented, pages, components and controllers SHALL NOT keep such state in local component state where the page's store can hold it. A stub controller of the spike is the exception: it keeps its literal data in local state, with no store and no query cache.

**Why** The person: "las stores son por página, pero por página de URL [...] para guardar todos esos estados que van cambiando, ni tener useReducer ni nada de eso, para lo que se usa un store". A page's state then survives its components and the page's own unmount, and one file per page says where to look for it. The spike stays the minimum that passes its tests.
