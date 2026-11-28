import type {
  Architecture,
  Layer,
  OxlintOverride,
} from "../acl/inspection.acl.ts";

export const layersOf = (a: Architecture): Layer[] =>
  a.workstreams.flatMap((w) => w.layers);

export const COVERAGE_RULE = "every-file-in-a-zone";

export const oxlintOverrides = (a: Architecture): OxlintOverride[] =>
  layersOf(a).flatMap((l) => l.oxlint?.(a.platform) ?? []);

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
