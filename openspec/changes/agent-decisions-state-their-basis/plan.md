---
name: agent-decisions-state-their-basis
description: The agent takes an evident architecture decision alone, stating its basis, and the decision model checks that basis; decisions that fork on intent reach the person.
created_at: 2026-11-27
created_by: Edgar
approved_at: 2026-11-27
schema: spec-plan
---

# An agent's architecture decision states its basis

## Goal

0.15.2 sent every architecture decision to the person, which makes the person the bottleneck. What failed before was not that the agent decided, but that it did not see the decision was the person's. Now the agent may take an architecture decision alone when it is evident, and says why: a **precedent** (a consolidated decision already settled the same kind of choice) or **no fork** (no option changes what the product can do or for whom). A decision that forks on intent (where the data lives, local or online, devices, people, outside services, cost) goes to the person. Validation asks for the basis, and the project's decision model checks it once per text; when it doubts, the agent asks the person.

## Findings

- On 2026-11-27, `decision-authored` in `schemas/spec-plan/validators/standard/validator.ts` reports an architecture decision tagged `@by:agent` (0.15.2), and `schemas/spec-plan/schema.ts` and `questions/ask-on-commitment.md` say every architecture decision is the person's.
- On 2026-11-27, `factory/quality/infrastructure/adapters/audit-decision.adapter.ts` holds `openAiClient`, the client of the decision model (`review.model`, key in `.env` under `review.keyVariable`, default `OPENAI_API_KEY`), used only by the quality department.
- On 2026-11-27, `AssessWorkOrderUseCase` (`factory/production`) runs a schema's validator for `factory validate`, for the write guards and for the completion gate; a validator's `ready` is synchronous and gets a `Candidate`.
- On 2026-11-27, `inspect-work-order.use-case.ts` skips the rubric review with a note when the project configures no key: the precedent for a project without a decision model.
- On 2026-11-27, the rubric cases pass at 95 % and warn from 90 % (`maintain-architecture-rules`): the precedent for the 90 % line.

## Decisions

- A validator may declare questions for the decision model (`judgements`), and the factory asks them before `ready` and hands the answers in the candidate, so the spec-plan validator stays synchronous and other schemas can judge too. Discarded: an asynchronous `ready` that calls the model itself, which would put a network client in a schema's resource. @by:agent
- Answers are recorded in `openspec/changes/<change>/judgements.json`, keyed by model and by a hash of the question and the text judged; a write guard or the completion gate reads them and only a new text is asked, so validation stays fast and the record travels with the change into the archive. Discarded: asking on every validation. @by:agent
- The decision model client moves to `factory/shared`, since production and quality now both use it; quality keeps importing it from its old file. Discarded: production importing a quality adapter, which crosses departments. @by:agent
- The endpoint of the decision model can be set with `FACTORY_DECISIONS_ENDPOINT` (default the OpenAI Decisions API), so another provider with the same contract is an adapter, and the tests answer from a local server. @by:agent
- A precedent names a consolidated decision only, which validation can check exists. Discarded: naming an archived change, whose decisions are not indexed. @by:agent
- Without a key the model is not asked and the basis tag alone holds, as the rubric review is skipped without one. @by:agent
- The guide of which decisions reach the person (`ask-on-commitment.md`) and the plan instruction give the three cases with examples, the storage of a product's data as the case that forks. @by:agent
- The person set the criterion (precedent, no fork, or it forks on intent and reaches them) and asked for validation plus the judge on the project's decision model, possibly behind an adapter (2026-11-27). @by:person

## Open questions

## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: An agent's architecture decision states its basis

**Tests**

- The generated tests of `plan-validation` run the modified authorship outline and the basis outline.

- [ ] Replace the 0.15.2 rule: `decision-authored` accepts `@by:agent` on an architecture decision again, and a new rule `decision-basis` asks an agent's architecture decision for exactly one `@basis:no-fork` or `@basis:precedent:<slug>` naming a consolidated decision.
- [ ] Rewrite `questions/ask-on-commitment.md` and the plan instruction in `schemas/spec-plan/schema.ts` with the three cases and the basis tags.
- [ ] Step adapter `architectureDecisionTagged`; regenerate the tests and run them.

### Phase 2: The decision model judges the basis

**Seams**

```ts
// factory/production/domain/services/work-order-assessment.service.ts
export type JudgementRequest = { block: string; state: string; instructions: string };
export type Judged = { configured: boolean; answers: Map<string, number | { error: string }> };
export type Validator = { ready: (candidate: Candidate) => Finding[]; judgements?: (candidate: Omit<Candidate, "judged">) => JudgementRequest[] };
// Candidate gains `judged: Judged`
```

**Tests**

- The generated tests of `plan-validation` run the judge outlines against a local server that answers as the Decisions API.
- A unit test of `AssessWorkOrderUseCase` with a fake judge: asks once per new text, records, reuses a record of the same model, and reports an error as an answer.
- The whole suite, `pnpm exec factory generate --check` and `pnpm exec factory check` pass.

- [ ] Move `openAiClient`, `inspect` and `DECISIONS_ENDPOINT` to `factory/shared/infrastructure/adapters/decision-model.adapter.ts`, re-exported by the quality adapter.
- [ ] `AssessWorkOrderUseCase` asks the validator's `judgements` through the repository (the product's review key and model, the recorded judgements), records new answers and hands `judged` to `ready`; wire it in `factory/production.ts`.
- [ ] The spec-plan validator declares one question per agent architecture decision and `decision-basis-holds` reports one below 0.9 or unanswered, telling the agent to ask the person.
- [ ] Step adapters `decisionModelKey`, `agentDecisionJudgedAt`, `changeValidatedOnce`, `decisionTextAfterJudgement`, `decisionModelAsked`; unit test of the use case; regenerate and run the whole suite and the factory checks.

## Feedback

## Next step

Implement phase 1.
