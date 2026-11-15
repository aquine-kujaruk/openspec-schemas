# schemas

### Decision: core-plus-framework · A schema is a core plus what it adds to it

@origin:2026-11-15-share-the-clean-core @applies:schemas,toolkit @enforced:build-spec

A schema that builds product code SHALL name one core and MAY add workstreams of its own, which are its framework. A core SHALL be a folder of `schemas/shared/cores/` that holds its workstreams, lists them and says which waits for which, and it SHALL name no framework and no package of one. A schema's name SHALL start with the short name of its core and end with what it adds: `clean-backend`, `clean-react`.

**Why** The person builds several backends and several frontends on the same Clean Architecture, and wants to be able to replace that core by another without rewriting the frameworks. Keeping the core as one named unit lets two schemas share it without one extending the other, and keeps its workstreams together.
