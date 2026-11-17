# language

### Decision: factory-speaks-the-plant-language · The factory's code speaks the language of a plant

@origin:2026-11-17-factory-as-clean-backend @applies:factory @enforced:review @by:person

The factory's code, its plans and its decisions SHALL name its concepts with these terms, taken from *The Goal* and *The Phoenix Project* and, where the books are silent, from a plant's vocabulary, and SHALL NOT use the words each term avoids. The commands a person or an agent types keep their names.

| Term | What it is | Avoid |
| --- | --- | --- |
| Work order | A unit of work a person asks for, from its opening to its closing; OpenSpec stores it as a change | change, ticket |
| Release | The constraint approving a work order's plan, which lets it into production | approval |
| Stage · Operation | A part of a work order worth having on its own · one step of a stage | phase · task |
| Andon | The signal anyone pulls when work misses its drawing or a decision is missing; the work order goes back to planning | feedback, non-conformance |
| Inventory · Throughput | The work orders open · the work orders closed | backlog · velocity |
| Constraint | The person who releases work orders and reviews what comes out, the resource that sets the plant's pace | user, reviewer |
| Operator | The agent that does the operations of a stage | agent, implementer |
| Process · Base process | How a line manufactures: work centers, parts, standards · a process others extend | schema · core |
| Work center | A part of a process that makes some parts and is checked on its own | workstream, station |
| Part · Standard | A kind of file a work center makes · a rule a part meets | layer · rule |
| Sample · Golden sample | Parts showing one way of breaking a standard · the parts that break none | example · reference module |
| Drawing · Drawing revision · Current drawing | The behaviour a use case must show · how a work order changes it · what stands | spec · delta spec · consolidated spec |
| Gauge · Fixture | A test made from a drawing · the code that connects it to the use case | generated test · step adapter |
| Quality control · Defect | Measuring the work against standards and gauges in front of the constraint, holding the operator until it passes · one place that breaks a standard | check, gate · finding |
| Final inspection · Quality certificate | Proving a whole work order · the record it leaves | verify · evidence |
| Audit | A review against a rubric by a decision model, whose warnings fail nothing | rubric review |
| Plant · Line · Module | The project · a folder one process manufactures · a context of what a line makes | project · product · feature |
| Equipment · Work instruction | What a plant installs: command, processes, work instructions, controls · a written procedure an operator follows | installed package · skill |
| Change control · Maintenance | Letting an operator write only what a released work order allows · checking and repairing the equipment | write guard · setup, doctor |

**Why** The person reads a plant better than a pipeline, and the books explain why the factory exists: the constraint is the person, so quality control stands in front of them and only good work reaches them.
