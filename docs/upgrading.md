# Upgrading

## From 0.3 to 0.4

The workstream `clean-architecture` is now called `modules`; it owns the same rules and the entry. A plan written before 0.4 whose tasks name `clean-architecture` is reported not ready: rename those tasks to `modules`. A project's `factory.config.ts` that sets a topology under `workstreams` renames the key the same way. A configuration can now name its platform, `platform: "web"` or `platform: "node"`.
