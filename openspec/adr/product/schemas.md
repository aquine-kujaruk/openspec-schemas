# schemas

### Decision: core-plus-framework · A schema is a core plus what it adds to it

@origin:2026-11-15-share-the-clean-core @applies:schemas,toolkit @enforced:build-spec

A schema that builds product code SHALL name one core and MAY add workstreams of its own, which are its framework. A core SHALL be a folder of `schemas/shared/cores/` that holds its workstreams, lists them and says which waits for which, and it SHALL name no framework and no package of one. A schema's name SHALL start with the short name of its core and end with what it adds: `clean-backend`, `clean-react`.

**Why** The person builds several backends and several frontends on the same Clean Architecture, and wants to be able to replace that core by another without rewriting the frameworks. Keeping the core as one named unit lets two schemas share it without one extending the other, and keeps its workstreams together.

### Decision: one-framework-workstream · A schema's framework is one workstream

@origin:2026-11-21-one-react-workstream @applies:schemas,phases @enforced:build-spec,implementer-spec @by:person

A schema that adds a framework to its core SHALL add it as one workstream that owns every layer of the framework. In a web schema that workstream SHALL be the spike workstream. It SHALL build the screens of a change against stub controllers in the first phase that touches them, and it SHALL replace those stubs with the real controllers in a phase whose seams sign the use cases and adapters they compose. The controller a page destructures SHALL NOT be a seam between workstreams.

**Why** The person wants the screen and the logic behind it built by the same hands, with one rule set. The stub is a step inside the framework's work, not a frontier, and the frontier that matters is the one with the core.
