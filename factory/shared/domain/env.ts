/** `.env` of the project, under the process environment (a set variable wins). */
export declare const loadEnv: (
  root: string,
  env: NodeJS.ProcessEnv,
) => Record<string, string | undefined>;
