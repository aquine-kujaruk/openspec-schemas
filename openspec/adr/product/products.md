# products

### Decision: one-change-one-product · A change builds exactly one product

@origin:2026-11-15-products-per-folder @applies:toolkit,schemas @enforced:validate,write-guard

In a project that declares products, every change SHALL name one declared product, its schema SHALL be that product's schema, and it SHALL open for writing only that product's folder. The changes of one intention SHALL name each other under `x-linked`.

**Why** A product is a deliverable, and the slice of a change goes end to end inside one deliverable. Tying the change to one folder lets the guard, the gate and the checks judge it without looking at the other products.
