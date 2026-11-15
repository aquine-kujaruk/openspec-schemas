# implementer

### Decision: scaffold-first · A scaffolded kind starts from its scaffold

@origin:2026-11-15-scaffold-from-examples @applies:schemas @enforced:scaffold-test

A workstream skill SHALL make the scaffold's render command the first step for every file of a kind its layer scaffolds, and the agent SHALL fill that file afterwards instead of writing it from nothing. A scaffold SHALL live in the `## scaffolds` section of its layer's examples, and it SHALL render into a file that its layer's vocabulary and single-file shape rules accept.

**Why** A scaffold saves the tokens of boilerplate the agent would otherwise emit, and starts every such file in the shape the rules check. Keeping it in the examples means each layer has one file to read and maintain.
