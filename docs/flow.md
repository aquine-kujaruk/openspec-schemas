# The flow

A change goes through five skills, each calling the command:

| Skill | What it does | Command behind it |
| --- | --- | --- |
| `plan` | Picks the schema the intention calls for, opens a change with it, writes its plan and delta specs while asking the person, ends with the person's approval and hands the change to the implementation | `factory schemas`, `factory validate <change>`, `factory handoff <change>` |
| `implement` | Builds every pending phase of a ready change in order, one workstream at a time, then verifies it | `factory implement <change>`, `factory check --workstream <workstream>` |
| `verify` | Runs every check and test and writes the evidence | `factory verify <change>` |
| `archive` | Consolidates the change's specs, decisions and procedures and archives it | `factory archive [change]` |
| `feedback` | Takes a correction back into the change it is about | `factory feedback <change>` |

The implement phase starts every short, rule-fixed file (schemas, entities, value objects, exception families, repository interfaces, ACLs, in-memory repositories and the shared bases) from a scaffold kept in the `## scaffolds` section of its layer's examples, rendered with `pnpm dlx ejs@7.0.2`; the first render on a machine needs the network.

While planning, the agent probes every access the change will use (an API behind an adapter, the repository, what is deployed, the logs) with the minimum that shows it works: the key is there and one authenticated read answers, under the agent's real permissions. It calls `prod` only after the person approves that read. Each access becomes a procedure of purpose `access` tagged `@probed:<date>` and, when it reads environment variables, `@keys:<VAR,VAR>`; archiving turns it into a runbook under `openspec/runbooks/access/`. What the probes saw goes under the plan's `## Findings`. What is missing (a key, the way to authenticate, a permission) is asked as an open question; the person may decline it, and the procedure is then tagged `@probed:declined` and the change goes ready: the implementation will fail on that access, and verify records it as declined instead of failing the change. Validation reports a change not ready while an access procedure carries no `@probed`.

A web change is seen before it is built. When a change of `clean-react` touches what a user sees, the plan phase spikes its screens as throwaway HTML pages under the change's `spikes/` folder: self-contained, opened with a double click, painting the literal data the screens will show and walking through each journey in tabs. A screen the person decides gets several structurally different variants behind a floating bar; once approved, its spike keeps only the chosen one. Each screen is listed under the plan's `## Screens` with `@page`, `@spike`, `@approved` and its journeys in plain words: the agent approves the screens a convention or a standing screen settles, the person the others. The plan writes no product code, so a product with no source yet is spiked like any other, and the archive keeps the spikes with the change. The implementation starts with the spike workstream, `react-ui`, which builds each screen from its approved spike against stub controllers and writes the end-to-end test of each journey under `test/e2e/<module>/` with [e2e-inc/e2e](https://github.com/e2e-inc/e2e): actions in natural language (`agent.act`, run on Claude Code or Codex over ACP, recorded once and replayed from the committed `.e2e/cache`) and deterministic checks, passing against the stubs. `react-hooks` keeps them passing with the real controllers over in-memory adapters seeded with the spikes' data. `factory test e2e` runs them, and verify records each in the evidence. A project with `frontend` or `fullstack` declares `e2e@0.22.0`, `@e2e-dev/web@0.15.4` and `@e2e-dev/acp@0.1.0` and runs Node 22.22.3 or later; setup reports what is missing. None of it is React's: a web schema names its spike workstream as `spike` in its definition.

Two guards hold the flow: a write guard lets product code through only for a started change whose schema builds product code and never lets an agent write the harness, and a completion gate holds a turn that would leave a started change failing the checks of its own schema.

## Who decided what

Every decision a change writes says who took it: `@by:person` when the person decided it, answering a question or asking for it, `@by:agent` when the agent did alone. It sits at the end of each line under the plan's Decisions, on the tag line of each architecture decision, procedure and screen, and as a backticked line (`` `@by:person` ``) that is the first line of each requirement of a delta spec. Validation reports a change not ready while one lacks it, and archiving keeps it in `openspec/adr`, `openspec/runbooks` and `openspec/specs`.

## Approving a plan

The plan's last open question is always the person's approval, with links to the plan, each delta spec and each spike. Approving records `approved_at` in the plan's front matter, and a change is not ready without it. In that same turn the plan phase runs `factory handoff <change>`, which hands the change to the implementation.

## Where a change is built

`implement.runner` in `factory.config.ts` says where an approved change is built:

```ts
export default {
  implement: { runner: "session" }, // the default: the same session, through the implement skill
};
```

```ts
export default {
  // any shell command: it receives the change's name in place of {change}
  implement: { runner: { command: "ssh build-box 'cd app && git pull && claude -p \"implement {change}\"'" } },
};
```

A command runner takes the change wherever it runs: the plan and specs must reach that place (push them, sync the folder) before the command starts the implementation there.

## Reading the artifacts in your language

The artifacts of `openspec/` stay in English. To read them in another language, set it for the project or for yourself:

```ts
export default { language: "es" }; // factory.config.ts, for everyone in the project
```

```bash
FACTORY_LANGUAGE=es # in your environment or .env, for you alone; it overrides the project's
```

Every artifact the agent then shows you (a plan, a spec, a decision, a runbook, a consolidated spec) is linked as a translated copy kept under the system's temporary folder, never in the project. `factory reading <paths…>` says where each copy goes and whether it is stale; a subagent on a small, fast model translates the stale ones, keeping code, names, tags and the specs' keywords in English. Edit the English artifacts through the agent: an edit to a copy is lost.

The clean core has four kinds of test: acceptance (`test/acceptance/<module>/`), integration (`test/integration/<module>/`), unit (`test/unit/<module>/`) and end-to-end (`test/e2e/`). Run one with `factory test <acceptance|integration|unit|e2e>`. A unit test mirrors the domain or application file it proves, imports only the core and its test runner, and belongs to app-domain.

A command runner starts in the approved checkout. When it launches another session, bind that session to the printed absolute path. In T3, compare the receiving thread’s workspace or worktree with `Approved checkout`. Changing the shell directory leaves the thread binding as it was. For a session runner, use `factory handoff <change> --session-root <path>` to check the receiving workspace.
