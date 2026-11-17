# modules

### Decision: factory-departments · The factory's modules are the departments of a plant

@origin:2026-11-17-factory-as-clean-backend @applies:factory @enforced:modules-are-isolated @by:person

The factory's modules SHALL be `production` (opens, releases, dispatches, stages and closes work orders, takes in andon pulls), `engineering` (processes, work centers, parts, standards, samples; prepares a line), `quality` (gauges from drawings, quality control, final inspection, audit, holding a stage), `change-control` (what an operator may write) and `maintenance` (the plant's equipment), with `shared` holding only what every department names: plant, line, module, process name. No module SHALL import another: a use case that needs another department declares a repository interface, and the entry hands it the other department's use case.

**Why** Each department changes for its own reasons and speaks its own part of the language; the 15 imports across the old modules came from boundaries drawn by folder, not by department.
