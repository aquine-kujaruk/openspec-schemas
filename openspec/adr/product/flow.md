# flow

### Decision: probe-while-planning · Every access a change needs is probed before it is ready

@origin:2026-11-16-probe-resources-while-planning @applies:phases,schemas,toolkit @enforced:procedure-probed,doctor

The plan phase SHALL smoke-test, with a minimal authenticated read under the agent's real permissions, every access the change will use, and SHALL write each as a procedure of purpose `access` carrying `@probed`. What a probe lacks (a key, an authentication scheme, a permission, approval to read `prod`) SHALL be an open question, which the person MAY answer by declining it: the procedure is then written with `@probed:declined` and the change MAY be ready. A change SHALL NOT be ready while an access procedure it adds or changes carries no `@probed`. Verify SHALL NOT fail a change on a declined access it was given no outcome for. `factory doctor` SHALL note a key a consolidated access procedure names in `@keys` and the environment lacks.

**Why** The person approves a plan to stop being interrupted; what most often interrupts the implementation is a missing key, an unclear authentication or a refused command. Finding them while planning, and writing the runbook, means the next change does not ask again.

### Decision: spike-while-planning · A web change is spiked as throwaway HTML while planning and tested end to end while implementing

@origin:2026-11-17-throwaway-spikes @applies:phases,schemas,toolkit @enforced:screen-approved

A schema whose platform is `web` SHALL declare a spike workstream. The plan of a change that touches what a user sees SHALL spike its screens as self-contained HTML files under the change's `spikes/` folder, SHALL get each screen approved by whoever can decide it (`@approved`), and SHALL write the journeys through it in plain words; it SHALL NOT write the product's code. The spike workstream SHALL be the first the implementation builds for those screens, from the approved spikes and against stub controllers, and SHALL write the end-to-end tests of their journeys; the later workstreams SHALL keep them passing with the real code behind the screens, the doubles sitting at the adapters.

**Why** The person saw the screens only at the end of the implementation, when changing them is expensive. Building the spike in the product asked the planner for a product that may not exist yet, with its framework and tools installed and a way to run it, and opened the product to a change not yet approved. A throwaway page costs an agent little; a plan coupled to the product costs a lot.

### Decision: phases-in-one-run · A started implementation builds every pending phase in one run

@origin:2026-11-17-carry-approved-plans-through-verification @applies:phases @enforced:implement-skill,completion-gate @by:agent

The main agent SHALL start in the checkout of the approved plan, build its pending phases in order, close each with its verification task and continue through verification. On an attempted stop, a passing phase with pending work SHALL return the next action. Feedback, a check that repeatedly fails and input only the person can give remain valid stops.

**Why** The person already approved the ordered work. The recorded incident required a further prompt after a passing phase.

### Decision: decisions-name-who-took-them · Every decision a change writes says whether the person or the agent took it

@origin:2026-11-17-approve-then-implement @applies:schemas,phases,toolkit @enforced:decision-authored @by:person

Every decision a change writes SHALL carry `@by:person` or `@by:agent`: each line under the plan's Decisions, each architecture decision, procedure and screen, and each requirement a delta spec adds or modifies. Validation SHALL report a change not ready while one lacks it, and archiving SHALL keep it in what it consolidates.

**Why** The person wants to audit later which decisions were theirs and which the agent's, inside the plan and the specs themselves.

### Decision: approve-then-implement · The person's approval is the plan's last question and starts the implementation where the project says

@origin:2026-11-17-approve-then-implement @applies:phases,schemas,toolkit @enforced:plan-approved,handoff-spec @by:person

The plan SHALL end with the person's approval as its last open question, shown with links to the change's artifacts themselves. A change SHALL NOT be ready until its plan records that approval. Once approved, the change SHALL be handed in the same turn to the implementation the project configures: the same session by default, or a command the project names.

**Why** The person wants planning and implementing to read as one flow: approving should be one more answer, not a stop that waits for another run; and the person reads the plan itself, not a summary of it.

### Decision: read-in-your-language · Artifacts are shown in the person's language and kept in English

@origin:2026-11-17-approve-then-implement @applies:phases,toolkit @enforced:reading-spec @by:person

The artifacts of `openspec/` SHALL stay in English in the repository. When a language other than English is configured, by the project or by the person's environment, every artifact the agent shows the person SHALL be shown as a copy translated into that language, kept under the system's temporary folder and never in the repository, translated by a small, fast model, with code, identifiers, names, tags and the specs' keywords left in English.

**Why** The person reviews plans and specs in their own language, while the specs stay convertible and shared in one language.
