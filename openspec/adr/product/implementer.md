# implementer

### Decision: scaffold-first · A scaffolded kind starts from its scaffold

@origin:2026-11-15-scaffold-from-examples @applies:schemas @enforced:scaffold-test

A workstream skill SHALL make the scaffold's render command the first step for every file of a kind its layer scaffolds, and the agent SHALL fill that file afterwards instead of writing it from nothing. A scaffold SHALL live in the `## scaffolds` section of its layer's examples, and it SHALL render into a file that its layer's vocabulary and single-file shape rules accept.

**Why** A scaffold saves the tokens of boilerplate the agent would otherwise emit, and starts every such file in the shape the rules check. Keeping it in the examples means each layer has one file to read and maintain.

### Decision: verify-joins-the-product · Workstreams stay decoupled and verify proves they work together

@origin:2026-11-16-e2e-and-spikes-for-the-web @applies:schemas,toolkit @enforced:verify,implementer-spec

No workstream SHALL own the checks that need the whole product joined. A core SHALL list only workstreams that own layers. Verify SHALL run the whole-product checks and, for a web product, its end-to-end tests, and SHALL raise each failure on the workstream that owns the file, which the next implement run fixes.

**Why** The person wants every workstream decoupled and one place that proves the parts fit; a reduce workstream that only checks duplicated what verify already does.
