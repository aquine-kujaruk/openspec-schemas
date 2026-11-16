# flow

### Decision: probe-while-planning · Every access a change needs is probed before it is ready

@origin:2026-11-16-probe-resources-while-planning @applies:phases,schemas,toolkit @enforced:procedure-probed,doctor

The plan phase SHALL smoke-test, with a minimal authenticated read under the agent's real permissions, every access the change will use, and SHALL write each as a procedure of purpose `access` carrying `@probed`. What a probe lacks (a key, an authentication scheme, a permission, approval to read `prod`) SHALL be an open question, which the person MAY answer by declining it: the procedure is then written with `@probed:declined` and the change MAY be ready. A change SHALL NOT be ready while an access procedure it adds or changes carries no `@probed`. Verify SHALL NOT fail a change on a declined access it was given no outcome for. `factory doctor` SHALL note a key a consolidated access procedure names in `@keys` and the environment lacks.

**Why** The person approves a plan to stop being interrupted; what most often interrupts the implementation is a missing key, an unclear authentication or a refused command. Finding them while planning, and writing the runbook, means the next change does not ask again.
