# openspec-schemas

Packages that make Claude Code or Codex change a project through one flow: say what you want, review the plan it writes with you, approve, review what it built, archive. Each package carries the phase skills, the OpenSpec schemas they plan with, the guards that hold the flow and the `factory` command they all call.

## Pick a package

| Package | For | Schemas |
| --- | --- | --- |
| `backend` | a backend in Clean Architecture | `clean-backend`, `spec-plan` |
| `frontend` | a React frontend | `clean-react`, `spec-plan` |
| `fullstack` | a repository with a backend and a frontend | `clean-backend`, `clean-react`, `spec-plan` |

`spec-plan` covers a change no architecture does: a procedure, a decision, tooling, documents.

## Install

You need git, curl, Node 22.18 or later (22.22.3 for `frontend` and `fullstack`) and pnpm. In the root of your project (with a `package.json`; `pnpm init` makes one):

```bash
curl -fsSL https://raw.githubusercontent.com/aquine-kujaruk/openspec-schemas/main/install.sh | sh -s -- backend
```

It installs the agent package manager ([APM](https://github.com/microsoft/apm)) if it is missing, installs the latest release of the package for Claude Code and Codex, pins the `factory` command and sets the project up. It ends by listing what only you can add (the test runner and type checker, at the versions it names). Add `--version <x.y.z>` to install another release, `--agents claude` to install for one agent only.

Installing by hand, or handing it to an agent: [docs/install.md](docs/install.md).

## Use it

Open your agent in the project and say what you want to change. You never need to name a skill.

1. **Plan.** The agent writes the plan and the delta specs while it asks you the decisions that are yours, and records each answer in them, so nothing depends on the conversation. Each decision says who took it, you (`@by:person`) or the agent (`@by:agent`).
2. **Approve.** Its last question is your approval, with links to the plan and the specs themselves. Approving starts the implementation at once: it builds every phase in order, checked at each step, and verifies the change at the end. By default it is built in the same session; [`implement.runner`](docs/flow.md#where-a-change-is-built) can send it elsewhere.
3. **Archive.** When it reports the change verified, ask it to archive: the specs, decisions and procedures become the project's standing ones.

Correct it at any point and it takes the correction into the change. Setting the project up, verifying and taking feedback run on their own when the flow needs them.

## Learn more

- [The flow](docs/flow.md): the skills and the commands behind them, the probes while planning, the spikes and end-to-end tests of a web change, the guards.
- [Several products in one repository](docs/products.md).
- [Codex](docs/codex.md): trusting the project and reviewing its hooks.
- [Upgrading](docs/upgrading.md).
- [Contributing](CONTRIBUTING.md): how this repository is laid out, built, released and changed.
