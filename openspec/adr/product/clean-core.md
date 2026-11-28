# clean-core

### Decision: cli-composition-in-framework · Factory's CLI glue lives in its framework controllers

@origin:2026-11-18-reparar-revision-semantica @applies:factory @enforced:pending @by:person

Each Factory module SHALL have a controller in its framework layer that composes its use cases and translates arguments, hook payloads, standard input, output and exit status. A thin outer entry SHALL wire department dependencies and keep the public SDK and CLI commands. The framework SHALL NOT call static methods of the core directly.

**Why** Another transport, such as an internal API, must reach the same core operation and keep its decision; a direct call from the CLI hides the process from the core.

### Decision: domain-hydrates-through-factory · The use case hydrates once through a domain factory

@origin:2026-11-28-use-cases-hydrate-through-the-domain @applies:schemas,factory @enforced:repository-returns-records,required-part-throws-in-domain @by:person

A repository SHALL return validated records, and the use case SHALL call a static factory of the domain once to obtain the complete aggregate. The domain SHALL own the error for a missing required part, and SHALL keep the optional lookup for callers that accept absence.

**Why** `PlantRepositoryImplementation` built `PlantEntity` and `PrepareLineUseCase` handled a missing line itself.

### Decision: domain-contracts-execute · A schema in the domain validates at runtime

@origin:2026-11-27-domain-contracts-and-topology @applies:schemas,factory @enforced:schema-validates-at-runtime,class-name-carries-role @by:person

A domain contract named as a schema SHALL be an executable validation with its inferred type, reused at the boundary when the shapes match. A class SHALL carry its role in its exported name as well as in its file name.

**Why** TypeScript-only aliases in schema files passed for validation, and 34 domain classes lacked the role their scaffold names.

### Decision: branch-by-responsibility · A branch lives with the responsibility it decides

@origin:2026-11-18-reparar-revision-semantica @applies:factory @enforced:pending @by:person

A branch that decides a domain policy SHALL live in the domain; a branch in a use case SHALL only coordinate whether to perform I/O.

**Why** A use case reads as orchestration; a policy branch inside it is a hidden state machine.

### Decision: process-owns-topology · The Process aggregate owns ordering and cycles

@origin:2026-11-27-domain-contracts-and-topology @applies:schemas,factory @enforced:value-object-holds-several-values,process-aggregate-unit-test @by:person

A work center SHALL describe its direct dependencies; the Process aggregate SHALL own ordering and cycle detection across centers, and both the runtime loader and the domain SHALL use that one calculation. Value objects of a single value SHALL become validated fields of their owner's schema.

**Why** `WorkCenter` was anemic while `Process` and `WorkCenterTopologyService` each traversed the graph; `WorkCenterId` and `StandardId` wrap a string.

### Decision: internal-ports-composed-directly · An adapter wraps an external system; internal ports are composed

@origin:2026-11-18-reparar-revision-semantica @applies:factory @enforced:pending @by:person

A Factory adapter SHALL wrap an external system (a package, an API, the disk). The composition root SHALL connect an internal port such as change control to the production operation, adapt its result to the validated consumer contract and keep its error semantics. The repository SHALL state the operation or query, a generic resource adapter SHALL execute it, and a contract adapter MAY compose a disk or HTTP adapter and transform the record with the contract schema.

**Why** Adapters that forwarded an internal callback, such as `ReleasedWorkOrderAdapter.readStarted()`, are not glue to anything external.

### Decision: code-breathes · Blocks are separated; a comment is the exception

@origin:2026-11-28-code-breathes @applies:schemas,factory @enforced:code-breathes @by:person

A statement SHALL be separated by a blank line from the statement before it when either spans several lines or when it is a `return` or `throw` that is not alone in its block; single-line declarations and imports MAY stay together. A comment SHALL stay only when it is a seed the next agent could not deduce from the code and the artifacts.

**Why** Code that breathes reads in blocks, and a comment is a second copy of what the code says that the next change has to keep in step.
