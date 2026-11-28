export type Command = {
  usage: string;
  run: (args: string[]) => Promise<number>;
};

export type Commands = Record<string, Command>;

export type CliHost = {
  version: () => string;
  extraCommands: () => Promise<Commands>;
  selectedProduct: () => string | undefined;
  selectProduct: (name: string) => void;
  products: () => Promise<Array<{ name: string }>>;
  runForProduct: (name: string, command: string, args: string[]) => number;
  say: (line: string) => void;
  warn: (line: string) => void;
};
