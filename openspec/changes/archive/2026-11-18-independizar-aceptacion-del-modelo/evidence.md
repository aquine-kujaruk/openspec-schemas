---
change: independizar-aceptacion-del-modelo
verdict: verified
digest: ca67cada0b42b5f3735936ebb11e5f3ac684eeedb506ca02acd208a9376447d9
---

# Evidence of independizar-aceptacion-del-modelo

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.95 produces target | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.90 produces warning | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.8999 produces failed | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.01 produces failed | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.05 produces target | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.10 produces warning | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.1001 produces failed | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.99 produces failed | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | A declaration of yes is accepted | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | A declaration of no is accepted | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | A declaration of a score and model name is rejected | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | A declaration of missing is rejected | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying none with key absent makes 0 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying case with key present makes 1 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying question with key present makes 1 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying model with key present makes 1 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying case with key absent makes 0 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying question with key absent makes 0 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying model with key absent makes 0 calls | passed |
| architecture/linting | Every judgement joins a history the report reads | History none followed by 0.95 yields target with drift absent | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.97 0.96 0.97 followed by 0.95 yields target with drift absent | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.75 followed by 0.95 yields target with drift present | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.72 followed by 0.91 yields warning with drift absent | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.70 followed by 0.90 yields warning with drift present | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.92 0.91 0.93 followed by 0.64 yields failed with drift present | passed |

## Checks

Every check passes.

## Review

Skipped: the project configures no OPENAI_API_KEY.

## Procedures

| Procedure | Environment | Treatment | Outcome |
| --- | --- | --- | --- |
| maintain-architecture-rules | local | executed | passed |

## Offline regression

The full suite passed 906 tests across 85 files. It replayed all 46 rubric cases with the model key set to an empty string. The seven score files and all generated tests stayed byte-identical. Test doubles exercised switching evaluators and returning to the matching history. The CLI refreshed S17/wrapper-id by reusing its matching evidence. TypeScript, generated-test freshness, Factory architecture checks and the local backend and frontend builds passed. The change made no live audit or calibration requests.
