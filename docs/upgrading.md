# Upgrading

## Rules that change with an update

From 0.18, every passing `pnpm exec factory check` records in `.factory-rules.json`, at the product's root, the rules it passed: each rule and rubric row with a hash of its definition and its cases. Commit it. After an update, `pnpm exec factory doctor` compares the installed rules with that record and reports as `outdated` each added or changed rule the code breaks, with its files, and as a `note` each one the code keeps and each one that left. `pnpm exec factory rules` prints the same comparison. The `plan` skill offers a change named `adapt-to-rules-<version>` that adapts the code; once `factory check` passes, the record moves to the new rules and doctor stops reporting them. A project with no record yet is judged against every rule once.

## From 0.3 to 0.4

The workstream `clean-architecture` is now called `modules`; it owns the same rules and the entry. A plan written before 0.4 whose tasks name `clean-architecture` is reported not ready: rename those tasks to `modules`. A project's `factory.config.ts` that sets a topology under `workstreams` renames the key the same way. A configuration can now name its platform, `platform: "web"` or `platform: "node"`.
