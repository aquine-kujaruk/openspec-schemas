---
description: Every change to this project enters through a phase of the factory
---

This project changes through five skills:

- `plan` when the person wants something to change: behaviour, code, a standing decision or a procedure. A small change starts there too. It opens each change with the schema the intention calls for; `pnpm exec factory schemas` lists the ones this project has.
- `implement` to build a change that validation reports ready. Product code is written by this skill.
- `verify` when a change has no task left, and `archive` when it is verified.
- `feedback` when the person corrects a change that is open, or when a guard, `verify` or `archive` sends one back.

A question that changes nothing needs no skill. A write guard lets product code through only for a change the `implement` skill has started and keeps the harness as it was installed; a completion gate holds a turn that would leave a change in implementation failing its checks. When either sends you back, do what it says: the way forward is one of the five skills.
