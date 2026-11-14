# layout

### Decision: toolkit-follows-the-spec-areas · The command's code is grouped by spec area

@origin:2026-11-14-organize-the-toolkit @applies:toolkit @enforced:layout-test

Every file under `toolkit/` other than its entry SHALL sit in the folder named after the area of `openspec/specs` whose behaviour it implements (`repository`, `package`, `flow`, `architecture`), or in `core` when every area uses it. A file SHALL import from another area only through that area's files, never by reaching into `core` for something an area owns.

**Why** The specs already name the parts of this repository; code filed under the same names is found without a map, and a file with no area shows that a spec is missing or that the file does two things.
