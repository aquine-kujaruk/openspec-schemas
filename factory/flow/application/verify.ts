import type { VerifyOptions } from "../domain/verify.ts";
import type { Layout } from "../../repository/domain/generated.ts";
import type {
  E2eResult,
  Evidence,
  ScenarioResult,
} from "../domain/evidence.ts";
import type { Product } from "../../repository/domain/products.ts";
import type { VerifyPorts } from "../domain/verify.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createVerify = ({
  environment,
  existsSync,
  readFileSync,
  rmSync,
  join,
  matchesGlob,
  layoutOf,
  testOf,
  loadEnv,
  activeChanges,
  readChange,
  digestOf,
  writeEvidence,
  raise,
  cacheDir,
  capture,
  PROJECT_ROOT,
  self,
  parsePlan,
  tagOf,
  loadSchema,
  schemaNames,
  productOf,
}: VerifyPorts): Omit<typeof import("../domain/verify.ts"), "run"> => {
  /** The environments a procedure is executed in while verifying; in any other it is only reviewed. */
  const SAFE = ["local", "sandbox"];

  type Failing = Evidence["failing"];

  type TestReport = {
    testResults: Array<{
      name: string;
      assertionResults: Array<{
        ancestorTitles: string[];
        title: string;
        status: string;
      }>;
    }>;
  };

  /** `--product <name>` for a run of the command over a declared product; nothing otherwise. */
  const over = (product: Product): string[] =>
    product.name ? ["--product", product.name] : [];

  /** Runs the generated tests `files`: all the acceptance tests of a project, those files alone in the command's repository. */
  const runTests =
    (layout: Layout) =>
    async (
      root: string,
      files: string[],
    ): Promise<TestReport["testResults"]> => {
      const report = join(cacheDir(root), "evidence.json");
      rmSync(report, { force: true });
      if (layout.repository)
        capture(
          "pnpm",
          [
            "exec",
            "vitest",
            "run",
            ...files,
            "--reporter=json",
            `--outputFile=${report}`,
          ],
          {
            cwd: root,
          },
        );
      else
        self(root, [
          "test",
          "acceptance",
          "--report",
          report,
          ...(layout.product ? ["--product", layout.product] : []),
        ]);
      return existsSync(report)
        ? (JSON.parse(readFileSync(report, "utf8")) as TestReport).testResults
        : [];
    };

  /**
   * Reads each scenario of the delta specs `specs` from the test generation writes for its spec. A
   * spec no test is generated from is proved only by the person's word, and only where that can be.
   */
  const acceptance = async (
    root: string,
    specs: string[],
    options: VerifyOptions,
    product?: string,
  ): Promise<ScenarioResult[]> => {
    if (!specs.length) return [];
    const layout = options.layout ?? (await layoutOf(root, product));
    const wanted = specs.map((spec) => ({ spec, file: testOf(spec, layout) }));
    const files = wanted.flatMap((w) => (w.file ? [w.file] : []));
    const ran = files.length
      ? await (options.tests ?? runTests(layout))(root, files)
      : [];
    return wanted.flatMap(({ spec, file }): ScenarioResult[] => {
      const tests = file
        ? ran.find((f) => f.name.endsWith(file))?.assertionResults
        : undefined;
      if (!tests?.length)
        return layout.repository && !file && options.proved?.includes(spec)
          ? [
              {
                spec,
                requirement: "",
                scenario: "",
                result: "passed",
                by: "the person",
              },
            ]
          : [{ spec, requirement: "", scenario: "", result: "missing" }];
      return tests.map((t) => ({
        spec,
        requirement: (t.ancestorTitles.at(-1) ?? "").replace(/^Rule: /, ""),
        scenario: t.title,
        result: t.status === "passed" ? "passed" : "failed",
      }));
    });
  };

  /**
   * Checks each workstream of the change's schema after those it waits for, so a failure is named by
   * the workstream that owns it: one whose upstream fails is not checked. Then the product tests each
   * is proved by. A schema with no workstreams leaves only the freshness of the generated tests.
   */
  const realChecks = async (
    root: string,
    made: string,
    product: Product,
  ): Promise<Failing> => {
    const [config, schema] = [product.config, await loadSchema(made)];
    const failing: Failing = [];
    const failed = new Set<string>();
    const done = new Set<string>();
    const ids = Object.keys(schema.workstreams);
    while (done.size < ids.length) {
      const next = ids.find(
        (id) =>
          !done.has(id) &&
          (config.workstreams[id]?.dependsOn ?? []).every((d) => done.has(d)),
      );
      if (!next) break;
      done.add(next);
      if (
        (config.workstreams[next]?.dependsOn ?? []).some((d) => failed.has(d))
      ) {
        failed.add(next);
        continue;
      }
      const check = self(root, [
        "check",
        "--workstream",
        next,
        ...over(product),
      ]);
      const tests = (schema.workstreams[next]?.tests ?? [])
        .filter((kind) => kind !== "acceptance")
        .map((kind) => self(root, ["test", kind, ...over(product)]))
        .find((r) => r.status !== 0);
      const broken = check.status !== 0 ? check : tests;
      if (broken) {
        failed.add(next);
        failing.push({ workstream: next, output: broken.output });
      }
    }
    const fresh = self(root, ["generate", "--check", ...over(product)]);
    if (fresh.status !== 0 && !failing.length)
      failing.push({
        workstream: ids[0] ?? "generated tests",
        output: `the generated tests are not fresh:\n${fresh.output}`,
      });
    return failing;
  };

  /** What failing whole-product checks printed: nothing when they pass. */
  const realWhole =
    (product: Product) =>
    async (root: string): Promise<string[]> => {
      const r = self(root, ["check", "--whole", ...over(product)]);
      return r.status === 0 ? [] : [r.output];
    };

  /** The end-to-end tests of a web product, each with its result; none for another platform. */
  const realE2e =
    (product: Product) =>
    async (root: string): Promise<E2eResult[]> => {
      if (product.config.platform.name !== "web") return [];
      const report = join(cacheDir(root), "e2e.json");
      rmSync(report, { force: true });
      const r = self(root, [
        "test",
        "e2e",
        "--report",
        report,
        ...over(product),
      ]);
      // Status 2: the run could not start, and no test result says anything.
      if (r.status !== 0 && r.status !== 1)
        return [
          { test: "the end-to-end run", result: "failed", output: r.output },
        ];
      return existsSync(report)
        ? (JSON.parse(readFileSync(report, "utf8")) as { tests: E2eResult[] })
            .tests
        : [];
    };

  /** The source files a check's output names. */
  const filesNamed = (output: string): string[] => [
    ...new Set(output.match(/[\w@.\/-]+\.(?:tsx?|jsx?|mts|cts)\b/g) ?? []),
  ];

  /** The workstream whose layers hold `file` in the product, by the zones each layer declares. */
  const ownerOf = async (
    made: string,
    product: Product,
  ): Promise<(file: string) => string | undefined> => {
    const { workstreams } = await loadSchema(made);
    const zones = Object.entries(workstreams).flatMap(([id, w]) =>
      w
        .layers(product.config)
        .flatMap((l) =>
          (l.fallow?.zones ?? []).map((z) => ({ id, patterns: z.patterns })),
        ),
    );
    const inProduct = (file: string) =>
      product.name && file.startsWith(`${product.root}/`)
        ? file.slice(product.root.length + 1)
        : file;
    return (file) =>
      zones.find((z) => z.patterns.some((p) => matchesGlob(inProduct(file), p)))
        ?.id;
  };

  const realReview =
    (product: Product) =>
    async (root: string, key: string): Promise<string[]> => {
      const { review } = product.config;
      const r = self(root, ["review", ...over(product)], {
        ...environment(),
        [review.keyVariable]: key,
      });
      if (r.status !== 0) throw new Error(r.output);
      return r.output.split("\n").filter((line) => /^S\d{2} p=/.test(line));
    };

  /**
   * Verifies the change `name` of the project at `root` and writes its evidence: every scenario
   * matched to its test, every check, the review when its key is configured, and each procedure in
   * the environments where executing it is safe. What fails is raised as feedback; nothing is fixed.
   */
  const verify = async (
    root: string,
    name: string,
    options: VerifyOptions = {},
  ): Promise<Evidence> => {
    const change = readChange(root, name);
    if (!change) throw new Error(`no active change is called ${name}`);
    if (!change.schema || !schemaNames().includes(change.schema))
      throw new Error(
        `the change ${name} was made with the schema ${change.schema ?? "(none)"}, which this package does not define; schemas: ${schemaNames().join(", ")}`,
      );
    const made = change.schema;
    const product = await productOf(root, change.product);
    const plan = parsePlan(change.plan ?? "");
    const specs = change.deltaSpecs.map((f) =>
      f.replace(/^specs\//, "").replace(/\/spec\.md$/, ""),
    );

    const scenarios = await (options.scenarios
      ? options.scenarios(root, specs)
      : acceptance(root, specs, options, change.product));
    const failing = await (options.checks
      ? options.checks(root)
      : realChecks(root, made, product));
    // The workstreams stay decoupled: what proves they work together is checked here, once they all
    // pass. A change of a schema that builds no product code proves nothing about the product.
    const builds = Object.keys((await loadSchema(made)).workstreams).length > 0;
    if (builds && !failing.length) {
      const owner = await ownerOf(made, product);
      for (const output of await (options.whole ?? realWhole(product))(root)) {
        const owners = [
          ...new Set(filesNamed(output).flatMap((f) => owner(f) ?? [])),
        ];
        for (const workstream of owners.length ? owners : [name])
          failing.push({ workstream, output });
      }
    }
    const e2e = builds ? await (options.e2e ?? realE2e(product))(root) : [];
    for (const t of e2e.filter((t) => t.result === "failed"))
      failing.push({
        workstream: name,
        output: t.output ?? `the end-to-end test ${t.test} fails`,
      });

    const { config } = product;
    const key = (options.env ?? loadEnv(root, environment()))[
      config.review.keyVariable
    ];
    let review: Evidence["review"] = {
      state: "skipped",
      warnings: [],
      note: `the project configures no ${config.review.keyVariable}`,
    };
    const { rubrics } = await loadSchema(product.schema);
    if (!rubrics.length)
      review.note = "the schema this project is checked with has no rubric";
    else if (key)
      try {
        review = {
          state: "run",
          warnings: await (options.review ?? realReview(product))(root, key),
        };
      } catch (e) {
        review.note = `the review could not run: ${e instanceof Error ? e.message : String(e)}`;
      }

    // A procedure the person declined while planning is not held against the verdict until it is run.
    const procedures: Evidence["procedures"] = plan.procedures.flatMap(
      (block) =>
        (tagOf(block, "env")?.value ?? "")
          .split(",")
          .filter(Boolean)
          .map((env) => {
            const outcome = options.procedures?.[`${block.slug}@${env}`];
            return !SAFE.includes(env)
              ? { slug: block.slug, env, treatment: "reviewed only" as const }
              : outcome
                ? {
                    slug: block.slug,
                    env,
                    treatment: "executed" as const,
                    outcome,
                  }
                : tagOf(block, "probed")?.value === "declined"
                  ? { slug: block.slug, env, treatment: "declined" as const }
                  : {
                      slug: block.slug,
                      env,
                      treatment: "not executed" as const,
                    };
          }),
    );

    const unproved = scenarios.filter((s) => s.result !== "passed");
    const unexercised = procedures.filter(
      (p) => p.treatment === "not executed" || p.outcome === "failed",
    );
    const evidence: Evidence = {
      change: name,
      verdict:
        unproved.length || failing.length || unexercised.length
          ? "not verified"
          : "verified",
      digest: await digestOf(root, name),
      scenarios,
      failing,
      review,
      procedures,
      e2e,
    };
    writeEvidence(root, evidence);

    const says = "the verify phase";
    // An unproved scenario is raised on the workstream proved by acceptance tests, else on the change.
    const prover =
      Object.entries((await loadSchema(made)).workstreams).find(([, w]) =>
        w.tests?.includes("acceptance"),
      )?.[0] ?? name;
    for (const f of failing)
      raise(root, name, {
        source: says,
        names: f.workstream,
        findings: [f.output],
      });
    if (unproved.length && !failing.some((f) => f.workstream === prover))
      raise(root, name, {
        source: says,
        names: prover,
        findings: unproved.map(
          (s) =>
            `${s.spec}: ${s.scenario || "no generated test ran"} ${s.result}`,
        ),
      });
    for (const p of unexercised)
      raise(root, name, {
        source: says,
        names: p.slug,
        findings: [
          p.outcome === "failed"
            ? `the procedure ${p.slug} failed its verification step in ${p.env}`
            : `the procedure ${p.slug} was not executed in ${p.env}`,
        ],
      });
    return evidence;
  };
  return { SAFE, verify };
};
