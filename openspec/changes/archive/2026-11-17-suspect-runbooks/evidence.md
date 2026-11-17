---
change: suspect-runbooks
verdict: verified
digest: d0e6cb7c22560cce405019bd7ac75ced28651f776712c641bef49084b2597c1c
---

# Evidence of suspect-runbooks

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| flow/plan |  |  | passed, by the person's word |
| package/setup | Setup pins the command at the version the skills name | the command goes from `none` to `1.2.0` when the skills name `1.2.0` | passed |
| package/setup | Setup pins the command at the version the skills name | the command goes from `1.2.0` to `1.2.0` when the skills name `1.2.0` | passed |
| package/setup | Setup pins the command at the version the skills name | the command goes from `1.2.0` to `1.3.0` when the skills name `1.3.0` | passed |
| package/setup | Setup makes every packaged schema resolvable | `clean-backend` resolves and the default goes from `none` to `clean-backend` | passed |
| package/setup | Setup makes every packaged schema resolvable | `legacy-to-specs` resolves and the default goes from `none` to `clean-backend` | passed |
| package/setup | Setup makes every packaged schema resolvable | `legacy-to-specs` resolves and the default goes from `spec-driven` to `spec-driven` | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `the pinned command` is reported and left as it was | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `a schema link` is reported and left as it was | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `a test runner` is reported and left as it was | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `a type checker` is reported and left as it was | passed |
| package/setup | Setup repairs only what the package owns | `the pinned command` is `repaired` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `a schema link` is `repaired` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `the consolidated roots` is `repaired` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `a test runner` is `missing` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `a type checker` is `missing` after setup with repair | passed |
| package/setup | Setup adds the flow instruction to an instruction file the project wrote | a file with `3` own line(s) holds the flow instruction `1` time(s) | passed |
| package/setup | Setup adds the flow instruction to an instruction file the project wrote | a file with `3` own line(s) holds the flow instruction `1` time(s) #2 | passed |
| package/setup | Setup adds the flow instruction to an instruction file the project wrote | a file with `0` own line(s) holds the flow instruction `1` time(s) | passed |
| package/setup | Skills and command of different versions are reported as drift | skills at `1.3.0` and the command at `1.2.0` are reported as drift | passed |
| package/setup | Every agent the package names has the flow | `the phase skills` missing for `codex` is reported | passed |
| package/setup | Every agent the package names has the flow | `the flow instruction` missing for `claude` is reported | passed |
| package/setup | Every agent the package names has the flow | `the guards` missing for `codex` is reported | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `absent`, is reported `note` without repair | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `in .env`, is reported `not reported` without repair | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `in the environment`, is reported `not reported` without repair | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `absent`, is reported `note` after repair | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `nothing` is reported `missing` | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `e2e@0.22.0, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0` is reported `not reported` | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `e2e@0.23.1, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0` is reported `missing` | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `node` product whose project declares `nothing` is reported `not reported` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm run start` where the project holds `the script dev` is reported `suspect` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm run dev` where the project holds `the script dev` is reported `not reported` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm dev` where the project holds `the script dev` is reported `not reported` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm exec react-scripts start` where the project holds `the binary vite` is reported `suspect` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm exec vite` where the project holds `the binary vite` is reported `not reported` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `npx create-vite@5.5.0 web` where the project holds `nothing` is reported `not reported` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `node scripts/seed.mjs` where the project holds `the file scripts/load.mjs` is reported `suspect` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `./scripts/seed.sh` where the project holds `the file scripts/seed.sh` is reported `not reported` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `kubectl logs deploy/api` where the project holds `nothing` is reported `not reported` | passed |
| package/setup | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm run start` is still reported `suspect` after repair | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
