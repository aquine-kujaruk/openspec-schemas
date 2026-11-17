export const runtime = {
  environment: (): NodeJS.ProcessEnv => process.env,
  workingDirectory: (): string => process.cwd(),
  changeDirectory: (directory: string): void => process.chdir(directory),
  nodeExecutable: process.execPath,
  nodeVersion: process.version,
  interactive: (): boolean => Boolean(process.stdin.isTTY),
  fetch: globalThis.fetch,
  setTimeout,
  loadModule: (specifier: string): Promise<unknown> => import(specifier),
};
