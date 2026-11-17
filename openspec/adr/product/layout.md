# layout

### Decision: factory-in-clean-core-layers · The command's code follows the clean core's layers

@origin:2026-11-17-factory-in-clean-core @applies:factory,tools,schemas,packages @enforced:layout-test @by:person

The command's code SHALL live under `factory/`: the entry files directly under it (`main.ts` and one composition file per module), the modules `repository`, `flow`, `architecture` and `package`, named after the areas of `openspec/specs`, `shared` for what two modules use, and `sdk`, the only part `schemas/` and `packages/` import, as `factory/sdk`. A module and `shared` SHALL hold only `domain/`, `application/`, `infrastructure/` (holding only `acl/`, `repository-implementations/` and `adapters/`), `framework/` (the commands and hooks that receive the person or the agent) and, at a module's root, its feature tests. Domain SHALL import only domain; application only domain; infrastructure only application and domain; framework only application and domain; only the entry composes them. Only `infrastructure/adapters` SHALL touch the environment: files, processes, environment variables, the network. A module SHALL import another only through that module's application or domain, along repository ← flow ← architecture, package, and never in a cycle. What only this repository runs SHALL live in `tools/`, which no package carries. In a decision written before this one, `@applies:toolkit` means `factory/`.

**Why** The person reads a folder to know what a file may import, and an agent works from the same map. The factory teaches the clean core; its own code now follows it, so whoever reads the repository learns one vocabulary.
