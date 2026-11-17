export type Tool = "fallow" | "oxlint" | "archunit";
export type Findings = Map<string, Set<Tool>>;
