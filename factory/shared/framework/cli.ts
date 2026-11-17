import type { Commands, CliHost } from "../domain/command.ts";

/** Parses the person's invocation and dispatches the module's command. */
export const runCli = async (
  given: string[],
  own: Commands,
  host: CliHost,
): Promise<number> => {
  const commands = { ...own, ...(await host.extraCommands()) };
  const [command, ...rest] = given;
  const usage = (only?: string): string =>
    (only && commands[only] ? [commands[only]!] : Object.values(commands))
      .map((c) => `factory ${c.usage}`)
      .join("\n");
  const at = rest.indexOf("--product");
  const args =
    at === -1 ? rest : rest.filter((_, i) => i !== at && i !== at + 1);
  if (at !== -1) {
    if (!rest[at + 1]) {
      host.warn("--product needs the name of a product");
      return 2;
    }
    host.selectProduct(rest[at + 1]!);
  }
  if (command === "--version" || command === "-v") {
    host.say(host.version());
    return 0;
  }
  if (["help", "--help", "-h"].includes(command ?? "")) {
    host.say(usage(rest[0]));
    return 0;
  }
  const handler = command && commands[command];
  if (
    handler &&
    command !== "openspec" &&
    args.some((a) => a === "--help" || a === "-h")
  ) {
    host.say(usage(command));
    return 0;
  }
  if (!handler) {
    host.warn(`Unknown command: ${command ?? "(none)"}. Commands:\n${usage()}`);
    return 2;
  }
  if (
    ["check", "generate", "test", "prepare", "review"].includes(command!) &&
    !host.selectedProduct()
  ) {
    const products = await host.products();
    if (products.length > 1) {
      let status = 0;
      const failing: string[] = [];
      for (const { name } of products) {
        host.say(`\n■ product ${name}`);
        const code = host.runForProduct(name, command!, args);
        status = Math.max(status, code);
        if (code) failing.push(name);
      }
      host.say(
        failing.length
          ? `\nfailing products: ${failing.join(", ")}`
          : "\nevery product passes",
      );
      return status;
    }
  }
  return handler.run(args);
};
