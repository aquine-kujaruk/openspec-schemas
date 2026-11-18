# decision-model

### Procedure: probe-decision-model · Check access to the configured decision model

@origin:2026-11-18-documentar-reglas-de-arquitectura @env:prod @probed:2026-11-18 @keys:OPENAI_API_KEY @by:agent

**When** A change to architecture auditing needs to establish whether the configured client and model return predicate probabilities.

**Requires** The project key in the configured environment or local `.env`. For Factory the default variable is `OPENAI_API_KEY`. Follow the project's planning procedure for approval of the production read.

**Steps**

1. Use `openAiClient` from `factory/quality/infrastructure/adapters/audit-decision.adapter.ts` with the project's model and key. Load the key without printing it.
2. Give the client one state containing four synthetic snippets: in pair A, both methods return `xs.filter(x => x.required)`; in pair B, the first filters and the other returns `this.c.deps(xs)`. Send one predicate per pair in the same request: do both files independently implement the filtering rule?
3. Record the model, request outcome and both named probabilities. Record an unavailable service as an incomplete probe. Restore availability and retry before relying on the result.

**Verification** The configured client receives a valid response with a probability for each pair. Classifier performance on actual rules is verified with that rule's own cases.
