import { project as architectureproject } from "../factory/engineering.ts";
const { initialize } = architectureproject;
await initialize();
const keyVariable = architectureproject.config.review.keyVariable;
if (process.env[keyVariable] === undefined) {
  const { loadEnv } = await import("../factory/shared/infrastructure/adapters/env.adapter.ts");
  const value = loadEnv(process.cwd(), process.env)[keyVariable];
  if (value !== undefined) process.env[keyVariable] = value;
}
