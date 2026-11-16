# flow

### Decision: probe-while-planning · Every access a change needs is probed before it is ready

@origin:2026-11-16-probe-resources-while-planning @applies:phases,schemas,toolkit @enforced:procedure-probed,doctor

The plan phase SHALL smoke-test, with a minimal authenticated read under the agent's real permissions, every access the change will use, and SHALL write each as a procedure of purpose `access` carrying `@probed`. What a probe lacks (a key, an authentication scheme, a permission, approval to read `prod`) SHALL be an open question, which the person MAY answer by declining it: the procedure is then written with `@probed:declined` and the change MAY be ready. A change SHALL NOT be ready while an access procedure it adds or changes carries no `@probed`. Verify SHALL NOT fail a change on a declined access it was given no outcome for. `factory doctor` SHALL note a key a consolidated access procedure names in `@keys` and the environment lacks.

**Why** The person approves a plan to stop being interrupted; what most often interrupts the implementation is a missing key, an unclear authentication or a refused command. Finding them while planning, and writing the runbook, means the next change does not ask again.

### Decision: spike-while-planning · A web change is spiked and its end-to-end tests are written while planning

@origin:2026-11-16-e2e-and-spikes-for-the-web @applies:phases,schemas,toolkit @enforced:screen-approved,write-guard

A schema whose platform is `web` SHALL declare a spike workstream. The plan of a change that touches what a user sees SHALL build that workstream's part as a spike, in place, against stub controllers, SHALL get each screen approved by whoever can decide it (`@approved`), and SHALL write the end-to-end tests of its journeys, passing against the spike. The implementation SHALL keep them passing with the real code behind the screens, the doubles sitting at the adapters.

**Why** The person saw the screens only at the end of the implementation, when changing them is expensive. A spike in the product's own framework is reused rather than thrown away, and tests that pass against it before any logic exists fix what the screens must do.
