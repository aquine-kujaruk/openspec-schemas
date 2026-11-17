---
name: accept-explicit-import-extensions
description: Clean core checks recognize TypeScript imports with explicit source extensions
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Recognize explicit extensions in architecture checks

## Goal

A module running on native Node TypeScript can use an explicit extension and meet the same architecture rules as a module using extensionless imports.

## Findings

- A scaffold with `.schema.ts` and `validation.schema.ts` imports typechecks under NodeNext but fails `entity-validates-with-schema` in the frozen checker. Removing the extension fails NodeNext resolution (isolated engineering fixture, 2026-11-17).
- Some clean core rules compare import paths without accounting for the extension. This also lets an explicit adapter import escape the infrastructure rule (rule source, 2026-11-17).

## Decisions

- Ignore the source extension when checking the architecture of an import. Discard switching the repository to a different runtime or toolchain. @by:person
- Exercise the allowed imports in the reference module and the rejected adapter import in a separate counterexample. Discard changing the SDK import parser's public result. @by:agent

## Open questions

## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: Check the target of the import

- [x] Compare imports consistently in the domain, acceptance and infrastructure rules.
- [x] Exercise explicitly extended imports in references and counterexamples.
- [x] Verify with typecheck, generation freshness and repository tests.

## Feedback

## Next step
