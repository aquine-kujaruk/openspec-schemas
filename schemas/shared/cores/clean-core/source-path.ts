/** The same source target can be named without an extension, as .ts, or as its emitted .js. */
export const sourceStem = (path: string): string => path.replace(/\.[jt]s$/, "");
