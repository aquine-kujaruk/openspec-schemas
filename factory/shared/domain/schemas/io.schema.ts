import { z } from "zod";

export const ArgumentsSchema = z.array(z.string());

export type Io = {
  write(line: string): void;
  warn(line: string): void;
  stdin(): string;
};
