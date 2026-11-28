import type { Layer } from "factory/sdk";
import type { Options } from "factory/sdk";

const CONTROLLER = /\/framework\/controllers\/[\w-]+\.controller\.ts$/;

/** Controllers: what a transport brings, translated into a call to a use case and back. Spec: `openspec/specs/architecture/controllers`. */
export const controllers = (o: Options): Layer => ({
  name: "controllers",
  fallow: {
    zones: [{ name: "controllers", patterns: [`${o.modules}/framework/**`] }],
    boundaries: [
      {
        id: "controller-reaches-core-through-use-cases",
        from: "controllers",
        allow: ["application", "domain"],
      },
    ],
    forbiddenCalls: [],
  },
  archunit: (ctx) => [
    {
      id: "controllers-vocabulary",
      title: "a module's framework holds only framework/controllers/<name>.controller.ts",
      check: () =>
        ctx
          .files()
          .inFolder(`${o.modules}/framework/**`)
          .should()
          .adhereTo(
            (f) => CONTROLLER.test(f.path),
            "[controllers-vocabulary] a module's framework holds only its controllers: `framework/controllers/<name>.controller.ts`",
          )
          .check(ctx.opts),
    },
  ],
});
