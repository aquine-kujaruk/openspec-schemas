import { globSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHITECTURE_SPECS, hasLayerSpecs, PACKAGE_ROOT, SKIPPED_WITHOUT_SPECS } from "./paths.ts";
import { architecture } from "./project.ts";
import { layersOf } from "./compose.ts";
import { ownRuleIds } from "./rules.ts";

/** The specs of the layers the workstreams own; a capability of the harness itself (`review`) names no linter rule. */
const layers = new Set(layersOf(architecture).map((l) => l.name));
const layerSpecs = globSync(join(PACKAGE_ROOT, ARCHITECTURE_SPECS, "*/spec.md")).filter((spec) =>
  layers.has(basename(dirname(spec))),
);

/** A rule is named by the slug before ` · ` in its requirement title; the linters enforce the same slugs. */
const inSpecs = new Set(
  layerSpecs.flatMap((spec) =>
    [...readFileSync(spec, "utf8").matchAll(/^### Requirement: ([a-z0-9-]+) · /gm)].map(
      (m) => m[1],
    ),
  ),
);
/** Whole-product checks (`no-unused-files`, …) are commands, not layer rules: no layer spec names them. */
const checks = new Set(architecture.workstreams.flatMap((w) => w.checks.map((c) => c.id)));
const inLinters = new Set(
  architecture.workstreams
    .flatMap((w) => [...ownRuleIds(architecture, w.id)])
    .filter((id) => !checks.has(id)),
);

describe.skipIf(!hasLayerSpecs())(
  hasLayerSpecs() ? "rule ids" : `rule ids (${SKIPPED_WITHOUT_SPECS})`,
  () => {
    it("every slug the linters enforce names a requirement in a layer spec", () => {
      expect(
        [...inLinters].filter((id) => !inSpecs.has(id)),
        "missing in the layer specs",
      ).toEqual([]);
    });
    it("every slug in a layer spec is enforced by the linters", () => {
      expect(
        [...inSpecs].filter((id) => !inLinters.has(id)),
        "missing in the workstreams",
      ).toEqual([]);
    });
  },
);
