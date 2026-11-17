import type {
  Architecture,
  Layer,
  OxlintOverride,
} from "../acl/inspection.acl.ts";

/** Pours the architecture into each tool. */
export const layersOf = (a: Architecture): Layer[] =>
  a.workstreams.flatMap((w) => w.layers);

/** every-file-in-a-zone: every file belongs to a zone. fallow enforces it over the whole architecture, not per layer. */
export const COVERAGE_RULE = "every-file-in-a-zone";

export const oxlintOverrides = (a: Architecture): OxlintOverride[] =>
  layersOf(a).flatMap((l) => l.oxlint?.(a.platform) ?? []);

/**
 * The lint configuration that holds only the architecture's rules. The linter reads `files` relative
 * to the configuration file, so a configuration written outside the project names them under `root`.
 */
export const oxlintConfig = (overrides: OxlintOverride[], root?: string) => ({
  categories: { correctness: "off" },
  overrides: root
    ? overrides.map((o) => ({
        ...o,
        files: o.files?.map((f) => `${root}/${f}`),
      }))
    : overrides,
});

export const fallowConfig = (a: Architecture) => {
  const fallows = layersOf(a).flatMap((l) => (l.fallow ? [l.fallow] : []));
  const zones = fallows.flatMap((f) => f.zones);
  const names = zones.map((z) => z.name);
  const callees = (what: "all" | "persistence") =>
    (what === "all" ? a.platform.all : a.platform.persistence).map(
      (g) => `${g}.*`,
    );
  return {
    ignorePatterns: a.ignore,
    boundaries: {
      zones,
      rules: fallows.flatMap((f) =>
        f.boundaries.map((b) => ({
          from: b.from,
          allow: b.allow === "*" ? names.filter((n) => n !== b.from) : b.allow,
        })),
      ),
      calls: {
        forbidden: fallows.flatMap((f) =>
          f.forbiddenCalls.map((c) => ({
            from: c.from,
            callee: callees(c.what),
          })),
        ),
      },
      coverage: { requireAllFiles: true, allowUnmatched: a.allowUnmatched },
    },
  };
};
