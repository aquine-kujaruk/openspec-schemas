---
name: <change name>
description: <one sentence>
created_at: <YYYY-MM-DD>
created_by: <who stated the intention>
approved_at: <YYYY-MM-DD the person approved the plan; absent until then>
schema: <schema of the change>
---

# <title>

## Goal

<!-- What is true once this change is archived, in two or three sentences. -->

## Findings

<!-- One line per fact the probes observed that the implementation needs: the fact, its source (a command, a file, a URL) and the date it was seen. -->

## Decisions

<!-- One line per decision that matters only to this change: what was chosen, the alternative discarded, and who took it: @by:person or @by:agent. -->

## Open questions

<!-- One item per decision only the person can take: the question, the options, and the one you would pick. The last item is always the person's approval, linking the plan, each delta spec and each spike. Empty once the change is ready. -->

## Architecture decisions

<!--
One block per decision a future change must respect:

### Decision: <slug> · <title>

@adds @area:product @topic:<topic> @applies:<layers> @enforced:<rule, check or review> @by:<person or agent>

<The statement, with SHALL.>

**Why** <the reason, in a sentence or two>

**Alternatives** <what was discarded and why>

**Consequences** <what this now costs or forbids>
-->

## Procedures

<!--
One block per way of setting the system up, reaching it, diagnosing it or operating it:

### Procedure: <slug> · <title>

@adds @purpose:access @topic:<topic> @env:<environments> @probed:<YYYY-MM-DD or declined> @keys:<VAR,VAR> @by:<person or agent>

**When** <the situation that calls for it>

**Requires** <access and tools; where each secret is kept>

**Steps**

1. <step>

**Verification** <how to tell it worked>
-->

## Screens

<!--
Only in a schema with a spike workstream (a web frontend): one block per screen the change adds or changes, spiked while planning as a throwaway HTML file under spikes/:

### Screen: <slug> · <title>

@approved:<YYYY-MM-DD or declined> @page:<path of the page the implementation builds> @spike:spikes/<name>.html @by:<person or agent>

<What the screen shows, and which variant was approved.>

<Each journey through it: a numbered list of plain-language steps, each ending with what the screen shows afterwards.>
-->

## Phases

### Phase 1: <what this phase leaves working>

**Seams**

```ts
// the public signatures the workstreams of this phase build against
```

**Tests**

<!-- The suites this phase adds or changes, and what each covers. -->

- [ ] <workstream>: <task>
- [ ] <workstream>: verify the phase

## Feedback

<!-- One entry per feedback taken in: where it came from, what it said, what changed. -->

## Next step
